import React from 'react';

const Container = ({
  children,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      className={`w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Container;
