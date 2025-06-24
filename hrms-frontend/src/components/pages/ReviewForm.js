import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
    setCurrentPage,
    showMessage,
    postData, // For sending new review data to backend
    fetchReviews, // To re-fetch reviews after creation
    fetchData // To fetch goals for linking
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
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const [allGoals, setAllGoals] = useState([]); // To store all goals for linking

  // Fetch all goals when component mounts to populate linked goals options
  useEffect(() => {
    const loadGoals = async () => {
      const fetchedGoals = await fetchData('/goals');
      if (fetchedGoals) {
        setAllGoals(fetchedGoals);
      }
    };
    loadGoals();
  }, [fetchData]);

  const activeEmployees = useMemo(() => employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    })), [employees]);

  const reviewPeriods = [
    { value: 'Q1-2025', label: 'Q1 2025' },
    { value: 'Q2-2025', label: 'Q2 2025' },
    { value: 'Annual-2024', label: 'Annual 2024' },
    { value: 'Mid-Year-2025', label: 'Mid-Year 2025' }
  ];

  // Get goals for selected employee to show in the "Related Goals" section
  const employeeGoals = useMemo(() => {
    if (!formData.employeeId) return [];
    return allGoals.filter(goal => goal.employeeId === formData.employeeId);
  }, [allGoals, formData.employeeId]);

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

  const handleRatingChange = useCallback((category, rating) => {
    setFormData(prev => {
      const updatedRatings = { ...prev, [category]: rating };
      
      // Calculate overall rating if not directly setting it
      if (category !== 'overallRating') {
        const ratingsArray = [
          updatedRatings.performanceRating,
          updatedRatings.communicationRating,
          updatedRatings.teamworkRating,
          updatedRatings.innovationRating
        ].filter(r => r > 0); // Only consider ratings that have been set
        
        if (ratingsArray.length > 0) {
          const average = ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length;
          updatedRatings.overallRating = Math.round(average * 10) / 10;
        } else {
          updatedRatings.overallRating = 0;
        }
      }
      return updatedRatings;
    });
  }, []);

  const handleGoalToggle = useCallback((goalId) => {
    setFormData(prev => ({
      ...prev,
      linkedGoals: prev.linkedGoals.includes(goalId)
        ? prev.linkedGoals.filter(id => id !== goalId)
        : [...prev.linkedGoals, goalId]
    }));
  }, []);

  const validateForm = useCallback(() => {
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
    // Check if at least one specific rating is provided, or overall is > 0
    if (formData.overallRating === 0 &&
        formData.performanceRating === 0 &&
        formData.communicationRating === 0 &&
        formData.teamworkRating === 0 &&
        formData.innovationRating === 0) {
      newErrors.rating = 'Please provide ratings';
    }
    if (!formData.comments) {
      newErrors.comments = 'Please provide overall comments';
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
      employeeId: formData.employeeId,
      reviewer: formData.reviewer,
      reviewPeriod: formData.reviewPeriod,
      rating: formData.overallRating, // Overall rating
      ratings: { // Detailed ratings
        performance: formData.performanceRating,
        communication: formData.communicationRating,
        teamwork: formData.teamworkRating,
        innovation: formData.innovationRating
      },
      strengths: formData.strengths,
      improvements: formData.improvements,
      comments: formData.comments,
      linkedGoals: formData.linkedGoals
      // reviewDate will be set by backend
    };

    const result = await postData('/reviews', payload, 'Performance review submitted successfully', 'Failed to submit review');
    
    if (result) {
      await fetchReviews(); // Re-fetch reviews to update the PerformanceManagement list
      setCurrentPage('performance'); // Navigate back
    }
    
    setIsLoading(false); // Set loading false
  }, [formData, validateForm, postData, fetchReviews, setCurrentPage, showMessage]);

  const handleCancel = useCallback(() => {
    setCurrentPage('performance');
  }, [setCurrentPage]);

  const RatingStars = ({ rating, onRatingChange, category, label }) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
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
            {rating > 0 ? `${rating}.0` : '0.0'}
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
              label={t('onboarding.employee')}
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
                    {formData.overallRating > 0 ? formData.overallRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-gray-600">/ 5.0</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Linked Goals */}
        {employeeGoals.length > 0 && (
          <Card title={t('performance.relatedGoals')}>
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
                      Status: {t(`common.${goal.status.replace(/\s/g, '').toLowerCase()}`)} • Due: {new Date(goal.dueDate).toLocaleDateString()}
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
          <Button type="submit" disabled={isLoading}>
            <Award className="w-4 h-4 mr-2" />
            {isLoading ? t('common.loading') : 'Submit Review'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;