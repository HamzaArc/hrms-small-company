import React from 'react';

const Card = ({ 
  title, 
  children, 
  className = '', 
  padding = true,
  shadow = true,
  onClick 
}) => {
  return (
    <div 
      className={`
        bg-white rounded-lg
        ${shadow ? 'shadow-md' : ''}
        ${padding ? 'p-6' : ''}
        ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
};

export default Card;