import React, { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Search, Plus, Edit } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';

const EmployeeList = () => {
  // Destructure directly from useHRMS context
  const {
    employees, // Now managed by HRMSContext, fetched from backend
    fetchEmployees, // Function to fetch employees
    setCurrentPage,
    setSelectedEmployeeId,
    showMessage,
    user, // Access logged-in user
  } = useHRMS();
  const { t } = useLanguage();

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch employees on component mount or when tenant changes
  useEffect(() => {
    if (user?.tenant?.id) { // Ensure user and tenant are loaded
      fetchEmployees();
    }
  }, [user, fetchEmployees]);


  // Get unique departments for filter (still derived from fetched employees)
  const departments = useMemo(() => {
    const depts = [...new Set(employees.map(emp => emp.department))];
    return depts.map(dept => ({ value: dept, label: dept }));
  }, [employees]);

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = searchTerm === '' ||
        employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = departmentFilter === '' || employee.department === departmentFilter;
      const matchesStatus = statusFilter === '' || employee.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  const handleAddNew = () => {
    setSelectedEmployeeId(null); // Clear selected ID for new employee form
    setCurrentPage('employeeDetail'); // Navigate to detail form
  };

  const handleViewEdit = (employeeId) => {
    setSelectedEmployeeId(employeeId); // Set selected ID for editing
    setCurrentPage('employeeDetail'); // Navigate to detail form
  };

  const statusOptions = [
    { value: 'Active', label: t('common.active') },
    { value: 'Inactive', label: t('common.inactive') }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('employees.title')}</h1>
        <Button onClick={handleAddNew} className="mt-4 sm:mt-0 flex items-center">
          <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{t('employees.addNew')}</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder={t('employees.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              style={{ paddingLeft: '2.5rem' }} // Add this
            />
          </div>

          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={departments}
            placeholder={t('employees.filterDepartment')}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            placeholder={t('employees.filterStatus')}
          />
        </div>
      </Card>

      {/* Employees Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  {t('employees.department')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  {t('employees.contact')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {t('employees.noFound')}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{employee.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      <div>{employee.email}</div>
                      <div>{employee.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => handleViewEdit(employee.id)}
                        variant="outline"
                        size="small"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {t('employees.viewEdit')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default EmployeeList;