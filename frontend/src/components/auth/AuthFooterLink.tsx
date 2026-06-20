import React from 'react';
import { Link } from 'react-router-dom';

interface AuthFooterLinkProps {
  prompt?: string;
  to: string;
  label: string;
}

const AuthFooterLink: React.FC<AuthFooterLinkProps> = ({ prompt, to, label }) => {
  return (
    <div className="mt-8 border-t border-cream-100 pt-8 text-center">
      {prompt ? (
        <p className="text-xs text-cream-500 font-medium tracking-wide">
          {prompt}{' '}
          <Link to={to} className="text-cream-950 font-bold hover:underline underline-offset-4">
            {label}
          </Link>
        </p>
      ) : (
        <Link to={to} className="text-xs text-cream-950 font-bold hover:underline underline-offset-4 uppercase tracking-widest">
          {label}
        </Link>
      )}
    </div>
  );
};

export default AuthFooterLink;
