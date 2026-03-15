import React, { useMemo } from 'react';
import { convertFromRaw } from 'draft-js';

const UpdatesViewer = ({ content, timestamp }) => {
  const parsedContent = useMemo(() => {
    if (!content) return '';
    try {
      const parsedContent = JSON.parse(content);
      const contentState = convertFromRaw(parsedContent);
      return contentState.getPlainText('\n');
    } catch (error) {
      console.error('Error parsing content:', error);
      return String(content);
    }
  }, [content]);

  const formattedTimestamp = useMemo(() => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }, [timestamp]);

  return (
    <div>
      <div style={{ marginTop: '10px' }}>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'inherit',
            margin: 0,
          }}
        >
          {parsedContent}
        </pre>
        <small>{formattedTimestamp}</small>
      </div>
    </div>
  );
};

export default React.memo(UpdatesViewer);
