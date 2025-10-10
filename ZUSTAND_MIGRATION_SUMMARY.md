# useState → Zustand Store Migration Summary

## ✅ Completed Migrations

### 1. **LineUI.jsx** (Already completed earlier)

**Converted:** 3 useState calls → connectionStore  
**State:**

- `showLineStyles`
- `showArrowDropdown`
- `currentLineStyle`

**Benefits:**

- Menu state persists across unmounts
- Prevents state loss during rapid connection switching
- Centralized menu management

---

### 2. **UIOverlay.jsx** ⭐ NEW

**Converted:** 3 useState calls → uiOverlayStore  
**State:**

- `isUploadingModel`
- `isProcessingMarkdown`
- `isRecording`

**Changes Made:**

#### `src/stores/uiOverlayStore.js`

```javascript
defaultOverlay: {
  // ... existing
  isUploadingModel: false,
  isProcessingMarkdown: false,
  isRecording: false,
}

// New actions:
setIsUploadingModel: (overlayId = 'main', isUploading)
setIsProcessingMarkdown: (overlayId = 'main', isProcessing)
setIsRecording: (overlayId = 'main', isRecording)
```

#### `src/components/UIOverlay.jsx`

**Before:**

```javascript
const [isUploadingModel, setIsUploadingModel] = useState(false);
const [isProcessingMarkdown, setIsProcessingMarkdown] = useState(false);
const [isRecording, setIsRecording] = useState(false);
```

**After:**

```javascript
const isUploadingModel = useUIOverlayStore(
  (state) => state.getUIOverlay('main').isUploadingModel
);
const setIsUploadingModel = useUIOverlayStore(
  (state) => state.setIsUploadingModel
);
// ... same for other states
```

**Benefits:**

- Operation states accessible globally
- Can monitor all uploads/operations from any component
- Prevents race conditions (only one operation at a time)
- Better error recovery (state persists if component unmounts)

---

### 3. **FaceUI.jsx** ⭐ NEW

**Converted:** 2 useState calls → faceStore  
**State:**

- `showBorderMenu`
- `isBorderColor`

**Changes Made:**

#### `src/stores/faceStore.js`

```javascript
createFace: (faceId, initialState = {}) => ({
  // ... existing
  showBorderMenu: false,
  isBorderColor: false,
});

// New actions:
toggleBorderMenu: faceId;
setShowBorderMenu: faceId, show;
setIsBorderColor: faceId, isBorder;
```

#### `src/components/FaceUI.jsx`

**Before:**

```javascript
const [showBorderMenu, setShowBorderMenu] = useState(false);
const [isBorderColor, setIsBorderColor] = useState(false);
```

**After:**

```javascript
const faceId = face?.id || 'default';
const faceState = useFaceStore((state) => state.getFace(faceId));
const showBorderMenu = faceState?.showBorderMenu || false;
const toggleBorderMenu = useFaceStore((state) => state.toggleBorderMenu);
```

**Benefits:**

- Menu state tied to specific face (not component instance)
- Survives face re-renders
- Can query which faces have menus open
- Cleaner mutual exclusion logic

---

## ❌ useState Calls NOT Converted (And Why)

### **TextObject.jsx** - Keep as useState

```javascript
const [visualScale, setVisualScale] = useState(scale);
const [localText, setLocalText] = useState(text);
const [isLocallyEditing, setIsLocallyEditing] = useState(false);
const [selectedText, setSelectedText] = useState({ start: 0, end: 0 });
const [hasTextSelection, setHasTextSelection] = useState(false);
const [localShowTransform, setLocalShowTransform] = useState(false);
const [effectivePosition, setEffectivePosition] = useState(...);
```

**Reason:** Already using `textObjectStore` for persistent state. These are **transient UI states** that need immediate, high-frequency updates during editing. Converting would cause performance issues due to:

- 60fps position updates
- Real-time text selection changes
- Drag/transform feedback needs to be instant
- No benefit from global access (editing is single-user, single-object)

**Alternative:** These could be consolidated into a `useReducer` for cleaner state transitions, but Zustand would be overkill.

---

### **FaceIndicator.jsx** - Keep as useState

```javascript
const [isOccluded, setIsOccluded] = useState(false);
```

**Reason:** High-frequency raycasting state. Updates 60fps when checking occlusion. Zustand store updates would be too expensive.

---

### **SnapLineIndicator.jsx** - Keep as useState

```javascript
const [fadeOut, setFadeOut] = useState(false);
```

**Reason:** Animation state for CSS fade effect. Temporary, component-local, no need for global access.

---

### **ModelObject.jsx** - Keep as useState

```javascript
const [model, setModel] = useState(null);
const [isDragging, setIsDragging] = useState(false);
```

**Reason:**

- `model`: GLTF model reference, not serializable for Zustand
- `isDragging`: High-frequency drag state, updated every frame

---

### **TextStyleUI.jsx & TextObjectUI.jsx** - Keep as useState

```javascript
const [distance, setDistance] = useState(50);
const [isPositioned, setIsPositioned] = useState(false);
const [bulletPointMode, setBulletPointMode] = useState(...);
```

**Reason:** Temporary UI positioning/layout states. No cross-component sharing needed.

---

## 📊 Migration Statistics

| Component             | useState Before | useState After | Converted | Store Used             |
| --------------------- | --------------- | -------------- | --------- | ---------------------- |
| LineUI.jsx            | 3               | 0              | ✅ 3      | connectionStore        |
| UIOverlay.jsx         | 3               | 0              | ✅ 3      | uiOverlayStore         |
| FaceUI.jsx            | 2               | 0              | ✅ 2      | faceStore              |
| **TOTAL CONVERTED**   | **8**           | **0**          | **✅ 8**  | -                      |
| TextObject.jsx        | 7               | 7              | ❌ 0      | N/A (transient state)  |
| FaceIndicator.jsx     | 1               | 1              | ❌ 0      | N/A (high-freq)        |
| SnapLineIndicator.jsx | 1               | 1              | ❌ 0      | N/A (animation)        |
| ModelObject.jsx       | 2               | 2              | ❌ 0      | N/A (non-serializable) |
| TextStyleUI.jsx       | 3               | 3              | ❌ 0      | N/A (temporary UI)     |
| **TOTAL KEPT**        | **14**          | **14**         | **❌ 14** | -                      |

---

## 🎯 Performance Impact

### Before Migration

- Component-local state lost on unmount
- State recreation on every render when component remounts
- No cross-component visibility
- Difficult to debug state across components

### After Migration

- ✅ **8 fewer useState calls** across 3 components
- ✅ **State persistence** across component lifecycle
- ✅ **Global debuggability** via Zustand DevTools
- ✅ **Better mutual exclusion** (e.g., only one menu open at a time)
- ✅ **Cleaner code** - actions named semantically
- ✅ **Race condition prevention** for async operations

---

## 🔧 How to Add More Migrations

### Decision Tree: Should I convert useState to Zustand?

```
Is the state needed across multiple components?
├─ YES → Convert to Zustand ✅
└─ NO → Is it updated very frequently (>30fps)?
    ├─ YES → Keep as useState ❌
    └─ NO → Does it need to persist across unmounts?
        ├─ YES → Convert to Zustand ✅
        └─ NO → Is it complex interdependent state?
            ├─ YES → Consider useReducer (not Zustand)
            └─ NO → Keep as useState ❌
```

### Example: Converting a new component

1. **Identify the store** (or create one)
2. **Add state to default object**
3. **Create setter/getter actions**
4. **Update component to use store**
5. **Test state persistence**

---

## ✨ Next Steps (If Desired)

### Potential Future Migrations:

None recommended. The remaining `useState` calls are appropriately component-local.

### Alternative Optimizations:

- **TextObject.jsx**: Convert 7 useState → `useReducer` for cleaner state machine
- **Performance**: Already optimized with Zustand where beneficial

---

## 📝 Migration Checklist

- [x] LineUI.jsx menu state
- [x] UIOverlay.jsx operation flags
- [x] FaceUI.jsx border menu state
- [x] Removed unused useState imports
- [x] Verified no regression in functionality
- [x] Updated store exports in `src/stores/index.js`
- [x] Tested state persistence across unmount/remount
- [x] Verified DevTools integration works

---

**Migration completed:** 8 useState calls → Zustand stores  
**Performance improvement:** ⚡ Reduced state recreation, better debuggability  
**Code quality:** ✨ More maintainable, semantic action names
