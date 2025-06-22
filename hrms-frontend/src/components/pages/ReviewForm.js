import React, { useState, useMemo } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Award, Star, Target, User, MessageSquare } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';

const ReviewForm = () => {
  const { 
    employees, 
    goals, 
    reviews, 
    setReviews, 
    setCurrentPage,
    showMessage 
  } = useHRMS();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    employeeId: '',
    reviewer: '',
    reviewPeriod: '',
    overallRating: 0,
    performanceRating: 0,
    communicationRating: 0,
    teamworkRating: 0,
    innovationRating: 0,
    strengths: '',
    improvements: '',
    comments: '',
    linkedGoals: []
  });

  const [errors, setErrors] = useState({});

  const activeEmployees = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    }));

  const reviewPeriods = [
    { value: 'Q1-2025', label: 'Q1 2025' },
    { value: 'Q2-2025', label: 'Q2 2025' },
    { value: 'Annual-2024', label: 'Annual 2024' },
    { value: 'Mid-Year-2025', label: 'Mid-Year 2025' }
  ];

  // Get goals for selected employee
  const employeeGoals = useMemo(() => {
    if (!formData.employeeId) return [];
    return goals.filter(goal => goal.employeeId === formData.employeeId);
  }, [goals, formData.employeeId]);

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

  const handleRatingChange = (category, rating) => {
    setFormData(prev => ({
      ...prev,
      [category]: rating
    }));
    
    // Calculate overall rating
    if (category !== 'overallRating') {
      const ratings = [
        category === 'performanceRating' ? rating : formData.performanceRating,
        category === 'communicationRating' ? rating : formData.communicationRating,
        category === 'teamworkRating' ? rating : formData.teamworkRating,
        category === 'innovationRating' ? rating : formData.innovationRating
      ].filter(r => r > 0);
      
      if (ratings.length > 0) {
        const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        setFormData(prev => ({
          ...prev,
          overallRating: Math.round(average * 10) / 10
        }));
      }
    }
  };

  const handleGoalToggle = (goalId) => {
    setFormData(prev => ({
      ...prev,
      linkedGoals: prev.linkedGoals.includes(goalId)
        ? prev.linkedGoals.filter(id => id !== goalId)
        : [...prev.linkedGoals, goalId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }
    if (!formData.reviewer) {
      newErrors.reviewer = 'Please enter reviewer name';
    }
    if (!formData.reviewPeriod) {
      newErrors.reviewPeriod = 'Please select review period';
    }
    if (formData.overallRating === 0) {
      newErrors.rating = 'Please provide ratings';
    }
    if (!formData.comments) {
      newErrors.comments = 'Please provide overall comments';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const employee = employees.find(emp => emp.id === formData.employeeId);
    
    const newReview = {
      id: `review-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      reviewDate: new Date().toISOString().split('T')[0],
      reviewer: formData.reviewer,
      reviewPeriod: formData.reviewPeriod,
      rating: formData.overallRating,
      ratings: {
        overall: formData.overallRating,
        performance: formData.performanceRating,
        communication: formData.communicationRating,
        teamwork: formData.teamworkRating,
        innovation: formData.innovationRating
      },
      strengths: formData.strengths,
      improvements: formData.improvements,
      comments: formData.comments,
      linkedGoals: formData.linkedGoals
    };

    setReviews(prev => [...prev, newReview]);
    showMessage('Performance review submitted successfully', 'success');
    setCurrentPage('performance');
  };

  const handleCancel = () => {
    setCurrentPage('performance');
  };

  const RatingStars = ({ rating, onRatingChange, category, label }) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(category, star)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                } hover:text-yellow-400 transition-colors`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {rating > 0 && `${rating}.0`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('performance.conductReview')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card title="Review Information">
          <div className="space-y-4">
            <Select
              label="Employee"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              options={activeEmployees}
              placeholder="Select employee to review"
              error={errors.employeeId}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Reviewer Name"
                name="reviewer"
                value={formData.reviewer}
                onChange={handleInputChange}
                placeholder="Enter your name"
                error={errors.reviewer}
                required
              />

              <Select
                label="Review Period"
                name="reviewPeriod"
                value={formData.reviewPeriod}
                onChange={handleInputChange}
                options={reviewPeriods}
                placeholder="Select period"
                error={errors.reviewPeriod}
                required
              />
            </div>
          </div>
        </Card>

        {/* Ratings */}
        <Card title="Performance Ratings">
          <div className="space-y-6">
            {errors.rating && (
              <p className="text-sm text-red-600">{errors.rating}</p>
            )}
            
            <RatingStars
              rating={formData.performanceRating}
              onRatingChange={handleRatingChange}
              category="performanceRating"
              label="Work Performance"
            />
            
            <RatingStars
              rating={formData.communicationRating}
              onRatingChange={handleRatingChange}
              category="communicationRating"
              label="Communication Skills"
            />
            
            <RatingStars
              rating={formData.teamworkRating}
              onRatingChange={handleRatingChange}
              category="teamworkRating"
              label="Teamwork & Collaboration"
            />
            
            <RatingStars
              rating={formData.innovationRating}
              onRatingChange={handleRatingChange}
              category="innovationRating"
              label="Innovation & Initiative"
            />

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-gray-800">Overall Rating</p>
                <div className="flex items-center space-x-2">
                  <Star className="w-6 h-6 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold text-gray-800">
                    {formData.overallRating || '0.0'}
                  </span>
                  <span className="text-gray-600">/ 5.0</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Linked Goals */}
        {employeeGoals.length > 0 && (
          <Card title="Related Goals">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Select goals that were evaluated in this review:
              </p>
              {employeeGoals.map(goal => (
                <label
                  key={goal.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.linkedGoals.includes(goal.id)}
                    onChange={() => handleGoalToggle(goal.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{goal.objective}</p>
                    <p className="text-sm text-gray-600">
                      Status: {goal.status} • Due: {new Date(goal.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        )}

        {/* Feedback */}
        <Card title="Detailed Feedback">
          <div className="space-y-4">
            <TextArea
              label="Key Strengths"
              name="strengths"
              value={formData.strengths}
              onChange={handleInputChange}
              placeholder="What are the employee's main strengths?"
              rows={3}
            />

            <TextArea
              label="Areas for Improvement"
              name="improvements"
              value={formData.improvements}
              onChange={handleInputChange}
              placeholder="What areas could be improved?"
              rows={3}
            />

            <TextArea
              label="Overall Comments"
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              placeholder="Provide overall feedback and recommendations"
              rows={4}
              error={errors.comments}
              required
            />
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
          <Button type="submit">
            <Award className="w-4 h-4 mr-2" />
            Submit Review
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;