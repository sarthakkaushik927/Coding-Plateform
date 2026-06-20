import React from 'react';
import { Link } from 'react-router-dom';

interface BrandMarkProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-10 h-10 text-xl',
  lg: 'w-16 h-16 text-3xl'
};

const BrandBox = ({ size = 'md', className = '' }: Omit<BrandMarkProps, 'to'>) => (
  <div className={`${sizeClasses[size]} border border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold mx-auto ${className}`}>
    N
  </div>
);

const BrandMark: React.FC<BrandMarkProps> = ({ to, size = 'md', className }) => {
  if (to) {
    return (
      <Link to={to} className="inline-block">
        <BrandBox size={size} className={className} />
      </Link>
    );
  }

  return <BrandBox size={size} className={className} />;
};

export default BrandMark;
