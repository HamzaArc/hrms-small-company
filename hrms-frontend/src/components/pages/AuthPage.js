import React, { useState } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import Input from '../common/Input';
import { Briefcase, Mail, Lock, User, Building } from 'lucide-react';

const Logo = ({ className }) => (
  <div className={`flex items-center space-x-3 ${className}`}>
    <div className="bg-white/20 p-2 rounded-lg">
      <Briefcase className="w-6 h-6 text-white" />
    </div>
    <span className="text-2xl font-bold tracking-tight text-white">HRMS</span>
  </div>
);

const AuthPage = () => {
  const { login, setupTenantAndAdmin } = useHRMS();
  const { t } = useLanguage();

  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [tenantName, setTenantName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await setupTenantAndAdmin({ tenantName, adminEmail, adminPassword });
    if (result) {
        setLoginEmail(adminEmail);
        setIsLoginMode(true);
    }
    setIsLoading(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await login(loginEmail, loginPassword);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* --- LEFT VISUAL PANEL --- */}
      <div className="relative hidden h-full flex-col bg-indigo-600 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-indigo-900" />
        <Logo className="relative z-20" />
        <div className="relative z-20 my-auto">
          <h1 className="text-5xl font-bold tracking-tighter">
            {t('auth.panelTitle')}
          </h1>
          <p className="mt-4 text-lg text-indigo-200 max-w-md">
            {t('auth.panelSubtitle')}
          </p>
        </div>
        <div className="relative z-20 mt-auto">
          <p className="text-sm text-indigo-300">&copy; {new Date().getFullYear()} HRMS Inc. All rights reserved.</p>
        </div>
      </div>

      {/* --- RIGHT FORM PANEL --- */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              {isLoginMode ? t('auth.loginTitle') : t('auth.setupTitle')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isLoginMode ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
              <button onClick={() => setIsLoginMode(!isLoginMode)} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none">
                {isLoginMode ? t('auth.setupLink') : t('auth.loginLink')}
              </button>
            </p>
          </div>

          {isLoginMode ? (
            <form onSubmit={handleLoginSubmit} className="mt-8 space-y-6">
              <Input label="Email" name="email" type="email" placeholder="name@company.com" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} icon={<Mail />} />
              <Input label="Password" name="password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot your password?
                  </a>
                </div>
              </div>
              <Button type="submit" className="w-full justify-center" disabled={isLoading}>
                {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSetupSubmit} className="mt-8 space-y-6">
             <Input label="Company Name" name="companyName" placeholder="e.g. TechCorp Solutions" required value={tenantName} onChange={(e) => setTenantName(e.target.value)} icon={<Building />} />
             <Input label="Your Admin Email" name="adminEmail" type="email" placeholder="name@company.com" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} icon={<User />} />
             <Input label="Admin Password" name="adminPassword" type="password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
              <Button type="submit" className="w-full justify-center" disabled={isLoading}>
                {isLoading ? t('auth.settingUp') : t('auth.setupButton')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;