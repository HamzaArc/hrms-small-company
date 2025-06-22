import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = React.forwardRef(({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  error, 
  disabled = false, 
  required = false,
  className = '',
  readOnly = false,
  id,
  name,
  icon // New prop for the icon
}, ref) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputId = id || `input-${name || Math.random().toString(36).substr(2, 9)}`;
  const inputType = type === 'password' && isPasswordVisible ? 'text' : type;

  const hasIcon = Boolean(icon);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Render icon if it exists */}
        {hasIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {React.cloneElement(icon, { className: 'h-5 w-5 text-gray-400' })}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm
            ${hasIcon ? 'pl-10' : ''}
            ${type === 'password' ? 'pr-10' : ''}
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${disabled || readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            placeholder-gray-400
          `}
        />
        {/* Render password toggle if type is 'password' */}
        {type === 'password' && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;