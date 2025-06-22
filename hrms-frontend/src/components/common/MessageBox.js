import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const MessageBox = ({ message, type = 'info', actions = [], onClose }) => {
  useEffect(() => {
    // Auto-close for success messages after 3 seconds
    if (type === 'success' && actions.length === 0) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [type, actions, onClose]);

  const icons = {
    info: <Info className="w-6 h-6 text-blue-600" />,
    success: <CheckCircle className="w-6 h-6 text-green-600" />,
    warning: <AlertCircle className="w-6 h-6 text-yellow-600" />,
    error: <XCircle className="w-6 h-6 text-red-600" />
  };

  const backgrounds = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200'
  };

  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 ${backgrounds[type]}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-gray-800">{message}</p>
            {actions.length > 0 && (
              <div className="mt-4 flex space-x-3">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick();
                      onClose();
                    }}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-colors
                      ${action.primary 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {actions.length === 0 && (
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBox;