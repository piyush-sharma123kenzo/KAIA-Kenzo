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
    <div className={`relative overflow-hidden w-full bg-brand-gray-50 border border-brand-gray-100 ${aspectRatio} ${className}`}>
      
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
        className={`w-full h-full transition-opacity duration-300 ${objectFit} ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
};

export default Image;
