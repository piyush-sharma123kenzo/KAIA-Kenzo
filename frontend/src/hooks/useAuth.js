import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [state, setState] = useState(null);
  return state;
};
export default useAuth;
