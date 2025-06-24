import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Heart, Megaphone, Award, TrendingUp, Users, 
  Calendar, MessageSquare, ThumbsUp, Plus 
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const EmployeeEngagement = () => {
  const { 
    employees, 
    setCurrentPage,
    showMessage,
    fetchData, 
    postData, 
    fetchAnnouncements, 
    fetchRecognitions, 
    announcements: globalAnnouncements, 
    recognitions: globalRecognitions 
  } = useHRMS();
  const { t } = useLanguage();

  const [announcements, setAnnouncements] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [viewMode, setViewMode] = useState('all');
  const [showReactions, setShowReactions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEngagementData = async () => {
      setIsLoading(true);
      const fetchedAnnouncements = await fetchData('/announcements');
      if (fetchedAnnouncements) {
        setAnnouncements(fetchedAnnouncements);
      }
      const fetchedRecognitions = await fetchData('/recognitions');
      if (fetchedRecognitions) {
        setRecognitions(fetchedRecognitions);
      }
      setIsLoading(false);
    };
    loadEngagementData();
  }, [fetchData]); 
  
  useEffect(() => {
    setAnnouncements(globalAnnouncements);
  }, [globalAnnouncements]);

  useEffect(() => {
    setRecognitions(globalRecognitions);
  }, [globalRecognitions]);


  const recentAnnouncements = useMemo(() => {
    const now = new Date();
    return announcements
      .filter(a => !a.expiryDate || new Date(a.expiryDate) >= now) // Filter out expired announcements
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()) // Sort by most recent publishDate
      .slice(0, 5); // Show top 5 recent announcements
  }, [announcements]);

  const recentRecognitions = useMemo(() => {
    return recognitions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by most recent recognition date
      .slice(0, 10); // Show top 10 recent recognitions
  }, [recognitions]);

  const engagementMetrics = useMemo(() => {
    const now = new Date();
    const metrics = {
      totalAnnouncements: announcements.length,
      totalRecognitions: recognitions.length,
      activeParticipants: new Set([
        ...recognitions.map(r => r.givenBy),
        ...recognitions.map(r => {
            const recipient = employees.find(emp => emp.id === r.recipientId);
            return recipient ? `${recipient.firstName} ${recipient.lastName}` : r.givenBy;
        })
      ].filter(Boolean)).size,
      thisMonth: {
        announcements: announcements.filter(a => {
          const date = new Date(a.publishDate);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length,
        recognitions: recognitions.filter(r => {
          const date = new Date(r.date);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length
      }
    };
    if (isNaN(metrics.activeParticipants)) {
        metrics.activeParticipants = 0;
    }
    return metrics;
  }, [announcements, recognitions, employees]);


  const employeeOfTheMonth = useMemo(() => {
    const now = new Date();
    const recognitionsThisMonth = recognitions.filter(r => {
      const date = new Date(r.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const recognitionCounts = {};
    recognitionsThisMonth.forEach(r => {
      recognitionCounts[r.recipientId] = (recognitionCounts[r.recipientId] || 0) + 1;
    });

    let bestEmployeeId = null;
    let maxRecognitions = 0;
    for (const id in recognitionCounts) {
      if (recognitionCounts[id] > maxRecognitions) {
        maxRecognitions = recognitionCounts[id];
        bestEmployeeId = id;
      }
    }

    if (bestEmployeeId) {
      const employee = employees.find(emp => emp.id === bestEmployeeId);
      return employee ? `${employee.firstName} ${employee.lastName}` : null;
    }
    return null;
  }, [recognitions, employees]);


  const upcomingEvents = useMemo(() => {
    const now = new Date();
    // Normalize 'now' to start of day for comparison
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 

    return announcements
      .filter(a => a.category === 'event' && new Date(a.publishDate).setHours(0,0,0,0) >= todayMidnight.getTime()) // Filter for events and future/today dates
      .sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()) // Sort by nearest date
      .slice(0, 3); // Show top 3 upcoming events
  }, [announcements]);


  const handleReaction = useCallback((type, id) => {
    setShowReactions(prev => ({
      ...prev,
      [`${type}-${id}`]: !prev[`${type}-${id}`]
    }));
    showMessage('Reaction recorded (simulated)!', 'info');
  }, [showMessage]); 

  const formatDate = useCallback((dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const todayStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateStartOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = Math.abs(todayStartOfDay.getTime() - dateStartOfDay.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (dateStartOfDay.getTime() === todayStartOfDay.getTime()) return t('common.today');
    // For yesterday and tomorrow, need to compare strictly against the actual date objects after setting to midnight
    const yesterdayStartOfDay = new Date(todayStartOfDay);
    yesterdayStartOfDay.setDate(todayStartOfDay.getDate() - 1);
    const tomorrowStartOfDay = new Date(todayStartOfDay);
    tomorrowStartOfDay.setDate(todayStartOfDay.getDate() + 1);

    if (dateStartOfDay.getTime() === yesterdayStartOfDay.getTime()) return t('common.yesterday');
    if (dateStartOfDay.getTime() === tomorrowStartOfDay.getTime()) return t('common.tomorrow');

    if (dateStartOfDay < todayStartOfDay) { // Past dates
      if (diffDays < 7) return t('common.daysAgo', { days: diffDays });
      return t('common.weeksAgo', { weeks: Math.floor(diffDays / 7) });
    } else { // Future dates
      if (diffDays < 7) return t('common.inDays', { days: diffDays });
      return t('common.inWeeks', { weeks: Math.floor(diffDays / 7) });
    }
    
    return date.toLocaleDateString();
  }, [t]);

  const getEmployeeAvatar = useCallback((name) => {
    const initials = name?.split(' ').map(n => n[0]).join('') || '';
    return initials.toUpperCase();
  }, []);

  const getAvatarColor = useCallback((name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500'
    ];
    const hash = name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    const index = hash % colors.length;
    return colors[index];
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('engagement.title')}</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button onClick={() => setCurrentPage('announcementForm')}>
            <Megaphone className="w-4 h-4 mr-2" />
            {t('engagement.createAnnouncement')}
          </Button>
          <Button onClick={() => setCurrentPage('recognitionForm')} variant="success">
            <Award className="w-4 h-4 mr-2" />
            {t('engagement.giveRecognition')}
          </Button>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('engagement.totalAnnouncements')}</p>
              <p className="text-2xl font-bold text-gray-800">{engagementMetrics.totalAnnouncements}</p>
            </div>
            <Megaphone className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('engagement.totalRecognitions')}</p>
              <p className="text-2xl font-bold text-gray-800">{engagementMetrics.totalRecognitions}</p>
            </div>
            <Award className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('engagement.activeParticipants')}</p>
              <p className="text-2xl font-bold text-gray-800">{engagementMetrics.activeParticipants}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('engagement.thisMonth')}</p>
              <p className="text-2xl font-bold text-gray-800">
                {engagementMetrics.thisMonth.announcements + engagementMetrics.thisMonth.recognitions}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <Card>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setViewMode('all')}
            variant={viewMode === 'all' ? 'primary' : 'outline'}
            size="small"
          >
            {t('engagement.allUpdates')}
          </Button>
          <Button
            onClick={() => setViewMode('announcements')}
            variant={viewMode === 'announcements' ? 'primary' : 'outline'}
            size="small"
          >
            {t('engagement.announcements')}
          </Button>
          <Button
            onClick={() => setViewMode('recognitions')}
            variant={viewMode === 'recognitions' ? 'primary' : 'outline'}
            size="small"
          >
            {t('engagement.recognitions')}
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Card><p className="text-center">{t('common.loading')}</p></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Announcements */}
          {(viewMode === 'all' || viewMode === 'announcements') && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Megaphone className="w-5 h-5 mr-2" />
                {t('engagement.companyAnnouncements')}
              </h2>
              
              {recentAnnouncements.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-500">{t('engagement.noAnnouncements')}</p>
                </Card>
              ) : (
                recentAnnouncements.map(announcement => (
                  <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {announcement.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(announcement.publishDate)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700">{announcement.content}</p>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          {t('common.by')} {announcement.author}
                        </p>
                        
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleReaction('announcement', announcement.id)}
                            className={`flex items-center space-x-1 text-sm ${
                              showReactions[`announcement-${announcement.id}`]
                                ? 'text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{t('engagement.like')}</span>
                          </button>
                          
                          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
                            <MessageSquare className="w-4 h-4" />
                            <span>{t('engagement.comment')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Recognitions */}
          {(viewMode === 'all' || viewMode === 'recognitions') && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                {t('engagement.employeeRecognition')}
              </h2>
              
              {recentRecognitions.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-500">{t('engagement.noRecognitions')}</p>
                </Card>
              ) : (
                recentRecognitions.map(recognition => {
                  const recipient = employees.find(emp => emp.id === recognition.recipientId);
                  const recipientName = recipient ? `${recipient.firstName} ${recipient.lastName}` : recognition.givenBy;
                  return (
                    <Card 
                      key={recognition.id} 
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-lg transition-shadow"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(recipientName)} flex items-center justify-center text-white font-semibold`}>
                            {getEmployeeAvatar(recipientName)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {recipientName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t('engagement.recognizedBy')} {recognition.givenBy}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 italic">"{recognition.message}"</p>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-yellow-200">
                          <span className="text-sm text-gray-500">
                            {formatDate(recognition.date)}
                          </span>
                          
                          <button
                            onClick={() => handleReaction('recognition', recognition.id)}
                            className={`flex items-center space-x-1 text-sm ${
                              showReactions[`recognition-${recognition.id}`]
                                ? 'text-yellow-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${
                              showReactions[`recognition-${recognition.id}`] ? 'fill-current' : ''
                            }`} />
                            <span>{t('engagement.celebrate')}</span>
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Employee of the Month */}
      {employeeOfTheMonth ? (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('engagement.employeeOfTheMonth')}</h3>
              <p className="text-gray-700">
                {t('engagement.eotmCongratsStart')}{' '}
                <span className="font-semibold">{employeeOfTheMonth}</span>{' '}
                {t('engagement.eotmCongratsEnd')}
              </p>
            </div>
            <Award className="w-16 h-16 text-purple-500" />
          </div>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <div className="flex items-center justify-center h-24 text-gray-500">
            <p>{t('engagement.noEotmYet')}</p>
          </div>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card title={t('engagement.upcomingEvents')}>
        {upcomingEvents.length === 0 ? (
          <p className="text-center text-gray-500">{t('engagement.noUpcomingEvents')}</p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div 
                key={event.id} 
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-800">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.publishDate).toLocaleDateString()}
                      {event.expiryDate && ` - ${new Date(event.expiryDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmployeeEngagement;