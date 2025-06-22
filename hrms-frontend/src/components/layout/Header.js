import React, { useState } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Menu, Bell, User, LogOut, Globe } from 'lucide-react';
import Select from '../common/Select';
import Card from '../common/Card';
import Button from '../common/Button';

const Header = ({ toggleSidebar }) => {
  const { notifications, setNotifications, setCurrentPage, setSelectedEmployeeId, employees, showMessage } = useHRMS();
  const { t, currentLang, setCurrentLang } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    // Mark all as read when opening
    if (!showNotifications) {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    setShowNotifications(false);
    showMessage(t('header.noNotifications'), 'success');
  };

  const handleMyProfile = () => {
    // Set to first employee (Alice Smith) as logged-in user
    setSelectedEmployeeId(employees[0].id);
    setCurrentPage('myProfile');
  };

  const handleLogout = () => {
    showMessage('Logged out successfully', 'success');
    // In a real app, this would handle authentication
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-600 hover:text-gray-800"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 hidden md:block">
            {t('header.title')}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-gray-600" />
            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value)}
              className="border-none bg-transparent text-sm focus:outline-none cursor-pointer"
            >
              {languageOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="relative p-2 text-gray-600 hover:text-gray-800"
            >
              <Bell className="w-6 h-6" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 z-50">
                <Card className="max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">{t('header.notifications')}</h3>
                    {notifications.length > 0 && (
                      <Button 
                        size="small" 
                        variant="secondary"
                        onClick={handleClearAll}
                      >
                        {t('header.clearAll')}
                      </Button>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-sm">{t('header.noNotifications')}</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.slice(0, 5).map(notification => (
                        <div 
                          key={notification.id} 
                          className={`p-3 rounded-lg ${
                            notification.type === 'error' ? 'bg-red-50' :
                            notification.type === 'warning' ? 'bg-yellow-50' :
                            'bg-gray-50'
                          }`}
                        >
                          <p className="text-sm text-gray-800">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* My Profile */}
          <Button
            onClick={handleMyProfile}
            variant="outline"
            size="small"
            className="hidden md:flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>{t('header.myProfile')}</span>
          </Button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-gray-800"
            title={t('header.logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;