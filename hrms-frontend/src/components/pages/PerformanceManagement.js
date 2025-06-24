import React, { useState, useMemo, useEffect, useCallback } from 'react'; // Added useCallback
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Target, Plus, Award, TrendingUp, Users, 
  Clock, CheckCircle, AlertCircle, BarChart3 
} from 'lucide-react';
import Button from '../common/Button';
import Select from '../common/Select';
import Card from '../common/Card';

const PerformanceManagement = () => {
  const { 
    employees,
    showMessage,
    setCurrentPage,
    fetchData, // For fetching data
    putData, // For updating goal status
    goals: globalGoals, // Use context's fetched goals as base
    reviews: globalReviews // Use context's fetched reviews as base
  } = useHRMS();
  const { t } = useLanguage();

  const [goals, setGoals] = useState([]); // Local state for filtered goals
  const [reviews, setReviews] = useState([]); // Local state for filtered reviews
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('goals'); // goals or reviews
  const [isLoading, setIsLoading] = useState(true);

  // Effect to fetch goals and reviews when component mounts or relevant data changes
  useEffect(() => {
    const loadPerformanceData = async () => {
      setIsLoading(true);
      const fetchedGoals = await fetchData('/goals');
      if (fetchedGoals) {
        setGoals(fetchedGoals);
      }
      const fetchedReviews = await fetchData('/reviews');
      if (fetchedReviews) {
        setReviews(fetchedReviews);
      }
      setIsLoading(false);
    };
    loadPerformanceData();
  }, [fetchData]); // Re-fetch when fetchData (from context) changes

  const employeeOptions = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    }));

  const statusOptions = [
    { value: 'Not Started', label: t('common.notStarted') || 'Not Started' }, // Assuming these common translations exist
    { value: 'In Progress', label: t('common.inProgress') || 'In Progress' },
    { value: 'Completed', label: t('common.completed') || 'Completed' },
    { value: 'Overdue', label: t('common.overdue') || 'Overdue' }
  ];

  // Filter goals (now filters the fetched 'goals' state)
  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      const matchesEmployee = !filterEmployee || goal.employeeId === filterEmployee;
      const matchesStatus = !filterStatus || goal.status === filterStatus;
      return matchesEmployee && matchesStatus;
    });
  }, [goals, filterEmployee, filterStatus]);

  // Filter reviews (now filters the fetched 'reviews' state)
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const matchesEmployee = !filterEmployee || review.employeeId === filterEmployee;
      // No status filter for reviews in current UI, but could be added
      return matchesEmployee;
    });
  }, [reviews, filterEmployee]);


  // Calculate statistics (now based on fetched 'goals' and 'reviews' states)
  const statistics = useMemo(() => {
    const stats = {
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.status === 'Completed').length,
      inProgressGoals: goals.filter(g => g.status === 'In Progress').length,
      overdueGoals: goals.filter(g => {
        const dueDate = new Date(g.dueDate);
        return dueDate < new Date() && g.status !== 'Completed';
      }).length,
      totalReviews: reviews.length,
      avgRating: reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0
    };
    
    stats.completionRate = stats.totalGoals > 0 
      ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
      : 0;
      
    return stats;
  }, [goals, reviews]);

  const handleStatusChange = useCallback(async (goalId, newStatus) => {
    const payload = { status: newStatus };
    const result = await putData(`/goals/${goalId}`, payload, 'Goal status updated successfully!');
    if (result) {
      const updatedGoals = await fetchData('/goals'); // Re-fetch to ensure consistency
      if (updatedGoals) {
        setGoals(updatedGoals);
      }
    }
  }, [putData, fetchData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (goal) => {
    if (!goal.keyResults || goal.keyResults.length === 0) return 0;
    
    // For now, this is simulated progress based on status
    // In a real app, this might depend on tracking key result completion
    switch (goal.status) {
      case 'Completed':
        return 100;
      case 'In Progress':
        return 60;
      case 'Not Started':
        return 0;
      default:
        return 30; // For overdue or other
    }
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300">★</span>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('performance.title')}</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button onClick={() => setCurrentPage('goalForm')}>
            <Plus className="w-4 h-4 mr-2" />
            {t('performance.setGoal')}
          </Button>
          <Button onClick={() => setCurrentPage('reviewForm')} variant="secondary">
            <Award className="w-4 h-4 mr-2" />
            {t('performance.conductReview')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('reports.totalGoals')}</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.totalGoals}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('reports.completionRate')}</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.completionRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('reports.overdueTasks')}</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.overdueGoals}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('reports.avgRating') || 'Avg Rating'}</p> {/* Assuming this key for reports */}
              <p className="text-2xl font-bold text-gray-800">{statistics.avgRating}</p>
            </div>
            <Award className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              onClick={() => setViewMode('goals')}
              variant={viewMode === 'goals' ? 'primary' : 'outline'}
              size="small"
            >
              {t('performance.goals')}
            </Button>
            <Button
              onClick={() => setViewMode('reviews')}
              variant={viewMode === 'reviews' ? 'primary' : 'outline'}
              size="small"
            >
              {t('performance.reviews')}
            </Button>
          </div>
          
          {viewMode === 'goals' && (
            <div className="flex space-x-2">
              <Select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                options={employeeOptions}
                placeholder="All Employees"
              />
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={statusOptions}
                placeholder="All Status"
              />
            </div>
          )}
        </div>
      </Card>

      {viewMode === 'goals' ? (
        /* Goals View */
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <Card><p className="text-center">{t('common.loading')}</p></Card>
          ) : filteredGoals.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500">No goals found matching filters.</p>
            </Card>
          ) : (
            filteredGoals.map(goal => (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{goal.objective}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <Users className="w-4 h-4 inline mr-1" />
                        {employees.find(emp => emp.id === goal.employeeId)?.firstName} {employees.find(emp => emp.id === goal.employeeId)?.lastName} {/* Use employees from context */}
                        <Clock className="w-4 h-4 inline ml-3 mr-1" />
                        Due: {new Date(goal.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Select
                      value={goal.status}
                      onChange={(e) => handleStatusChange(goal.id, e.target.value)}
                      options={statusOptions}
                      className="w-40"
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{calculateProgress(goal)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress(goal)}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Results */}
                  {goal.keyResults && goal.keyResults.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {t('performance.keyResults')}:
                      </p>
                      <ul className="space-y-1">
                        {goal.keyResults.map((kr, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                            <span className="text-sm text-gray-600">{kr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="flex justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                      {goal.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Reviews View */
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <Card><p className="text-center">{t('common.loading')}</p></Card>
          ) : filteredReviews.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500">No reviews found.</p>
            </Card>
          ) : (
            filteredReviews.map(review => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {employees.find(emp => emp.id === review.employeeId)?.firstName} {employees.find(emp => emp.id === review.employeeId)?.lastName} {/* Use employees from context */}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Reviewed by {review.reviewer} on {new Date(review.reviewDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>{getRatingStars(review.rating)}</div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-700">{review.comments}</p>
                  </div>

                  {review.linkedGoals && review.linkedGoals.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Linked Goals:</p>
                      <div className="flex flex-wrap gap-2">
                        {review.linkedGoals.map((goalId) => {
                          // Find the goal from the 'goals' state
                          const linkedGoal = goals.find(g => g.id === goalId);
                          return linkedGoal ? (
                            <span key={goalId} className="text-xs px-2 py-1 bg-gray-100 rounded-lg">
                              {linkedGoal.objective}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceManagement;