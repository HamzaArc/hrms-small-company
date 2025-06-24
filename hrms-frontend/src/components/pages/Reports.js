import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Users, Target, Award, FileText, Clock, TrendingUp, 
  CheckCircle, AlertCircle, Calendar, BarChart2, Download, Filter, 
  Megaphone, Star 
} from 'lucide-react'; 
import Button from '../common/Button'; 
import Card from '../common/Card';
import Select from '../common/Select'; 
import Input from '../common/Input'; 

const Reports = () => {
  const { 
    employees: globalEmployees, 
    goals: globalGoals,
    reviews: globalReviews,
    documents: globalDocuments, 
    timesheets: globalTimesheets, 
    leaveRequests: globalLeaveRequests, 
    announcements: globalAnnouncements, 
    recognitions: globalRecognitions, 
    onboardingTasks: globalOnboardingTasks, 
    showMessage,
    fetchEmployees, 
    fetchGoals,
    fetchReviews,
    fetchDocuments,
    fetchTimesheets,
    fetchLeaveRequests,
    fetchAnnouncements,
    fetchRecognitions,
    fetchOnboardingTasks 
  } = useHRMS();
  const { t } = useLanguage();

  const [employees, setEmployees] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [onboardingTasks, setOnboardingTasks] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month'); 

  const reportTypes = useMemo(() => [
    { value: 'overview', label: t('reports.overview') },
    { value: 'employees', label: t('reports.employeeAnalytics') },
    { value: 'leave', label: t('reports.leaveAnalysis') },
    { value: 'timesheet', label: t('reports.timesheetReport') },
    { value: 'performance', label: t('reports.performanceMetrics') },
    { value: 'engagement', label: t('reports.engagementReport') }
  ], [t]);

  const dateRangeOptions = useMemo(() => [
    { value: 'week', label: t('reports.last7Days') },
    { value: 'month', label: t('reports.last30Days') },
    { value: 'quarter', label: t('reports.lastQuarter') },
    { value: 'year', label: t('reports.lastYear') }
  ], [t]);


  useEffect(() => {
    const loadAllDataForReports = async () => {
      setIsLoading(true);
      // Ensure all fetch functions are defined before calling them
      if (
        fetchEmployees && fetchGoals && fetchReviews && fetchDocuments && 
        fetchTimesheets && fetchLeaveRequests && fetchAnnouncements && 
        fetchRecognitions && fetchOnboardingTasks
      ) {
        await Promise.all([
          fetchEmployees(),
          fetchGoals(),
          fetchReviews(),
          fetchDocuments(),
          fetchTimesheets(),
          fetchLeaveRequests(),
          fetchAnnouncements(),
          fetchRecognitions(),
          fetchOnboardingTasks()
        ]);
      } else {
        console.warn("One or more fetch functions are not yet available. Retrying on next render or check HRMSContext setup.");
        // Could also introduce a retry mechanism or a more explicit loading sequence here
      }
      setIsLoading(false);
    };

    if (true) { // This useEffect always runs if dependencies change. Removed user?.tenantId check here.
      loadAllDataForReports();
    }
  }, [
    fetchEmployees, fetchGoals, fetchReviews, fetchDocuments, 
    fetchTimesheets, fetchLeaveRequests, fetchAnnouncements, fetchRecognitions,
    fetchOnboardingTasks // All fetchers from useHRMS context
  ]);

  useEffect(() => {
    if (globalEmployees) setEmployees(globalEmployees);
    if (globalGoals) setGoals(globalGoals);
    if (globalReviews) setReviews(globalReviews);
    if (globalDocuments) setDocuments(globalDocuments);
    if (globalTimesheets) setTimesheets(globalTimesheets);
    if (globalLeaveRequests) setLeaveRequests(globalLeaveRequests);
    if (globalAnnouncements) setAnnouncements(globalAnnouncements);
    if (globalRecognitions) setRecognitions(globalRecognitions);
    if (globalOnboardingTasks) setOnboardingTasks(globalOnboardingTasks); 
  }, [
    globalEmployees, globalGoals, globalReviews, globalDocuments, globalTimesheets, 
    globalLeaveRequests, globalAnnouncements, globalRecognitions, globalOnboardingTasks
  ]);

  const getDocumentStatus = useCallback((doc) => {
    if (!doc.expiryDate) return doc.status || 'Active';

    const today = new Date();
    today.setHours(0,0,0,0);
    const expiryDate = new Date(doc.expiryDate);
    expiryDate.setHours(0,0,0,0);
    
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays <= 90) return 'Expiring Soon';
    return doc.status || 'Active';
  }, []); 

  const metrics = useMemo(() => {
    const now = new Date();
    const activeEmployees = employees.filter(emp => emp.status === 'Active');
    
    const departmentCounts = {};
    employees.forEach(emp => { 
      departmentCounts[emp.department] = (departmentCounts[emp.department] || 0) + 1;
    });

    const leavesByType = {};
    const leavesByStatus = {};
    let totalLeaveRequests = 0;
    let pendingLeaveRequests = 0;

    leaveRequests.forEach(leave => { 
        totalLeaveRequests++;
        leavesByType[leave.type] = (leavesByType[leave.type] || 0) + 1;
        leavesByStatus[leave.status] = (leavesByStatus[leave.status] || 0) + 1;
        if (leave.status === 'Pending') {
            pendingLeaveRequests++;
        }
    });

    const totalHoursLogged = timesheets.reduce((sum, ts) => sum + (parseFloat(ts.hours) || 0), 0); 
    const avgHoursPerEntry = timesheets.length > 0 ? (totalHoursLogged / timesheets.length).toFixed(1) : 0;
    
    const hoursByEmployee = {};
    timesheets.forEach(ts => {
      const employee = employees.find(emp => emp.id === ts.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
      hoursByEmployee[employeeName] = (hoursByEmployee[employeeName] || 0) + (parseFloat(ts.hours) || 0);
    });

    const goalsByStatus = {};
    goals.forEach(goal => {
      goalsByStatus[goal.status] = (goalsByStatus[goal.status] || 0) + 1;
    });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (parseFloat(r.rating) || 0), 0) / reviews.length).toFixed(1)
      : 'N/A'; 

    const overdueGoals = goals.filter(goal => {
        const dueDate = new Date(goal.dueDate);
        return dueDate < new Date() && goal.status !== 'Completed';
    }).length;

    const overdueDocuments = documents.filter(doc => getDocumentStatus(doc) === 'Expired').length;
    const expiringSoonDocumentsList = documents.filter(doc => getDocumentStatus(doc) === 'Expiring Soon'); 
    const totalDocuments = documents.length;

    const totalOnboardingTasks = onboardingTasks.length; 
    const completedOnboardingTasks = onboardingTasks.filter(t => t.completed).length;
    const onboardingCompletionRate = totalOnboardingTasks > 0
      ? ((completedOnboardingTasks / totalOnboardingTasks) * 100).toFixed(1)
      : 'N/A';
    
    const announcementsThisMonth = announcements.filter(a => {
      const date = new Date(a.publishDate); 
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const recognitionsThisMonth = recognitions.filter(r => {
      const date = new Date(r.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    return {
      employees: {
        total: employees.length,
        active: activeEmployees.length,
        inactive: employees.length - activeEmployees.length,
        byDepartment: departmentCounts,
        newHires: employees.filter(emp => {
          const hireDate = new Date(emp.hireDate);
          const monthsAgo = new Date(now);
          monthsAgo.setMonth(monthsAgo.getMonth() - 1); 
          return hireDate > monthsAgo;
        }).length
      },
      leave: {
        total: totalLeaveRequests,
        byType: leavesByType,
        byStatus: leavesByStatus,
        pending: pendingLeaveRequests,
        utilization: (employees.length > 0 && leaveRequests.length > 0) ? 
            ((leaveRequests.filter(lr => lr.status === 'Approved').reduce((sum, lr) => {
                const start = new Date(lr.startDate);
                const end = new Date(lr.endDate);
                return sum + ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1);
            }, 0)) / (employees.length * 20)) * 100 || 0 : 0 
      },
      timesheet: {
        totalHours: totalHoursLogged,
        avgHoursPerEntry,
        hoursByEmployee,
        entriesCount: timesheets.length
      },
      performance: {
        totalGoals: goals.length,
        goalsByStatus,
        avgRating,
        reviewsCount: reviews.length,
        completionRate: (goals.length > 0)
          ? ((goalsByStatus['Completed'] || 0) / goals.length * 100).toFixed(1)
          : 'N/A', 
        overdueGoals: overdueGoals
      },
      documents: {
        total: totalDocuments,
        overdue: overdueDocuments,
        expiringSoon: expiringSoonDocumentsList.length,
        expiringList: expiringSoonDocumentsList 
      },
      onboarding: { 
        totalTasks: totalOnboardingTasks, 
        completedTasks: completedOnboardingTasks,
        completionRate: onboardingCompletionRate 
      },
      engagement: {
        announcements: announcements.length,
        recognitions: recognitions.length,
        thisMonth: {
          announcements: announcementsThisMonth,
          recognitions: recognitionsThisMonth
        }
      }
    };
  }, [employees, goals, reviews, documents, timesheets, leaveRequests, announcements, recognitions, onboardingTasks, getDocumentStatus]); 


  const BarChart = ({ data }) => { 
    const values = Object.values(data).filter(val => typeof val === 'number');
    const maxValue = values.length > 0 ? Math.max(...values) : 1; 
    
    if (Object.keys(data).length === 0) return <p className="text-center text-gray-500">{t('reports.noDataForChart')}</p>; 
    
    return (
      <div className="space-y-3">
        {Object.entries(data).map(([label, value]) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const PieChartSimple = ({ data }) => {
    const total = Object.values(data).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500'];
    
    if (total === 0) return <p className="text-center text-gray-500">{t('reports.noDataForChart')}</p>; 

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {Object.entries(data).map(([label, value], index) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
              <span className="text-sm font-medium">
                {value} ({total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };


  const renderReportContent = () => {
    if (isLoading) {
        return <Card><p className="text-center">{t('common.loading')}</p></Card>;
    }
    
    const metricsData = metrics;

    switch (selectedReport) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.totalEmployees')}</p>
                    <p className="text-2xl font-bold text-gray-800">{metricsData.employees.total}</p>
                    <p className="text-xs text-green-600">
                        {t('reports.newHires', { count: metricsData.employees.newHires })}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.pendingApproval')}</p>
                    <p className="text-2xl font-bold text-gray-800">{metricsData.leave.pending}</p>
                    <p className="text-xs text-gray-600">{t('reports.requiresAttention')}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.totalHoursLogged')}</p>
                    <p className="text-2xl font-bold text-gray-800">{metricsData.timesheet.totalHours.toFixed(1)}</p>
                    <p className="text-xs text-gray-600">{t('reports.avgHoursPerEntry', { avg: metricsData.timesheet.avgHoursPerEntry })}</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.avgRating')}</p>
                    <p className="text-2xl font-bold text-gray-800">{metricsData.performance.avgRating}/5</p>
                    <p className="text-xs text-gray-600">{t('reports.reviews', { count: metricsData.performance.reviewsCount })}</p>
                  </div>
                  <Award className="w-8 h-8 text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title={t('reports.employeesByDepartment')}>
                <BarChart data={metricsData.employees.byDepartment} />
              </Card>
              
              <Card title={t('reports.goalsByStatus')}>
                <PieChartSimple data={metricsData.performance.goalsByStatus} />
              </Card>
              
              <Card title={t('reports.onboardingProgress')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('reports.completionRate')}</span>
                    <span className="text-lg font-bold">
                        {metricsData.onboarding.totalTasks !== 'N/A' ? `${metricsData.onboarding.completionRate}%` : t('common.na')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${metricsData.onboarding.completionRate || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{metricsData.onboarding.completedTasks} {t('common.completed')}</span>
                    <span>{metricsData.onboarding.totalTasks} {t('reports.totalTasks')}</span>
                  </div>
                </div>
              </Card>
              
              <Card title={t('reports.documentExpiry')}>
                {metricsData.documents.overdue > 0 || metricsData.documents.expiringList.length > 0 ? (
                    <div className="space-y-2">
                      {metricsData.documents.overdue > 0 && (
                          <div className="flex items-center justify-between text-sm text-red-700 font-medium">
                              <span>{metricsData.documents.overdue} {t('reports.overdueDocs')}</span>
                              <AlertCircle className="w-4 h-4 text-red-700" />
                          </div>
                      )}
                      {metricsData.documents.expiringList.slice(0, 5).map((doc, index) => (
                        <div key={doc.id || index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{doc.employee?.firstName} {doc.employee?.lastName} - {doc.name}</span>
                          <span className="text-yellow-700 font-medium">
                            {t('reports.expires')}: {new Date(doc.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {(metricsData.documents.overdue + metricsData.documents.expiringList.length) > 5 && (
                        <p className="text-sm text-yellow-700 font-medium mt-2">
                          +{metricsData.documents.overdue + metricsData.documents.expiringList.length - 5} {t('reports.moreDocsExpiring')}
                        </p>
                      )}
                    </div>
                ) : (
                    <p className="text-center text-gray-700 py-4">{t('reports.noExpiringDocs')}</p>
                )}
            </Card>
            </div>
          </div>
        );

      case 'employees':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.employees.total}</p>
                  <p className="text-sm text-gray-600">{t('reports.totalEmployees')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.employees.active}</p>
                  <p className="text-sm text-gray-600">{t('common.active')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.employees.newHires}</p>
                  <p className="text-sm text-gray-600">{t('reports.newHires', { count: metricsData.employees.newHires })}</p>
                </div>
              </Card>
            </div>

            <Card title={t('reports.employeesByDepartment')}>
              <BarChart data={metricsData.employees.byDepartment} />
            </Card>

            <Card title={t('reports.employeeStatusOverview')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PieChartSimple 
                  data={{ 
                    [t('common.active')]: metricsData.employees.active, 
                    [t('common.inactive')]: metricsData.employees.inactive 
                  }} 
                />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">{t('reports.departmentDetails')}</h4>
                  <div className="space-y-2">
                    {Object.entries(metricsData.employees.byDepartment).map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{dept}</span>
                        <span className="text-sm font-medium">{t('reports.employees', { count })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'leave':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.leave.total}</p>
                  <p className="text-sm text-gray-600">{t('reports.totalRequests')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{metricsData.leave.pending}</p>
                  <p className="text-sm text-gray-600">{t('reports.pendingApproval')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {metricsData.leave.byStatus['Approved'] || 0}
                  </p>
                  <p className="text-sm text-gray-600">{t('leave.approved')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {metricsData.leave.byStatus['Rejected'] || 0}
                  </p>
                  <p className="text-sm text-gray-600">{t('leave.rejected')}</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title={t('reports.leaveTypesDistribution')}>
                <PieChartSimple data={metricsData.leave.byType} />
              </Card>
              
              <Card title={t('reports.leaveStatusOverview')}>
                <BarChart data={metricsData.leave.byStatus} />
              </Card>
            </div>

            <Card title={t('reports.leaveUtilization')}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('reports.averageUtilization')}</span>
                  <span className="text-lg font-bold">{metricsData.leave.utilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${metricsData.leave.utilization}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {t('reports.leaveUtilizationDesc')}
                </p>
              </div>
            </Card>
          </div>
        );

      case 'timesheet':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.timesheet.totalHours.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">{t('reports.totalHoursLogged')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.timesheet.entriesCount}</p>
                  <p className="text-sm text-gray-600">{t('reports.totalEntries')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.timesheet.avgHoursPerEntry}</p>
                  <p className="text-sm text-gray-600">{t('reports.avgHoursPerEntry')}</p>
                </div>
              </Card>
            </div>

            <Card title={t('reports.hoursByEmployee')}>
              <BarChart data={metricsData.timesheet.hoursByEmployee} />
            </Card>

            <Card title={t('reports.topContributors')}>
              <div className="space-y-2">
                {Object.entries(metricsData.timesheet.hoursByEmployee)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([name, hours], index) => (
                    <div key={name} className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-700">{name}</span>
                      <span className="text-sm font-bold text-gray-800">{hours.toFixed(1)} {t('reports.hours')}</span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.performance.totalGoals}</p>
                  <p className="text-sm text-gray-600">{t('reports.totalGoals')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.performance.completionRate}%</p>
                  <p className="text-sm text-gray-600">{t('reports.completionRate')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.performance.avgRating}</p>
                  <p className="text-sm text-gray-600">{t('reports.avgRating')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.performance.reviewsCount}</p>
                  <p className="text-sm text-gray-600">{t('reports.reviewsConducted')}</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title={t('reports.goalsByStatus')}>
                <PieChartSimple data={metricsData.performance.goalsByStatus} />
              </Card>
              
              <Card title={t('reports.performanceOverview')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span className="text-sm text-gray-700">{t('reports.goalsCompleted')}</span>
                    <span className="text-lg font-bold text-green-600">
                      {metricsData.performance.goalsByStatus['Completed'] || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span className="text-sm text-gray-700">{t('reports.goalsInProgress')}</span>
                    <span className="text-lg font-bold text-blue-600">
                      {metricsData.performance.goalsByStatus['In Progress'] || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <span className="text-sm text-gray-700">{t('common.notStarted')}</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {metricsData.performance.goalsByStatus['Not Started'] || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <span className="text-sm text-gray-700">{t('common.overdue')}</span>
                    <span className="text-lg font-bold text-red-600">
                      {metricsData.performance.overdueGoals}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <Card title={t('reports.ratingDistribution')}>
              <div className="text-center py-8">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32">
                    <circle
                      className="text-gray-200"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="56"
                      cx="64"
                      cy="64"
                    />
                    <circle
                      className="text-yellow-500"
                      strokeWidth="10"
                      strokeDasharray={351.86}
                      strokeDashoffset={351.86 * (1 - (parseFloat(metricsData.performance.avgRating) / 5))}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="56"
                      cx="64"
                      cy="64"
                      transform="rotate(-90 64 64)"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold">{metricsData.performance.avgRating}</span>
                </div>
                <p className="text-sm text-gray-600 mt-4">{t('reports.overallPerformanceRating')}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {t('reports.ratingBasedOnReviews', { count: metricsData.performance.reviewsCount })}
                </p>
              </div>
            </Card>
          </div>
        );

      case 'engagement':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.engagement.announcements}</p>
                  <p className="text-sm text-gray-600">{t('engagement.totalAnnouncements')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metricsData.engagement.recognitions}</p>
                  <p className="text-sm text-gray-600">{t('engagement.totalRecognitions')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">
                    {metricsData.engagement.thisMonth.announcements}
                  </p>
                  <p className="text-sm text-gray-600">{t('reports.announcementsThisMonth')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">
                    {metricsData.engagement.thisMonth.recognitions}
                  </p>
                  <p className="text-sm text-gray-600">{t('reports.recognitionsThisMonth')}</p>
                </div>
              </Card>
            </div>

            <Card title={t('reports.engagementTrends')}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('reports.monthlyActivity')}</span>
                  <span className="text-lg font-bold">
                    {((metricsData.engagement.thisMonth.announcements || 0) + (metricsData.engagement.thisMonth.recognitions || 0))} {t('reports.items')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <Megaphone className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">
                      {metricsData.engagement.thisMonth.announcements}
                    </p>
                    <p className="text-sm text-blue-600">{t('engagement.announcements')}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-800">
                      {metricsData.engagement.thisMonth.recognitions}
                    </p>
                    <p className="text-sm text-yellow-600">{t('engagement.recognitions')}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title={t('reports.engagementScore')}>
              <div className="text-center py-8">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32">
                    <circle
                      className="text-gray-200"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="56"
                      cx="64"
                      cy="64"
                    />
                    <circle
                      className="text-green-500"
                      strokeWidth="10"
                      strokeDasharray={351.86}
                      strokeDashoffset={351.86 * 0.25}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="56"
                      cx="64"
                      cy="64"
                      transform="rotate(-90 64 64)"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold">75%</span>
                </div>
                <p className="text-sm text-gray-600 mt-4">{t('reports.overallEngagementScore')}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {t('reports.engagementScoreDesc')}
                </p>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const handleExportReport = useCallback(() => {
    showMessage('Export report functionality is not yet implemented.', 'info');
  }, [showMessage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('reports.title')}</h1>
        <Button onClick={handleExportReport} className="mt-4 sm:mt-0">
          <Download className="w-4 h-4 mr-2" />
          {t('reports.exportReports')}
        </Button>
      </div>

      {/* Report Controls */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Select
              label={t('reports.selectReport')}
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              options={reportTypes}
              className="w-48 min-w-[200px]" 
            />
            <Select
              label={t('reports.selectDateRange')}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={dateRangeOptions}
              className="w-40"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="small">
              <Filter className="w-4 h-4 mr-2" />
              {t('reports.moreFilters')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default Reports;