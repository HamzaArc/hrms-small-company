import React, { useState } from 'react';
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
    announcements, 
    recognitions,
    employees,
    setCurrentPage 
  } = useHRMS();
  const { t } = useLanguage();

  const [viewMode, setViewMode] = useState('all'); // all, announcements, recognitions
  const [showReactions, setShowReactions] = useState({});

  // Get recent items
  const recentAnnouncements = announcements.slice(0, 5);
  const recentRecognitions = recognitions.slice(0, 10);

  // Calculate engagement metrics
  const engagementMetrics = {
    totalAnnouncements: announcements.length,
    totalRecognitions: recognitions.length,
    activeParticipants: new Set([
      ...recognitions.map(r => r.givenBy),
      ...recognitions.map(r => r.recipientName)
    ]).size,
    thisMonth: {
      announcements: announcements.filter(a => {
        const date = new Date(a.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
      recognitions: recognitions.filter(r => {
        const date = new Date(r.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length
    }
  };

  const handleReaction = (type, id) => {
    setShowReactions(prev => ({
      ...prev,
      [`${type}-${id}`]: !prev[`${type}-${id}`]
    }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString();
  };

  const getEmployeeAvatar = (name) => {
    const initials = name.split(' ').map(n => n[0]).join('');
    return initials.toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

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
              <p className="text-sm text-gray-600">Total Announcements</p>
              <p className="text-2xl font-bold text-gray-800">{engagementMetrics.totalAnnouncements}</p>
            </div>
            <Megaphone className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Recognitions</p>
              <p className="text-2xl font-bold text-gray-800">{engagementMetrics.totalRecognitions}</p>
            </div>
            <Award className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Participants</p>
              <p className="text-2xl font-bold text-gray-800">{engagementMetrics.activeParticipants}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
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
            All Updates
          </Button>
          <Button
            onClick={() => setViewMode('announcements')}
            variant={viewMode === 'announcements' ? 'primary' : 'outline'}
            size="small"
          >
            Announcements
          </Button>
          <Button
            onClick={() => setViewMode('recognitions')}
            variant={viewMode === 'recognitions' ? 'primary' : 'outline'}
            size="small"
          >
            Recognitions
          </Button>
        </div>
      </Card>

      {/* Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements */}
        {(viewMode === 'all' || viewMode === 'announcements') && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Megaphone className="w-5 h-5 mr-2" />
              Company Announcements
            </h2>
            
            {recentAnnouncements.length === 0 ? (
              <Card>
                <p className="text-center text-gray-500">No announcements yet</p>
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
                        {formatDate(announcement.date)}
                      </span>
                    </div>
                    
                    <p className="text-gray-700">{announcement.content}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        By {announcement.author}
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
                          <span>Like</span>
                        </button>
                        
                        <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
                          <MessageSquare className="w-4 h-4" />
                          <span>Comment</span>
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
              Employee Recognition
            </h2>
            
            {recentRecognitions.length === 0 ? (
              <Card>
                <p className="text-center text-gray-500">No recognitions yet</p>
              </Card>
            ) : (
              recentRecognitions.map(recognition => (
                <Card 
                  key={recognition.id} 
                  className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-lg transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(recognition.recipientName)} flex items-center justify-center text-white font-semibold`}>
                        {getEmployeeAvatar(recognition.recipientName)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {recognition.recipientName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Recognized by {recognition.givenBy}
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
                        <span>Celebrate</span>
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Employee of the Month */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Employee of the Month</h3>
            <p className="text-gray-700">
              Congratulations to <span className="font-semibold">Alice Smith</span> for outstanding performance 
              and dedication this month!
            </p>
          </div>
          <Award className="w-16 h-16 text-purple-500" />
        </div>
      </Card>

      {/* Upcoming Events */}
      <Card title="Upcoming Events">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-800">Q2 All-Hands Meeting</p>
                <p className="text-sm text-gray-600">June 30, 2025 at 2:00 PM</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-800">Team Building Event</p>
                <p className="text-sm text-gray-600">July 15, 2025 - Outdoor Activities</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-800">Summer Office Party</p>
                <p className="text-sm text-gray-600">August 5, 2025 at 5:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmployeeEngagement;