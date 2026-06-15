import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ref,
  push,
  get,
  onValue,
  query,
  orderByChild,
  limitToLast,
  endBefore,
} from 'firebase/database';
import { database } from '../firebase';
import { sendToZen, buildZenMessages } from '../services/zenService';
import { extractMerfolkBlocks } from '../services/merfolkExtractor';
import useObjectsStore from '../stores/objectsStore';
import { getMarkdownLayoutWorker } from '../workers/markdownLayoutWorkerClient';
import { markdownDiagramService } from '../services/markdownDiagramService';

const INITIAL_LOAD = 10;
const PAGE_SIZE = 10;

const getGuestId = () => {
  let guestId = sessionStorage.getItem('guestPresenceId');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('guestPresenceId', guestId);
  }
  return guestId;
};

const senderInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const mergeMessages = (existing, incoming) => {
  const map = new Map(existing.map((m) => [m.key, m]));
  for (const m of incoming) map.set(m.key, m);
  return Array.from(map.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
};

async function renderMerfolkToScene(merfolkBlocks) {
  if (!merfolkBlocks || merfolkBlocks.length === 0) return false;

  const markdown = merfolkBlocks
    .map(block => '```merfolk\n' + block + '\n```')
    .join('\n\n');

  const basePosition = markdownDiagramService.getCameraBasedPosition();

  let workerResult = null;
  try {
    const layoutWorker = getMarkdownLayoutWorker();
    workerResult = await layoutWorker.computeLayout(markdown, basePosition);
  } catch (err) {
    console.warn('[SpaceChat] Layout worker failed:', err.message);
    return false;
  }

  if (!workerResult || !workerResult.diagramLayouts || workerResult.diagramLayouts.length === 0) {
    return false;
  }

  const diagrams = workerResult.diagramLayouts.map((layout) => ({
    graph: {
      nodes: new Map(layout.graphNodes),
      connections: new Map(
        layout.rawConnections.map((c, i) => [
          `hc-${i}`,
          { source: c.source, target: c.target, label: c.label, type: c.connectionType, visual: c.visual || null },
        ])
      ),
    },
    errors: layout.errors || [],
  }));

  const connectionTags = new Map(
    workerResult.connectionTags.map(([key, tags]) => [key, new Set(tags)])
  );

  const nodeToObjectIdMap = new Map();
  const allConnectionsToSave = [];
  const allObjectsToSave = [];
  const user = null;
  const currentSpaceId = null;

  window._faceDistributionCounters = window._faceDistributionCounters || new Map();

  for (const diagram of diagrams) {
    if (diagram.errors && diagram.errors.length > 0) continue;

    await markdownDiagramService.createObjectsFromDiagram(
      diagram,
      () => {},
      nodeToObjectIdMap,
      basePosition,
      user,
      currentSpaceId,
      allObjectsToSave,
      null
    );

    markdownDiagramService.createConnectionsFromDiagram(
      diagram,
      nodeToObjectIdMap,
      allConnectionsToSave,
      connectionTags
    );
  }

  if (allConnectionsToSave.length > 0) {
    await markdownDiagramService.saveConnections(
      allConnectionsToSave,
      null,
      null,
      allObjectsToSave
    );
  }

  return allConnectionsToSave.length > 0 || allObjectsToSave.length > 0;
}

const SpaceChat = ({ spaceId, user, isOpen, onClose }) => {
  // ── Group chat state (existing) ───────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const oldestTimestampRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const liveKeysRef = useRef(new Set());

  // ── LLM chat state ───────────────────────────────────────────────────
  const [chatMode, setChatMode] = useState('group');
  const [llmMessages, setLlmMessages] = useState([]);
  const [llmStreaming, setLlmStreaming] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const streamingRef = useRef('');
  const streamingMsgKeyRef = useRef(0);
  const abortControllerRef = useRef(null);

  // ── Firebase real-time subscription (group mode) ──────────────────────
  useEffect(() => {
    if (!spaceId || !isOpen || chatMode !== 'group') return;

    setMessages([]);
    setHasMore(true);
    oldestTimestampRef.current = null;
    liveKeysRef.current = new Set();

    const messagesRef = query(
      ref(database, `/chat/${spaceId}/messages`),
      orderByChild('timestamp'),
      limitToLast(INITIAL_LOAD)
    );

    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const live = Object.entries(data)
          .map(([key, msg]) => ({ key, ...msg }))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        liveKeysRef.current = new Set(live.map((m) => m.key));

        setMessages((prev) => {
          const older = prev.filter((m) => !liveKeysRef.current.has(m.key));
          const merged = mergeMessages(older, live);

          if (merged.length > 0) {
            oldestTimestampRef.current = merged[0].timestamp || null;
          }

          return merged;
        });
      },
      (err) => {
        console.warn('[chat] Failed to subscribe to messages:', err.message);
      }
    );

    return () => {
      unsubscribe();
      setMessages([]);
      liveKeysRef.current = new Set();
    };
  }, [spaceId, isOpen, chatMode]);

  // ── Auto-scroll to bottom ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, llmMessages, isOpen]);

  // ── Track whether user is near the bottom ─────────────────────────────
  const handleScroll = useCallback(async () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

    if (chatMode === 'group' && el.scrollTop < 60 && hasMore && !loadingMore && oldestTimestampRef.current !== null) {
      setLoadingMore(true);
      const prevScrollHeight = el.scrollHeight;

      try {
        const olderQuery = query(
          ref(database, `/chat/${spaceId}/messages`),
          orderByChild('timestamp'),
          endBefore(oldestTimestampRef.current),
          limitToLast(PAGE_SIZE)
        );

        const snapshot = await get(olderQuery);
        const data = snapshot.val() || {};
        const older = Object.entries(data)
          .map(([key, msg]) => ({ key, ...msg }))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        if (older.length === 0) {
          setHasMore(false);
        } else {
          if (older.length < PAGE_SIZE) setHasMore(false);
          oldestTimestampRef.current = older[0].timestamp || oldestTimestampRef.current;
          setMessages((prev) => mergeMessages(older, prev));

          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop =
                scrollContainerRef.current.scrollHeight - prevScrollHeight;
            }
          });
        }
      } catch (err) {
        console.warn('[chat] Failed to load older messages:', err.message);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [spaceId, chatMode, hasMore, loadingMore]);

  // ── Group chat: Send ──────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !spaceId) return;

    const userId = user ? user.uid : getGuestId();
    const displayName = user ? (user.displayName || user.email || 'User') : 'Guest';
    const photoURL = user ? (user.photoURL || null) : null;

    setSending(true);
    try {
      await push(ref(database, `/chat/${spaceId}/messages`), {
        userId,
        displayName,
        photoURL,
        text,
        timestamp: Date.now(),
      });
      setInput('');
      isNearBottomRef.current = true;
    } catch (err) {
      console.warn('[chat] Failed to send message:', err.message);
    } finally {
      setSending(false);
    }
  }, [input, spaceId, user]);

  // ── LLM chat: Send ────────────────────────────────────────────────────
  const handleLlmSend = useCallback(async () => {
    const text = input.trim();
    if (!text || llmStreaming) return;

    setLlmError(null);
    setInput('');
    isNearBottomRef.current = true;

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...llmMessages, userMessage];
    setLlmMessages(updatedMessages);

    const sceneObjects = useObjectsStore.getState().objects;
    const zenMessages = buildZenMessages({
      llmMessages: updatedMessages,
      sceneObjects,
      maxMessages: 20,
    });

    setLlmStreaming(true);
    streamingRef.current = '';
    streamingMsgKeyRef.current = `llm-stream-${Date.now()}`;
    const currentStreamKey = streamingMsgKeyRef.current;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await sendToZen({
        messages: zenMessages,
        signal: abortController.signal,
        onChunk: (delta, fullText) => {
          streamingRef.current = fullText;
          setLlmMessages((prev) => {
            const streamMsg = {
              key: currentStreamKey,
              role: 'assistant',
              content: fullText,
              streaming: true,
            };
            const withoutStreaming = prev.filter(m => m.key !== currentStreamKey);
            return [...withoutStreaming, streamMsg];
          });
        },
      });

      const finalText = streamingRef.current;
      const blocks = extractMerfolkBlocks(finalText);

      setLlmMessages((prev) => {
        const finalMsg = {
          key: currentStreamKey,
          role: 'assistant',
          content: finalText,
          streaming: false,
          diagramCreated: false,
        };

        const withoutStream = prev.filter(m => m.key !== currentStreamKey);
        return [...withoutStream, finalMsg];
      });

      if (blocks.length > 0) {
        const rendered = await renderMerfolkToScene(blocks);
        if (rendered) {
          setLlmMessages((prev) =>
            prev.map(m =>
              m.key === currentStreamKey
                ? { ...m, diagramCreated: true }
                : m
            )
          );
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setLlmError(err.message || 'Failed to reach LLM. Check your connection.');
      setLlmMessages((prev) => prev.filter(m => m.key !== currentStreamKey));
    } finally {
      setLlmStreaming(false);
      streamingRef.current = '';
      abortControllerRef.current = null;
    }
  }, [input, llmStreaming, llmMessages]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (chatMode === 'group') {
          handleSend();
        } else {
          handleLlmSend();
        }
      }
    },
    [chatMode, handleSend, handleLlmSend]
  );

  const handleModeSwitch = useCallback((mode) => {
    setChatMode(mode);
    setLlmError(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="space-chat-window" onClick={(e) => e.stopPropagation()}>
      <div className="space-chat-header">
        <div className="space-chat-mode-toggle">
          <button
            className={`space-chat-mode-btn ${chatMode === 'group' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('group')}
          >
            Group
          </button>
          <button
            className={`space-chat-mode-btn ${chatMode === 'llm' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('llm')}
          >
            LLM
          </button>
        </div>
        {onClose && (
          <button
            className="space-chat-close"
            onClick={onClose}
            title="Close chat"
          >
            ✕
          </button>
        )}
      </div>

      <div
        className="space-chat-messages"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {chatMode === 'group' ? (
          <>
            {loadingMore && (
              <div className="space-chat-load-more">Loading…</div>
            )}
            {!loadingMore && !hasMore && messages.length > 0 && (
              <div className="space-chat-load-more">Beginning of chat</div>
            )}
            {messages.length === 0 && !loadingMore && (
              <div className="space-chat-empty">No messages yet. Say hello!</div>
            )}
            {messages.map((msg) => {
              const ownId = user ? user.uid : getGuestId();
              const isOwn = msg.userId === ownId;
              return (
                <div
                  key={msg.key}
                  className={`space-chat-message ${isOwn ? 'own' : ''}`}
                >
                  {!isOwn && (
                    <div className="space-chat-avatar" title={msg.displayName || 'User'}>
                      {msg.photoURL ? (
                        <img
                          src={msg.photoURL}
                          alt={msg.displayName}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span style={{ display: msg.photoURL ? 'none' : 'flex' }}>
                        {senderInitials(msg.displayName)}
                      </span>
                    </div>
                  )}
                  <div className="space-chat-bubble-wrap">
                    {!isOwn && (
                      <div className="space-chat-name">{msg.displayName || 'User'}</div>
                    )}
                    <div className="space-chat-bubble">{msg.text}</div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            {llmMessages.length === 0 && !llmStreaming && (
              <div className="space-chat-empty">
                Ask me to create a system architecture diagram.
                <br /><br />
                Try: &quot;Create a microservices e-commerce architecture&quot;
              </div>
            )}
            {llmError && (
              <div className="space-chat-error">{llmError}</div>
            )}
            {llmMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.key}
                  className={`space-chat-message ${isUser ? 'own llm-user' : 'llm-assistant'}`}
                >
                  <div className="space-chat-bubble-wrap">
                    <div className="space-chat-bubble">
                      {msg.content}
                      {msg.streaming && <span className="space-chat-streaming-cursor" />}
                    </div>
                    {msg.diagramCreated && (
                      <div className="space-chat-merfolk-badge">
                        ✦ 3D diagram created
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-chat-input-row">
        <input
          className="space-chat-input"
          type="text"
          placeholder={chatMode === 'group' ? 'Send a message…' : 'Describe a diagram…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={chatMode === 'group' ? 500 : 2000}
          disabled={chatMode === 'llm' && llmStreaming}
        />
        <button
          className="space-chat-send"
          onClick={chatMode === 'group' ? handleSend : handleLlmSend}
          disabled={!input.trim() || (chatMode === 'group' ? sending : llmStreaming)}
          title={chatMode === 'group' ? 'Send' : 'Generate diagram'}
        >
          {chatMode === 'llm' && llmStreaming ? '◼' : '➤'}
        </button>
      </div>
    </div>
  );
};

SpaceChat.displayName = 'SpaceChat';
export default SpaceChat;
