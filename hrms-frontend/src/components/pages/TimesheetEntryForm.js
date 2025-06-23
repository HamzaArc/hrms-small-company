// hrms-frontend/src/components/pages/TimesheetEntryForm.js
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Clock, Calendar, User, FileText, Plus, Save } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';

const TimesheetEntryForm = () => {
  const { 
    user,
    employees, 
    fetchTimesheets,
    postData,
    setCurrentPage,
    showMessage 
  } = useHRMS();
  const { t } = useLanguage();

  const [entryMode, setEntryMode] = useState('single');
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0], // This date will now represent the start of the selected week in 'week' mode
    hours: '',
    description: ''
  });

  const [weekData, setWeekData] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const userIsAdmin = useMemo(() => user?.role === 'admin', [user]);

  const activeEmployees = useMemo(() => employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    })), [employees]);

  // Pre-select employee if not admin
  useEffect(() => {
    if (!userIsAdmin && user?.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: user.employeeId }));
    }
    else if (userIsAdmin && activeEmployees.length > 0 && !formData.employeeId) {
        setFormData(prev => ({ ...prev, employeeId: activeEmployees[0].value }));
    }
  }, [userIsAdmin, user?.employeeId, activeEmployees]);

  // FIX: Trigger initializeWeekData when entryMode changes to 'week' or formData.date changes
  useEffect(() => {
    if (entryMode === 'week' && formData.employeeId && formData.date) {
      initializeWeekData();
    }
  }, [entryMode, formData.employeeId, formData.date]); // Added formData.date as dependency

  const initializeWeekData = async () => { // FIX: Make async to potentially fetch data
    const selectedDate = new Date(formData.date); // Use formData.date for the selected date
    const dayOfWeek = selectedDate.getDay(); // 0 for Sunday, 1 for Monday etc.
    const weekStart = new Date(selectedDate);
    weekStart.setDate(selectedDate.getDate() - dayOfWeek); // Set to the start of the week (Sunday)

    const week = [];
    // FIX: Fetch existing timesheets for the current employee and week range
    const fetchedTimesheetsForWeek = await postData('/timesheets/by-employee-and-week', {
        employeeId: formData.employeeId,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6).toISOString().split('T')[0]
    }, null, null); // Don't show messages for this internal fetch

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const existingEntry = (fetchedTimesheetsForWeek || []).find(ts => ts.date === dateString);

      week.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: existingEntry ? existingEntry.hours : '',
        description: existingEntry ? existingEntry.description : '',
        isWeekend: i === 0 || i === 6 // Sunday and Saturday
      });
    }
    setWeekData(week);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleWeekDataChange = (index, field, value) => {
    setWeekData(prev => 
      prev.map((day, i) => 
        i === index ? { ...day, [field]: value } : day
      )
    );
  };

  const validateSingleEntry = () => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }
    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      newErrors.hours = 'Please enter valid hours (1-24)';
    }
    if (!formData.description) {
      newErrors.description = 'Please provide a description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateWeekEntries = () => {
    const hasValidEntry = weekData.some(day => day.hours && day.description);
    if (!hasValidEntry) {
      showMessage('Please fill at least one day with hours and description', 'error');
      return false;
    }

    // Validate each entry
    for (const day of weekData) {
      const hours = parseFloat(day.hours);
      if (day.hours && (isNaN(hours) || hours <= 0 || hours > 24)) {
        showMessage(`Invalid hours for ${day.dayName}. Must be between 1-24`, 'error');
        return false;
      }
      if (day.hours && !day.description) {
        showMessage(`Please add description for ${day.dayName}`, 'error');
        return false;
      }
    }

    return true;
  };

  const handleSubmitSingle = async () => { // FIX: Made async
    if (!validateSingleEntry()) {
      return;
    }

    setIsLoading(true); // FIX: Set loading true
    
    const payload = {
      employeeId: formData.employeeId,
      date: formData.date,
      hours: parseFloat(formData.hours),
      description: formData.description
    };

    const result = await postData('/timesheets', payload, 'Timesheet entry added successfully', 'Failed to add timesheet entry'); // FIX: Call postData

    if (result) {
      await fetchTimesheets(); // FIX: Re-fetch global timesheets
      // Reset form for continuous entry
      setFormData(prev => ({
        ...prev,
        hours: '',
        description: ''
      }));
    }
    setIsLoading(false); // FIX: Set loading false
  };

  const handleSubmitWeek = async () => { // FIX: Made async
    if (!formData.employeeId) {
      showMessage('Please select an employee', 'error');
      return;
    }

    if (!validateWeekEntries()) {
      return;
    }

    setIsLoading(true); // FIX: Set loading true

    const newEntries = [];
    for (const day of weekData) { // FIX: Use for...of for async operations if needed later
      if (day.hours && day.description) {
        newEntries.push({
          employeeId: formData.employeeId,
          date: day.date,
          hours: parseFloat(day.hours),
          description: day.description
        });
      }
    }

    // FIX: Send each entry individually or as a batch if API supports
    // For simplicity, posting one by one for now.
    // A more efficient backend might have a batch create endpoint.
    let allSucceeded = true;
    for (const entry of newEntries) {
        const result = await postData('/timesheets', entry, null, `Failed to add entry for ${new Date(entry.date).toLocaleDateString()}`);
        if (!result) {
            allSucceeded = false;
        }
    }

    if (allSucceeded) {
      await fetchTimesheets(); // FIX: Re-fetch global timesheets
      showMessage(`${newEntries.length} timesheet entries added successfully`, 'success');
      setCurrentPage('timesheets');
    } else {
        showMessage('Some timesheet entries failed to save. Check console for details.', 'error');
    }
    
    setIsLoading(false); // FIX: Set loading false
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (entryMode === 'single') {
      handleSubmitSingle();
    } else {
      handleSubmitWeek();
    }
  };

  const calculateWeekTotal = () => {
    return weekData.reduce((total, day) => total + (parseFloat(day.hours) || 0), 0);
  };

  const handleCancel = () => {
    setCurrentPage('timesheets');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">{t('timesheets.addNew')}</h1>

      {/* Entry Mode Selector */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Entry Mode:</span>
          <div className="flex space-x-2">
            <Button
              type="button"
              onClick={() => setEntryMode('single')}
              variant={entryMode === 'single' ? 'primary' : 'outline'}
              size="small"
            >
              Single Entry
            </Button>
            <Button
              type="button"
              onClick={() => {
                setEntryMode('week');
                // Ensure form data date is today's date if empty or invalid for initial week view
                setFormData(prev => ({ ...prev, date: prev.date || new Date().toISOString().split('T')[0] }));
              }}
              variant={entryMode === 'week' ? 'primary' : 'outline'}
              size="small"
            >
              Weekly Entry
            </Button>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit}>
        {entryMode === 'single' ? (
          /* Single Entry Mode (unchanged) */
          <Card>
            <div className="space-y-4">
              {userIsAdmin ? (
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
              ) : (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('leave.employee')}</label>
                    <p className="mt-2 text-gray-800 font-semibold">{user?.firstName} {user?.lastName}</p>
                </div>
              )}

              <Input
                label={t('timesheets.date')}
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                error={errors.date}
                max={new Date().toISOString().split('T')[0]}
                required
              />

              <Input
                label={t('timesheets.hours')}
                name="hours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.hours}
                onChange={handleInputChange}
                error={errors.hours}
                placeholder="e.g., 8"
                required
              />

              <TextArea
                label={t('timesheets.description')}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="What did you work on?"
                rows={3}
                error={errors.description}
                required
              />

              {/* Quick Templates */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Daily standup and team meetings',
                    'Code review and bug fixes',
                    'Feature development',
                    'Documentation and testing'
                  ].map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, description: template }))}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <div className="space-x-2">
                <Button type="submit" disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
                <Button type="button" onClick={handleCancel} variant="secondary">
                  {t('common.cancel')}
                </Button>
              </div>
              <Button 
                type="button" 
                onClick={() => setCurrentPage('timesheets')}
                variant="outline"
              >
                Save & Close
              </Button>
            </div>
          </Card>
        ) : (
          /* Weekly Entry Mode */
          <div className="space-y-6">
            <Card>
              {userIsAdmin ? (
                <Select
                  label={t('leave.employee')}
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  options={activeEmployees}
                  placeholder="Select an employee"
                  required
                />
              ) : (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('leave.employee')}</label>
                    <p className="mt-2 text-gray-800 font-semibold">{user?.firstName} {user?.lastName}</p>
                </div>
              )}
              {/* FIX: New date input for selecting the week */}
              <Input
                label={t('timesheets.selectWeek')} // Needs new translation key
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]} // Cannot select future weeks
              />
            </Card>

            {formData.employeeId && (
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Week of {weekData[0]?.date ? new Date(weekData[0].date).toLocaleDateString() : ''}
                    </h3>
                    <div className="text-sm text-gray-600">
                      Total: <span className="font-semibold">{calculateWeekTotal()} hours</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {weekData.map((day, index) => (
                      <div 
                        key={day.date} 
                        className={`p-4 rounded-lg border ${
                          day.isWeekend ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-2">
                            <p className="font-medium text-gray-800">{day.dayName}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(day.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              value={day.hours}
                              onChange={(e) => handleWeekDataChange(index, 'hours', e.target.value)}
                              placeholder="Hours"
                            />
                          </div>
                          <div className="md:col-span-8">
                            <Input
                              value={day.description}
                              onChange={(e) => handleWeekDataChange(index, 'description', e.target.value)}
                              placeholder="What did you work on?"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                  <Button type="button" onClick={handleCancel} variant="secondary">
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Week
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default TimesheetEntryForm;