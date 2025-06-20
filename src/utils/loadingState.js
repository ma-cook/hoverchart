// Simple module to track initial loading state for services
// This avoids circular dependencies and React hook issues in service files

let isInitialLoading = true;

export const getIsInitialLoading = () => isInitialLoading;

export const setIsInitialLoading = (loading) => {
  isInitialLoading = loading;
};
