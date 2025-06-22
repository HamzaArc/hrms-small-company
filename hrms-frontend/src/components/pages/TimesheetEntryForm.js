import React, { useState, useEffect } from 'react';
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
    employees, 
    timesheets, 
    setTimesheets, 
    setCurrentPage,
    showMessage 
  } = useHRMS();
  const { t } = useLanguage();

  const [entryMode, setEntryMode] = useState('single'); // single or week
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: ''
  });

  const [weekData, setWeekData] = useState([]);
  const [errors, setErrors] = useState({});

  // Initialize week data when switching to week mode
  useEffect(() => {
    if (entryMode === 'week' && formData.employeeId) {
      initializeWeekData();
    }
  }, [entryMode, formData.employeeId]);

  const activeEmployees = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    }));

  const initializeWeekData = () => {
    const startDate = new Date(formData.date);
    const dayOfWeek = startDate.getDay();
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() - dayOfWeek);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      // Check if entry already exists
      const existingEntry = timesheets.find(ts => 
        ts.employeeId === formData.employeeId && 
        ts.date === date.toISOString().split('T')[0]
      );

      week.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: existingEntry ? existingEntry.hours : '',
        description: existingEntry ? existingEntry.description : '',
        isWeekend: i === 0 || i === 6
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
    if (!formData.hours || formData.hours <= 0 || formData.hours > 24) {
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
      if (day.hours && (day.hours <= 0 || day.hours > 24)) {
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

  const handleSubmitSingle = () => {
    if (!validateSingleEntry()) {
      return;
    }

    const employee = employees.find(emp => emp.id === formData.employeeId);
    
    const newEntry = {
      id: `ts-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date: formData.date,
      hours: parseFloat(formData.hours),
      description: formData.description
    };

    setTimesheets(prev => [...prev, newEntry]);
    showMessage('Timesheet entry added successfully', 'success');
    
    // Reset form for continuous entry
    setFormData(prev => ({
      ...prev,
      hours: '',
      description: ''
    }));
  };

  const handleSubmitWeek = () => {
    if (!formData.employeeId) {
      showMessage('Please select an employee', 'error');
      return;
    }

    if (!validateWeekEntries()) {
      return;
    }

    const employee = employees.find(emp => emp.id === formData.employeeId);
    const newEntries = [];

    weekData.forEach(day => {
      if (day.hours && day.description) {
        newEntries.push({
          id: `ts-${Date.now()}-${day.date}`,
          employeeId: formData.employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          date: day.date,
          hours: parseFloat(day.hours),
          description: day.description
        });
      }
    });

    setTimesheets(prev => [...prev, ...newEntries]);
    showMessage(`${newEntries.length} timesheet entries added successfully`, 'success');
    setCurrentPage('timesheets');
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('timesheets.addNew')}</h1>

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
              onClick={() => setEntryMode('week')}
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
          /* Single Entry Mode */
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
                <Button type="submit">
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
              <Select
                label={t('leave.employee')}
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                options={activeEmployees}
                placeholder="Select an employee"
                required
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
                  <Button type="submit">
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