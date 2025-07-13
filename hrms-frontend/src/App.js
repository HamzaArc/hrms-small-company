// hrms-frontend/src/App.js
import React, { useState } from 'react';
import { HRMSProvider, useHRMS } from './contexts/HRMSContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/pages/Dashboard';
import EmployeeList from './components/pages/EmployeeList';
import EmployeeDetail from './components/pages/EmployeeDetail';
import LeaveManagement from './components/pages/LeaveManagement';
import LeaveRequestForm from './components/pages/LeaveRequestForm';
import Timesheets from './components/pages/Timesheets';
import TimesheetEntryForm from './components/pages/TimesheetEntryForm';
import PerformanceManagement from './components/pages/PerformanceManagement';
import GoalForm from './components/pages/GoalForm';
import ReviewForm from './components/pages/ReviewForm';
import DocumentManagement from './components/pages/DocumentManagement';
import DocumentForm from './components/pages/DocumentForm';
import Onboarding from './components/pages/Onboarding';
import EmployeeEngagement from './components/pages/EmployeeEngagement';
import AnnouncementForm from './components/pages/AnnouncementForm';
import RecognitionForm from './components/pages/RecognitionForm';
import HRLetters from './components/pages/HRLetters';
import Reports from './components/pages/Reports';
import CompanyProfile from './components/pages/CompanyProfile';
import MyRequests from './components/pages/MyRequests';
import TeamOverview from './components/pages/TeamOverview';
import Approvals from './components/pages/Approvals';
import Compliance from './components/pages/Compliance';
import Policies from './components/pages/Policies';
import OrgChart from './components/pages/OrgChart';
import HolidayManagement from './components/pages/HolidayManagement';
import LeavePolicyManagement from './components/pages/LeavePolicyManagement'; // NEW: Import LeavePolicyManagement

import AuthPage from './components/pages/AuthPage';
import MessageBox from './components/common/MessageBox';

const PlaceholderPage = ({ title }) => (
  <div className="p-6 bg-white rounded-lg shadow">
    <h2 className="text-xl font-bold">{title}</h2>
    <p className="mt-4 text-gray-600">This page is under construction.</p>
  </div>
);

function AppContent() {
  const { currentPage, user, isLoading, logout, messageBox, selectedDocumentId } = useHRMS();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen w-screen"><p>Loading Application...</p></div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      // My Workspace
      case 'myProfile': return <EmployeeDetail isMyProfile={true} />;
      case 'myRequests': return <PlaceholderPage title="My Requests" />;
      
      // Team Management
      case 'teamOverview': return <PlaceholderPage title="Team Overview" />;
      case 'leave': return <LeaveManagement />;
      case 'timesheets': return <Timesheets />;
      case 'performance': return <PerformanceManagement />;
      case 'approvals': return <PlaceholderPage title="Approvals" />;

      // HR Operations
      case 'employees': return <EmployeeList />;
      case 'documents': return <DocumentManagement />;
      case 'onboarding': return <Onboarding />;
      case 'letters': return <HRLetters />;
      case 'compliance': return <PlaceholderPage title="Compliance" />;
      case 'holidays': return <HolidayManagement />;
      case 'leavePolicies': return <LeavePolicyManagement />; // NEW: Add LeavePolicyManagement route

      // Company
      case 'companyProfile': return <CompanyProfile />;
      case 'announcements': return <EmployeeEngagement />;
      case 'engagement': return <EmployeeEngagement />;
      case 'reports': return <Reports />;
      case 'policies': return <PlaceholderPage title="Policies" />;
      case 'orgChart': return <PlaceholderPage title="Organization Chart" />;
      
      // Forms (could be nested under their respective modules in the future, but accessible directly for now)
      case 'employeeDetail': return <EmployeeDetail />;
      case 'leaveRequest': return <LeaveRequestForm />;
      case 'timesheetEntry': return <TimesheetEntryForm />;
      case 'goalForm': return <GoalForm />;
      case 'reviewForm': return <ReviewForm />;
      case 'documentForm': return <DocumentForm />;
      case 'documentEdit': return <DocumentForm documentId={selectedDocumentId} />;
      case 'announcementForm': return <AnnouncementForm />;
      case 'recognitionForm': return <RecognitionForm />;

      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          logout={logout}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
      {messageBox && messageBox.message && (
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          actions={messageBox.actions}
          onClose={messageBox.onClose}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <HRMSProvider>
        <AppContent />
      </HRMSProvider>
    </LanguageProvider>
  );
}

export default App;