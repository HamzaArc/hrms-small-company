import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import api from '../api'; // Import your configured API client
import { translations } from '../data/translations'; // Keep translations

const HRMSContext = createContext();

export const useHRMS = () => {
  const context = useContext(HRMSContext);
  if (!context) {
    throw new Error('useHRMS must be used within HRMSProvider');
  }
  return context;
};

export const HRMSProvider = ({ children }) => {
  // States to hold data fetched from backend (initially empty)
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [documents, setDocuments] = useState([]); // For DocumentManagement page
  const [notifications, setNotifications] = useState([]); // Keep notifications for now

  // UI States (remain largely same)
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [messageBox, setMessageBox] = useState({ message: '', type: 'info', actions: [], onClose: () => {} });
  const [currentLang, setCurrentLang] = useState('en'); // Assuming English default

  // --- Authentication & User Management ---
  const [user, setUser] = useState(null); // Stores logged-in user data
  const [tenant, setTenant] = useState(null); // Stores current tenant data
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken')); // Retrieve from local storage

  // Set default headers for API client once token is available
  React.useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);


  // --- Helper Functions ---
  // Modified showMessage to handle API errors
  const showMessage = useCallback((message, type = 'info', actions = []) => {
    setMessageBox({
      message,
      type,
      actions,
      onClose: () => setMessageBox({ message: '', type: 'info', actions: [], onClose: () => {} })
    });
  }, []);

  const t = useCallback((key, replacements = {}) => {
    let text = translations[currentLang][key] || translations['en'][key] || key;
    Object.keys(replacements).forEach(placeholder => {
      text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    });
    return text;
  }, [currentLang]);

  // --- Backend API Interaction Functions (Core CRUD) ---
  // Each of these will be implemented fully in relevant pages/components
  // For now, they'll be placeholder async functions
  const fetchData = useCallback(async (endpoint, setter, errorMessage) => {
    try {
      const response = await api.get(endpoint);
      if (setter) { // Setter is optional now
        setter(response.data);
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      showMessage(errorMessage || `Failed to fetch data from ${endpoint}.`, 'error');
      throw error; // IMPORTANT: Re-throw the error so the caller's catch block is hit
    }
  }, [showMessage]);

  const postData = useCallback(async (endpoint, data, successMessage, errorMessage) => {
    try {
      const response = await api.post(endpoint, { ...data, tenantId: user?.tenant?.id }); // Ensure tenantId is from current user
      showMessage(successMessage || 'Operation successful!', 'success');
      return response.data;
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error.response?.data || error.message);
      showMessage(errorMessage || `Failed to perform operation. Details: ${error.response?.data?.message || error.message}`, 'error');
      return null; // Return null on error
    }
  }, [showMessage, user]); // Depend on user state now

  const putData = useCallback(async (endpoint, data, successMessage, errorMessage) => {
    try {
      const response = await api.put(endpoint, { ...data, tenantId: user?.tenant?.id }); // Ensure tenantId is from current user
      showMessage(successMessage || 'Update successful!', 'success');
      return response.data;
    } catch (error) {
      console.error(`Error updating ${endpoint}:`, error.response?.data || error.message);
      showMessage(errorMessage || `Failed to update. Details: ${error.response?.data?.message || error.message}`, 'error');
      return null;
    }
  }, [showMessage, user]); // Depend on user state now

  const deleteData = useCallback(async (endpoint, id, successMessage, errorMessage) => {
    try {
      await api.delete(`${endpoint}/${id}`, { data: { tenantId: user?.tenant?.id } }); // Ensure tenantId is from current user
      showMessage(successMessage || 'Deletion successful!', 'success');
      return true;
    } catch (error) {
      console.error(`Error deleting from ${endpoint}:`, error.response?.data || error.message);
      showMessage(errorMessage || `Failed to delete. Details: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }, [showMessage, user]); // Depend on user state now


  // --- Specific API Calls (to be implemented in relevant pages) ---
  // These functions are now simplified as fetchData is doing the heavy lifting
  const fetchEmployees = useCallback(async () => { // Removed tId parameter as it comes from user.tenant.id
    if (!user?.tenant?.id) return;
    return await fetchData(`/employees`, setEmployees, 'Failed to load employees.');
  }, [fetchData, user]);

  const fetchLeaveRequests = useCallback(async (employeeId = '') => { // Added optional employeeId parameter for filtering
    if (!user?.tenant?.id) return;
    const endpoint = employeeId ? `/leave-requests?employeeId=${employeeId}` : `/leave-requests`;
    return await fetchData(endpoint, setLeaveRequests, 'Failed to load leave requests.');
  }, [fetchData, user]);
  
  const fetchTimesheets = useCallback(async (employeeId = '') => {
    if (!user?.tenant?.id) return;
    const endpoint = employeeId ? `/timesheets?employeeId=${employeeId}` : `/timesheets`;
    return await fetchData(endpoint, setTimesheets, 'Failed to load timesheets.');
  }, [fetchData, user]);

  const fetchGoals = useCallback(async (employeeId = '', status = '') => { // Added optional employeeId/status parameters
    if (!user?.tenant?.id) return;
    let endpoint = `/goals`;
    const params = [];
    if (employeeId) params.push(`employeeId=${employeeId}`);
    if (status) params.push(`status=${status}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;
    return await fetchData(endpoint, setGoals, 'Failed to load goals.');
  }, [fetchData, user]);

  const fetchReviews = useCallback(async (employeeId = '') => {
    if (!user?.tenant?.id) return;
    const endpoint = employeeId ? `/reviews?employeeId=${employeeId}` : `/reviews`;
    return await fetchData(endpoint, setReviews, 'Failed to load reviews.');
  }, [fetchData, user]);

  const fetchAnnouncements = useCallback(async (category = '', priority = '') => {
    if (!user?.tenant?.id) return;
    let endpoint = `/announcements`;
    const params = [];
    if (category) params.push(`category=${category}`);
    if (priority) params.push(`priority=${priority}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;
    return await fetchData(endpoint, setAnnouncements, 'Failed to load announcements.');
  }, [fetchData, user]);

  const fetchRecognitions = useCallback(async (recipientId = '', category = '') => {
    if (!user?.tenant?.id) return;
    let endpoint = `/recognitions`;
    const params = [];
    if (recipientId) params.push(`recipientId=${recipientId}`);
    if (category) params.push(`category=${category}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;
    return await fetchData(endpoint, setRecognitions, 'Failed to load recognitions.');
  }, [fetchData, user]);

  const fetchDocuments = useCallback(async (employeeId = '', type = '', status = '') => {
    if (!user?.tenant?.id) return;
    let endpoint = `/documents`;
    const params = [];
    if (employeeId) params.push(`employeeId=${employeeId}`);
    if (type) params.push(`type=${type}`);
    if (status) params.push(`status=${status}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;
    return await fetchData(endpoint, setDocuments, 'Failed to load documents.');
  }, [fetchData, user]);

  // --- Authentication Functions ---
  const login = useCallback(async (email, password, loginTenantId) => {
    try {
      const response = await api.post('/auth/login', { email, password, tenantId: loginTenantId });
      const { accessToken: newAccessToken, user: loggedInUser } = response.data;
      
      localStorage.setItem('accessToken', newAccessToken); // Store token
      setAccessToken(newAccessToken);
      setUser(loggedInUser);
      setTenant({ id: loginTenantId }); // Simple tenant object for context. Full tenant data can be fetched later.

      showMessage('Login successful!', 'success');
      setCurrentPage('dashboard'); // Redirect to dashboard on successful login
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      showMessage(`Login failed: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }, [showMessage, setAccessToken, setUser, setTenant, setCurrentPage]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    setUser(null);
    setTenant(null);
    setEmployees([]); // Clear data on logout
    setLeaveRequests([]);
    setTimesheets([]);
    setGoals([]);
    setReviews([]);
    setAnnouncements([]);
    setRecognitions([]);
    setDocuments([]);
    setNotifications([]);
    showMessage('Logged out successfully.', 'info');
    setCurrentPage('login'); // Redirect to login page
  }, [showMessage, setAccessToken, setUser, setTenant, setCurrentPage,
      setEmployees, setLeaveRequests, setTimesheets, setGoals, setReviews,
      setAnnouncements, setRecognitions, setDocuments, setNotifications]);


  const hrmsContextValue = useMemo(() => ({
    // Data states
    employees, setEmployees,
    leaveRequests, setLeaveRequests,
    timesheets, setTimesheets,
    goals, setGoals,
    reviews, setReviews,
    announcements, setAnnouncements,
    recognitions, setRecognitions,
    documents, setDocuments,
    notifications, setNotifications,
    
    // UI states
    currentPage, setCurrentPage,
    selectedEmployeeId, setSelectedEmployeeId, // Added setSelectedEmployeeId to context
    messageBox, setMessageBox,
    currentLang, setCurrentLang,

    // User/Auth states
    user, setUser,
    tenant, setTenant,
    accessToken, setAccessToken,

    // Helper functions
    showMessage, t,

    // API interaction functions
    fetchEmployees, fetchLeaveRequests, fetchTimesheets,
    fetchGoals, fetchReviews, fetchAnnouncements,
    fetchRecognitions, fetchDocuments,
    postData, putData, deleteData, // Generic CRUD
    fetchData, // Exposed general fetchData for direct use when needed
    login, logout, // Auth
  }), [
    employees, leaveRequests, timesheets, goals, reviews, 
    announcements, recognitions, documents, notifications,
    currentPage, selectedEmployeeId, setSelectedEmployeeId, messageBox, currentLang,
    user, tenant, accessToken,
    showMessage, t,
    fetchEmployees, fetchLeaveRequests, fetchTimesheets,
    fetchGoals, fetchReviews, fetchAnnouncements,
    fetchRecognitions, fetchDocuments,
    postData, putData, deleteData, fetchData,
    login, logout
  ]);

  return (
    <HRMSContext.Provider value={hrmsContextValue}>
      {children}
    </HRMSContext.Provider>
  );
};