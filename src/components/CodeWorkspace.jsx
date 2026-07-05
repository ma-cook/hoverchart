import { useEffect, useCallback } from 'react';
import useCodeStore from '../stores/codeStore';
import { useObjectsStore } from '../stores';

const LANGUAGE_MAP = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  cs: 'csharp', php: 'php', cpp: 'cpp', c: 'c', h: 'c',
  css: 'css', scss: 'scss', html: 'html', json: 'json', md: 'markdown',
  yml: 'yaml', yaml: 'yaml', sql: 'sql', sh: 'bash', bash: 'bash',
};

function getLanguage(filePath) {
  const ext = filePath?.split('.').pop()?.toLowerCase();
  return LANGUAGE_MAP[ext] || ext || 'text';
}

const CodeWorkspace = () => {
  const expandedView = useCodeStore((s) => s.expandedView);
  const activeCodeObjectId = useCodeStore((s) => s.activeCodeObjectId);
  const setExpandedView = useCodeStore((s) => s.setExpandedView);

  const objectData = useObjectsStore(
    useCallback(
      (state) => state.objects?.find((o) => o.id === activeCodeObjectId) || null,
      [activeCodeObjectId]
    )
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && expandedView) {
        setExpandedView(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedView, setExpandedView]);

  if (!expandedView || !objectData?.metadata?.code) return null;

  const code = objectData.metadata.code;
  const language = objectData.metadata.language || getLanguage(objectData.metadata.filePath);
  const filePath = objectData.metadata.filePath || '';

  return (
    <div
      className="code-workspace-overlay"
      onClick={() => setExpandedView(false)}
    >
      <div
        className="code-workspace-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="code-workspace-header">
          <div className="code-workspace-file-info">
            <span className="code-workspace-language-tag">{language}</span>
            <span className="code-workspace-file-path">{filePath}</span>
          </div>
          <button
            className="code-workspace-close"
            onClick={() => setExpandedView(false)}
          >
            ✕
          </button>
        </div>
        <div className="code-workspace-body">
          <pre className="code-workspace-pre">
            <code className={`code-workspace-code language-${language}`}>
              {code}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeWorkspace;
