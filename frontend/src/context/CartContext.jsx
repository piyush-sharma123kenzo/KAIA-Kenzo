import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import axiosInstance from '../api/axiosInstance';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  // Load cart initially
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      if (user) {
        // Authenticated user cart loading
        try {
          const res = await axiosInstance.get('/cart');
          if (res.data.success) {
            setCart(res.data.cart || { items: [] });
          }
        } catch (err) {
          console.error('Error loading authenticated cart:', err);
          setCart({ items: [] });
        }
      } else {
        // Guest user cart loading from localStorage
        const localCart = localStorage.getItem('kaia_cart');
        if (localCart) {
          try {
            const parsed = JSON.parse(localCart);
            if (parsed && Array.isArray(parsed.items)) {
              setCart(parsed);
            } else {
              setCart({ items: [] });
            }
          } catch (e) {
            setCart({ items: [] });
          }
        } else {
          setCart({ items: [] });
        }
      }
      setLoading(false);
    };

    loadCart();
  }, [user]);

  // Sync guest cart with backend cart on login
  useEffect(() => {
    const performSync = async () => {
      if (user) {
        const localCartStr = localStorage.getItem('kaia_cart');
        if (localCartStr) {
          try {
            const localCart = JSON.parse(localCartStr);
            if (localCart.items && localCart.items.length > 0) {
              // Flatten data to backend format: [{ product: id, quantity, selectedSpecs }]
              const itemsToSync = localCart.items.map((item) => ({
                product: item.product._id || item.product,
                quantity: item.quantity,
                selectedSpecs: item.selectedSpecs || {},
              }));

              const res = await axiosInstance.post('/cart/sync', { items: itemsToSync });
              if (res.data.success) {
                setCart(res.data.cart);
                localStorage.removeItem('kaia_cart');
              }
            }
          } catch (err) {
            console.error('Error syncing local cart to backend:', err);
          }
        }
      }
    };

    performSync();
  }, [user]);

  // Add Item
  const addToCart = async (product, quantity = 1, selectedSpecs = {}) => {
    if (user) {
      try {
        const res = await axiosInstance.post('/cart/add', {
          productId: product._id,
          quantity,
          selectedSpecs,
        });
        if (res.data.success) {
          setCart(res.data.cart);
        }
      } catch (err) {
        console.error('Error adding to backend cart:', err);
        throw err;
      }
    } else {
      // Guest local update
      const items = [...(cart?.items || [])];
      const existingIndex = items.findIndex(
        (item) =>
          item && item.product &&
          item.product._id === product._id &&
          JSON.stringify(item.selectedSpecs) === JSON.stringify(selectedSpecs)
      );

      if (existingIndex > -1) {
        items[existingIndex].quantity += Number(quantity);
      } else {
        items.push({
          product, // Store full product object for offline browsing displays
          quantity: Number(quantity),
          selectedSpecs,
        });
      }

      const updatedCart = { items };
      setCart(updatedCart);
      localStorage.setItem('kaia_cart', JSON.stringify(updatedCart));
    }
  };

  // Update Quantity
  const updateQuantity = async (productId, quantity, selectedSpecs = {}) => {
    if (user) {
      try {
        const res = await axiosInstance.put('/cart/update', {
          productId,
          quantity,
          selectedSpecs,
        });
        if (res.data.success) {
          setCart(res.data.cart);
        }
      } catch (err) {
        console.error('Error updating backend cart qty:', err);
      }
    } else {
      // Guest local update
      const items = (cart?.items || []).map((item) => {
        if (
          item && item.product &&
          item.product._id === productId &&
          JSON.stringify(item.selectedSpecs) === JSON.stringify(selectedSpecs)
        ) {
          return { ...item, quantity: Number(quantity) };
        }
        return item;
      });

      const updatedCart = { items };
      setCart(updatedCart);
      localStorage.setItem('kaia_cart', JSON.stringify(updatedCart));
    }
  };

  // Remove Item
  const removeFromCart = async (productId, selectedSpecs = {}) => {
    if (user) {
      try {
        const res = await axiosInstance.post('/cart/remove', {
          productId,
          selectedSpecs,
        });
        if (res.data.success) {
          setCart(res.data.cart);
        }
      } catch (err) {
        console.error('Error removing from backend cart:', err);
      }
    } else {
      // Guest local update
      const items = (cart?.items || []).filter(
        (item) =>
          item && item.product &&
          !(
            item.product._id === productId &&
            JSON.stringify(item.selectedSpecs) === JSON.stringify(selectedSpecs)
          )
      );

      const updatedCart = { items };
      setCart(updatedCart);
      localStorage.setItem('kaia_cart', JSON.stringify(updatedCart));
    }
  };

  // Clear Cart locally (utility)
  const clearCart = () => {
    setCart({ items: [] });
    localStorage.removeItem('kaia_cart');
  };

  // Calculate pricing summaries locally to display in UI immediately
  const getCartTotals = () => {
    let subtotal = 0;
    let tax = 0;
    let quantityCount = 0;

    const items = cart?.items || [];
    items.forEach((item) => {
      if (!item || !item.product) return;
      const price = item.product.sellingPrice || 0;
      const qty = item.quantity || 0;
      const gstRate = item.product.gstRate || 18.0;

      const itemTotal = price * qty;
      const itemGst = itemTotal * (gstRate / (100 + gstRate));

      subtotal += itemTotal - itemGst;
      tax += itemGst;
      quantityCount += qty;
    });

    const totalBeforeShipping = subtotal + tax;
    const shipping = totalBeforeShipping > 0 && totalBeforeShipping < 5000 ? 150 : 0;
    const total = totalBeforeShipping + shipping;

    return {
      subtotal: Math.round(subtotal),
      tax: Math.round(tax),
      shipping,
      total: Math.round(total),
      quantityCount,
    };
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartTotals,
        cartTotals: getCartTotals(),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
