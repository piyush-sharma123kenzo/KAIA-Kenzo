import { useState, useEffect } from 'react';

export const useWishlist = () => {
  const [state, setState] = useState(null);
  return state;
};
export default useWishlist;
