import { useState, useRef, useEffect, useMemo } from 'react';
import useObjectsStore from '../stores/objectsStore';
import * as THREE from 'three';

function getDisplayName(obj) {
  if (obj.headerText) return obj.headerText;
  if (obj.type === 'text' && obj.text) {
    const t = obj.text.replace(/\s+/g, ' ').trim();
    return t.length > 40 ? t.slice(0, 40) + '…' : t;
  }
  if (obj.type === 'model' && obj.modelUrl) {
    try {
      return obj.modelUrl.split('/').pop().split('?')[0] || '3D Model';
    } catch {
      return '3D Model';
    }
  }
  return obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
}

function matchesQuery(obj, query) {
  const name = getDisplayName(obj).toLowerCase();
  return name.includes(query.toLowerCase().trim());
}

const LOOKAT_OFFSET = new THREE.Vector3(30, 30, 30);

function lookAtObject(object) {
  const position = new THREE.Vector3(
    object.position[0],
    object.position[1],
    object.position[2]
  );
  const cameraPos = position.clone().add(LOOKAT_OFFSET);
  if (window.cameraRef) {
    window.cameraRef.camera.position.copy(cameraPos);
    window.cameraRef.camera.lookAt(position);
    if (window.cameraRef.setTarget) {
      window.cameraRef.setTarget(position);
    }
  } else if (window.orbitControls) {
    window.orbitControls.target.copy(position);
    window.orbitControls.update();
  }
}

const MAX_RESULTS = 10;

const ObjectSearch = () => {
  const objects = useObjectsStore((s) => s.objects);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 1) return [];
    const filtered = [];
    for (const obj of objects) {
      if (filtered.length >= MAX_RESULTS) break;
      if (matchesQuery(obj, trimmed)) {
        filtered.push(obj);
      }
    }
    return filtered;
  }, [objects, query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleFocus = () => {
    if (query.trim()) setIsOpen(true);
  };

  const handleEyeClick = (obj) => {
    lookAtObject(obj);
    setIsOpen(false);
    setQuery('');
  };

  const showDropdown = isOpen && query.trim().length >= 1;

  return (
    <div className="object-search-wrapper" ref={wrapperRef}>
      <input
        ref={inputRef}
        className="object-search-input"
        type="text"
        placeholder="🔍 Search objects…"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
      />
      {showDropdown && (
        <div className="object-search-dropdown">
          {results.length === 0 ? (
            <div className="object-search-empty">No objects found</div>
          ) : (
            results.map((obj) => (
              <div key={obj.id} className="object-search-item">
                <span className="object-search-name">
                  {getDisplayName(obj)}
                </span>
                <button
                  className="object-search-eye-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEyeClick(obj);
                  }}
                  title="Look at this object"
                >
                  👁
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ObjectSearch;
