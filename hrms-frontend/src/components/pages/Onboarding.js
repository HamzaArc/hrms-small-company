import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  UserCheck, Plus, Clock, CheckCircle, AlertCircle, 
  Calendar, Filter, ChevronDown, ChevronRight, Edit2, Trash2 
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';

const Onboarding = () => {
  const { 
    employees, // Employees from global context (for selecting assignee)
    showMessage,
    fetchData, // For GET requests
    postData, // For POST requests
    putData, // For PUT requests
    deleteData // For DELETE requests
  } = useHRMS();
  const { t } = useLanguage();

  const [onboardingTasks, setOnboardingTasks] = useState([]); // State for fetched onboarding tasks
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskForm, setNewTaskForm] = useState({ employeeId: '', task: '', dueDate: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch onboarding tasks when component mounts or dependencies change
  useEffect(() => {
    const loadOnboardingTasks = async () => {
      setIsLoading(true);
      const fetchedTasks = await fetchData('/onboarding-tasks');
      if (fetchedTasks) {
        setOnboardingTasks(fetchedTasks);
      }
      setIsLoading(false);
    };
    loadOnboardingTasks();
  }, [fetchData]); // Dependency array: re-run when fetchData (or any dependency of fetchData like user/tenant) changes

  const employeeOptions = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    }));

  const statusOptions = [
    { value: 'all', label: t('common.allTasks') },
    { value: 'completed', label: t('common.completed') },
    { value: 'pending', label: t('common.pending') },
    { value: 'overdue', label: t('common.overdue') }
  ];

  // Group and filter tasks by employee
  const groupedAndFilteredTasks = useMemo(() => {
    const grouped = {};
    onboardingTasks.forEach(task => {
      if (!grouped[task.employeeId]) {
        grouped[task.employeeId] = [];
      }
      grouped[task.employeeId].push(task);
    });

    return employees.filter(emp => {
      // Filter by selected employee
      if (filterEmployee && emp.id !== filterEmployee) return false;
      
      const empTasks = grouped[emp.id] || [];
      if (empTasks.length === 0) return false; // Only show employees with tasks

      // Filter tasks by status for display purposes, but don't exclude employee if they have any matching task
      let hasMatchingTasksForFilter = false;
      if (filterStatus && filterStatus !== 'all') {
        hasMatchingTasksForFilter = empTasks.some(task => {
          const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
          switch (filterStatus) {
            case 'completed': return task.completed;
            case 'pending': return !task.completed && !isOverdue;
            case 'overdue': return isOverdue;
            default: return true;
          }
        });
      } else {
        hasMatchingTasksForFilter = true; // No status filter or 'all' selected
      }
      
      return hasMatchingTasksForFilter;
    }).map(emp => ({
      ...emp,
      // Only include tasks that match the status filter for display within the expanded view
      onboardingTasks: (grouped[emp.id] || []).filter(task => {
        const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
        switch (filterStatus) {
          case 'completed': return task.completed;
          case 'pending': return !task.completed && !isOverdue;
          case 'overdue': return isOverdue;
          case 'all': return true; // Show all if 'all' filter is selected
          default: return true; // Fallback to show all
        }
      })
    }));
  }, [onboardingTasks, employees, filterEmployee, filterStatus, t]);


  // Calculate statistics (now based on `onboardingTasks` directly from backend)
  const statistics = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    const employeesWithIncompleteTasks = new Set(); // Changed from employeesInProgress to reflect meaning

    onboardingTasks.forEach(task => {
      totalTasks++;
      if (task.completed) {
        completedTasks++;
      } else {
        const isOverdue = new Date(task.dueDate) < new Date();
        if (isOverdue) {
          overdueTasks++;
        }
        employeesWithIncompleteTasks.add(task.employeeId); // Add to set if task is incomplete
      }
    });
    
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      employeesInProgress: employeesWithIncompleteTasks.size, // Number of employees with at least one pending task
      completionRate
    };
  }, [onboardingTasks]);

  const toggleEmployee = (employeeId) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  const handleTaskToggle = useCallback(async (taskId, currentCompletedStatus) => {
    const payload = { completed: !currentCompletedStatus };
    const result = await putData(`/onboarding-tasks/${taskId}`, payload, 'Task status updated successfully!');
    if (result) {
      // Optimistically update or re-fetch to ensure consistency
      const fetchedTasks = await fetchData('/onboarding-tasks'); // Re-fetch to update UI
      if (fetchedTasks) {
        setOnboardingTasks(fetchedTasks);
      }
    }
  }, [putData, fetchData]);

  const handleEditTask = useCallback((employeeId, task) => {
    setEditingTask({ employeeId, ...task });
  }, []);

  const handleUpdateTask = useCallback(async () => {
    if (!editingTask.task || !editingTask.dueDate) {
      showMessage('Please fill all fields', 'error');
      return;
    }

    const payload = {
        task: editingTask.task,
        dueDate: editingTask.dueDate
    };

    const result = await putData(`/onboarding-tasks/${editingTask.id}`, payload, 'Task updated successfully!');
    if (result) {
      setEditingTask(null);
      const fetchedTasks = await fetchData('/onboarding-tasks'); // Re-fetch to update UI
      if (fetchedTasks) {
        setOnboardingTasks(fetchedTasks);
      }
    }
  }, [editingTask, putData, fetchData, showMessage]);

  const handleDeleteTask = useCallback((taskId) => {
    showMessage('Are you sure you want to delete this task?', 'warning', [
      {
        label: t('common.yes'),
        onClick: async () => {
          const success = await deleteData('/onboarding-tasks', taskId, 'Task deleted successfully');
          if (success) {
            const fetchedTasks = await fetchData('/onboarding-tasks'); // Re-fetch to update UI
            if (fetchedTasks) {
              setOnboardingTasks(fetchedTasks);
            }
          }
        },
        primary: true
      },
      {
        label: t('common.no'),
        onClick: () => {}
      }
    ]);
  }, [deleteData, fetchData, showMessage, t]);

  const handleAddTask = useCallback(async () => {
    const { employeeId, task, dueDate } = newTaskForm;
    
    if (!employeeId || !task || !dueDate) {
      showMessage('Please fill all fields', 'error');
      return;
    }

    const payload = {
      employeeId,
      task,
      dueDate,
      completed: false // Default for new tasks
    };

    const result = await postData('/onboarding-tasks', payload, 'Task added successfully');
    if (result) {
      setNewTaskForm({ employeeId: '', task: '', dueDate: '' }); // Clear form
      const fetchedTasks = await fetchData('/onboarding-tasks'); // Re-fetch to update UI
      if (fetchedTasks) {
        setOnboardingTasks(fetchedTasks);
      }
    }
  }, [newTaskForm, postData, fetchData, showMessage]);

  const getTaskStatus = (task) => {
    if (task.completed) return 'completed';
    if (new Date(task.dueDate) < new Date() && !task.completed) return 'overdue'; // Only overdue if not completed
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: // pending
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getProgressPercentage = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Onboarding templates (now directly apply to form, then user clicks Add Task)
  const onboardingTemplates = [
    {
      name: 'Standard Employee',
      tasks: [
        { task: 'Complete HR paperwork', days: 1 },
        { task: 'Setup workstation and IT access', days: 1 },
        { task: 'Meet with direct manager', days: 2 },
        { task: 'Complete company orientation', days: 3 },
        { task: 'Review employee handbook', days: 5 },
        { task: 'Complete mandatory training', days: 7 },
        { task: 'Meet team members', days: 7 },
        { task: '30-day check-in with HR', days: 30 }
      ]
    },
    {
      name: 'Remote Employee',
      tasks: [
        { task: 'Complete digital onboarding forms', days: 1 },
        { task: 'Receive and setup equipment', days: 2 },
        { task: 'Virtual meeting with manager', days: 2 },
        { task: 'Complete remote work training', days: 3 },
        { task: 'Virtual team introduction', days: 5 },
        { task: 'Setup communication tools', days: 5 }
      ]
    }
  ];

  const applyTemplate = useCallback(async (employeeId, template) => {
    if (!employeeId) {
        showMessage('Please select an employee first before applying a template.', 'error');
        return;
    }

    const today = new Date();
    const tasksToCreate = template.tasks.map(t => {
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + t.days);
      return {
        employeeId: employeeId,
        task: t.task,
        dueDate: dueDate.toISOString().split('T')[0],
        completed: false
      };
    });

    let allSucceeded = true;
    for (const taskPayload of tasksToCreate) {
        const result = await postData('/onboarding-tasks', taskPayload, null); // Don't show message for each individual task
        if (!result) {
            allSucceeded = false;
            // Potentially log or inform user about specific task failure
        }
    }

    if (allSucceeded) {
        showMessage(`Applied ${template.name} template for the selected employee.`, 'success');
        const fetchedTasks = await fetchData('/onboarding-tasks'); // Re-fetch to update UI
        if (fetchedTasks) {
            setOnboardingTasks(fetchedTasks);
        }
    } else {
        showMessage('Some tasks from the template failed to add. Please check your network or server logs.', 'error');
    }
  }, [postData, fetchData, showMessage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('onboarding.title')}</h1>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('reports.totalTasks')}</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.totalTasks}</p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('reports.completionRate')}</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.completionRate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('reports.overdueTasks')}</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.overdueTasks}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('onboarding.employeesInProgress')}</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.employeesInProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Add New Task */}
      <Card title={t('onboarding.addTask')}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Select
            label={t('onboarding.employee')}
            name="employeeId"
            value={newTaskForm.employeeId}
            onChange={(e) => setNewTaskForm(prev => ({ ...prev, employeeId: e.target.value }))}
            options={employeeOptions}
            placeholder="Select employee"
            className="md:col-span-1"
          />
          <Input
            label={t('onboarding.taskDescription')}
            value={newTaskForm.task}
            onChange={(e) => setNewTaskForm(prev => ({ ...prev, task: e.target.value }))}
            placeholder="Task description"
            className="md:col-span-2"
          />
          <Input
            label={t('onboarding.dueDate')}
            type="date"
            value={newTaskForm.dueDate}
            onChange={(e) => setNewTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="md:col-span-1"
          />
          <Button onClick={handleAddTask} className="md:col-span-4 lg:col-span-1 mt-4 md:mt-0 w-full justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
      </Card>

      {/* Employee Onboarding Tasks */}
      <div className="space-y-4">
        {isLoading ? (
          <Card><p className="text-center">{t('common.loading')}</p></Card>
        ) : groupedAndFilteredTasks.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500">{t('onboarding.noTasksFound')}</p>
          </Card>
        ) : (
          groupedAndFilteredTasks.map(employee => {
            const isExpanded = expandedEmployees[employee.id];
            const progress = getProgressPercentage(employee.onboardingTasks);
            
            return (
              <Card key={employee.id} className="overflow-hidden">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleEmployee(employee.id)}
                >
                  <div className="flex items-center space-x-4">
                    <button className="text-gray-500">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {employee.role} • Hired: {new Date(employee.hireDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Progress</p>
                      <p className="text-lg font-semibold text-gray-800">{progress}%</p>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-6 space-y-2">
                    {/* Quick Templates */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
                      <div className="flex flex-wrap gap-2">
                        {onboardingTemplates.map((template, index) => (
                          <Button
                            key={index}
                            onClick={() => applyTemplate(employee.id, template)}
                            variant="outline"
                            size="small"
                            disabled={!employee.id} // Disable if no employee selected for template
                          >
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Tasks List */}
                    {employee.onboardingTasks.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No tasks for this employee matching the filters.</p>
                    ) : (
                      employee.onboardingTasks.map(task => {
                        const status = getTaskStatus(task);
                        const isEditing = editingTask?.id === task.id;
                        
                        return (
                          <div 
                            key={task.id} 
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              status === 'completed' ? 'bg-green-50' :
                              status === 'overdue' ? 'bg-red-50' :
                              'bg-gray-50'
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                {/* Fixed sizing for edit fields */}
                                <div className="md:col-span-2">
                                    <Input
                                        value={editingTask.task}
                                        onChange={(e) => setEditingTask(prev => ({ ...prev, task: e.target.value }))}
                                        className="w-full"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <Input
                                        type="date"
                                        value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''} // Ensure date format for input
                                        onChange={(e) => setEditingTask(prev => ({ ...prev, dueDate: e.target.value }))}
                                        className="w-full"
                                    />
                                </div>
                                <div className="md:col-span-3 flex justify-end space-x-2 mt-2 md:mt-0">
                                    <Button onClick={handleUpdateTask} size="small">
                                        Save
                                    </Button>
                                    <Button onClick={() => setEditingTask(null)} variant="secondary" size="small">
                                        Cancel
                                    </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center space-x-3">
                                  {/* Mark as Done/Incomplete - Clickable Icon */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent toggling employee expansion
                                      handleTaskToggle(task.id, task.completed); // Pass task.id and current completed status
                                    }}
                                    className="focus:outline-none"
                                    title={task.completed ? 'Mark as Incomplete' : 'Mark as Completed'}
                                  >
                                    {getStatusIcon(status)}
                                  </button>
                                  <div>
                                    <p className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                      {task.task}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditTask(employee.id, task)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit Task"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete Task"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Onboarding;