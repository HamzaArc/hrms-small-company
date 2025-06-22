import React, { useState, useMemo } from 'react';
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
    employees, 
    setEmployees,
    showMessage 
  } = useHRMS();
  const { t } = useLanguage();

  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskForm, setNewTaskForm] = useState({ employeeId: '', task: '', dueDate: '' });

  const employeeOptions = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    }));

  const statusOptions = [
    { value: 'all', label: 'All Tasks' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' }
  ];

  // Filter employees with onboarding tasks
  const employeesWithTasks = useMemo(() => {
    return employees.filter(emp => {
      if (!emp.onboardingTasks || emp.onboardingTasks.length === 0) return false;
      if (filterEmployee && emp.id !== filterEmployee) return false;
      
      if (filterStatus && filterStatus !== 'all') {
        const hasMatchingTasks = emp.onboardingTasks.some(task => {
          const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
          
          switch (filterStatus) {
            case 'completed':
              return task.completed;
            case 'pending':
              return !task.completed && !isOverdue;
            case 'overdue':
              return isOverdue;
            default:
              return true;
          }
        });
        
        if (!hasMatchingTasks) return false;
      }
      
      return true;
    });
  }, [employees, filterEmployee, filterStatus]);

  // Calculate statistics
  const statistics = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let employeesInProgress = 0;

    employees.forEach(emp => {
      if (emp.onboardingTasks && emp.onboardingTasks.length > 0) {
        const tasks = emp.onboardingTasks;
        totalTasks += tasks.length;
        
        const completed = tasks.filter(t => t.completed).length;
        completedTasks += completed;
        
        const overdue = tasks.filter(t => 
          !t.completed && new Date(t.dueDate) < new Date()
        ).length;
        overdueTasks += overdue;
        
        if (completed < tasks.length) {
          employeesInProgress++;
        }
      }
    });

    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      employeesInProgress,
      completionRate
    };
  }, [employees]);

  const toggleEmployee = (employeeId) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  const handleTaskToggle = (employeeId, taskId) => {
    setEmployees(prev => 
      prev.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            onboardingTasks: emp.onboardingTasks.map(task =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            )
          };
        }
        return emp;
      })
    );
    
    showMessage('Task status updated', 'success');
  };

  const handleEditTask = (employeeId, task) => {
    setEditingTask({ employeeId, ...task });
  };

  const handleUpdateTask = () => {
    if (!editingTask.task || !editingTask.dueDate) {
      showMessage('Please fill all fields', 'error');
      return;
    }

    setEmployees(prev => 
      prev.map(emp => {
        if (emp.id === editingTask.employeeId) {
          return {
            ...emp,
            onboardingTasks: emp.onboardingTasks.map(task =>
              task.id === editingTask.id 
                ? { ...task, task: editingTask.task, dueDate: editingTask.dueDate }
                : task
            )
          };
        }
        return emp;
      })
    );

    setEditingTask(null);
    showMessage('Task updated successfully', 'success');
  };

  const handleDeleteTask = (employeeId, taskId) => {
    showMessage('Are you sure you want to delete this task?', 'warning', [
      {
        label: t('common.yes'),
        onClick: () => {
          setEmployees(prev => 
            prev.map(emp => {
              if (emp.id === employeeId) {
                return {
                  ...emp,
                  onboardingTasks: emp.onboardingTasks.filter(task => task.id !== taskId)
                };
              }
              return emp;
            })
          );
          showMessage('Task deleted successfully', 'success');
        },
        primary: true
      },
      {
        label: t('common.no'),
        onClick: () => {}
      }
    ]);
  };

  const handleAddTask = () => {
    const { employeeId, task, dueDate } = newTaskForm;
    
    if (!employeeId || !task || !dueDate) {
      showMessage('Please fill all fields', 'error');
      return;
    }

    const newTask = {
      id: `task-${Date.now()}`,
      task,
      dueDate,
      completed: false
    };

    setEmployees(prev => 
      prev.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            onboardingTasks: [...(emp.onboardingTasks || []), newTask]
          };
        }
        return emp;
      })
    );

    setNewTaskForm({ employeeId: '', task: '', dueDate: '' });
    showMessage('Task added successfully', 'success');
  };

  const getTaskStatus = (task) => {
    if (task.completed) return 'completed';
    if (new Date(task.dueDate) < new Date()) return 'overdue';
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getProgressPercentage = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Onboarding templates
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

  const applyTemplate = (employeeId, template) => {
    const today = new Date();
    const tasks = template.tasks.map(t => {
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + t.days);
      return {
        id: `task-${Date.now()}-${Math.random()}`,
        task: t.task,
        dueDate: dueDate.toISOString().split('T')[0],
        completed: false
      };
    });

    setEmployees(prev => 
      prev.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            onboardingTasks: [...(emp.onboardingTasks || []), ...tasks]
          };
        }
        return emp;
      })
    );

    showMessage(`Applied ${template.name} template`, 'success');
  };

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
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.totalTasks}</p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.completionRate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.overdueTasks}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.employeesInProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Add New Task */}
      <Card title={t('onboarding.addTask')}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={newTaskForm.employeeId}
            onChange={(e) => setNewTaskForm(prev => ({ ...prev, employeeId: e.target.value }))}
            options={employeeOptions}
            placeholder="Select employee"
          />
          <Input
            value={newTaskForm.task}
            onChange={(e) => setNewTaskForm(prev => ({ ...prev, task: e.target.value }))}
            placeholder="Task description"
          />
          <Input
            type="date"
            value={newTaskForm.dueDate}
            onChange={(e) => setNewTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
          />
          <Button onClick={handleAddTask}>
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
            placeholder="All Tasks"
          />
        </div>
      </Card>

      {/* Employee Onboarding Tasks */}
      <div className="space-y-4">
        {employeesWithTasks.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500">No onboarding tasks found</p>
          </Card>
        ) : (
          employeesWithTasks.map(employee => {
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
                          >
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Tasks List */}
                    {employee.onboardingTasks.map(task => {
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
                            <div className="flex-1 flex items-center space-x-2">
                              <Input
                                value={editingTask.task}
                                onChange={(e) => setEditingTask(prev => ({ ...prev, task: e.target.value }))}
                                className="flex-1"
                              />
                              <Input
                                type="date"
                                value={editingTask.dueDate}
                                onChange={(e) => setEditingTask(prev => ({ ...prev, dueDate: e.target.value }))}
                              />
                              <Button onClick={handleUpdateTask} size="small">
                                Save
                              </Button>
                              <Button onClick={() => setEditingTask(null)} variant="secondary" size="small">
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTaskToggle(employee.id, task.id);
                                  }}
                                  className="focus:outline-none"
                                >
                                  {getStatusIcon(status)}
                                </button>
                                <div>
                                  <p className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                    {task.task}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditTask(employee.id, task)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(employee.id, task.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
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