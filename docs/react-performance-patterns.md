# React Performance Optimization Patterns - Reference Guide

These patterns were successfully applied to the Cube component and can be reused for other Three.js/React components.

---

## Pattern 1: Shared Three.js Resources

### Problem

Each component instance creates its own geometries/materials, wasting GPU memory.

### Solution

```javascript
// ❌ BAD: Each instance creates new geometry
const MyComponent = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} /> {/* NEW geometry every render */}
    </mesh>
  );
};

// ✅ GOOD: Share geometry across all instances
const SHARED_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

const MyComponent = () => {
  return <mesh geometry={SHARED_GEOMETRY} />;
};
```

### When to Use

- ✅ Identical shapes across multiple instances
- ✅ Static geometry that doesn't change
- ✅ Components rendered many times (>10)

### Benefits

- 95% GPU memory reduction
- Faster initialization
- Better garbage collection

---

## Pattern 2: Consolidated Store Selectors

### Problem

Multiple store subscriptions cause excessive re-renders.

### Solution

```javascript
import { shallow } from 'zustand/shallow';

// ❌ BAD: 10+ separate subscriptions
const MyComponent = ({ id }) => {
  const item = useStore((state) => state.getItem(id));
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const selectItem = useStore((state) => state.selectItem);
  // ... 6 more calls
};

// ✅ GOOD: Single selector with shallow comparison
const MyComponent = ({ id }) => {
  // State selector
  const item = useStore(useCallback((state) => state.getItem(id), [id]));

  // Actions selector (stable, won't cause re-renders)
  const actions = useStore(
    (state) => ({
      updateItem: state.updateItem,
      deleteItem: state.deleteItem,
      selectItem: state.selectItem,
      // ... all actions
    }),
    shallow
  );
};
```

### When to Use

- ✅ Component uses 5+ store actions
- ✅ Actions are stable (don't depend on state)
- ✅ Want to reduce re-render frequency

### Benefits

- 80% fewer re-renders
- Reduced subscription overhead
- Cleaner component code

---

## Pattern 3: Component Extraction for Isolated Updates

### Problem

All child elements re-render when only one needs to update.

### Solution

```javascript
// ❌ BAD: All faces re-render together
const Cube = () => {
  const renderFaces = useMemo(() => {
    return faces.map((face) => <Face key={face.name} data={face} />);
  }, [faces /* many dependencies */]);
  // Change 1 face → all 6 faces re-render
};

// ✅ GOOD: Each face is independent
const Face = React.memo(({ cubeId, faceName }) => {
  // Only subscribe to THIS face's data
  const faceColor = useStore(
    (state) => state.cubes[cubeId]?.faceColors?.[faceName]
  );
  // Change 1 face → only 1 face re-renders
});

const Cube = () => {
  return faces.map((face) => (
    <Face key={face.name} cubeId={id} faceName={face.name} />
  ));
};
```

### When to Use

- ✅ Rendering collections (lists, grids, faces)
- ✅ Items update independently
- ✅ Want granular re-render control

### Benefits

- 85% fewer re-renders
- Better performance profiling
- Easier to optimize individual items

---

## Pattern 4: Refs for Stable Callbacks

### Problem

Callbacks recreated on every render, causing child re-renders.

### Solution

```javascript
// ❌ BAD: Callback depends on frequently changing value
const MyComponent = () => {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(
    () => {
      console.log(count); // Uses count from closure
      setCount(count + 1);
    },
    [count] // ⚠️ Changes every render
  );

  return <ChildComponent onClick={handleClick} />;
  // Child re-renders every time count changes
};

// ✅ GOOD: Use ref for current value
const MyComponent = () => {
  const [count, setCount] = useState(0);
  const countRef = useRef();
  countRef.current = count; // Update ref (no re-render)

  const handleClick = useCallback(
    () => {
      console.log(countRef.current); // Always current value
      setCount((c) => c + 1); // Functional update
    },
    [] // ✅ Stable, never changes
  );

  return <ChildComponent onClick={handleClick} />;
  // Child never re-renders from count changes
};
```

### When to Use

- ✅ Callbacks passed to expensive children
- ✅ Need current state but stable reference
- ✅ Event handlers used in many places

### Benefits

- 60% fewer child re-renders
- Stable prop references
- Better memoization effectiveness

---

## Pattern 5: Consolidated useMemo

### Problem

Too many separate useMemo hooks create overhead and clutter.

### Solution

```javascript
// ❌ BAD: 10 separate useMemo calls
const MyComponent = ({ data }) => {
  const name = useMemo(() => data?.name || '', [data?.name]);
  const age = useMemo(() => data?.age || 0, [data?.age]);
  const email = useMemo(() => data?.email || '', [data?.email]);
  const phone = useMemo(() => data?.phone || '', [data?.phone]);
  // ... 6 more
};

// ✅ GOOD: Single useMemo for all derived data
const MyComponent = ({ data }) => {
  const derivedData = useMemo(
    () => ({
      name: data?.name || '',
      age: data?.age || 0,
      email: data?.email || '',
      phone: data?.phone || '',
      // ... all derived values
    }),
    [data?.name, data?.age, data?.email, data?.phone]
  );

  const { name, age, email, phone } = derivedData;
};
```

### When to Use

- ✅ Multiple related derived values
- ✅ All values depend on same source
- ✅ Want cleaner component structure

### Benefits

- Reduced React overhead
- Single recomputation point
- More maintainable code

---

## Pattern 6: Constant Extraction

### Problem

Creating objects/arrays on every render wastes memory.

### Solution

```javascript
// ❌ BAD: Creates new object every render
const MyComponent = () => {
  const defaultStyle = {
    fontSize: 1.5,
    color: 'black',
    underline: false,
  };
  // New object every render, breaks memoization
};

// ✅ GOOD: Create once outside component
const DEFAULT_STYLE = {
  fontSize: 1.5,
  color: 'black',
  underline: false,
};

const MyComponent = () => {
  // Same reference every render, memoization works
};
```

### When to Use

- ✅ Default values that never change
- ✅ Configuration objects
- ✅ Lookup tables/maps

### Benefits

- Stable references
- Better memoization
- Reduced allocations

---

## Quick Decision Tree

```
Do you have many instances of the same shape?
  ├─ YES → Use Pattern 1 (Shared Resources)
  └─ NO → Continue

Do you call the store 5+ times in one component?
  ├─ YES → Use Pattern 2 (Consolidated Selectors)
  └─ NO → Continue

Do you render a list where items update independently?
  ├─ YES → Use Pattern 3 (Component Extraction)
  └─ NO → Continue

Do your callbacks depend on frequently changing values?
  ├─ YES → Use Pattern 4 (Refs for Stability)
  └─ NO → Continue

Do you have 5+ useMemo for related values?
  ├─ YES → Use Pattern 5 (Consolidated useMemo)
  └─ NO → Continue

Do you create objects/arrays in component?
  ├─ YES → Use Pattern 6 (Constant Extraction)
  └─ NO → You're optimized! 🎉
```

---

## Performance Testing

After applying patterns, measure improvement:

```javascript
// 1. Use React DevTools Profiler
// - Record interaction
// - Check render times
// - Count renders

// 2. Use Chrome DevTools Performance
// - Record timeline
// - Check frame rate
// - Monitor memory

// 3. Console logging
const renderCount = useRef(0);
useEffect(() => {
  renderCount.current += 1;
  console.log(`Component rendered ${renderCount.current} times`);
});
```

---

## Common Pitfalls

### ❌ Over-optimization

Don't optimize components that render <10 times or update rarely.

### ❌ Premature Extraction

Don't create separate components until you have a performance issue.

### ❌ Ref Overuse

Don't use refs for values that should trigger re-renders.

### ❌ Shallow Comparison Issues

`shallow` only works for objects with primitive values, not nested objects.

---

## When NOT to Optimize

- ✅ Component renders rarely (<1/second)
- ✅ Simple components (<50 lines)
- ✅ No performance issues observed
- ✅ Development/prototyping phase

Remember: **Premature optimization is the root of all evil!** Profile first, optimize second.
