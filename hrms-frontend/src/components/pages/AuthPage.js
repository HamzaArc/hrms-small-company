import React, { useState } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';

const AuthPage = () => {
  const { login, showMessage } = useHRMS();
  const { t } = useLanguage();

  const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between login and setup
  const [tenantName, setTenantName] = useState(''); // For setup
  const [adminEmail, setAdminEmail] = useState(''); // For setup
  const [adminPassword, setAdminPassword] = useState(''); // For setup

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginTenantId, setLoginTenantId] = useState(''); // For login

  const [isLoading, setIsLoading] = useState(false);

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/auth/setup-tenant-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantName, adminEmail, adminPassword })
      });
      const data = await response.json();

      if (response.ok) {
        showMessage(data.message || 'Tenant and admin user created successfully!', 'success');
        // Automatically log in the admin user after successful setup
        setLoginEmail(adminEmail);
        setLoginPassword(adminPassword);
        setLoginTenantId(data.tenant.id); // Get the newly created tenant ID
        setIsLoginMode(true); // Switch to login mode
      } else {
        showMessage(data.message || 'Failed to set up tenant.', 'error');
      }
    } catch (error) {
      console.error('Setup error:', error);
      showMessage('Network error during setup. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(loginEmail, loginPassword, loginTenantId);
    setIsLoading(false);
    if (success) {
      // login function in context already handles redirection to dashboard and message
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          {isLoginMode ? 'Login to HRMS' : 'Setup Your HRMS'}
        </h2>

        {isLoginMode ? (
          /* Login Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input
              label="Tenant ID"
              type="text"
              value={loginTenantId}
              onChange={(e) => setLoginTenantId(e.target.value)}
              placeholder="Enter your Tenant ID"
              required
            />
            <Input
              label="Email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging In...' : 'Login'}
            </Button>
            <p className="text-center text-sm text-gray-600 mt-4">
              First time here?{' '}
              <button
                type="button"
                onClick={() => setIsLoginMode(false)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Setup New Company
              </button>
            </p>
          </form>
        ) : (
          /* Setup Form */
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              This will create your company (tenant) and an initial admin user account.
            </p>
            <Input
              label="Company Name"
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="e.g., Acme Corp"
              required
            />
            <Input
              label="Admin Email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Your admin email"
              required
            />
            <Input
              label="Admin Password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Choose a strong password"
              required
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Setting Up...' : 'Setup Company & Admin'}
            </Button>
            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLoginMode(true)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Login
              </button>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
};

export default AuthPage;