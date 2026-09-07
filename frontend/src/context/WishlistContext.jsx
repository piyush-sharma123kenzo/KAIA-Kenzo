import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { CartContext } from './CartContext';
import { wishlistService } from '../services/wishlistService';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { refreshCart } = useContext(CartContext) || {};
  const [wishlist, setWishlist] = useState({ products: [], count: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch or refresh wishlist from backend
  const refreshWishlist = useCallback(async () => {
    if (user) {
      try {
        const data = await wishlistService.getWishlist();
        if (data.success && data.wishlist) {
          setWishlist(data.wishlist);
        } else {
          setWishlist({ products: [], count: 0 });
        }
      } catch (err) {
        console.error('Error fetching backend wishlist:', err);
        setWishlist({ products: [], count: 0 });
      }
    } else {
      setWishlist({ products: [], count: 0 });
    }
  }, [user]);

  // Initial load & user session transition
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await refreshWishlist();
      setLoading(false);
    };

    initialize();
  }, [user, refreshWishlist]);

  // Helper: check if product is in wishlist
  const isInWishlist = useCallback(
    (productId) => {
      if (!productId || !wishlist?.products) return false;
      const targetId = productId._id || productId.id || productId;
      return wishlist.products.some((item) => {
        const pId = item?.product?._id || item?.product?.id || item?.product;
        return String(pId) === String(targetId);
      });
    },
    [wishlist]
  );

  // Add Item to Wishlist
  const addToWishlist = async (productId) => {
    const targetId = productId?._id || productId?.id || productId;
    if (!user) {
      const err = new Error('Please sign in to add items to your wishlist');
      err.requiresAuth = true;
      throw err;
    }

    try {
      const res = await wishlistService.addToWishlist(targetId);
      if (res.success && res.wishlist) {
        setWishlist(res.wishlist);
        return res;
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      throw err;
    }
  };

  // Toggle item in Wishlist
  const toggleWishlist = async (productId) => {
    const targetId = productId?._id || productId?.id || productId;
    if (!user) {
      const err = new Error('Please sign in to manage your wishlist');
      err.requiresAuth = true;
      throw err;
    }

    try {
      const res = await wishlistService.toggleWishlist(targetId);
      if (res.success && res.wishlist) {
        setWishlist(res.wishlist);
        return res;
      }
    } catch (err) {
      console.error('Error toggling wishlist item:', err);
      throw err;
    }
  };

  // Remove Item from Wishlist
  const removeFromWishlist = async (productId) => {
    const targetId = productId?._id || productId?.id || productId;
    if (!user) return;

    try {
      const res = await wishlistService.removeFromWishlist(targetId);
      if (res.success && res.wishlist) {
        setWishlist(res.wishlist);
        return res;
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      throw err;
    }
  };

  // Move Item from Wishlist to Cart
  const moveToCart = async (productId, quantity = 1, selectedSpecs = {}) => {
    const targetId = productId?._id || productId?.id || productId;
    if (!user) {
      const err = new Error('Please sign in to move items to your cart');
      err.requiresAuth = true;
      throw err;
    }

    try {
      const res = await wishlistService.moveToCart(targetId, quantity, selectedSpecs);
      if (res.success) {
        if (res.wishlist) {
          setWishlist(res.wishlist);
        } else {
          await refreshWishlist();
        }
        if (refreshCart) {
          await refreshCart();
        }
        return res;
      }
    } catch (err) {
      console.error('Error moving wishlist item to cart:', err);
      throw err;
    }
  };

  // Clear entire Wishlist
  const clearWishlist = async () => {
    if (!user) {
      setWishlist({ products: [], count: 0 });
      return;
    }

    try {
      const res = await wishlistService.clearWishlist();
      if (res.success && res.wishlist) {
        setWishlist(res.wishlist);
      } else {
        setWishlist({ products: [], count: 0 });
      }
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      throw err;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist?.count || wishlist?.products?.length || 0,
        loading,
        isInWishlist,
        addToWishlist,
        toggleWishlist,
        removeFromWishlist,
        moveToCart,
        clearWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
