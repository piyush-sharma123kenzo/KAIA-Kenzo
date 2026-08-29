import React from 'react';
import { ArrowUpDown, SlidersHorizontal } from 'lucide-react';

// General collapsible section wrapper
export const FilterSection = ({
  title,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-3 pb-6 border-b border-brand-gray-150 ${className}`} {...props}>
      <h4 className="font-bold text-xs text-brand-gray-700 uppercase tracking-wider">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
};

// Checkbox item mapping
export const CheckboxFilter = ({
  label,
  checked,
  onChange,
  count,
  className = '',
  ...props
}) => {
  return (
    <label
      className={`flex items-center justify-between text-xs text-brand-gray-600 cursor-pointer hover:text-brand-gray-950 select-none ${className}`}
      {...props}
    >
      <div className="flex items-center space-x-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="rounded border-brand-gray-300 text-brand-accent focus:ring-brand-accent w-4 h-4"
        />
        <span>{label}</span>
      </div>
      {count !== undefined && <span className="text-[10px] text-brand-gray-400 font-bold bg-brand-gray-50 border px-1.5 py-0.5 rounded">{count}</span>}
    </label>
  );
};

// Price range fields
export const PriceFilter = ({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  onApply,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-3 ${className}`} {...props}>
      <div className="flex space-x-2">
        <div className="space-y-1 w-full">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onMinChange(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded text-xs"
          />
        </div>
        <div className="space-y-1 w-full">
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onMaxChange(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded text-xs"
          />
        </div>
      </div>
      {onApply && (
        <button
          type="button"
          onClick={onApply}
          className="w-full bg-brand-dark hover:bg-brand-gray-800 text-white font-semibold py-2 text-[10px] rounded-sm uppercase tracking-wider transition-colors"
        >
          Apply Price Range
        </button>
      )}
    </div>
  );
};

// Sort triggers dropdown
export const SortDropdown = ({
  value,
  onChange,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-center space-x-2 bg-white border border-brand-gray-200 px-3 py-2 rounded-sm text-xs ${className}`} {...props}>
      <ArrowUpDown className="w-4 h-4 text-brand-gray-500 shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none text-brand-gray-800 text-xs focus:ring-0 cursor-pointer font-semibold"
      >
        <option value="">Sort: Featured</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="rating">Rating: High to Low</option>
      </select>
    </div>
  );
};

// Complete Filter Sidebar shell
const FilterSidebar = ({
  categories = [],
  selectedCategories = [],
  onCategoryToggle,
  brands = [],
  selectedBrands = [],
  onBrandToggle,
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  onPriceApply,
  onClearAll,
  className = '',
  ...props
}) => {
  return (
    <aside className={`bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-6 ${className}`} {...props}>
      <div className="flex justify-between items-center pb-4 border-b border-brand-gray-250">
        <h3 className="font-extrabold text-brand-gray-900 text-xs tracking-wider uppercase flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-accent" />
          <span>Filters Catalog</span>
        </h3>
        {onClearAll && (
          <button onClick={onClearAll} className="text-[10px] text-brand-accent hover:underline font-bold uppercase tracking-wider">
            Clear All
          </button>
        )}
      </div>

      {/* Categories Section */}
      {categories.length > 0 && (
        <FilterSection title="Categories">
          {categories.map((cat) => (
            <CheckboxFilter
              key={cat._id}
              label={cat.name}
              checked={selectedCategories.includes(cat.slug)}
              onChange={() => onCategoryToggle(cat.slug)}
            />
          ))}
        </FilterSection>
      )}

      {/* Brands Section */}
      {brands.length > 0 && (
        <FilterSection title="Brands">
          {brands.map((b) => (
            <CheckboxFilter
              key={b._id}
              label={b.name}
              checked={selectedBrands.includes(b.slug)}
              onChange={() => onBrandToggle(b.slug)}
            />
          ))}
        </FilterSection>
      )}

      {/* Pricing Section */}
      <FilterSection title="Pricing (INR)">
        <PriceFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinChange={onMinChange}
          onMaxChange={onMaxChange}
          onApply={onPriceApply}
        />
      </FilterSection>
    </aside>
  );
};

export default FilterSidebar;
