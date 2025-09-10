# Test Merfolk Syntax Variations

## Test 1: Quoted labels with spaces around colon

```merfolk
graph3d "Test 1"
A[Function: App]
B{Component: useSpaceManager}
A --> B : "space management"
```

## Test 2: Unquoted labels with colon

```merfolk
graph3d "Test 2"
C[Function: App2]
D{Component: useSpaceManager2}
C --> D: space management
```

## Test 3: No labels

```merfolk
graph3d "Test 3"
E[Function: App3]
F{Component: useSpaceManager3}
E --> F
```
