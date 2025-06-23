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
import Timesheets from './components/pages/Timesheets'; // Import Timesheets
import TimesheetEntryForm from './components/pages/TimesheetEntryForm'; // Import TimesheetEntryForm
import PerformanceManagement from './components/pages/PerformanceManagement'; // Import PerformanceManagement
import GoalForm from './components/pages/GoalForm'; // Import GoalForm
import ReviewForm from './components/pages/ReviewForm'; // Import ReviewForm
import DocumentManagement from './components/pages/DocumentManagement'; // Import DocumentManagement
import DocumentUploadForm from './components/pages/DocumentUploadForm'; // Import DocumentUploadForm
import Onboarding from './components/pages/Onboarding'; // Import Onboarding
import EmployeeEngagement from './components/pages/EmployeeEngagement'; // Import EmployeeEngagement
import AnnouncementForm from './components/pages/AnnouncementForm'; // Import AnnouncementForm
import RecognitionForm from './components/pages/RecognitionForm'; // Import RecognitionForm
import HRLetters from './components/pages/HRLetters'; // Import HRLetters
import Reports from './components/pages/Reports'; // Import Reports

import AuthPage from './components/pages/AuthPage';
import MessageBox from './components/common/MessageBox';

function AppContent() {
  const { currentPage, user, isLoading, logout, messageBox } = useHRMS();
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
      case 'employees': return <EmployeeList />;
      case 'employeeDetail': return <EmployeeDetail />;
      case 'leave': return <LeaveManagement />;
      case 'leaveRequest': return <LeaveRequestForm />;
      case 'timesheets': return <Timesheets />; {/* FIX: Add Timesheets case */}
      case 'timesheetEntry': return <TimesheetEntryForm />; {/* FIX: Add TimesheetEntryForm case */}
      case 'performance': return <PerformanceManagement />; {/* FIX: Add PerformanceManagement case */}
      case 'goalForm': return <GoalForm />; {/* FIX: Add GoalForm case */}
      case 'reviewForm': return <ReviewForm />; {/* FIX: Add ReviewForm case */}
      case 'documents': return <DocumentManagement />; {/* FIX: Add DocumentManagement case */}
      case 'documentUpload': return <DocumentUploadForm />; {/* FIX: Add DocumentUploadForm case */}
      case 'onboarding': return <Onboarding />; {/* FIX: Add Onboarding case */}
      case 'engagement': return <EmployeeEngagement />; {/* FIX: Add EmployeeEngagement case */}
      case 'announcementForm': return <AnnouncementForm />; {/* FIX: Add AnnouncementForm case */}
      case 'recognitionForm': return <RecognitionForm />; {/* FIX: Add RecognitionForm case */}
      case 'letters': return <HRLetters />; {/* FIX: Add HRLetters case */}
      case 'reports': return <Reports />; {/* FIX: Add Reports case */}
      case 'myProfile': return <EmployeeDetail isMyProfile={true} />; {/* FIX: Add My Profile case, reusing EmployeeDetail */}
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