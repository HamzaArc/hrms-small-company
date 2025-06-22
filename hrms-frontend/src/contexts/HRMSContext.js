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
  
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  // Add other data states here as needed
  
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

  // Effect to handle session restoration from token
  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
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
  // FIX: This effect MUST run when `accessToken` changes.
  }, [accessToken, logout]);
  
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken: newAccessToken } = response.data;
      // The only job of login is to get the token and set it.
      // The useEffect above will handle fetching the profile and redirecting.
      localStorage.setItem('accessToken', newAccessToken);
      setAccessToken(newAccessToken); // This will trigger the useEffect
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

  // Data fetching and mutation functions
  const fetchData = useCallback((endpoint, setter) => {
    return api.get(endpoint).then(res => {
      if (setter) setter(res.data);
      return res.data;
    }).catch(err => {
      handleApiError(err, `Failed to fetch from ${endpoint}`);
      return null;
    });
  }, [handleApiError]);
  
  const postData = useCallback((endpoint, data, successMessage) => {
    return api.post(endpoint, data).then(res => {
      if(successMessage) showMessage(successMessage, 'success');
      return res.data;
    }).catch(err => {
      handleApiError(err, `Failed to post to ${endpoint}`);
      return null;
    });
  }, [handleApiError, showMessage]);

  const putData = useCallback((endpoint, data, successMessage) => {
    return api.put(endpoint, data).then(res => {
      if(successMessage) showMessage(successMessage, 'success');
      return res.data;
    }).catch(err => {
      handleApiError(err, `Failed to update ${endpoint}`);
      return null;
    });
  }, [handleApiError, showMessage]);

  const deleteData = useCallback((endpoint, id, successMessage) => {
    return api.delete(`${endpoint}/${id}`).then(() => {
      if(successMessage) showMessage(successMessage, 'success');
      return true;
    }).catch(err => {
      handleApiError(err, `Failed to delete from ${endpoint}`);
      return false;
    });
  }, [handleApiError, showMessage]);


  const fetchEmployees = useCallback(() => fetchData('/employees', setEmployees), [fetchData]);
  const fetchLeaveRequests = useCallback(() => fetchData('/leave-requests', setLeaveRequests), [fetchData]);

  const value = useMemo(() => ({
    user, tenant, isLoading, currentPage, accessToken, employees, leaveRequests, selectedEmployeeId, messageBox,
    setCurrentPage, setSelectedEmployeeId,
    login, logout, setupTenantAndAdmin, showMessage,
    postData, putData, deleteData, fetchData,
    fetchEmployees, fetchLeaveRequests,
  }), [
    user, tenant, isLoading, currentPage, accessToken, employees, leaveRequests, selectedEmployeeId, messageBox,
    login, logout, setupTenantAndAdmin, showMessage,
    postData, putData, deleteData, fetchData,
    fetchEmployees, fetchLeaveRequests,
  ]);

  return (
    <HRMSContext.Provider value={value}>
      {children}
    </HRMSContext.Provider>
  );
};