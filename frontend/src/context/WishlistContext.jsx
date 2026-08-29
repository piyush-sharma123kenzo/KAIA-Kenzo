import React, { createContext, useContext, useState } from 'react';

const WishlistContext = createContext(null);

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [data, setData] = useState([]);
  return (
    <WishlistContext.Provider value={{ data, setData }}>
      {children}
    </WishlistContext.Provider>
  );
};
