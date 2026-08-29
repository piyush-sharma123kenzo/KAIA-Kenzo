import { useState, useEffect } from 'react';

export const useFetch = () => {
  const [state, setState] = useState(null);
  return state;
};
export default useFetch;
