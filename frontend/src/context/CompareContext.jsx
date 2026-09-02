import React, { createContext, useState, useEffect, useContext } from 'react';
import { ToastContext } from './ToastContext';

export const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
  const toast = useContext(ToastContext);
  const [compareItems, setCompareItems] = useState(() => {
    try {
      const saved = localStorage.getItem('kaia_compare_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading compare items:', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kaia_compare_items', JSON.stringify(compareItems));
    } catch (e) {
      console.error('Error saving compare items:', e);
    }
  }, [compareItems]);

  const addToCompare = (product) => {
    if (!product) return false;
    const prodId = product._id || product.id;

    if (compareItems.some((item) => (item._id || item.id) === prodId)) {
      if (toast?.showToast) toast.showToast(`${product.name} is already in comparison.`, 'info');
      return false;
    }

    if (compareItems.length >= 4) {
      if (toast?.showToast) {
        toast.showToast('You can compare a maximum of 4 products at a time.', 'warning');
      } else {
        alert('You can compare a maximum of 4 products at a time.');
      }
      return false;
    }

    setCompareItems((prev) => [...prev, product]);
    if (toast?.showToast) toast.showToast(`Added ${product.name} to comparison.`, 'success');
    return true;
  };

  const removeFromCompare = (productId) => {
    setCompareItems((prev) => prev.filter((item) => (item._id || item.id) !== productId));
    if (toast?.showToast) toast.showToast('Product removed from comparison.', 'info');
  };

  const toggleCompare = (product) => {
    if (!product) return;
    const prodId = product._id || product.id;
    if (isInCompare(prodId)) {
      removeFromCompare(prodId);
    } else {
      addToCompare(product);
    }
  };

  const isInCompare = (productId) => {
    return compareItems.some((item) => (item._id || item.id) === productId);
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        compareCount: compareItems.length,
        addToCompare,
        removeFromCompare,
        toggleCompare,
        isInCompare,
        clearCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

export default CompareContext;
