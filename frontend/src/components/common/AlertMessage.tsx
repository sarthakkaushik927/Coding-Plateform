import React from 'react';

interface AlertMessageProps {
  message?: string | null;
  tone?: 'error' | 'success';
  className?: string;
}

const toneClasses = {
  error: 'text-red-800 bg-red-50 border-red-800',
  success: 'text-green-800 bg-green-50 border-green-800'
};

const AlertMessage: React.FC<AlertMessageProps> = ({ message, tone = 'error', className = '' }) => {
  if (!message) return null;

  return (
    <div className={`text-xs p-3 border-l-2 font-medium ${toneClasses[tone]} ${className}`}>
      {message}
    </div>
  );
};

export default AlertMessage;
