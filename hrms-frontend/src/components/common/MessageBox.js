import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const MessageBox = ({ message, type = 'info', actions = [], onClose }) => {
  useEffect(() => {
    // Auto-close for success, info, and warning messages after 3 seconds if no actions
    if ((type === 'success' || type === 'info' || type === 'warning') && actions.length === 0) {
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
    info: 'bg-blue-50 border-blue-200 text-blue-900', // Adjusted text color for better contrast
    success: 'bg-green-50 border-green-200 text-green-900', // Adjusted text color
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900', // Adjusted text color
    error: 'bg-red-50 border-red-200 text-red-900' // Adjusted text color
  };

  const textColors = {
    info: 'text-blue-800',
    success: 'text-green-800',
    warning: 'text-yellow-800',
    error: 'text-red-800'
  };

  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-center z-50 p-4 pt-16"> {/* Adjusted opacity and added top padding */}
      <div className={`relative rounded-lg shadow-xl max-w-sm w-full p-6 border-2 transform transition-transform duration-300 ease-out translate-y-0 opacity-100 ${backgrounds[type]}`}> {/* Added transition */}
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5"> {/* Slight adjustment for icon alignment */}
            {icons[type]}
          </div>
          <div className="ml-3 flex-1">
            <p className={`font-medium ${textColors[type]}`}>{message}</p> {/* Applied specific text color */}
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
                      px-4 py-2 rounded-lg font-medium transition-colors text-sm
                      ${action.primary 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500'}
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
              className={`absolute top-2 right-2 p-1 rounded-full ${textColors[type]} hover:bg-white/30`}
              title="Close"
            >
              <X className="w-4 h-4" /> {/* Smaller X icon for close */}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBox;