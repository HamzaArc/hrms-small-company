import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  User, Mail, Phone, MapPin, Calendar, Briefcase, Plus, Trash2
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';

const roleToDepartmentMap = {
    'Software Engineer': 'Engineering',
    'Product Manager': 'Product',
    'HR Manager': 'Human Resources',
    'Marketing Specialist': 'Marketing',
    'Sales Representative': 'Sales',
    'Accountant': 'Finance'
};

const EmployeeDetail = ({ isMyProfile = false }) => {
  const {
    employees,
    selectedEmployeeId,
    setSelectedEmployeeId,
    setCurrentPage,
    showMessage,
    user,
    fetchEmployees,
    postData,
    putData,
    deleteData,
    fetchData,
  } = useHRMS();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    role: '', department: '', hireDate: '', status: 'Active',
    vacationBalance: 15, sickBalance: 10, personalBalance: 5,
  });

  const [newTask, setNewTask] = useState({ task: '', dueDate: '' }); // For local mock task addition
  const [isLoading, setIsLoading] = useState(true);
  const [myDocuments, setMyDocuments] = useState([]); // This state is for display only

  const currentEmployeeIdToLoad = useMemo(() => isMyProfile ? user?.employeeId : selectedEmployeeId, [isMyProfile, user, selectedEmployeeId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (currentEmployeeIdToLoad) {
        const employeeData = await fetchData(`/employees/${currentEmployeeIdToLoad}`);
        if (employeeData) {
          setFormData({
            ...employeeData,
            hireDate: employeeData.hireDate ? new Date(employeeData.hireDate).toISOString().split('T')[0] : '',
            vacationBalance: employeeData.vacationBalance || 0,
            sickBalance: employeeData.sickBalance || 0,
            personalBalance: employeeData.personalBalance || 0,
          });
          if (isMyProfile) {
            setMyDocuments(await fetchData(`/documents?employeeId=${currentEmployeeIdToLoad}`) || []);
          }
        }
      } else {
        setFormData({
          firstName: '', lastName: '', email: '', phone: '', address: '',
          role: '', department: '', hireDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          vacationBalance: 15, sickBalance: 10, personalBalance: 5,
        });
      }
      setIsLoading(false);
    };
    loadData();
  }, [currentEmployeeIdToLoad, isMyProfile, fetchData]);
  
  const roleOptions = useMemo(() => Object.keys(roleToDepartmentMap).map(role => ({ value: role, label: role })), []);
  const departmentOptions = useMemo(() => [...new Set(Object.values(roleToDepartmentMap))].map(dept => ({ value: dept, label: dept })), []);
  const statusOptions = useMemo(() => [{ value: 'Active', label: t('common.active') }, { value: 'Inactive', label: t('common.inactive') }], [t]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'role') {
        newState.department = roleToDepartmentMap[value] || '';
      }
      return newState;
    });
  }, []);

  const handleLeaveBalanceChange = useCallback((type, value) => {
    setFormData(prev => ({ ...prev, [`${type}Balance`]: parseInt(value) || 0 }));
  }, []);

  const handleTaskToggle = useCallback((taskId) => showMessage('Onboarding task status update needs backend integration on Onboarding page.', 'info'), [showMessage]);
  const handleAddTask = useCallback(() => showMessage('Adding onboarding tasks needs backend integration on Onboarding page.', 'info'), [showMessage]);
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      role: formData.role,
      department: formData.department,
      status: formData.status,
      vacationBalance: formData.vacationBalance,
      sickBalance: formData.sickBalance,
      personalBalance: formData.personalBalance,
    };

    if (!selectedEmployeeId) {
        payload.hireDate = formData.hireDate;
    }
    
    const requiredFields = ['firstName', 'lastName', 'email', 'role', 'department', 'status'];
    if (requiredFields.some(field => !payload[field])) {
        showMessage(t('common.allFields'), 'error');
        setIsLoading(false);
        return;
    }

    const apiCall = selectedEmployeeId ? putData : postData;
    const endpoint = selectedEmployeeId ? `/employees/${selectedEmployeeId}` : '/employees';
    const successMsg = selectedEmployeeId ? t('employee.saveSuccess') : t('employee.addSuccess');
    const errorMsg = selectedEmployeeId ? t('employee.saveError') : t('employee.addError');

    const result = await apiCall(endpoint, payload, successMsg, errorMsg);
    if (result) {
        await fetchEmployees();
        setCurrentPage('employees');
    }
    setIsLoading(false);
  }, [formData, selectedEmployeeId, postData, putData, fetchEmployees, setCurrentPage, showMessage, t]);

  const handleDelete = useCallback(() => {
    if (!currentEmployeeIdToLoad) return;
    showMessage(t('employee.confirmDelete'), 'warning', [{
        label: t('common.yes'),
        onClick: async () => {
            const success = await deleteData('/employees', currentEmployeeIdToLoad, t('employee.deleteSuccess'));
            if (success) {
                await fetchEmployees();
                setCurrentPage('employees');
            }
        },
        primary: true
    }, { label: t('common.no'), onClick: () => {} }]);
  }, [currentEmployeeIdToLoad, deleteData, fetchEmployees, setCurrentPage, showMessage, t]);


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        {isMyProfile ? t('employee.myProfileTitle') : selectedEmployeeId ? t('employee.editTitle') : t('employee.addTitle')}
      </h1>

      {isLoading ? (
        <Card><p className="text-center">{t('common.loading')}</p></Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title={t('employee.personalInformation')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label={t('employee.firstName')} name="firstName" value={formData.firstName} onChange={handleInputChange} required readOnly={isMyProfile} icon={<User />} />
              <Input label={t('employee.lastName')} name="lastName" value={formData.lastName} onChange={handleInputChange} required readOnly={isMyProfile} icon={<User />} />
              <Input label={t('employee.email')} name="email" type="email" value={formData.email} onChange={handleInputChange} required readOnly={isMyProfile} icon={<Mail />} />
              <Input label={t('employee.phone')} name="phone" value={formData.phone} onChange={handleInputChange} readOnly={isMyProfile} icon={<Phone />} />
              <div className="md:col-span-2">
                <Input label={t('employee.address')} name="address" value={formData.address} onChange={handleInputChange} readOnly={isMyProfile} icon={<MapPin />} />
              </div>
            </div>
          </Card>

          <Card title={t('employee.employmentInformation')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select label={t('employee.role')} name="role" value={formData.role} onChange={handleInputChange} options={roleOptions} required disabled={isMyProfile} />
              <Select label={t('employee.department')} name="department" value={formData.department} options={departmentOptions} required disabled={true} />
              {(!selectedEmployeeId || isMyProfile) && (
                <Input label={t('employee.hireDate')} name="hireDate" type="date" value={formData.hireDate} onChange={handleInputChange} required readOnly={isMyProfile} icon={<Calendar />} />
              )}
              <Select label={t('employee.status')} name="status" value={formData.status} onChange={handleInputChange} options={statusOptions} required disabled={isMyProfile} />
            </div>
          </Card>

          {!isMyProfile && (
            <>
              <Card title={t('employee.leaveBalancesTitle')}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label={t('employee.vacationDays')} type="number" value={formData.vacationBalance} onChange={(e) => handleLeaveBalanceChange('vacation', e.target.value)} min="0" />
                  <Input label={t('employee.sickDays')} type="number" value={formData.sickBalance} onChange={(e) => handleLeaveBalanceChange('sick', e.target.value)} min="0" />
                  <Input label={t('employee.personalDays')} type="number" value={formData.personalBalance} onChange={(e) => handleLeaveBalanceChange('personal', e.target.value)} min="0" />
                </div>
              </Card>

              {/* Removed Onboarding Tasks section */}
              {/* Removed Documents section */}

            </>
          )}

          <div className="flex justify-between">
            <div className="space-x-2">
              <Button type="submit" disabled={isLoading}>{selectedEmployeeId ? t('employee.save') : t('employee.add')}</Button>
              <Button type="button" onClick={() => setCurrentPage('employees')} variant="secondary">{t('common.cancel')}</Button>
            </div>
            {selectedEmployeeId && !isMyProfile && (
              <Button type="button" onClick={handleDelete} variant="danger" disabled={isLoading}><Trash2 className="w-4 h-4 mr-2" />{t('employee.delete')}</Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default EmployeeDetail;