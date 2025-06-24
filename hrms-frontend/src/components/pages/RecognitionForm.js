import React, { useState, useCallback, useMemo } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Award, Star, Heart, Trophy, Target, Users, Save } from 'lucide-react';
import Button from '../common/Button';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';

const RecognitionForm = () => {
  const { 
    employees, 
    setCurrentPage,
    showMessage,
    postData, 
    fetchRecognitions 
  } = useHRMS();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    recipientId: '',
    category: '',
    message: '',
    value: '',
    isPublic: true
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false); // Manages loading state for submission

  const activeEmployees = useMemo(() => employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName} - ${emp.role}`
    })), [employees]);

  const categoryOptions = [
    { value: 'teamwork', label: 'Outstanding Teamwork', icon: Users },
    { value: 'innovation', label: 'Innovation & Creativity', icon: Star },
    { value: 'leadership', label: 'Leadership Excellence', icon: Trophy },
    { value: 'achievement', label: 'Goal Achievement', icon: Target },
    { value: 'dedication', label: 'Dedication & Hard Work', icon: Heart },
    { value: 'customer', label: 'Customer Service', icon: Award }
  ];

  const valueOptions = [
    { value: 'integrity', label: 'Integrity' },
    { value: 'excellence', label: 'Excellence' },
    { value: 'collaboration', label: 'Collaboration' },
    { value: 'innovation', label: 'Innovation' },
    { value: 'accountability', label: 'Accountability' },
    { value: 'respect', label: 'Respect' }
  ];

  const recognitionTemplates = [
    {
      category: 'teamwork',
      message: 'Thank you for your exceptional teamwork on the recent project. Your collaborative spirit and willingness to help others made a real difference!'
    },
    {
      category: 'innovation',
      message: 'Your innovative approach to solving problems continues to inspire the team. Thank you for thinking outside the box!'
    },
    {
      category: 'achievement',
      message: 'Congratulations on achieving your goals! Your dedication and hard work are truly appreciated.'
    },
    {
      category: 'dedication',
      message: 'Your commitment and dedication to excellence never go unnoticed. Thank you for always going above and beyond!'
    }
  ];

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Remove specific error when input changes
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]); // Dependency on errors to clear them

  const handleTemplateSelect = useCallback((template) => {
    setFormData(prev => ({
      ...prev,
      category: template.category,
      message: template.message
    }));
  }, []); // No external dependencies

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.recipientId) {
      newErrors.recipientId = 'Please select an employee';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a recognition category';
    }
    if (!formData.message) {
      newErrors.message = 'Please write a recognition message';
    }
    if (formData.message && formData.message.length < 20) {
      newErrors.message = 'Message should be at least 20 characters';
    }
    if (!formData.value) {
      newErrors.value = 'Please select a company value';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]); // Dependency on formData for validation

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    // `employees` is from context, ensure it's up-to-date if needed, but for recipient lookup it's fine.
    const recipient = employees.find(emp => emp.id === formData.recipientId);
    
    const payload = {
      recipientId: formData.recipientId,
      category: formData.category,
      value: formData.value,
      message: formData.message,
      givenBy: 'Current User', // In real app, this would be the logged-in user's name or ID
      isPublic: formData.isPublic,
      // date will be set by the backend
    };

    const result = await postData('/recognitions', payload, 'Recognition sent successfully! 🎉', 'Failed to send recognition');
    
    if (result) {
      await fetchRecognitions(); // Re-fetch recognitions to update the main Engagement page
      setCurrentPage('engagement'); // Navigate back
    }
    
    setIsLoading(false);
  }, [formData, validateForm, employees, postData, fetchRecognitions, setCurrentPage, showMessage]); // Added all dependencies

  const handleCancel = useCallback(() => {
    setCurrentPage('engagement');
  }, [setCurrentPage]); // Dependency on setCurrentPage

  // Memoized getter for selected category to ensure stability and re-evaluation when category changes
  const getSelectedCategory = useCallback(() => {
    return categoryOptions.find(cat => cat.value === formData.category);
  }, [formData.category]); // Dependency on formData.category

  // Memoized selected recipient for efficient re-renders
  const selectedRecipient = useMemo(() => {
    return formData.recipientId 
      ? employees.find(emp => emp.id === formData.recipientId)
      : null;
  }, [formData.recipientId, employees]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('engagement.giveRecognition')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Selection */}
        <Card title="Who are you recognizing?">
          <Select
            label={t('engagement.recipient')}
            name="recipientId"
            value={formData.recipientId}
            onChange={handleInputChange}
            options={activeEmployees}
            placeholder="Select an employee"
            error={errors.recipientId}
            required
          />
          
          {selectedRecipient && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                {selectedRecipient.firstName[0]}{selectedRecipient.lastName[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {selectedRecipient.firstName} {selectedRecipient.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedRecipient.role} • {selectedRecipient.department}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Recognition Category */}
        <Card title="What are you recognizing them for?">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryOptions.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.category === category.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-2 ${
                    formData.category === category.value ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.category === category.value ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {category.label}
                  </p>
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p className="mt-2 text-sm text-red-600">{errors.category}</p>
          )}
        </Card>

        {/* Message Templates */}
        {formData.category && (
          <Card title="Quick Templates">
            <div className="space-y-2">
              {recognitionTemplates
                .filter(t => t.category === formData.category)
                .map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm text-gray-700">{template.message}</p>
                  </button>
                ))}
            </div>
          </Card>
        )}

        {/* Recognition Message */}
        <Card title="Write your message">
          <TextArea
            label={t('engagement.message')}
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Share why you're recognizing this person..."
            rows={4}
            error={errors.message}
            required
          />
          
          <div className="mt-4">
            <Select
              label="Company Value"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              options={valueOptions}
              placeholder="Select the value they exemplified"
              error={errors.value}
              required
            />
          </div>

          <div className="mt-4 flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Share this recognition publicly with the team
            </label>
          </div>
        </Card>

        {/* Preview */}
        {formData.recipientId && formData.category && formData.message && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* FIX: Correctly access the icon component and render it only if it exists */}
                  {(() => {
                    const Icon = getSelectedCategory()?.icon;
                    return Icon ? <Icon className="w-6 h-6 text-yellow-600" /> : null;
                  })()}
                  <div>
                    <p className="font-semibold text-gray-800">
                      {selectedRecipient?.firstName} {selectedRecipient?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {categoryOptions.find(c => c.value === formData.category)?.label}
                    </p>
                  </div>
                </div>
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
              
              <p className="text-gray-700 italic">"{formData.message}"</p>
              
              <div className="flex items-center justify-between pt-3 border-t border-yellow-200">
                <span className="text-sm text-gray-600">
                  Value: {valueOptions.find(v => v.value === formData.value)?.label}
                </span>
                <span className="text-sm text-gray-600">
                  {formData.isPublic ? 'Public Recognition' : 'Private Recognition'}
                </span>
              </div>
            </div>
          </Card>
        )}

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
            <Award className="w-4 h-4 mr-2" />
            {isLoading ? t('common.loading') : 'Send Recognition'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RecognitionForm;