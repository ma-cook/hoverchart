import { useState } from 'react';

// Small presentational helper shared by the public FeedbackPanel and the admin
// Feedback section.

export function FeedbackAvatar({ name, url, size = 24 }) {
  const [errored, setErrored] = useState(false);
  const initials = (name || '?').trim().slice(0, 1).toUpperCase();
  return (
    <span
      className="feedback-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {url && !errored ? (
        <img
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
