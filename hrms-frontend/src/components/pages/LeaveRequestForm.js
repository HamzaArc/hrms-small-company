import React, { useState } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calendar, User, FileText } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';

const LeaveRequestForm = () => {
  const { 
    employees, 
    leaveRequests, 
    setLeaveRequests, 
    setCurrentPage,
    showMessage 
  } = useHRMS();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    employeeId: '',
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [errors, setErrors] = useState({});

  const leaveTypes = [
    { value: 'Vacation', label: t('leave.vacation') },
    { value: 'Sick', label: t('leave.sick') },
    { value: 'Personal', label: t('leave.personal') }
  ];

  const activeEmployees = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }
    if (!formData.type) {
      newErrors.type = 'Please select leave type';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Please select start date';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Please select end date';
    }
    if (!formData.reason) {
      newErrors.reason = 'Please provide a reason';
    }

    // Validate date logic
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }
      
      // Check if dates are in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (start < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const checkLeaveBalance = () => {
    if (!formData.employeeId || !formData.type) return true;
    
    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) return true;
    
    const leaveType = formData.type.toLowerCase();
    const requestedDays = calculateDays();
    
    return employee.leaveBalances[leaveType] >= requestedDays;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check leave balance
    if (!checkLeaveBalance()) {
      showMessage(t('leave.insufficientDays'), 'error');
      return;
    }

    const employee = employees.find(emp => emp.id === formData.employeeId);
    
    const newRequest = {
      id: `leave-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    setLeaveRequests(prev => [...prev, newRequest]);
    showMessage('Leave request submitted successfully', 'success');
    setCurrentPage('leave');
  };

  const handleCancel = () => {
    setCurrentPage('leave');
  };

  // Get current leave balance for selected employee and type
  const getCurrentBalance = () => {
    if (!formData.employeeId || !formData.type) return null;
    
    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) return null;
    
    const leaveType = formData.type.toLowerCase();
    return employee.leaveBalances[leaveType];
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('leave.requestNew')}</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-4">
            <Select
              label={t('leave.employee')}
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              options={activeEmployees}
              placeholder="Select an employee"
              error={errors.employeeId}
              required
            />

            <Select
              label={t('leave.type')}
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              options={leaveTypes}
              placeholder="Select leave type"
              error={errors.type}
              required
            />

            {formData.employeeId && formData.type && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Current Balance:</strong> {getCurrentBalance()} days
                  {calculateDays() > 0 && (
                    <span className="ml-2">
                      • <strong>Requesting:</strong> {calculateDays()} days
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('leave.startDate')}
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                error={errors.startDate}
                required
              />

              <Input
                label={t('leave.endDate')}
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                error={errors.endDate}
                min={formData.startDate}
                required
              />
            </div>

            <TextArea
              label={t('leave.reason')}
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Please provide a reason for your leave request"
              rows={4}
              error={errors.reason}
              required
            />

            {!checkLeaveBalance() && calculateDays() > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  {t('leave.insufficientDays')}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <Button
              type="button"
              onClick={handleCancel}
              variant="secondary"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!checkLeaveBalance() && calculateDays() > 0}
            >
              {t('common.submit')}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default LeaveRequestForm;