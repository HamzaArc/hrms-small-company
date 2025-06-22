import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HRMSProvider, useHRMS } from './contexts/HRMSContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'; // Import useLanguage hook
import { translations } from './data/translations'; // FIX: Re-import translations here for the t function

// Import layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Import page components
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
import DocumentUploadForm from './components/pages/DocumentUploadForm';
import Onboarding from './components/pages/Onboarding';
import EmployeeEngagement from './components/pages/EmployeeEngagement';
import AnnouncementForm from './components/pages/AnnouncementForm';
import RecognitionForm from './components/pages/RecognitionForm';
import HRLetters from './components/pages/HRLetters';
import Reports from './components/pages/Reports';

// Import common components
import MessageBox from './components/common/MessageBox';

// NEW: Import a Login/Auth page component
import AuthPage from './components/pages/AuthPage';

function AppContent() {
  // FIX: Destructure required variables from useHRMS
  const {
    currentPage, setCurrentPage,
    user, tenant, accessToken,
    notifications, setNotifications, // Keeping for notifications logic
    showMessage, // Keeping for notifications logic and general messages
    fetchEmployees, fetchLeaveRequests, fetchTimesheets,
    fetchGoals, fetchReviews, fetchAnnouncements, fetchRecognitions, fetchDocuments,
    // messageBox state is now directly exposed from HRMSContext via `messageBox`
    messageBox, // FIX: messageBox is now directly from HRMSContext
    selectedEmployeeId, // FIX: selectedEmployeeId is now directly from HRMSContext
  } = useHRMS();

  // FIX: currentLang and setCurrentLang are now provided by LanguageProvider directly
  const { t, currentLang, setCurrentLang } = useLanguage();


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch initial data based on authenticated user/tenant
  useEffect(() => {
    if (user && tenant?.id) { // Only fetch if a user is logged in and tenant ID is available
      fetchEmployees();
      fetchLeaveRequests();
      fetchTimesheets();
      fetchGoals();
      fetchReviews();
      fetchAnnouncements();
      fetchRecognitions();
      fetchDocuments();
      // Additional notification logic could go here, or be backend-driven
    } else if (!accessToken) { // If no access token, redirect to login
      setCurrentPage('login');
    }
  }, [user, tenant, accessToken, setCurrentPage, fetchEmployees, fetchLeaveRequests,
      fetchTimesheets, fetchGoals, fetchReviews, fetchAnnouncements, fetchRecognitions, fetchDocuments]);


  // Mock notification generation (can be removed once backend drives this)
  useEffect(() => {
    if (user && tenant?.id) {
      // This would be replaced by actual backend notifications
      // For now, clear existing and add a dummy one on login
      setNotifications([]);
      const dummyNotification = {
        id: 'notif-1',
        message: `Welcome, ${user.email}! You are logged into tenant ${tenant.id}.`,
        date: new Date().toISOString(),
        read: false,
        type: 'info'
      };
      setNotifications(prev => [dummyNotification, ...prev]);
    } else {
        setNotifications([]); // Clear notifications if logged out
    }
  }, [user, tenant, setNotifications]);


  // Render current page based on login status and currentPage
  const renderPage = () => {
    if (!user || !tenant?.id) {
      return <AuthPage />; // Show login/auth page if not logged in
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return <EmployeeList />;
      case 'employeeDetail':
        // FIX: selectedEmployeeId is now from context, remove the prop passing in isMyProfile here if it's not a general EmployeeDetail
        // The isMyProfile prop is for the specific "My Profile" case in EmployeeDetail
        // If selectedEmployeeId is set, it means we are viewing a specific employee, not necessarily own profile unless id matches.
        return <EmployeeDetail />; // Removed conditional prop passing, let EmployeeDetail figure it out based on selectedEmployeeId
      case 'myProfile':
        // This case should automatically set selectedEmployeeId to user.employeeId if that's how MyProfile works
        return <EmployeeDetail isMyProfile={true} />; // Use the isMyProfile prop to indicate it's the current user
      case 'leave':
        return <LeaveManagement />;
      case 'leaveRequest':
        return <LeaveRequestForm />;
      case 'timesheets':
        return <Timesheets />;
      case 'timesheetEntry':
        return <TimesheetEntryForm />;
      case 'performance':
        return <PerformanceManagement />;
      case 'goalForm':
        return <GoalForm />;
      case 'reviewForm':
        return <ReviewForm />;
      case 'documents':
        return <DocumentManagement />;
      case 'documentUpload':
        return <DocumentUploadForm />;
      case 'onboarding':
        return <Onboarding />;
      case 'engagement':
        return <EmployeeEngagement />;
      case 'announcementForm':
        return <AnnouncementForm />;
      case 'recognitionForm':
        return <RecognitionForm />;
      case 'letters':
        return <HRLetters />;
      case 'reports':
        return <Reports />;
      case 'login': // Explicitly handle login page
        return <AuthPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Only show if logged in */}
      {user && (
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Only show if logged in */}
        {user && (
          <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>

      {/* Message Box - Displayed globally */}
      {messageBox.message && (
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

// Main App component that wraps AppContent with HRMSProvider
function App() {
  // Language context value - managed here
  const [currentLang, setCurrentLang] = useState('en');
  // FIX: Define t function here, as LanguageProvider expects it
  const t = useCallback((key, replacements = {}) => {
    let text = translations[currentLang][key] || translations['en'][key] || key;
    Object.keys(replacements).forEach(placeholder => {
      text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    });
    return text;
  }, [currentLang]);

  const languageContextValue = useMemo(() => ({ t, currentLang, setCurrentLang }), [t, currentLang]);

  return (
    <HRMSProvider> {/* HRMSProvider now manages its own state internally */}
      <LanguageProvider value={languageContextValue}>
        <AppContent /> {/* Render AppContent inside providers */}
      </LanguageProvider>
    </HRMSProvider>
  );
}

export default App;