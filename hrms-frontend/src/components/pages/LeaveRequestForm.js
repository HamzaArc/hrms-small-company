// hrms-frontend/src/components/pages/LeaveRequestForm.js
// Existing imports...
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';
import { Send, Calendar as CalendarIcon } from 'lucide-react'; // Renamed Calendar to CalendarIcon to avoid conflict

const LeaveRequestForm = () => {
  const { user, employees, postData, setCurrentPage, fetchLeaveRequests, showMessage, fetchData } = useHRMS();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    employeeId: user?.role === 'employee' && user?.employeeId ? user.employeeId : '',
    type: 'Vacation', // Initial type, will be dynamically populated from policies
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedWorkingDays, setCalculatedWorkingDays] = useState(0);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [currentLeaveBalance, setCurrentLeaveBalance] = useState(0);
  const [projectedBalance, setProjectedBalance] = useState(0);
  const [holidaysInRange, setHolidaysInRange] = useState([]); // State to store holidays in the selected range
  const [leavePolicies, setLeavePolicies] = useState([]); // NEW: State to store available leave policies

  const userIsAdmin = useMemo(() => user?.role === 'admin', [user]);

  const employeeOptions = useMemo(() => employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    })), [employees]);

  const selectedEmployee = useMemo(() => {
    return employees.find(emp => emp.id === formData.employeeId);
  }, [employees, formData.employeeId]);

  // NEW: Fetch leave policies
  useEffect(() => {
    const loadLeavePolicies = async () => {
      const fetchedPolicies = await fetchData('/leave-policies');
      if (fetchedPolicies) {
        setLeavePolicies(fetchedPolicies);
        // Set a default leave type if none selected and policies exist
        if (fetchedPolicies.length > 0 && !formData.type) {
            setFormData(prev => ({ ...prev, type: fetchedPolicies[0].name }));
        }
      }
    };
    loadLeavePolicies();
  }, [fetchData]); // Only fetch once or when fetchData changes

  // Update employeeId default and initial balances
  useEffect(() => {
    if (!userIsAdmin && user?.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: user.employeeId }));
    } else if (userIsAdmin && employeeOptions.length > 0 && !formData.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: employeeOptions[0].value }));
    }
    // Update initial balance when employee or policies change
    if (selectedEmployee && leavePolicies.length > 0) {
      setCurrentLeaveBalance(selectedEmployee.leaveBalances?.[formData.type] || 0);
    }
  }, [user, userIsAdmin, employeeOptions, formData.employeeId, selectedEmployee, leavePolicies]);


  // MODIFIED: Leave type options from fetched policies
  const leaveTypeOptions = useMemo(() => {
    // Filter policies applicable to the selected employee's role, or all if no employee selected
    const employeeRoles = selectedEmployee ? [selectedEmployee.role] : [];
    
    return leavePolicies
        .filter(policy => policy.applicableRoles.length === 0 || employeeRoles.some(role => policy.applicableRoles.includes(role)))
        .map(policy => ({ value: policy.name, label: policy.name }));
  }, [leavePolicies, selectedEmployee]);


  // Calculate requested days and update balances whenever dates or type change
  useEffect(() => {
    const calculateAndFetchHolidays = async () => {
      const { startDate, endDate, employeeId } = formData;
      setHolidaysInRange([]);
      setCalculatedWorkingDays(0);
      setCurrentLeaveBalance(0);
      setProjectedBalance(0);

      if (startDate && endDate && employeeId && selectedEmployee) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start && end && start <= end) {
          setCalculationLoading(true);
          try {
            const fetchedHolidays = await fetchData(`/holidays?startDate=${startDate}&endDate=${endDate}`);
            if (fetchedHolidays) {
                setHolidaysInRange(fetchedHolidays);
            }

            const result = await fetchData(`/leave-requests/calculate-days?startDate=${startDate}&endDate=${endDate}`);
            if (result && typeof result.workingDays === 'number') {
              setCalculatedWorkingDays(result.workingDays);
              
              let balance = selectedEmployee.leaveBalances?.[formData.type] || 0; // Use dynamic balance from employee entity
              setCurrentBalance(balance);
              setProjectedBalance(balance - result.workingDays);

            } else {
              setCalculatedWorkingDays(0);
            }
          } catch (error) {
            setCalculatedWorkingDays(0);
            setHolidaysInRange([]);
            setCurrentLeaveBalance(0);
            setProjectedBalance(0);
          } finally {
            setCalculationLoading(false);
          }
        } else {
          setCalculatedWorkingDays(0);
        }
      }
    };
    calculateAndFetchHolidays();
  }, [formData.startDate, formData.endDate, formData.type, formData.employeeId, selectedEmployee, fetchData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { employeeId, type, startDate, endDate, reason } = formData;

    if (!employeeId || !type || !startDate || !endDate || !reason) {
      showMessage(t('common.allFields'), 'error');
      setIsSubmitting(false);
      return;
    }

    // Enhanced check for leave balance based on actual calculated working days
    if (calculatedWorkingDays > currentLeaveBalance) { // Use calculatedWorkingDays
      showMessage(t('leave.insufficientDays', { type: t(`leave.${type.toLowerCase()}`), currentBalance, requestedDays: calculatedWorkingDays }), 'error');
      setIsSubmitting(false);
      return;
    }
    
    const payload = { employeeId, type, startDate, endDate, reason };
    
    const result = await postData('/leave-requests', payload, t('leave.requestSuccess'), t('leave.requestError'));

    if (result) {
      await fetchLeaveRequests();
      setCurrentPage('leave');
    }
    
    setIsSubmitting(false);
  };

  const handleCancel = useCallback(() => {
    setCurrentPage('leave');
  }, [setCurrentPage]);

  // Filter upcoming holidays that are not yet passed and are within the selected employee's policy type
  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const relevantPolicyNames = leavePolicies.map(p => p.name); // All defined policy names

    return holidaysInRange
      .filter(h => new Date(h.date) >= today && relevantPolicyNames.includes(h.name)) // Only show future/today holidays and ensure holiday name matches a policy name
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [holidaysInRange, leavePolicies]);


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
            options={leaveTypeOptions} // Now dynamic based on policies
            required
            disabled={leaveTypeOptions.length === 0 && !calculationLoading} // Disable if no policies loaded yet
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
          {(formData.startDate && formData.endDate && formData.employeeId && selectedEmployee) && (
            <div className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
              <p>
                {t('leave.calculatedWorkingDays')}:{' '}
                {calculationLoading ? (
                  <span className="font-semibold text-gray-500">{t('leave.calculatingDays')}...</span>
                ) : (
                  <span className="font-semibold text-blue-700">{calculatedWorkingDays}</span>
                )}{' '}
                {t('common.days')}
              </p>
              <p className="mt-1">
                {t('leave.currentBalance', { type: formData.type })}:{' '} {/* Added type for balance display */}
                <span className="font-semibold">{currentLeaveBalance}</span>{' '}
                {t('common.days')} ({t('leave.projectedBalance')}:{' '}
                <span className={`font-semibold ${projectedBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {projectedBalance}
                </span>{' '}
                {t('common.days')})
              </p>
              {calculatedWorkingDays > 0 && holidaysInRange.length > 0 && (
                <div className="mt-2 text-yellow-800 text-xs">
                  <p className="font-semibold">{t('leave.daysExcluded')}:</p>
                  <ul className="list-disc list-inside">
                    {holidaysInRange.map(h => (
                      <li key={h.id}>
                        {t('leave.holidayNotice', { date: new Date(h.date).toLocaleDateString(), name: h.name })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* This logic needs to determine if ANY weekend was in range and excluded, not if all days were working days */}
              {calculatedWorkingDays > 0 && (calculatedWorkingDays < ((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1) - holidaysInRange.length) && (
                <p className="mt-2 text-green-700 text-xs">
                    {t('leave.weekendsExcludedNotice')}
                </p>
              )}
            </div>
          )}

          <TextArea
            label={t('leave.reason')}
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder={t('leave.reasonPlaceholder')}
            rows="3"
            required
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || calculationLoading}>
              {isSubmitting ? t('common.loading') : t('common.submit')}
            </Button>
          </div>
        </form>
      </Card>

      {/* NEW: Upcoming Holidays for Selected Employee */}
      {(selectedEmployee && upcomingHolidays.length > 0) && (
        <Card title={t('holidays.upcomingForEmployee', { employeeName: selectedEmployee.firstName })}>
          <div className="space-y-2">
            {upcomingHolidays.map(holiday => (
              <div key={holiday.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-800">{new Date(holiday.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">{holiday.name} ({holiday.isPublic ? t('holidays.public') : t('common.private')})</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LeaveRequestForm;