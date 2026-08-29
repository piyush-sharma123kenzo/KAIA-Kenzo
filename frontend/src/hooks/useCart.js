import { useState, useEffect } from 'react';

export const useCart = () => {
  const [state, setState] = useState(null);
  return state;
};
export default useCart;
