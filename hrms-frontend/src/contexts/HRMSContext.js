import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import api from '../api';

const HRMSContext = createContext();

export const useHRMS = () => useContext(HRMSContext);

export const HRMSProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(!!accessToken);
  const [currentPage, setCurrentPage] = useState('login');
  const [messageBox, setMessageBox] = useState({ message: '', type: 'info', actions: [], onClose: () => {} });
  
  // All global data states
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null); // Used for Document Edit Form
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [onboardingTasks, setOnboardingTasks] = useState([]); // FIX: Add onboardingTasks state

  const showMessage = useCallback((text, type = 'info', actions = []) => {
    setMessageBox({ message: text, type, actions, onClose: () => setMessageBox({ message: '', type: 'info', actions: [], onClose: () => {} }) });
  }, []);

  const handleApiError = useCallback((error, genericMessage) => {
    console.error("API Error Caught:", { genericMessage, error: error.response?.data || error.message });
    const message = error.response?.data?.message || genericMessage || 'An unknown error occurred.';
    showMessage(Array.isArray(message) ? message.join(', ') : message, 'error');
  }, [showMessage]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    setUser(null);
    setTenant(null);
    setCurrentPage('login');
  }, []);

  useEffect(() => {
    if (accessToken) {
      setIsLoading(true);
      api.get('/auth/profile').then(response => {
        setUser(response.data);
        setTenant(response.data.tenant);
        setCurrentPage('dashboard');
      }).catch(() => {
        console.error("Token validation failed. Logging out.");
        logout();
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
      setCurrentPage('login');
    }
  }, [accessToken, logout]);
  
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken: newAccessToken } = response.data;
      localStorage.setItem('accessToken', newAccessToken);
      setAccessToken(newAccessToken);
      return true;
    } catch (error) {
      handleApiError(error, 'Login failed');
      return false;
    }
  }, [handleApiError]);

  const setupTenantAndAdmin = useCallback(async (data) => {
    try {
      await api.post('/auth/setup-tenant-admin', data);
      showMessage('Setup successful! Please log in.', 'success');
      return true;
    } catch(error) {
      handleApiError(error, "Setup failed.");
      return false;
    }
  }, [handleApiError, showMessage]);

  // Centralized data fetching utility
  const fetchData = useCallback(async (endpoint) => {
    try {
      const res = await api.get(endpoint);
      return res.data;
    } catch (err) {
      handleApiError(err, `Failed to fetch from ${endpoint}`);
      return null;
    }
  }, [handleApiError]);
  
  const postData = useCallback(async (endpoint, data, successMessage, errorMessage) => {
    try {
      const res = await api.post(endpoint, data);
      if(successMessage) showMessage(successMessage, 'success');
      return res.data;
    } catch (err) {
      handleApiError(err, errorMessage || `Failed to post to ${endpoint}`);
      return null;
    }
  }, [handleApiError, showMessage]);

  const putData = useCallback(async (endpoint, data, successMessage, errorMessage) => {
    try {
      const res = await api.put(endpoint, data);
      if(successMessage) showMessage(successMessage, 'success');
      return res.data;
    } catch (err) {
      handleApiError(err, errorMessage || `Failed to update ${endpoint}`);
      return null;
    }
  }, [handleApiError, showMessage]);

  const deleteData = useCallback(async (endpoint, id, successMessage, errorMessage) => {
    try {
      await api.delete(`${endpoint}/${id}`);
      if(successMessage) showMessage(successMessage, 'success');
      return true;
    } catch (err) {
      handleApiError(err, errorMessage || `Failed to delete from ${endpoint}`);
      return false;
    }
  }, [handleApiError, showMessage]);

  // Specific fetch functions for each data type
  const fetchEmployees = useCallback(() => fetchData('/employees').then(setEmployees), [fetchData]);
  const fetchLeaveRequests = useCallback(() => fetchData('/leave-requests').then(setLeaveRequests), [fetchData]);
  const fetchTimesheets = useCallback(() => fetchData('/timesheets').then(setTimesheets), [fetchData]);
  const fetchGoals = useCallback(() => fetchData('/goals').then(setGoals), [fetchData]);
  const fetchReviews = useCallback(() => fetchData('/reviews').then(setReviews), [fetchData]);
  const fetchAnnouncements = useCallback(() => fetchData('/announcements').then(setAnnouncements), [fetchData]);
  const fetchRecognitions = useCallback(() => fetchData('/recognitions').then(setRecognitions), [fetchData]);
  const fetchOnboardingTasks = useCallback(() => fetchData('/onboarding-tasks').then(setOnboardingTasks), [fetchData]); // FIX: Add fetch for onboarding tasks

  // Initial data loading when user is authenticated for ALL modules
  useEffect(() => {
    if (user?.tenantId) {
      // Fetch all necessary data immediately upon user authentication
      fetchEmployees();
      fetchLeaveRequests();
      fetchTimesheets();
      fetchGoals();
      fetchReviews();
      fetchAnnouncements();
      fetchRecognitions();
      fetchOnboardingTasks(); // FIX: Fetch onboarding tasks globally
    }
  }, [
    user, 
    fetchEmployees, fetchLeaveRequests, fetchTimesheets, 
    fetchGoals, fetchReviews, fetchAnnouncements, fetchRecognitions,
    fetchOnboardingTasks // FIX: Add to dependencies
  ]);


  const value = useMemo(() => ({
    user, tenant, isLoading, currentPage, accessToken, messageBox,
    employees, setEmployees, selectedEmployeeId, setSelectedEmployeeId,
    selectedDocumentId, setSelectedDocumentId,
    leaveRequests, setLeaveRequests,
    timesheets, setTimesheets,
    goals, setGoals,
    reviews, setReviews,
    announcements, setAnnouncements,
    recognitions, setRecognitions,
    onboardingTasks, setOnboardingTasks, // FIX: Expose onboardingTasks state and setter
    setCurrentPage, 
    login, logout, setupTenantAndAdmin, showMessage,
    // CRUD operations
    fetchData, postData, putData, deleteData,
    // Specific fetchers (used by individual pages to refresh their data)
    fetchEmployees, fetchLeaveRequests, fetchTimesheets, fetchGoals, fetchReviews, 
    fetchAnnouncements, fetchRecognitions, fetchOnboardingTasks // FIX: Expose onboarding tasks fetcher
  }), [
    user, tenant, isLoading, currentPage, accessToken, messageBox,
    employees, selectedEmployeeId, selectedDocumentId,
    leaveRequests, timesheets, goals, reviews, announcements, recognitions, onboardingTasks, // All global states
    setCurrentPage, setSelectedEmployeeId, setSelectedDocumentId, setEmployees, setLeaveRequests, setTimesheets, setGoals, setReviews, setAnnouncements, setRecognitions, setOnboardingTasks, // All setters
    login, logout, setupTenantAndAdmin, showMessage,
    fetchData, postData, putData, deleteData,
    fetchEmployees, fetchLeaveRequests, fetchTimesheets, fetchGoals, fetchReviews,
    fetchAnnouncements, fetchRecognitions, fetchOnboardingTasks // All fetchers
  ]);

  return (
    <HRMSContext.Provider value={value}>
      {children}
    </HRMSContext.Provider>
  );
};