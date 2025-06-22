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
      // Add other page cases here
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