import React, { useState, useCallback } from 'react'; // Added useCallback
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Megaphone, Calendar, Users, AlertCircle, Save } from 'lucide-react'; // Added Save icon
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';

const AnnouncementForm = () => {
  const { 
    setCurrentPage,
    showMessage,
    postData, // For sending new announcement data to backend
    fetchAnnouncements // To re-fetch announcements after creation
  } = useHRMS();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 'normal',
    audience: 'all',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });

  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false); // New loading state for submission

  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'policy', label: 'Policy Update' },
    { value: 'event', label: 'Event' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'holiday', label: 'Holiday Notice' },
    { value: 'benefits', label: 'Benefits' },
    { value: 'training', label: 'Training' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const audienceOptions = [
    { value: 'all', label: 'All Employees' },
    { value: 'department', label: 'Specific Department' },
    { value: 'management', label: 'Management Only' },
    { value: 'new_employees', label: 'New Employees' }
  ];

  const announcementTemplates = [
    {
      title: 'Welcome New Team Member',
      content: 'We are excited to welcome [Name] to our team as [Position]. [Name] brings [experience] and will be working with the [Department] team. Please join us in making them feel welcome!',
      category: 'general'
    },
    {
      title: 'Office Closure Notice',
      content: 'Please note that our office will be closed on [Date] for [Reason]. Regular business hours will resume on [Date]. If you have any urgent matters, please contact [Contact Person].',
      category: 'holiday'
    },
    {
      title: 'Policy Update',
      content: 'We have updated our [Policy Name] policy effective [Date]. The key changes include: [Changes]. Please review the full policy document available in the employee portal.',
      category: 'policy'
    }
  ];

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleTemplateSelect = useCallback((template) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      content: template.content,
      category: template.category
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title) {
      newErrors.title = 'Please enter a title';
    }
    if (!formData.content) {
      newErrors.content = 'Please enter content';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Validate dates
    if (formData.expiryDate && formData.expiryDate <= formData.publishDate) {
      newErrors.expiryDate = 'Expiry date must be after publish date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading true

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    const payload = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      priority: formData.priority,
      audience: formData.audience,
      publishDate: formData.publishDate,
      expiryDate: formData.expiryDate || null,
      author: 'HR Team', // In real app, this would be the logged-in user's name
      isActive: true // Default to active
    };

    const result = await postData('/announcements', payload, 'Announcement published successfully', 'Failed to publish announcement');
    
    if (result) {
      await fetchAnnouncements(); // Re-fetch announcements to update the main page
      setCurrentPage('engagement'); // Navigate back
    }
    
    setIsLoading(false); // Set loading false
  }, [formData, validateForm, postData, fetchAnnouncements, setCurrentPage, showMessage]);

  const handleCancel = useCallback(() => {
    setCurrentPage('engagement');
  }, [setCurrentPage]);

  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('engagement.createAnnouncement')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Templates */}
        <Card title="Quick Templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {announcementTemplates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleTemplateSelect(template)}
                className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-sm text-gray-800">{template.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {categoryOptions.find(c => c.value === template.category)?.label}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Announcement Details */}
        <Card title="Announcement Details">
          <div className="space-y-4">
            <Input
              label={t('engagement.announcementTitle')}
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter announcement title"
              error={errors.title}
              required
            />

            <TextArea
              label={t('engagement.content')}
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Write your announcement here..."
              rows={6}
              error={errors.content}
              required
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

            <Select
              label="Target Audience"
              name="audience"
              value={formData.audience}
              onChange={handleInputChange}
              options={audienceOptions}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Publish Date"
                name="publishDate"
                type="date"
                value={formData.publishDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />

              <Input
                label="Expiry Date (Optional)"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleInputChange}
                error={errors.expiryDate}
                min={formData.publishDate}
              />
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
            <Button
              type="button"
              onClick={() => setPreview(!preview)}
              variant="outline"
              size="small"
            >
              {preview ? 'Edit' : 'Preview'}
            </Button>
          </div>

          {preview ? (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{formData.title || 'Announcement Title'}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(formData.publishDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {audienceOptions.find(a => a.value === formData.audience)?.label}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(formData.priority)}`}>
                  {priorityOptions.find(p => p.value === formData.priority)?.label}
                </span>
              </div>
              
              <p className="text-gray-700 whitespace-pre-wrap">
                {formData.content || 'Announcement content will appear here...'}
              </p>
              
              <div className="pt-3 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Category: {categoryOptions.find(c => c.value === formData.category)?.label || 'Not selected'}
                </span>
                <span className="text-sm text-gray-500">By HR Team</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Fill in the form above and click "Preview" to see how your announcement will appear.
            </p>
          )}
        </Card>

        {/* Priority Notice */}
        {formData.priority === 'urgent' && (
          <Card className="bg-red-50 border-red-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Urgent Announcement</p>
                <p>This announcement will be highlighted and sent as an immediate notification to all selected recipients.</p>
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
            <Megaphone className="w-4 h-4 mr-2" />
            {isLoading ? t('common.loading') : 'Publish Announcement'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementForm;