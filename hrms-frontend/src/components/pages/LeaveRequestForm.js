import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';

const LeaveRequestForm = () => {
  const { user, employees, postData, setCurrentPage, fetchLeaveRequests, showMessage } = useHRMS();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'Vacation',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [requestedDays, setRequestedDays] = useState(0); // New state for calculated days
  const [currentBalance, setCurrentBalance] = useState(0); // New state for current balance
  const [projectedBalance, setProjectedBalance] = useState(0); // New state for projected balance

  const userIsAdmin = useMemo(() => user?.role === 'admin', [user]);

  // Define activeEmployees here using useMemo
  const activeEmployees = useMemo(() => employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    })), [employees]);

  // Find the selected employee object
  const selectedEmployee = useMemo(() => {
    return employees.find(emp => emp.id === formData.employeeId);
  }, [employees, formData.employeeId]);

  useEffect(() => {
    if (!userIsAdmin && user?.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: user.employeeId }));
    }
    else if (userIsAdmin && activeEmployees.length > 0 && !formData.employeeId) { // activeEmployees used here
        setFormData(prev => ({ ...prev, employeeId: activeEmployees[0].value }));
    }
  }, [user, userIsAdmin, activeEmployees]); // Ensure activeEmployees is a dependency

  const leaveTypeOptions = useMemo(() => [
    { value: 'Vacation', label: t('leave.vacation') || 'Vacation' },
    { value: 'Sick', label: t('leave.sick') || 'Sick' },
    { value: 'Personal', label: t('leave.personal') || 'Personal' },
  ], [t]);

  // Calculate requested days and update balances whenever dates or type change
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.type && selectedEmployee) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day

      if (diffDays > 0) {
        setRequestedDays(diffDays);

        let balance = 0;
        switch(formData.type) {
          case 'Vacation': balance = selectedEmployee.vacationBalance; break;
          case 'Sick': balance = selectedEmployee.sickBalance; break;
          case 'Personal': balance = selectedEmployee.personalBalance; break;
          default: balance = 0; // Should not happen with validation
        }
        setCurrentBalance(balance);
        setProjectedBalance(balance - diffDays);
      } else {
        setRequestedDays(0);
        setCurrentBalance(0);
        setProjectedBalance(0);
      }
    } else {
      setRequestedDays(0);
      setCurrentBalance(0);
      setProjectedBalance(0);
    }
  }, [formData.startDate, formData.endDate, formData.type, selectedEmployee]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { employeeId, type, startDate, endDate, reason } = formData;

    if (!employeeId || !type || !startDate || !endDate || !reason) {
      showMessage(t('common.allFields'), 'error');
      setIsLoading(false);
      return;
    }

    if (projectedBalance < 0) {
      showMessage(`Insufficient ${type} days. You only have ${currentBalance} days.`, 'error');
      setIsLoading(false);
      return;
    }
    
    const payload = { employeeId, type, startDate, endDate, reason };
    
    const result = await postData('/leave-requests', payload, 'Leave request submitted successfully!', 'Failed to submit leave request');

    if (result) {
      await fetchLeaveRequests();
      setCurrentPage('leave');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('leave.requestNew')}</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {userIsAdmin ? (
            <Select
              label={t('leave.employee')}
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              options={activeEmployees} // activeEmployees used here
              required
            />
          ) : (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('leave.employee')}</label>
                <p className="mt-2 text-gray-800 font-semibold">{user?.firstName} {user?.lastName}</p>
            </div>
          )}
          <Select
            label={t('leave.type')}
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            options={leaveTypeOptions}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('leave.startDate')}
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
            <Input
              label={t('leave.endDate')}
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              required
            />
          </div>
          {selectedEmployee && requestedDays > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-md font-semibold text-blue-800 mb-2">Leave Impact Preview</h3>
              <p className="text-sm text-blue-700">
                You are requesting <span className="font-bold">{requestedDays}</span> days of <span className="font-bold">{formData.type}</span> leave.
              </p>
              <ul className="text-sm text-blue-700 mt-2">
                <li>Current {formData.type} Balance: <span className="font-bold">{currentBalance}</span> days</li>
                <li>Projected {formData.type} Balance after approval: <span className={`font-bold ${projectedBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>{projectedBalance}</span> days</li>
              </ul>
              {projectedBalance < 0 && (
                <p className="text-red-600 text-xs mt-2">
                  Warning: This request exceeds your available leave balance!
                </p>
              )}
            </div>
          )}
          <TextArea
            label={t('leave.reason')}
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder="Please provide a reason for your leave request..."
            required
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setCurrentPage('leave')}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.loading') : t('common.submit')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LeaveRequestForm;