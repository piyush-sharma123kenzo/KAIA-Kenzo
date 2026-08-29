import { useState, useEffect } from 'react';

export const useDebounce = () => {
  const [state, setState] = useState(null);
  return state;
};
export default useDebounce;
