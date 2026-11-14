import { createContext, useContext } from 'react';

export const DetailContext = createContext('high');

export function useDetailLevel() {
  return useContext(DetailContext);
}
