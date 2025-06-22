import React, { useState, useMemo } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Calendar, Plus, ChevronLeft, ChevronRight, 
  Check, X, Clock, AlertCircle 
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Select from '../common/Select';

const LeaveManagement = () => {
  const { 
    employees, 
    leaveRequests, 
    setLeaveRequests, 
    setEmployees,
    setCurrentPage,
    showMessage 
  } = useHRMS();
  const { t } = useLanguage();

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Calculate days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Get month name
  const monthNames = [
    t('month.january'), t('month.february'), t('month.march'),
    t('month.april'), t('month.may'), t('month.june'),
    t('month.july'), t('month.august'), t('month.september'),
    t('month.october'), t('month.november'), t('month.december')
  ];

  // Generate years for selector
  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return { value: year, label: year.toString() };
  });

  const months = monthNames.map((name, index) => ({
    value: index,
    label: name
  }));

  // Get leaves for current month
  const monthLeaves = useMemo(() => {
    const leaves = {};
    
    leaveRequests.forEach(request => {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      
      // Check if leave overlaps with current month
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);
      
      if (startDate <= monthEnd && endDate >= monthStart) {
        // Calculate which days in current month are affected
        let currentDate = new Date(Math.max(startDate, monthStart));
        const lastDate = new Date(Math.min(endDate, monthEnd));
        
        while (currentDate <= lastDate) {
          const day = currentDate.getDate();
          if (!leaves[day]) leaves[day] = [];
          leaves[day].push({
            employeeName: request.employeeName,
            status: request.status,
            type: request.type
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });
    
    return leaves;
  }, [leaveRequests, currentMonth, currentYear]);

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleApprove = (requestId) => {
    const request = leaveRequests.find(r => r.id === requestId);
    if (!request) return;

    // Calculate days
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Find employee and check balance
    const employee = employees.find(emp => emp.id === request.employeeId);
    if (!employee) return;

    const leaveType = request.type.toLowerCase();
    if (employee.leaveBalances[leaveType] < days) {
      showMessage(t('leave.insufficientDays'), 'error');
      return;
    }

    // Update leave request status
    setLeaveRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: 'Approved' } : req
      )
    );

    // Deduct leave balance
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === request.employeeId 
          ? {
              ...emp,
              leaveBalances: {
                ...emp.leaveBalances,
                [leaveType]: emp.leaveBalances[leaveType] - days
              }
            }
          : emp
      )
    );

    showMessage(`Leave request approved for ${request.employeeName}`, 'success');
  };

  const handleReject = (requestId) => {
    setLeaveRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: 'Rejected' } : req
      )
    );
    
    const request = leaveRequests.find(r => r.id === requestId);
    showMessage(`Leave request rejected for ${request.employeeName}`, 'info');
  };

  const renderCalendar = () => {
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayLeaves = monthLeaves[day] || [];
      
      days.push(
        <div key={day} className="h-24 border border-gray-200 p-2 overflow-y-auto">
          <div className="font-semibold text-sm text-gray-700 mb-1">{day}</div>
          <div className="space-y-1">
            {dayLeaves.map((leave, index) => (
              <div 
                key={index}
                className={`text-xs p-1 rounded ${
                  leave.status === 'Approved' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {leave.employeeName.split(' ')[0]}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('leave.title')}</h1>
        <Button 
          onClick={() => setCurrentPage('leaveRequest')}
          className="mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('leave.requestNew')}
        </Button>
      </div>

      {/* Leave Calendar */}
      <Card title={t('leave.calendar')}>
        <div className="space-y-4">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              onClick={handlePreviousMonth}
              variant="outline"
              size="small"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                options={months}
              />
              <Select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                options={years}
              />
            </div>
            
            <Button 
              onClick={handleNextMonth}
              variant="outline"
              size="small"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Legend */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span>{t('leave.approved')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 rounded"></div>
              <span>{t('leave.pending')}</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm py-2 bg-gray-100">
                {day}
              </div>
            ))}
            {/* Calendar days */}
            {renderCalendar()}
          </div>
        </div>
      </Card>

      {/* Employee Leave Balances */}
      <Card title={t('leave.balances')}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('leave.employee')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('leave.vacation')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('leave.sick')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('leave.personal')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.filter(emp => emp.status === 'Active').map(employee => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.leaveBalances.vacation} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.leaveBalances.sick} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.leaveBalances.personal} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* All Leave Requests */}
      <Card title={t('leave.requests')}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('leave.employee')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('leave.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('leave.reason')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('leave.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests.map(request => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.employeeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.startDate} to {request.endDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {request.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.status === 'Approved' 
                        ? 'bg-green-100 text-green-800' 
                        : request.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'Pending' && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          variant="success"
                          size="small"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {t('leave.approve')}
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          variant="danger"
                          size="small"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t('leave.reject')}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default LeaveManagement;