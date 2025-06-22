import React, { useState, useMemo } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  BarChart3, PieChart, TrendingUp, Users, Calendar,
  Clock, Target, FileText, Download, Filter, Award, 
  Star, Megaphone
} from 'lucide-react';
import Button from '../common/Button';
import Select from '../common/Select';
import Card from '../common/Card';

const Reports = () => {
  const { 
    employees, 
    leaveRequests, 
    timesheets, 
    goals, 
    reviews,
    announcements,
    recognitions,
    showMessage 
  } = useHRMS();
  const { t } = useLanguage();

  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');

  const reportTypes = [
    { value: 'overview', label: 'Overview Dashboard' },
    { value: 'employees', label: 'Employee Analytics' },
    { value: 'leave', label: 'Leave Analysis' },
    { value: 'timesheet', label: 'Timesheet Report' },
    { value: 'performance', label: 'Performance Metrics' },
    { value: 'engagement', label: 'Engagement Report' }
  ];

  const dateRangeOptions = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' }
  ];

  // Calculate various metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const activeEmployees = employees.filter(emp => emp.status === 'Active');
    
    // Employee metrics
    const departmentCounts = {};
    activeEmployees.forEach(emp => {
      departmentCounts[emp.department] = (departmentCounts[emp.department] || 0) + 1;
    });

    // Leave metrics
    const leavesByType = {};
    const leavesByStatus = {};
    leaveRequests.forEach(leave => {
      leavesByType[leave.type] = (leavesByType[leave.type] || 0) + 1;
      leavesByStatus[leave.status] = (leavesByStatus[leave.status] || 0) + 1;
    });

    // Timesheet metrics
    const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0);
    const avgHoursPerEntry = timesheets.length > 0 ? (totalHours / timesheets.length).toFixed(1) : 0;
    
    const hoursByEmployee = {};
    timesheets.forEach(ts => {
      hoursByEmployee[ts.employeeName] = (hoursByEmployee[ts.employeeName] || 0) + ts.hours;
    });

    // Performance metrics
    const goalsByStatus = {};
    goals.forEach(goal => {
      goalsByStatus[goal.status] = (goalsByStatus[goal.status] || 0) + 1;
    });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    // Document expiry
    const expiringDocuments = [];
    const threeMonthsFromNow = new Date(now);
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    employees.forEach(emp => {
      if (emp.documents) {
        emp.documents.forEach(doc => {
          if (doc.expiryDate) {
            const expiryDate = new Date(doc.expiryDate);
            if (expiryDate > now && expiryDate < threeMonthsFromNow) {
              expiringDocuments.push({
                employee: `${emp.firstName} ${emp.lastName}`,
                document: doc.name,
                expiryDate: doc.expiryDate
              });
            }
          }
        });
      }
    });

    // Onboarding metrics
    let totalOnboardingTasks = 0;
    let completedOnboardingTasks = 0;
    employees.forEach(emp => {
      if (emp.onboardingTasks) {
        totalOnboardingTasks += emp.onboardingTasks.length;
        completedOnboardingTasks += emp.onboardingTasks.filter(t => t.completed).length;
      }
    });

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
        total: leaveRequests.length,
        byType: leavesByType,
        byStatus: leavesByStatus,
        pending: leavesByStatus['Pending'] || 0,
        utilization: activeEmployees.reduce((sum, emp) => {
          const totalDays = emp.leaveBalances.vacation + emp.leaveBalances.sick + emp.leaveBalances.personal;
          const usedDays = 30 - totalDays; // Assuming 30 days total
          return sum + (usedDays / 30 * 100);
        }, 0) / activeEmployees.length
      },
      timesheet: {
        totalHours,
        avgHoursPerEntry,
        hoursByEmployee,
        entriesCount: timesheets.length
      },
      performance: {
        totalGoals: goals.length,
        goalsByStatus,
        avgRating,
        reviewsCount: reviews.length,
        completionRate: goals.length > 0 
          ? ((goalsByStatus['Completed'] || 0) / goals.length * 100).toFixed(1)
          : 0
      },
      documents: {
        expiring: expiringDocuments
      },
      onboarding: {
        totalTasks: totalOnboardingTasks,
        completedTasks: completedOnboardingTasks,
        completionRate: totalOnboardingTasks > 0
          ? ((completedOnboardingTasks / totalOnboardingTasks) * 100).toFixed(1)
          : 0
      },
      engagement: {
        announcements: announcements.length,
        recognitions: recognitions.length,
        thisMonth: {
          announcements: announcements.filter(a => {
            const date = new Date(a.date);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length,
          recognitions: recognitions.filter(r => {
            const date = new Date(r.date);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length
        }
      }
    };
  }, [employees, leaveRequests, timesheets, goals, reviews, announcements, recognitions]);

  const handleExportReport = () => {
    // Simulate export functionality
    showMessage('Report exported successfully', 'success');
  };

  // Chart components (visual representation)
  const BarChart = ({ data, title }) => {
    const maxValue = Math.max(...Object.values(data));
    
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
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

  const PieChartSimple = ({ data, title }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
    
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <div className="space-y-2">
          {Object.entries(data).map(([label, value], index) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
              <span className="text-sm font-medium">
                {value} ({((value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReport = () => {
    switch (selectedReport) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.totalEmployees')}</p>
                    <p className="text-2xl font-bold text-gray-800">{metrics.employees.total}</p>
                    <p className="text-xs text-green-600">+{metrics.employees.newHires} this month</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Leaves</p>
                    <p className="text-2xl font-bold text-gray-800">{metrics.leave.pending}</p>
                    <p className="text-xs text-gray-600">Requires attention</p>
                  </div>
                  <Calendar className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.totalHours')}</p>
                    <p className="text-2xl font-bold text-gray-800">{metrics.timesheet.totalHours}</p>
                    <p className="text-xs text-gray-600">Avg: {metrics.timesheet.avgHoursPerEntry}h/entry</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Performance</p>
                    <p className="text-2xl font-bold text-gray-800">{metrics.performance.avgRating}/5</p>
                    <p className="text-xs text-gray-600">{metrics.performance.reviewsCount} reviews</p>
                  </div>
                  <Award className="w-8 h-8 text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Department Distribution">
                <BarChart data={metrics.employees.byDepartment} />
              </Card>
              
              <Card title="Leave Requests by Type">
                <PieChartSimple data={metrics.leave.byType} />
              </Card>
              
              <Card title="Goal Status Distribution">
                <PieChartSimple data={metrics.performance.goalsByStatus} />
              </Card>
              
              <Card title="Onboarding Progress">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-lg font-bold">{metrics.onboarding.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.onboarding.completionRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{metrics.onboarding.completedTasks} completed</span>
                    <span>{metrics.onboarding.totalTasks} total tasks</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Document Expiry Alert */}
            {metrics.documents.expiring.length > 0 && (
              <Card title={t('reports.documentExpiry')} className="border-yellow-200 bg-yellow-50">
                <div className="space-y-2">
                  {metrics.documents.expiring.slice(0, 5).map((doc, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{doc.employee} - {doc.document}</span>
                      <span className="text-yellow-700 font-medium">
                        Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {metrics.documents.expiring.length > 5 && (
                    <p className="text-sm text-yellow-700 font-medium">
                      +{metrics.documents.expiring.length - 5} more documents expiring soon
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        );

      case 'employees':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metrics.employees.active}</p>
                  <p className="text-sm text-gray-600">Active Employees</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metrics.employees.inactive}</p>
                  <p className="text-sm text-gray-600">Inactive Employees</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metrics.employees.newHires}</p>
                  <p className="text-sm text-gray-600">New Hires (30 days)</p>
                </div>
              </Card>
            </div>

            <Card title="Employees by Department">
              <BarChart data={metrics.employees.byDepartment} />
            </Card>

            <Card title="Employee Status Overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PieChartSimple 
                  data={{ 
                    Active: metrics.employees.active, 
                    Inactive: metrics.employees.inactive 
                  }} 
                  title="Status Distribution"
                />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Department Details</h4>
                  <div className="space-y-2">
                    {Object.entries(metrics.employees.byDepartment).map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{dept}</span>
                        <span className="text-sm font-medium">{count} employees</span>
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
                  <p className="text-3xl font-bold text-gray-800">{metrics.leave.total}</p>
                  <p className="text-sm text-gray-600">Total Requests</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{metrics.leave.pending}</p>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {metrics.leave.byStatus['Approved'] || 0}
                  </p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {metrics.leave.byStatus['Rejected'] || 0}
                  </p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Leave Types Distribution">
                <PieChartSimple data={metrics.leave.byType} />
              </Card>
              
              <Card title="Leave Status Overview">
                <BarChart data={metrics.leave.byStatus} />
              </Card>
            </div>

            <Card title="Leave Utilization">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Utilization</span>
                  <span className="text-lg font-bold">{metrics.leave.utilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.leave.utilization}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Based on leave balances across all active employees
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
                  <p className="text-3xl font-bold text-gray-800">{metrics.timesheet.totalHours}</p>
                  <p className="text-sm text-gray-600">Total Hours Logged</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metrics.timesheet.entriesCount}</p>
                  <p className="text-sm text-gray-600">Total Entries</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metrics.timesheet.avgHoursPerEntry}</p>
                  <p className="text-sm text-gray-600">Avg Hours/Entry</p>
                </div>
              </Card>
            </div>

            <Card title="Hours by Employee">
              <BarChart data={metrics.timesheet.hoursByEmployee} />
            </Card>

            <Card title="Top Contributors">
              <div className="space-y-2">
                {Object.entries(metrics.timesheet.hoursByEmployee)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([name, hours], index) => (
                    <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-700">{name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{hours} hours</span>
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
                  <p className="text-3xl font-bold text-gray-800">{metrics.performance.totalGoals}</p>
                  <p className="text-sm text-gray-600">{t('reports.totalGoals')}</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metrics.performance.completionRate}%</p>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metrics.performance.avgRating}</p>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metrics.performance.reviewsCount}</p>
                  <p className="text-sm text-gray-600">{t('reports.reviewsConducted')}</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Goals by Status">
                <PieChartSimple data={metrics.performance.goalsByStatus} />
              </Card>
              
              <Card title="Performance Overview">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span className="text-sm text-gray-700">{t('reports.goalsCompleted')}</span>
                    <span className="text-lg font-bold text-green-600">
                      {metrics.performance.goalsByStatus['Completed'] || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span className="text-sm text-gray-700">{t('reports.goalsInProgress')}</span>
                    <span className="text-lg font-bold text-blue-600">
                      {metrics.performance.goalsByStatus['In Progress'] || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <span className="text-sm text-gray-700">Not Started</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {metrics.performance.goalsByStatus['Not Started'] || 0}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <Card title="Rating Distribution">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-yellow-500">{metrics.performance.avgRating}</p>
                    <div className="flex items-center justify-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-6 h-6 ${
                            i < Math.floor(metrics.performance.avgRating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Average Performance Rating</p>
                  </div>
                </div>
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
                  <p className="text-3xl font-bold text-gray-800">{metrics.engagement.announcements}</p>
                  <p className="text-sm text-gray-600">Total Announcements</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{metrics.engagement.recognitions}</p>
                  <p className="text-sm text-gray-600">Total Recognitions</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">
                    {metrics.engagement.thisMonth.announcements}
                  </p>
                  <p className="text-sm text-gray-600">Announcements This Month</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">
                    {metrics.engagement.thisMonth.recognitions}
                  </p>
                  <p className="text-sm text-gray-600">Recognitions This Month</p>
                </div>
              </Card>
            </div>

            <Card title="Engagement Trends">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monthly Activity</span>
                  <span className="text-lg font-bold">
                    {metrics.engagement.thisMonth.announcements + metrics.engagement.thisMonth.recognitions} items
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <Megaphone className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">
                      {metrics.engagement.thisMonth.announcements}
                    </p>
                    <p className="text-sm text-blue-600">Announcements</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-800">
                      {metrics.engagement.thisMonth.recognitions}
                    </p>
                    <p className="text-sm text-yellow-600">Recognitions</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Engagement Score">
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
                <p className="text-sm text-gray-600 mt-4">Overall Engagement Score</p>
                <p className="text-xs text-gray-500 mt-2">
                  Based on announcements, recognitions, and participation
                </p>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('reports.title')}</h1>
        <Button onClick={handleExportReport} className="mt-4 sm:mt-0">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Report Controls */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              options={reportTypes}
              className="w-48 min-w-[200px]" 

            />
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={dateRangeOptions}
              className="w-40"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="small">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      {renderReport()}
    </div>
  );
};

export default Reports;