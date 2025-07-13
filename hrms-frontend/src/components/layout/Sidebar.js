// hrms-frontend/src/components/layout/Sidebar.js
import React, { useState } from 'react';
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
  X,
  Briefcase,
  UserCog,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Megaphone,
  ChevronDown,
  ChevronUp,
  Gift, // Icon for Holidays
  FileSpreadsheet // NEW: Icon for Leave Policies
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { currentPage, setCurrentPage, user } = useHRMS();
  const { t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState({});

  const menuSections = [
    {
      id: 'myWorkspace',
      section: t('nav.myWorkspace'),
      icon: Briefcase,
      items: [
        { id: 'dashboard', label: t('nav.dashboard'), icon: Home },
        { id: 'myProfile', label: t('header.myProfile'), icon: Users },
        { id: 'myRequests', label: t('nav.myRequests'), icon: Mail },
      ]
    },
    {
      id: 'teamManagement',
      section: t('nav.teamManagement'),
      icon: LayoutDashboard,
      roles: ['admin', 'hr', 'manager'],
      items: [
        { id: 'teamOverview', label: t('nav.teamOverview'), icon: Users },
        { id: 'leave', label: t('nav.leave'), icon: Calendar },
        { id: 'timesheets', label: t('nav.timesheets'), icon: Clock },
        { id: 'performance', label: t('nav.performance'), icon: Target },
        { id: 'approvals', label: t('nav.approvals'), icon: ClipboardCheck },
      ]
    },
    {
      id: 'hrOperations',
      section: t('nav.hrOperations'),
      icon: UserCog,
      roles: ['admin', 'hr'],
      items: [
        { id: 'employees', label: t('nav.employees'), icon: Users },
        { id: 'documents', label: t('nav.documents'), icon: FileText },
        { id: 'onboarding', label: t('nav.onboarding'), icon: UserCheck },
        { id: 'letters', label: t('nav.letters'), icon: Award },
        { id: 'compliance', label: t('nav.compliance'), icon: ShieldCheck },
        { id: 'holidays', label: t('nav.holidays'), icon: Gift },
        { id: 'leavePolicies', label: t('nav.leavePolicies'), icon: FileSpreadsheet }, // NEW: Leave Policies menu item
      ]
    },
    {
      id: 'company',
      section: t('nav.company'),
      icon: Building2,
      roles: ['admin', 'hr', 'employee', 'manager'],
      items: [
        { id: 'companyProfile', label: t('nav.companyProfile'), icon: Building2 },
        { id: 'announcements', label: t('engagement.announcements'), icon: Megaphone },
        { id: 'engagement', label: t('nav.engagement'), icon: Heart },
        { id: 'reports', label: t('nav.reports'), icon: BarChart },
        { id: 'policies', label: t('nav.policies'), icon: FileText },
        { id: 'orgChart', label: t('nav.orgChart'), icon: Users },
      ]
    }
  ];

  const isSectionActive = (sectionId) => {
    const section = menuSections.find(s => s.id === sectionId);
    return section?.items.some(item => item.id === currentPage);
  };

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const hasPermission = (item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
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
        <div className="flex items-center justify-between p-4 border-b h-16">
          <h2 className="text-xl font-bold text-gray-800 leading-none">HRMS</h2>
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
          {menuSections.map((sectionItem) => (
            (sectionItem.items.some(hasPermission) || (sectionItem.roles && hasPermission(sectionItem))) && (
              <div key={sectionItem.id} className="mb-4">
                {/* Section Header (Clickable for collapse/expand) */}
                <button
                  onClick={() => toggleSection(sectionItem.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg
                    transition-colors duration-200 mb-1
                    ${isSectionActive(sectionItem.id)
                      ? 'bg-blue-100 text-blue-800 font-extrabold'
                      : expandedSections[sectionItem.id]
                        ? 'bg-gray-100 text-gray-700 font-bold'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold'
                    }
                  `}
                >
                  <h3 className="text-xs uppercase tracking-wider flex items-center space-x-2 whitespace-nowrap overflow-hidden text-ellipsis">
                    {/* Section icon color also changes with text color */}
                    {sectionItem.icon && <sectionItem.icon className={`w-4 h-4 ${isSectionActive(sectionItem.id) ? 'text-blue-600' : 'text-gray-500'}`} />}
                    <span>{sectionItem.section}</span>
                  </h3>
                  {expandedSections[sectionItem.id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>

                {/* Sub-menu Items (Conditionally rendered) */}
                {expandedSections[sectionItem.id] && (
                  <ul className="mt-2 space-y-1">
                    {sectionItem.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        hasPermission(item) && (
                          <li key={item.id}>
                            <button
                              onClick={() => handleNavClick(item.id)}
                              className={`
                                w-full flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg
                                transition-colors duration-200
                                ${currentPage === item.id
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'}
                              `}
                            >
                              {ItemIcon && <ItemIcon className="w-4 h-4" />}
                              <span className="font-medium text-sm">{item.label}</span>
                            </button>
                          </li>
                        )
                      );
                    })}
                  </ul>
                )}
              </div>
            )
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;