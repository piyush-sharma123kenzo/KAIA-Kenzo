import { useState, useEffect } from 'react';

export const useLocalStorage = () => {
  const [state, setState] = useState(null);
  return state;
};
export default useLocalStorage;
