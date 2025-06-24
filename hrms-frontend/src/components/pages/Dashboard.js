import React, { useMemo } from 'react'; // Removed useEffect if not directly needed for activity fetching
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Card from '../common/Card';
import { Users, UserCheck, Calendar, Activity } from 'lucide-react'; // Added Activity icon

const Dashboard = () => {
  const { employees, leaveRequests, announcements, recognitions } = useHRMS();
  const { t } = useLanguage();

  const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
  const pendingLeaves = leaveRequests.filter(req => req.status === 'Pending').length;

  const statsCards = [
    {
      title: t('dashboard.totalEmployees'),
      value: employees.length,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: t('dashboard.activeEmployees'),
      value: activeEmployees,
      icon: UserCheck,
      color: 'bg-green-500'
    },
    {
      title: t('dashboard.pendingLeaves'),
      value: pendingLeaves,
      icon: Calendar,
      color: 'bg-yellow-500'
    }
  ];

  // Logic to generate recent activity from actual data
  const recentActivities = useMemo(() => {
    const activities = [];

    // Add recent leave requests (e.g., last 5 approved/rejected)
    leaveRequests.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime())
                 .slice(0, 5) // Get latest 5
                 .forEach(req => {
                   const employeeName = employees.find(emp => emp.id === req.employeeId)?.firstName || 'Unknown';
                   activities.push(
                     `${employeeName} ${req.status.toLowerCase()} their ${req.type.toLowerCase()} leave request for ${new Date(req.startDate).toLocaleDateString()} - ${new Date(req.endDate).toLocaleDateString()}`
                   );
                 });

    // Add recent new hires (e.g., last 3 new hires)
    employees.sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
             .slice(0, 3) // Get latest 3
             .forEach(emp => {
               activities.push(
                 `New employee ${emp.firstName} ${emp.lastName} joined the ${emp.department} team`
               );
             });

    // You can add more types of activities here (e.g., goal updates, new documents, etc.)
    
    return activities.sort((a, b) => (a > b ? -1 : 1)); // Simple sort, more complex logic could order by date
  }, [employees, leaveRequests]); // Depend on relevant data arrays

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('nav.dashboard')}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <Card title={t('dashboard.announcements')}>
          <div className="space-y-4">
            {announcements.length === 0 ? ( // Added check for no announcements
              <p className="text-center text-gray-500">{t('engagement.noAnnouncements')}</p>
            ) : (
              announcements.slice(0, 3).map(announcement => (
                <div key={announcement.id} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-800">{announcement.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {announcement.author} • {new Date(announcement.date).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recognitions */}
        <Card title={t('dashboard.recognitions')}>
          <div className="space-y-4">
            {recognitions.length === 0 ? ( // Added check for no recognitions
              <p className="text-center text-gray-500">{t('engagement.noRecognitions')}</p>
            ) : (
              recognitions.slice(0, 3).map(recognition => (
                <div key={recognition.id} className="bg-green-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-800">{recognition.recipientName}</p>
                  <p className="text-sm text-gray-600 mt-1">{recognition.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    From {recognition.givenBy} • {new Date(recognition.date).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity - Dynamic Data */}
      <Card title={t('dashboard.recentActivity')}>
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-center text-gray-500">No recent activity to display.</p>
          ) : (
            recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-gray-400" />
                <p className="text-sm text-gray-600">{activity}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;