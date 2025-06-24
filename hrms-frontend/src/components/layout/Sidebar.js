import React from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Home, 
  Users, 
  Calendar, 
  Clock, 
  Target, 
  FileText, 
  UserCheck, 
  Heart, 
  Award, 
  BarChart,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { currentPage, setCurrentPage } = useHRMS();
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Home },
    { id: 'employees', label: t('nav.employees'), icon: Users },
    { id: 'leave', label: t('nav.leave'), icon: Calendar },
    { id: 'timesheets', label: t('nav.timesheets'), icon: Clock },
    { id: 'performance', label: t('nav.performance'), icon: Target },
    { id: 'documents', label: t('nav.documents'), icon: FileText },
    { id: 'onboarding', label: t('nav.onboarding'), icon: UserCheck },
    { id: 'engagement', label: t('nav.engagement'), icon: Heart },
    { id: 'letters', label: t('nav.letters'), icon: Award },
    { id: 'reports', label: t('nav.reports'), icon: BarChart },
  ];

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b h-16"> {/* Added h-16 for consistent height */}
          <h2 className="text-xl font-bold text-gray-800 leading-none">HRMS</h2> {/* Added leading-none */}
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg
                      transition-colors duration-200
                      ${currentPage === item.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;