import React, { useState, useEffect, useMemo } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  User, Mail, Phone, MapPin, Calendar, Building,
  Briefcase, Trash2, Plus, Check, X, FileText,
  Download, Edit3, Clock, Target
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';

const EmployeeDetail = ({ isMyProfile = false }) => {
  const {
    employees,
    // Removed setEmployees as it's not directly used for main employee data in this component now
    selectedEmployeeId,
    setSelectedEmployeeId,
    setCurrentPage,
    showMessage,
    user,
    fetchEmployees,
    postData,
    putData,
    deleteData,
    fetchData,
    // FIX: Destructure missing fetch functions here
    fetchLeaveRequests,
    fetchGoals,
    fetchReviews,
    fetchDocuments,
  } = useHRMS();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    role: '', department: '', hireDate: '', status: 'Active',
    vacationBalance: 15, sickBalance: 10, personalBalance: 5,
    onboardingTasks: [], documents: [], user: null,
  });

  const [newTask, setNewTask] = useState({ task: '', dueDate: '' });
  const [isLoading, setIsLoading] = useState(true);

  const [myLeaveRequests, setMyLeaveRequests] = useState([]);
  const [myGoals, setMyGoals] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [myDocuments, setMyDocuments] = useState([]);


  const currentEmployeeIdToLoad = useMemo(() => {
    if (isMyProfile) {
        return user?.employeeId || null;
    }
    return selectedEmployeeId;
  }, [isMyProfile, user, selectedEmployeeId]);


  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!user?.tenant?.id) {
        setIsLoading(false);
        return;
      }

      if (currentEmployeeIdToLoad) {
        setIsLoading(true);
        try {
          const employeeData = await fetchData(`/employees/${currentEmployeeIdToLoad}`, null, 'Failed to load employee details.');

          if (employeeData) {
            setFormData({
                ...employeeData,
                vacationBalance: employeeData.vacationBalance ?? 15,
                sickBalance: employeeData.sickBalance ?? 10,
                personalBalance: employeeData.personalBalance ?? 5,
                hireDate: employeeData.hireDate ? new Date(employeeData.hireDate).toISOString().split('T')[0] : '',
            });

            if (isMyProfile) {
                const fetchedLeaves = await fetchData(`/leave-requests?employeeId=${currentEmployeeIdToLoad}`, null, 'Failed to load leave requests for profile.');
                setMyLeaveRequests(fetchedLeaves || []);

                const fetchedGoals = await fetchData(`/goals?employeeId=${currentEmployeeIdToLoad}`, null, 'Failed to load goals for profile.');
                setMyGoals(fetchedGoals || []);

                const fetchedReviews = await fetchData(`/reviews?employeeId=${currentEmployeeIdToLoad}`, null, 'Failed to load reviews for profile.');
                setMyReviews(fetchedReviews || []);

                const fetchedDocuments = await fetchData(`/documents?employeeId=${currentEmployeeIdToLoad}`, null, 'Failed to load documents for profile.');
                setMyDocuments(fetchedDocuments || []);
            }
          } else {
             showMessage('Employee not found or failed to load details.', 'error');
             setCurrentPage('employees');
          }
        } catch (error) {
          console.error("Error fetching employee details:", error);
          showMessage('Failed to load employee details.', 'error');
          setCurrentPage('employees');
        } finally {
          setIsLoading(false);
        }
      } else {
        setFormData({
          firstName: '', lastName: '', email: '', phone: '', address: '',
          role: '', department: '', hireDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          vacationBalance: 15, sickBalance: 10, personalBalance: 5,
          onboardingTasks: [], documents: [], user: null
        });
        setIsLoading(false);
      }
    };

    if (user?.tenant?.id) {
        loadEmployeeData();
    }

  }, [currentEmployeeIdToLoad, isMyProfile, user, showMessage, fetchData, setCurrentPage,
      fetchLeaveRequests, fetchGoals, fetchReviews, fetchDocuments]);


  const departmentOptions = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Product', label: 'Product' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Finance', label: 'Finance' }
  ];

  const statusOptions = [
    { value: 'Active', label: t('common.active') },
    { value: 'Inactive', label: t('common.inactive') }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLeaveBalanceChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Balance`]: parseInt(value) || 0
    }));
  };


  const handleTaskToggle = async (taskId, currentCompletedStatus) => {
    if (isMyProfile) return;

    showMessage('Onboarding task status updated (simulated). This needs backend integration.', 'info');

    setFormData(prev => ({
      ...prev,
      onboardingTasks: prev.onboardingTasks.map(task =>
        task.id === taskId ? { ...task, completed: !currentCompletedStatus } : task
      )
    }));
  };

  const handleAddTask = async () => {
    if (!newTask.task || !newTask.dueDate) {
      showMessage(t('common.allFields'), 'error');
      return;
    }
    showMessage('Onboarding task added (simulated). This needs backend integration.', 'success');

    setFormData(prev => ({
      ...prev,
      onboardingTasks: [
        ...prev.onboardingTasks,
        {
          id: `task-${Date.now()}`,
          task: newTask.task,
          dueDate: newTask.dueDate,
          completed: false
        }
      ]
    }));
    setNewTask({ task: '', dueDate: '' });
  };

  const handleDeleteTask = async (taskId) => {
    showMessage('Onboarding task deleted (simulated). This needs backend integration.', 'success');
    setFormData(prev => ({
      ...prev,
      onboardingTasks: prev.onboardingTasks.filter(task => task.id !== taskId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user?.tenant?.id) {
      showMessage('Tenant ID is missing. Please log in again.', 'error');
      setIsLoading(false);
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email ||
        !formData.role || !formData.department || !formData.hireDate) {
      showMessage(t('common.allFields'), 'error');
      setIsLoading(false);
      return;
    }

    const employeeDataToSend = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      role: formData.role,
      department: formData.department,
      hireDate: formData.hireDate,
      status: formData.status,
      vacationBalance: formData.vacationBalance,
      sickBalance: formData.sickBalance,
      personalBalance: formData.personalBalance,
      tenantId: user.tenant.id,
    };


    let result = null;
    if (currentEmployeeIdToLoad) {
      result = await putData(`/employees/${currentEmployeeIdToLoad}`, employeeDataToSend, t('employee.save') + ' successfully', t('common.error') + ': Failed to save changes.');
    } else {
      result = await postData('/employees', employeeDataToSend, t('employee.add') + ' successfully', t('common.error') + ': Failed to add employee.');
    }

    if (result) {
      setSelectedEmployeeId(null);
      fetchEmployees();
      setCurrentPage('employees');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!user?.tenant?.id) {
      showMessage('Tenant ID is missing. Please log in again.', 'error');
      return;
    }
    if (!currentEmployeeIdToLoad) {
        showMessage('No employee selected for deletion.', 'error');
        return;
    }

    showMessage(t('employee.confirmDelete'), 'warning', [
      {
        label: t('common.yes'),
        onClick: async () => {
          setIsLoading(true);
          const result = await deleteData(`/employees`, currentEmployeeIdToLoad, 'Employee deleted successfully', t('common.error') + ': Failed to delete employee.');
          if (result) {
            setSelectedEmployeeId(null);
            fetchEmployees();
            setCurrentPage('employees');
          }
          setIsLoading(false);
        },
        primary: true
      },
      {
        label: t('common.no'),
        onClick: () => {}
      }
    ]);
  };

  const handleCancel = () => {
    setCurrentPage(isMyProfile ? 'dashboard' : 'employees');
  };

  // These useMemo definitions are now correctly using the local states
  const myLeaveRequestsMemo = useMemo(() => myLeaveRequests, [myLeaveRequests]);
  const myGoalsMemo = useMemo(() => myGoals, [myGoals]);
  const myReviewsMemo = useMemo(() => myReviews, [myReviews]);
  const myDocumentsMemo = useMemo(() => myDocuments, [myDocuments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {isMyProfile
            ? t('employee.myProfileTitle')
            : currentEmployeeIdToLoad
              ? t('employee.editTitle')
              : t('employee.addTitle')}
        </h1>
      </div>

      {isLoading ? (
        <Card>
          <p className="text-center text-gray-500">{t('common.loading')}</p>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('employee.firstName')}
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                readOnly={isMyProfile}
              />
              <Input
                label={t('employee.lastName')}
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                readOnly={isMyProfile}
              />
              <Input
                label={t('employee.email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                readOnly={isMyProfile}
              />
              <Input
                label={t('employee.phone')}
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                readOnly={isMyProfile}
              />
              <div className="md:col-span-2">
                <Input
                  label={t('employee.address')}
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  readOnly={isMyProfile}
                  icon={<MapPin className="w-5 h-5" />}
                />
              </div>
            </div>
          </Card>

          {/* Employment Information */}
          <Card title="Employment Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={t('employee.role')}
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                options={[
                  { value: 'Software Engineer', label: 'Software Engineer' },
                  { value: 'Product Manager', label: 'Product Manager' },
                  { value: 'HR Manager', label: 'HR Manager' },
                  { value: 'Marketing Specialist', label: 'Marketing Specialist' },
                  { value: 'Sales Representative', label: 'Sales Representative' }
                ]}
                required
                disabled={isMyProfile || !!currentEmployeeIdToLoad} // Disabled for existing
              />
              <Select
                label={t('employee.department')}
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                options={departmentOptions}
                required
                disabled={isMyProfile || !!currentEmployeeIdToLoad} // Disabled for existing
              />
              <Input
                label={t('employee.hireDate')}
                name="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={handleInputChange}
                readOnly={isMyProfile || !!currentEmployeeIdToLoad} // Read-only for existing employees
                icon={<Calendar className="w-5 h-5" />}
              />
              {!isMyProfile && (
                <Select
                  label={t('employee.status')}
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  options={statusOptions}
                />
              )}
            </div>
          </Card>

          {/* Leave Balances */}
          <Card title="Leave Balances">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={t('leave.vacation') + ' Days'}
                type="number"
                value={formData.vacationBalance}
                onChange={(e) => handleLeaveBalanceChange('vacation', e.target.value)}
                readOnly={isMyProfile}
                min="0"
              />
              <Input
                label={t('leave.sick') + ' Days'}
                type="number"
                value={formData.sickBalance}
                onChange={(e) => handleLeaveBalanceChange('sick', e.target.value)}
                readOnly={isMyProfile}
                min="0"
              />
              <Input
                label={t('leave.personal') + ' Days'}
                type="number"
                value={formData.personalBalance}
                onChange={(e) => handleLeaveBalanceChange('personal', e.target.value)}
                readOnly={isMyProfile}
                min="0"
              />
            </div>
          </Card>

          {/* Onboarding Tasks */}
          <Card title={t('onboarding.tasks')}>
            <div className="space-y-4">
              {/* These tasks would ideally come from a specific Onboarding API endpoint linked to employee ID */}
              {/* For now, they are simulated in frontend state */}
              {formData.onboardingTasks.length === 0 && !isMyProfile && (
                  <p className="text-gray-500 text-center">No onboarding tasks. Add one below!</p>
              )}
              {formData.onboardingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleTaskToggle(task.id, task.completed)}
                      disabled={isMyProfile}
                      className={`${isMyProfile ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {task.completed ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div>
                      <p className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.task}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        {new Date(task.dueDate) < new Date() && !task.completed && (
                          <span className="ml-2 text-red-600 font-medium">{t('onboarding.overdue')}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {!isMyProfile && (
                    <Button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      variant="danger"
                      size="small"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              {!isMyProfile && (
                <div className="flex space-x-2">
                  <Input
                    placeholder="New task"
                    value={newTask.task}
                    onChange={(e) => setNewTask(prev => ({ ...prev, task: e.target.value }))}
                  />
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                  <Button type="button" onClick={handleAddTask}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* My Profile Specific Sections */}
          {isMyProfile && (
            <>
              {/* My Leave Requests */}
              <Card title="My Leave Requests">
                <div className="space-y-3">
                  {myLeaveRequestsMemo.length === 0 ? (
                    <p className="text-gray-500">No leave requests found</p>
                  ) : (
                    myLeaveRequestsMemo.map(request => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{request.type} Leave</p>
                          <p className="text-sm text-gray-600">
                            {new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    ))
                  )}
                  <Button
                    type="button"
                    onClick={() => setCurrentPage('leave')}
                    variant="outline"
                    className="w-full"
                  >
                    {t('leave.requestNew')}
                  </Button>
                </div>
              </Card>

              {/* My Documents */}
              <Card title="My Documents">
                <div className="space-y-3">
                  {myDocumentsMemo.length === 0 ? (
                    <p className="text-gray-500">No documents found</p>
                  ) : (
                    myDocumentsMemo.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-600">
                              Expires: {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            onClick={() => showMessage('Document downloaded (simulated)', 'success')}
                            variant="outline"
                            size="small"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            onClick={() => showMessage(t('documents.signed') + ' (simulated)', 'success')}
                            variant="secondary"
                            size="small"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Quick Links */}
              <Card title="Quick Links">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    type="button"
                    onClick={() => setCurrentPage('timesheets')}
                    variant="outline"
                    className="flex items-center justify-center space-x-2"
                  >
                    <Clock className="w-5 h-5" />
                    <span>My Timesheet Entries</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentPage('performance')}
                    variant="outline"
                    className="flex items-center justify-center space-x-2"
                  >
                    <Target className="w-5 h-5" />
                    <span>My Goals & Reviews</span>
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Form Actions */}
          <div className="flex justify-between">
            <div className="space-x-2">
              <Button type="submit" disabled={isLoading}>
                {currentEmployeeIdToLoad ? t('employee.save') : t('employee.add')}
              </Button>
              <Button type="button" onClick={handleCancel} variant="secondary">
                {t('employee.cancel')}
              </Button>
            </div>
            {currentEmployeeIdToLoad && !isMyProfile && (
              <Button type="button" onClick={handleDelete} variant="danger" disabled={isLoading}>
                {t('employee.delete')}
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default EmployeeDetail;