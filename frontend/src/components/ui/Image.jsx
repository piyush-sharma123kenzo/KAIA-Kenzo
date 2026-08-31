import React, { useState } from 'react';

const Image = ({
  src,
  alt = 'KAIA Technologies Product',
  className = '',
  aspectRatio = 'aspect-square',
  fallbackSrc = 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=550&auto=format&fit=crop&q=60',
  objectFit = 'object-contain',
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden w-full bg-[#F8FAFC] rounded-xl p-3 border border-slate-100 flex items-center justify-center ${aspectRatio} ${className}`}>
      
      {/* Loading Shimmer */}
      {loading && (
        <div className="absolute inset-0 animate-shimmer" />
      )}

      {/* Image tag */}
      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        className={`w-full h-full max-w-full max-h-full transition-opacity duration-300 ${objectFit} object-center ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
};

export default Image;
