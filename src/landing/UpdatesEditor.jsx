import React, { useState } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const UpdatesEditor = ({ onClose, user }) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleInlineStyle = (style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const handleSave = async () => {
    const contentState = editorState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    try {
      await addDoc(collection(db, 'devUpdates'), {
        content: JSON.stringify(rawContent),
        timestamp: new Date(),
        userId: user.uid,
      });
      onClose();
    } catch (error) {
      console.error('Error saving update:', error);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '15px',
        border: '2px solid black',
        zIndex: 20,
        boxShadow: '0 0 20px rgba(0,0,0,0.2)',
        width: '400px',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => toggleInlineStyle('BOLD')}>Bold</button>
        <button onClick={() => toggleInlineStyle('UNDERLINE')}>
          Underline
        </button>
        <button onClick={() => toggleInlineStyle('ITALIC')}>Italic</button>
        <button onClick={() => toggleInlineStyle('STRIKETHROUGH')}>
          Strikethrough
        </button>
      </div>
      <div style={{ flex: 1, border: '1px solid black', padding: '1rem' }}>
        <div style={{ color: 'black' }}>
          <Editor
            editorState={editorState}
            handleKeyCommand={handleKeyCommand}
            onChange={setEditorState}
          />
        </div>
      </div>
      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default UpdatesEditor;
