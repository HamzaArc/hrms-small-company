import React, { useState, useMemo, useEffect } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Clock, Plus, Calendar, Filter, Download, 
  TrendingUp, User, Trash2, Edit2 
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';

const Timesheets = () => {
  const { 
    employees, 
    fetchEmployees,
    fetchTimesheets,
    deleteData,
    setCurrentPage,
    showMessage,
    user,
    timesheets: globalTimesheets // Get global timesheets state from context
  } = useHRMS();
  const { t } = useLanguage();

  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [isLoading, setIsLoading] = useState(true);

  const getWeekKey = (dateStr) => {
    const date = new Date(dateStr);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split('T')[0];
  };

  // Fetch and update local state when globalTimesheets or user change
  useEffect(() => {
    const loadAndFilterTimesheets = async () => {
      setIsLoading(true);
      if (employees.length === 0) {
        await fetchEmployees(); // Ensure employees are loaded
      }
      
      // This refreshes the global `timesheets` state in HRMSContext
      await fetchTimesheets(); 

      setIsLoading(false);
    };

    if (user?.tenantId) {
      loadAndFilterTimesheets();
    }
  }, [user, fetchTimesheets, fetchEmployees, employees.length]); // Added employees.length as dependency to refetch if employees change

  // Get unique employees from timesheets
  const employeeOptions = useMemo(() => {
    const uniqueEmployees = [...new Set(employees.map(emp => emp.id))];
    return uniqueEmployees.map(empId => {
      const emp = employees.find(e => e.id === empId);
      return {
        value: empId,
        label: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'
      };
    });
  }, [employees]);

  // Filter timesheets (client-side for now, backend could support this later)
  const filteredTimesheets = useMemo(() => {
    // Apply filters to the globally managed timesheets
    return (globalTimesheets || []).filter(timesheet => {
      const matchesEmployee = !filterEmployee || timesheet.employeeId === filterEmployee;
      
      const entryDate = new Date(timesheet.date);
      const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
      const toDate = filterDateTo ? new Date(filterDateTo) : null;

      const matchesDateFrom = !fromDate || entryDate >= fromDate;
      const matchesDateTo = !toDate || entryDate <= toDate;
      
      return matchesEmployee && matchesDateFrom && matchesDateTo;
    });
  }, [globalTimesheets, filterEmployee, filterDateFrom, filterDateTo]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const stats = {
      totalHours: 0,
      byEmployee: {},
      byWeek: {},
      avgHoursPerDay: 0
    };

    filteredTimesheets.forEach(ts => {
      const currentHours = parseFloat(ts.hours) || 0; 
      stats.totalHours += currentHours;
      
      const employee = employees.find(emp => emp.id === ts.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
      if (!stats.byEmployee[employeeName]) {
        stats.byEmployee[employeeName] = 0;
      }
      stats.byEmployee[employeeName] += currentHours;
      
      const weekKey = getWeekKey(ts.date);
      if (!stats.byWeek[weekKey]) {
        stats.byWeek[weekKey] = 0;
      }
      stats.byWeek[weekKey] += currentHours;
    });

    const uniqueDays = [...new Set(filteredTimesheets.map(ts => ts.date))].length;
    stats.avgHoursPerDay = uniqueDays > 0 ? (stats.totalHours / uniqueDays).toFixed(1) : 0;

    return stats;
  }, [filteredTimesheets, employees]);

  const handleDelete = async (timesheetId) => {
    showMessage('Are you sure you want to delete this timesheet entry?', 'warning', [
      {
        label: t('common.yes'),
        onClick: async () => {
          const success = await deleteData('/timesheets', timesheetId, 'Timesheet entry deleted successfully');
          if (success) {
            await fetchTimesheets(); // This will re-fetch and trigger re-render
          }
        },
        primary: true
      },
      {
        label: t('common.no'),
        onClick: () => {}
      }
    ]);
  };

  const handleExport = () => {
    showMessage('Timesheet data exported successfully', 'success');
  };

  const clearFilters = () => {
    setFilterEmployee('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('timesheets.title')}</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button
            onClick={() => setViewMode(viewMode === 'list' ? 'summary' : 'list')}
            variant="secondary"
          >
            {viewMode === 'list' ? t('timesheets.summaryView') : t('timesheets.listView')}
          </Button>
          <Button onClick={() => setCurrentPage('timesheetEntry')}>
            <Plus className="w-4 h-4 mr-2" />
            {t('timesheets.addNew')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h3>
            {(filterEmployee || filterDateFrom || filterDateTo) && (
              <Button onClick={clearFilters} variant="outline" size="small">
                Clear Filters
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label={t('leave.employee')}
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              options={employeeOptions}
              placeholder="All Employees"
            />
            <Input
              label={t('timesheets.from')}
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
            <Input
              label={t('timesheets.to')}
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              min={filterDateFrom}
            />
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{summary.totalHours}</p>
            </div>
            <Clock className="w-10 h-10 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Hours/Day</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{summary.avgHoursPerDay}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Entries</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{filteredTimesheets.length}</p>
            </div>
            <Calendar className="w-10 h-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {isLoading ? (
        <Card><p className="text-center">{t('common.loading')}</p></Card>
      ) : filteredTimesheets.length === 0 && (filterEmployee || filterDateFrom || filterDateTo || globalTimesheets.length > 0) ? (
        <Card>
          <p className="text-center text-gray-500">
            {filterEmployee || filterDateFrom || filterDateTo ? "No timesheet entries found matching your filters." : "No timesheet entries found for your tenant."}
          </p>
        </Card>
      ) : viewMode === 'list' ? (
        /* List View */
        <Card className="overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Timesheet Entries</h3>
            <Button onClick={handleExport} variant="outline" size="small">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('timesheets.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leave.employee')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('timesheets.hours')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('timesheets.description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTimesheets.map((timesheet) => (
                    <tr key={timesheet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(timesheet.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {employees.find(emp => emp.id === timesheet.employeeId)?.firstName} {employees.find(emp => emp.id === timesheet.employeeId)?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {timesheet.hours} hours
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {timesheet.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(timesheet.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Summary View */
        <div className="space-y-6">
          <Card title="Hours by Employee">
            <div className="space-y-3">
              {Object.entries(summary.byEmployee).map(([name, hours]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(hours / summary.totalHours) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Weekly Summary">
            <div className="space-y-3">
              {Object.entries(summary.byWeek).sort().map(([week, hours]) => (
                <div key={week} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Week of {new Date(week).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">{hours} hours</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Timesheets;