import React, { useState, useMemo, useCallback } from 'react'; // Added useCallback
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Target, Plus, X, Calendar, User } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';

const GoalForm = () => {
  const { 
    employees, 
    setCurrentPage,
    showMessage,
    postData, // For sending new goal data to backend
    fetchGoals // To re-fetch goals after creation
  } = useHRMS();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    employeeId: '',
    objective: '',
    dueDate: '',
    description: '',
    category: '',
    priority: 'Medium'
  });

  const [keyResults, setKeyResults] = useState(['']);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false); // New loading state

  const activeEmployees = useMemo(() => employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    })), [employees]);

  const categoryOptions = [
    { value: 'Performance', label: 'Performance' },
    { value: 'Development', label: 'Professional Development' },
    { value: 'Project', label: 'Project Goals' },
    { value: 'Team', label: 'Team Goals' },
    { value: 'Innovation', label: 'Innovation' }
  ];

  const priorityOptions = [
    { value: 'High', label: 'High Priority' },
    { value: 'Medium', label: 'Medium Priority' },
    { value: 'Low', label: 'Low Priority' }
  ];

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      return newState;
    });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleKeyResultChange = useCallback((index, value) => {
    setKeyResults(prev => 
      prev.map((kr, i) => i === index ? value : kr)
    );
  }, []);

  const addKeyResult = useCallback(() => {
    if (keyResults.length < 5) {
      setKeyResults(prev => [...prev, '']);
    } else {
      showMessage('Maximum 5 key results allowed', 'warning');
    }
  }, [keyResults, showMessage]);

  const removeKeyResult = useCallback((index) => {
    setKeyResults(prev => prev.filter((_, i) => i !== index));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }
    if (!formData.objective) {
      newErrors.objective = 'Please enter an objective';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Please select a due date';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Validate due date is in the future
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate <= today) {
        newErrors.dueDate = 'Due date must be in the future';
      }
    }

    // Validate at least one key result
    const validKeyResults = keyResults.filter(kr => kr.trim() !== '');
    if (validKeyResults.length === 0) {
      newErrors.keyResults = 'Please add at least one key result';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, keyResults]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading true

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    const validKeyResults = keyResults.filter(kr => kr.trim() !== '');
    
    const payload = {
      employeeId: formData.employeeId,
      objective: formData.objective,
      description: formData.description,
      dueDate: formData.dueDate,
      category: formData.category,
      priority: formData.priority,
      keyResults: validKeyResults,
      // status and createdDate will be set by the backend
    };

    const result = await postData('/goals', payload, 'Goal created successfully!', 'Failed to create goal'); // Send to backend
    
    if (result) {
      await fetchGoals(); // Re-fetch goals to update the PerformanceManagement list
      setCurrentPage('performance'); // Navigate back
    }
    
    setIsLoading(false); // Set loading false
  }, [formData, keyResults, validateForm, postData, fetchGoals, setCurrentPage, showMessage]);

  const handleCancel = useCallback(() => {
    setCurrentPage('performance');
  }, [setCurrentPage]);

  // Goal templates
  const goalTemplates = [
    {
      title: 'Improve Code Quality',
      keyResults: [
        'Reduce bug count by 30%',
        'Achieve 90% code coverage',
        'Complete code review training'
      ]
    },
    {
      title: 'Enhance Customer Satisfaction',
      keyResults: [
        'Achieve 95% customer satisfaction score',
        'Reduce response time to under 2 hours',
        'Implement customer feedback system'
      ]
    },
    {
      title: 'Professional Development',
      keyResults: [
        'Complete certification program',
        'Attend 3 industry conferences',
        'Mentor 2 junior team members'
      ]
    }
  ];

  const applyTemplate = useCallback((template) => {
    setFormData(prev => ({
      ...prev,
      objective: template.title
    }));
    setKeyResults(template.keyResults);
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('performance.setGoal')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goal Templates */}
        <Card title="Quick Templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {goalTemplates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => applyTemplate(template)}
                className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-sm text-gray-800">{template.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {template.keyResults.length} key results
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Goal Details */}
        <Card title="Goal Details">
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
              label="Objective"
              name="objective"
              value={formData.objective}
              onChange={handleInputChange}
              placeholder="What do you want to achieve?"
              error={errors.objective}
              required
            />

            <TextArea
              label="Description (Optional)"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide additional context or details"
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                options={categoryOptions}
                placeholder="Select category"
                error={errors.category}
                required
              />

              <Select
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                options={priorityOptions}
              />
            </div>

            <Input
              label={t('performance.dueDate')}
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleInputChange}
              error={errors.dueDate}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </Card>

        {/* Key Results */}
        <Card title={t('performance.keyResults')}>
          <div className="space-y-3">
            {errors.keyResults && (
              <p className="text-sm text-red-600">{errors.keyResults}</p>
            )}
            
            {keyResults.map((kr, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500 w-8">
                  {index + 1}.
                </span>
                <Input
                  value={kr}
                  onChange={(e) => handleKeyResultChange(index, e.target.value)}
                  placeholder="Enter a measurable key result"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeKeyResult(index)}
                  variant="danger"
                  size="small"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            {keyResults.length < 5 && (
              <Button
                type="button"
                onClick={addKeyResult}
                variant="outline"
                size="small"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('performance.addKeyResult')}
              </Button>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tips for good key results:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Make them specific and measurable</li>
                <li>• Set ambitious but achievable targets</li>
                <li>• Focus on outcomes, not activities</li>
                <li>• Include deadlines or metrics</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            onClick={handleCancel}
            variant="secondary"
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Target className="w-4 h-4 mr-2" />
            {isLoading ? t('common.loading') : 'Create Goal'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GoalForm;