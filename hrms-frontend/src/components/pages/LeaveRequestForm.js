import React, { useState, useMemo, useEffect } from 'react';
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

  const userIsAdmin = useMemo(() => user?.role === 'admin', [user]);

  const employeeOptions = useMemo(() => {
    return employees.map(emp => ({ value: emp.id, label: `${emp.firstName} ${emp.lastName}` }));
  }, [employees]);

  useEffect(() => {
    if (!userIsAdmin && user?.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: user.employeeId }));
    }
    else if (userIsAdmin) {
      setFormData(prev => ({ ...prev, employeeId: employees[0]?.id || '' }));
    }
  }, [user, userIsAdmin, employees]);

  const leaveTypeOptions = useMemo(() => [
    { value: 'Vacation', label: t('leave.vacation') || 'Vacation' },
    { value: 'Sick', label: t('leave.sick') || 'Sick' },
    { value: 'Personal', label: t('leave.personal') || 'Personal' },
  ], [t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { employeeId, type, startDate, endDate, reason } = formData;

    // --- DIAGNOSTIC LOG ---
    console.log("--- [LeaveRequestForm] Submitting FormData ---", {
        employeeId,
        type,
        startDate,
        endDate,
        reason
    });

    if (!employeeId || !type || !startDate || !endDate || !reason) {
      showMessage(t('common.allFields'), 'error');
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
              options={employeeOptions}
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