import { useEffect, useRef, useState, useCallback } from 'react';
import { onSocket, emitSocket } from '../api-client';
import { sendToZen, buildZenMessages } from '../services/zenService';
import { extractMerfolkBlocks } from '../services/merfolkExtractor';
import useObjectsStore from '../stores/objectsStore';
import { getMarkdownLayoutWorker } from '../workers/markdownLayoutWorkerClient';
import { markdownDiagramService } from '../services/markdownDiagramService';

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

async function renderMerfolkToScene(merfolkBlocks, spaceId, user) {
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
  const currentSpaceId = spaceId;

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
      currentSpaceId,
      user,
      allObjectsToSave
    );
  }

  return allConnectionsToSave.length > 0 || allObjectsToSave.length > 0;
}

const SPACE_CHAT_MIN_WIDTH = 240;
const SPACE_CHAT_MIN_HEIGHT = 200;
const SPACE_CHAT_DEFAULT_WIDTH = 300;
const SPACE_CHAT_DEFAULT_HEIGHT = 360;

const SpaceChat = ({ spaceId, user, isOpen, onClose }) => {
  // ── Expand / Resize state ─────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatSize, setChatSize] = useState({ width: SPACE_CHAT_DEFAULT_WIDTH, height: SPACE_CHAT_DEFAULT_HEIGHT });
  const [userResized, setUserResized] = useState(false);
  const [resizing, setResizing] = useState(null);

  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e) => {
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;
      setChatSize((prev) => {
        const next = { ...prev };
        if (resizing.edge === 'right' || resizing.edge === 'corner') {
          const newWidth = Math.max(SPACE_CHAT_MIN_WIDTH, resizing.startWidth + dx);
          next.width = newWidth;
          next.userRight = 76 - dx;
        }
        if (resizing.edge === 'bottom' || resizing.edge === 'corner') {
          next.height = Math.max(SPACE_CHAT_MIN_HEIGHT, resizing.startHeight + dy);
        }
        return next;
      });
    };
    const handleUp = () => {
      setResizing(null);
      setUserResized(true);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [resizing]);

  const handleResizeStart = (edge, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ edge, startX: e.clientX, startY: e.clientY, startWidth: chatSize.width, startHeight: chatSize.height });
  };

  // ── Group chat state (existing) ───────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const textareaRef = useRef(null);
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const oldestTimestampRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const liveKeysRef = useRef(new Set());

  // ── Auto-grow textarea ────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || isExpanded) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [input, isExpanded]);

  // ── LLM chat state ───────────────────────────────────────────────────
  const [chatMode, setChatMode] = useState('group');
  const [llmMessages, setLlmMessages] = useState([]);
  const [llmStreaming, setLlmStreaming] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const [model, setModel] = useState('big-pickle');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const streamingRef = useRef('');
  const streamingMsgKeyRef = useRef(0);
  const abortControllerRef = useRef(null);

  const AVAILABLE_MODELS = [
    { id: 'big-pickle', name: 'Big Pickle' },
    { id: 'mimo', name: 'Mimo' },
  ];

  // ── Socket.IO chat subscription (group mode) ────────────────────────
  useEffect(() => {
    if (!spaceId || !isOpen || chatMode !== 'group') return;

    setMessages([]);
    setHasMore(false);
    oldestTimestampRef.current = null;
    liveKeysRef.current = new Set();

    const unsubHistory = onSocket('chat:history', (msgs) => {
      const mapped = (msgs || []).map((m) => ({ key: m.id, ...m }));
      liveKeysRef.current = new Set(mapped.map((m) => m.key));
      setMessages(mapped);
      if (mapped.length > 0) {
        oldestTimestampRef.current = mapped[0].timestamp || null;
      }
    });

    const unsubMessage = onSocket('chat:message', (msg) => {
      const wrapped = { ...msg, key: msg.id };
      setMessages((prev) => {
        if (prev.some((m) => m.key === wrapped.key || m.key === msg._tempKey)) return prev;
        const next = [...prev, wrapped];
        if (next.length > 0) {
          oldestTimestampRef.current = next[0].timestamp || null;
        }
        return next;
      });
      liveKeysRef.current.add(msg.id);
    });

      emitSocket('chat:join', { spaceId });

    return () => {
      emitSocket('chat:leave', { spaceId });
      unsubHistory();
      unsubMessage();
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

    if (chatMode === 'group' && el.scrollTop < 60 && hasMore && !loadingMore) {
      // Pagination not supported via Socket.IO — all messages sent on join
      setHasMore(false);
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
      emitSocket('chat:message', { spaceId, text });
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
        model,
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
        const rendered = await renderMerfolkToScene(blocks, spaceId, user);
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

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={`space-chat-window${isExpanded ? ' expanded' : ''}`}
      onClick={(e) => e.stopPropagation()}
      style={isExpanded ? undefined : { width: chatSize.width, height: chatSize.height, ...(userResized && chatSize.userRight ? { right: chatSize.userRight } : {}) }}
    >
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
        <div className="space-chat-header-actions">
          <button
            className="space-chat-expand"
            onClick={() => setIsExpanded(v => !v)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '⤡' : '⤢'}
          </button>
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
      </div>

      {/* Resize handles (only when not expanded) */}
      {!isExpanded && (
        <>
          <div className="space-chat-resize-handle space-chat-resize-right" onMouseDown={(e) => handleResizeStart('right', e)} />
          <div className="space-chat-resize-handle space-chat-resize-bottom" onMouseDown={(e) => handleResizeStart('bottom', e)} />
          <div className="space-chat-resize-handle space-chat-resize-corner" onMouseDown={(e) => handleResizeStart('corner', e)} />
        </>
      )}

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
            {llmStreaming && !llmMessages.some(m => m.streaming) && (
              <div className="space-chat-loading">
                <span className="space-chat-spinner" />
                <span>Thinking…</span>
              </div>
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

      {chatMode === 'llm' && (
        <div className="space-chat-model-bar" ref={dropdownRef}>
          <button
            className="space-chat-model-btn"
            onClick={() => setShowModelDropdown(v => !v)}
            disabled={llmStreaming}
          >
            {AVAILABLE_MODELS.find(m => m.id === model)?.name || model}
            <span className="space-chat-model-arrow">{showModelDropdown ? '▲' : '▼'}</span>
          </button>
          {showModelDropdown && (
            <div className="space-chat-model-dropdown">
              {AVAILABLE_MODELS.map(m => (
                <button
                  key={m.id}
                  className={`space-chat-model-option ${m.id === model ? 'selected' : ''}`}
                  onClick={() => { setModel(m.id); setShowModelDropdown(false); }}
                >
                  {m.name}
                  {m.id === model && <span className="space-chat-model-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-chat-input-row">
        <textarea
          ref={textareaRef}
          className="space-chat-input"
          rows={1}
          placeholder={chatMode === 'group' ? 'Send a message…' : 'Describe a diagram…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={chatMode === 'group' ? 500 : 2000}
          disabled={chatMode === 'llm' && llmStreaming}
        />
        <button
          className="space-chat-send"
          onClick={chatMode === 'llm' && llmStreaming ? handleStop : (chatMode === 'group' ? handleSend : handleLlmSend)}
          disabled={chatMode === 'llm' && llmStreaming ? false : (!input.trim() || (chatMode === 'group' ? sending : llmStreaming))}
          title={chatMode === 'llm' && llmStreaming ? 'Stop' : (chatMode === 'group' ? 'Send' : 'Generate diagram')}
        >
          {chatMode === 'llm' && llmStreaming ? '◼' : '➤'}
        </button>
      </div>
    </div>
  );
};

SpaceChat.displayName = 'SpaceChat';
export default SpaceChat;
