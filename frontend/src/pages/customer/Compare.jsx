import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeftRight, Trash2, ShoppingCart, Star, CheckCircle, 
  X, ArrowRight, ShieldCheck, Cpu, HardDrive, Monitor, Zap, Plus 
} from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { CartContext } from '../../context/CartContext';
import { getAccurateProductImage } from '../../utils/productImageMap';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const Compare = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useContext(CartContext) || {};

  const formatPrice = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);

  // Extract all unique specification keys across all products
  const allSpecKeys = Array.from(
    new Set(
      compareItems.flatMap((p) =>
        p.specifications && typeof p.specifications === 'object'
          ? Object.keys(p.specifications)
          : []
      )
    )
  );

  if (compareItems.length === 0) {
    return (
      <div className="py-20 bg-slate-50 min-h-[75vh] flex items-center justify-center text-left">
        <Container className="max-w-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner border border-amber-200/80">
            <ArrowLeftRight className="w-10 h-10 stroke-[1.75]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Compare Technology Products
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              You have not added any products to compare yet. Browse laptops, smartphones, processors, or peripherals and click the Compare icon.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/products">
              <Button variant="primary" size="lg" className="font-bold px-8 shadow-md">
                Browse Technology Catalog
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 bg-slate-50 min-h-[85vh] text-left">
      <Container className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
              <Link to="/" className="hover:text-amber-600">Home</Link>
              <span>/</span>
              <span className="text-slate-900">Compare</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Side-by-Side Product Comparison
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Comparing {compareItems.length} of max 4 selected electronics hardware items.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/products">
              <button className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors flex items-center space-x-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                <span>Add More Products</span>
              </button>
            </Link>
            <button
              onClick={clearCompare}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Comparison Matrix Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="p-4 md:p-6 w-48 text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
                    Product Overview
                  </th>
                  {compareItems.map((prod) => {
                    const prodId = prod._id || prod.id;
                    const imageUrl = getAccurateProductImage(prod);
                    const brandName = typeof prod.brand === 'string' ? prod.brand : prod.brand?.name || 'Verified';
                    return (
                      <th key={prodId} className="p-4 md:p-6 align-top w-64 md:w-72 relative">
                        <button
                          onClick={() => removeFromCompare(prodId)}
                          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="space-y-3 pr-6">
                          <div className="w-32 h-32 md:w-36 md:h-36 mx-auto bg-slate-50 rounded-xl border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={prod.name}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700';
                              }}
                            />
                          </div>

                          <div className="text-center space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block">
                              {brandName}
                            </span>
                            <Link
                              to={`/product/${prod.slug || prodId}`}
                              className="text-xs md:text-sm font-bold text-slate-900 hover:text-amber-600 line-clamp-2 transition-colors block text-left"
                            >
                              {prod.name}
                            </Link>
                          </div>

                          <div className="pt-2 flex flex-col items-center gap-2">
                            <button
                              onClick={() => addToCart && addToCart(prod, 1)}
                              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 px-3 rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-colors"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </button>
                            <Link
                              to={`/product/${prod.slug || prodId}`}
                              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline"
                            >
                              View Full Details
                            </Link>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {/* Price Row */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 md:p-5 font-bold text-slate-700 bg-slate-50/40">
                    Price & Savings
                  </td>
                  {compareItems.map((prod) => {
                    const prodId = prod._id || prod.id;
                    const sellingPrice = Number(prod.sellingPrice ?? prod.price ?? 0);
                    const mrp = Number(prod.mrp ?? sellingPrice);
                    const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
                    return (
                      <td key={prodId} className="p-4 md:p-5">
                        <div className="space-y-1">
                          <span className="text-base md:text-lg font-black text-slate-950 block">
                            {formatPrice(sellingPrice)}
                          </span>
                          {discount > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(mrp)}
                              </span>
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {discount}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Rating Row */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 md:p-5 font-bold text-slate-700 bg-slate-50/40">
                    Customer Rating
                  </td>
                  {compareItems.map((prod) => {
                    const prodId = prod._id || prod.id;
                    const rating = prod.ratings?.average || 4.5;
                    const count = prod.ratings?.count || 18;
                    return (
                      <td key={prodId} className="p-4 md:p-5">
                        <div className="flex items-center space-x-1.5">
                          <div className="inline-flex items-center space-x-1 bg-amber-400/20 text-amber-900 border border-amber-300/60 font-black px-2 py-0.5 rounded text-[11px]">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{rating}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            ({count} reviews)
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Availability Row */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 md:p-5 font-bold text-slate-700 bg-slate-50/40">
                    Availability
                  </td>
                  {compareItems.map((prod) => {
                    const prodId = prod._id || prod.id;
                    const stockQty = prod.stock?.quantity ?? prod.stock ?? 10;
                    const inStock = stockQty > 0;
                    return (
                      <td key={prodId} className="p-4 md:p-5">
                        {inStock ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle className="w-3 h-3" />
                            <span>In Stock ({stockQty} units)</span>
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold text-[11px]">Out of Stock</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Model Number / SKU */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 md:p-5 font-bold text-slate-700 bg-slate-50/40">
                    Model & SKU
                  </td>
                  {compareItems.map((prod) => (
                    <td key={prod._id || prod.id} className="p-4 md:p-5 text-slate-600 font-mono text-[11px]">
                      <div>Model: {prod.modelNumber || 'Standard'}</div>
                      <div className="text-slate-400">SKU: {prod.SKU || prod.sku || 'N/A'}</div>
                    </td>
                  ))}
                </tr>

                {/* Warranty */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 md:p-5 font-bold text-slate-700 bg-slate-50/40">
                    Warranty
                  </td>
                  {compareItems.map((prod) => (
                    <td key={prod._id || prod.id} className="p-4 md:p-5 text-slate-700 font-medium">
                      {prod.warranty || '1 Year Official Manufacturer Warranty with GST Invoice'}
                    </td>
                  ))}
                </tr>

                {/* Detailed Dynamic Specifications */}
                {allSpecKeys.map((key) => (
                  <tr key={key} className="hover:bg-slate-50/50">
                    <td className="p-4 md:p-5 font-bold text-slate-700 bg-slate-50/40 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </td>
                    {compareItems.map((prod) => {
                      const val = prod.specifications?.[key];
                      return (
                        <td key={prod._id || prod.id} className="p-4 md:p-5 text-slate-800 font-medium">
                          {val !== undefined && val !== null && val !== '' ? String(val) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Compare;
