import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { cartService } from '../services/cartService';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [], totals: {} });
  const [loading, setLoading] = useState(true);

  // Helper: calculate local pricing summary for guest carts
  const calculateTotals = useCallback((itemsList = []) => {
    let subtotal = 0;
    let tax = 0;
    let quantityCount = 0;

    itemsList.forEach((item) => {
      if (!item || !item.product) return;
      const unitPrice = Number(item.product.sellingPrice ?? item.product.price ?? 0);
      const qty = Number(item.quantity || 1);
      const gstRate = Number(item.product.gstRate ?? 18.0);

      const itemTotal = unitPrice * qty;
      const itemGst = Math.round(itemTotal * (gstRate / (100 + gstRate)));
      const itemSubtotal = itemTotal - itemGst;

      subtotal += itemSubtotal;
      tax += itemGst;
      quantityCount += qty;
    });

    const totalBeforeShipping = subtotal + tax;
    const shipping = totalBeforeShipping > 0 && totalBeforeShipping < 5000 ? 150 : 0;
    const grandTotal = totalBeforeShipping + shipping;

    return {
      subtotal: Math.round(subtotal),
      tax: Math.round(tax),
      shipping,
      total: Math.round(grandTotal),
      quantityCount,
    };
  }, []);

  // Fetch or load initial cart
  const refreshCart = useCallback(async () => {
    if (user) {
      try {
        const data = await cartService.getCart();
        if (data.success && data.cart) {
          setCart(data.cart);
        } else {
          setCart({ items: [], totals: calculateTotals([]) });
        }
      } catch (err) {
        console.error('Error fetching backend cart:', err);
        setCart({ items: [], totals: calculateTotals([]) });
      }
    } else {
      // Load guest cart from localStorage
      const localCartStr = localStorage.getItem('kaia_cart');
      if (localCartStr) {
        try {
          const parsed = JSON.parse(localCartStr);
          if (parsed && Array.isArray(parsed.items)) {
            const calculated = calculateTotals(parsed.items);
            setCart({ items: parsed.items, totals: calculated });
          } else {
            setCart({ items: [], totals: calculateTotals([]) });
          }
        } catch (e) {
          setCart({ items: [], totals: calculateTotals([]) });
        }
      } else {
        setCart({ items: [], totals: calculateTotals([]) });
      }
    }
  }, [user, calculateTotals]);

  // Initial cart load & user session transition
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      if (user) {
        // If there are guest items in localStorage, merge them upon login
        const localCartStr = localStorage.getItem('kaia_cart');
        if (localCartStr) {
          try {
            const localCart = JSON.parse(localCartStr);
            if (localCart && Array.isArray(localCart.items) && localCart.items.length > 0) {
              const formattedItems = localCart.items.map((it) => ({
                product: it.product?._id || it.product,
                quantity: it.quantity || 1,
                selectedSpecs: it.selectedSpecs || {},
              }));
              const mergeRes = await cartService.mergeCart(formattedItems);
              if (mergeRes.success && mergeRes.cart) {
                setCart(mergeRes.cart);
                localStorage.removeItem('kaia_cart');
                setLoading(false);
                return;
              }
            }
          } catch (err) {
            console.error('Error merging guest cart on login:', err);
          }
          localStorage.removeItem('kaia_cart');
        }
        await refreshCart();
      } else {
        await refreshCart();
      }
      setLoading(false);
    };

    initialize();
  }, [user, refreshCart]);

  // Add Item
  const addToCart = async (product, quantity = 1, selectedSpecs = {}) => {
    const prodId = product._id || product.id;
    const requestedQty = parseInt(quantity, 10) || 1;

    if (user) {
      try {
        const res = await cartService.addToCart(prodId, requestedQty, selectedSpecs);
        if (res.success && res.cart) {
          setCart(res.cart);
          return res;
        }
      } catch (err) {
        console.error('Error adding to backend cart:', err);
        throw err;
      }
    } else {
      // Guest local storage update
      const items = [...(cart?.items || [])];
      const existingIndex = items.findIndex(
        (item) =>
          item &&
          item.product &&
          (item.product._id === prodId || item.product.id === prodId) &&
          JSON.stringify(item.selectedSpecs || {}) === JSON.stringify(selectedSpecs || {})
      );

      const availableStock = Math.max(
        0,
        (product.stock?.quantity ?? 10) - (product.stock?.reservedQuantity ?? 0)
      );

      if (existingIndex > -1) {
        const newQty = items[existingIndex].quantity + requestedQty;
        if (newQty > availableStock) {
          const err = new Error(`Only ${availableStock} items are available.`);
          err.response = { data: { message: `Only ${availableStock} items are available.` } };
          throw err;
        }
        items[existingIndex].quantity = newQty;
      } else {
        if (requestedQty > availableStock) {
          const err = new Error(`Only ${availableStock} items are available.`);
          err.response = { data: { message: `Only ${availableStock} items are available.` } };
          throw err;
        }
        items.push({
          product,
          quantity: requestedQty,
          selectedSpecs,
          priceAtAdd: product.sellingPrice || product.price || 0,
        });
      }

      const calculated = calculateTotals(items);
      const updatedCart = { items, totals: calculated };
      setCart(updatedCart);
      localStorage.setItem('kaia_cart', JSON.stringify(updatedCart));
      return { success: true, cart: updatedCart };
    }
  };

  // Update Item Quantity
  const updateQuantity = async (productId, quantity, selectedSpecs = {}) => {
    const targetQty = parseInt(quantity, 10);

    if (user) {
      try {
        const res = await cartService.updateQuantity(productId, targetQty, selectedSpecs);
        if (res.success && res.cart) {
          setCart(res.cart);
          return res;
        }
      } catch (err) {
        console.error('Error updating cart quantity:', err);
        throw err;
      }
    } else {
      // Guest update
      let items = [...(cart?.items || [])];
      if (targetQty <= 0) {
        items = items.filter(
          (item) =>
            !(
              (item.product?._id === productId || item.product?.id === productId) &&
              JSON.stringify(item.selectedSpecs || {}) === JSON.stringify(selectedSpecs || {})
            )
        );
      } else {
        items = items.map((item) => {
          if (
            (item.product?._id === productId || item.product?.id === productId) &&
            JSON.stringify(item.selectedSpecs || {}) === JSON.stringify(selectedSpecs || {})
          ) {
            return { ...item, quantity: targetQty };
          }
          return item;
        });
      }

      const calculated = calculateTotals(items);
      const updatedCart = { items, totals: calculated };
      setCart(updatedCart);
      localStorage.setItem('kaia_cart', JSON.stringify(updatedCart));
      return { success: true, cart: updatedCart };
    }
  };

  // Remove Item
  const removeFromCart = async (productId, selectedSpecs = {}) => {
    if (user) {
      try {
        const res = await cartService.removeFromCart(productId, selectedSpecs);
        if (res.success && res.cart) {
          setCart(res.cart);
          return res;
        }
      } catch (err) {
        console.error('Error removing cart item:', err);
        throw err;
      }
    } else {
      const items = (cart?.items || []).filter(
        (item) =>
          !(
            (item.product?._id === productId || item.product?.id === productId) &&
            JSON.stringify(item.selectedSpecs || {}) === JSON.stringify(selectedSpecs || {})
          )
      );

      const calculated = calculateTotals(items);
      const updatedCart = { items, totals: calculated };
      setCart(updatedCart);
      localStorage.setItem('kaia_cart', JSON.stringify(updatedCart));
      return { success: true, cart: updatedCart };
    }
  };

  // Clear Cart
  const clearCart = async () => {
    if (user) {
      try {
        await cartService.clearCart();
      } catch (err) {
        console.error('Error clearing cart on backend:', err);
      }
    }
    const emptyCart = { items: [], totals: calculateTotals([]) };
    setCart(emptyCart);
    localStorage.removeItem('kaia_cart');
  };

  // Get current cart totals
  const getCartTotals = useCallback(() => {
    if (cart?.totals && Object.keys(cart.totals).length > 0) {
      return cart.totals;
    }
    return calculateTotals(cart?.items || []);
  }, [cart, calculateTotals]);

  const currentTotals = getCartTotals();

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartTotals,
        cartTotals: currentTotals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;

