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

const SpaceChat = ({ spaceId, user, isOpen }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  // Track the oldest timestamp we've loaded so we know where to page from
  const oldestTimestampRef = useRef(null);
  // Flag: only auto-scroll when the user is already near the bottom
  const isNearBottomRef = useRef(true);
  // Prevent the live subscription from overwriting a paginated state
  const liveKeysRef = useRef(new Set());

  // ── Real-time subscription: last INITIAL_LOAD messages ──────────────────
  useEffect(() => {
    if (!spaceId || !isOpen) return;

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

        // Track which keys are in the live window
        liveKeysRef.current = new Set(live.map((m) => m.key));

        setMessages((prev) => {
          // Keep any older (paginated) messages that aren't in the live window,
          // then merge in the live batch
          const older = prev.filter((m) => !liveKeysRef.current.has(m.key));
          const merged = mergeMessages(older, live);

          // Record oldest timestamp from the full merged set for pagination
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
  }, [spaceId, isOpen]);

  // ── Auto-scroll to bottom on new messages (only when near bottom) ────────
  useEffect(() => {
    if (isOpen && isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // ── Track whether user is near the bottom ───────────────────────────────
  const handleScroll = useCallback(async () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Near bottom check
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

    // Near top: load older page
    if (el.scrollTop < 60 && hasMore && !loadingMore && oldestTimestampRef.current !== null) {
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

          // Restore scroll position after prepending messages
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
  }, [spaceId, hasMore, loadingMore]);

  // ── Send ─────────────────────────────────────────────────────────────────
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
      // Force scroll to bottom after sending
      isNearBottomRef.current = true;
    } catch (err) {
      console.warn('[chat] Failed to send message:', err.message);
    } finally {
      setSending(false);
    }
  }, [input, spaceId, user]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isOpen) return null;

  return (
    <div className="space-chat-window" onClick={(e) => e.stopPropagation()}>
      <div className="space-chat-header">
        <span>Space Chat</span>
      </div>

      <div
        className="space-chat-messages"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
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
        <div ref={bottomRef} />
      </div>

      <div className="space-chat-input-row">
        <input
          className="space-chat-input"
          type="text"
          placeholder="Send a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
          disabled={sending}
        />
        <button
          className="space-chat-send"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          title="Send"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

SpaceChat.displayName = 'SpaceChat';
export default SpaceChat;
