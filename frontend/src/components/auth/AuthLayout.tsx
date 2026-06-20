import React from 'react';
import BrandMark from '../common/BrandMark';

interface AuthLayoutProps {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  logoLinksHome?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children, footer, logoLinksHome = true }) => {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mb-8">
          <BrandMark to={logoLinksHome ? '/' : undefined} size="md" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-cream-950 tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-cream-600 font-light italic">{subtitle}</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 border border-cream-200 shadow-sm rounded-sm">
          {children}
        </div>

        {footer && (
          <p className="mt-10 text-center text-[10px] text-cream-400 uppercase tracking-[0.2em] font-bold">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
