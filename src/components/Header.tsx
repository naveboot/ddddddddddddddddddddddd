import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, Sparkles, Zap, X, Settings, LogOut, Building, Mail, Phone, MapPin, Calendar, CreditCard as Edit, Save, Clock, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { useNotifications } from '../contexts/NotificationContext';
import { authService } from '../services/authService';
import ProfileSidebar from './ProfileSidebar';
import type { View } from '../App';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, onSearchChange, activeView, onViewChange, onLogout }) => {
  const { t } = useLanguage();
  const { currentOrganization } = useOrganization();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications, hasMore, currentPage } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'task' | 'appointment' | 'opportunity'>('all');
  const notificationsRef = useRef<HTMLDivElement>(null);

  const currentUser = authService.getStoredUser();
  const userDisplayName = authService.getUserDisplayName();
  const userInitials = authService.getUserInitials();

  const displayNotifications = notifications.length > 0 ? notifications : [];

  const filteredNotifications = displayNotifications.filter(notification => {
    switch (notificationFilter) {
      case 'unread':
        return !notification.read;
      case 'task':
        return notification.category === 'task' || notification.category === 'reminder';
      case 'appointment':
        return notification.category === 'appointment';
      case 'opportunity':
        return notification.category === 'opportunity';
      default:
        return true;
    }
  }).sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const getTitle = () => {
    switch (activeView) {
      case 'dashboard': return t('dashboard');
      case 'contacts': return t('contacts');
      case 'opportunities': return t('opportunities');
      case 'tasks': return t('tasksReminders');
      case 'calendar': return t('calendarAppointments');
      case 'email': return t('emailCampaigns');
      case 'analytics': return t('analyticsReports');
      case 'integrations': return t('integrationsTitle');
      case 'settings': return t('settings');
      case 'join-organization': return 'Rejoindre une Organisation';
      case 'organization-management': return 'Gestion de l\'Organisation';
      default: return t('dashboard');
    }
  };

  const getDescription = () => {
    switch (activeView) {
      case 'dashboard': return t('welcomeDescription');
      case 'contacts': return t('manageContacts');
      case 'opportunities': return t('trackOpportunities');
      case 'tasks': return t('manageTasks');
      case 'calendar': return t('scheduleAppointments');
      case 'email': return t('manageEmailCampaigns');
      case 'analytics': return t('trackPerformance');
      case 'integrations': return t('connectTools');
      case 'settings': return t('preferences');
      case 'join-organization': return 'Découvrez et rejoignez des organisations qui correspondent à vos intérêts';
      case 'organization-management': return 'Gérez les informations et paramètres de votre organisation';
      default: return t('welcomeDescription');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'error': return <X size={16} className="text-red-600" />;
      case 'reminder': return <Clock size={16} className="text-blue-600" />;
      default: return <Info size={16} className="text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'reminder': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'task': return '📋';
      case 'appointment': return '📅';
      case 'opportunity': return '💼';
      case 'contact': return '👤';
      case 'reminder': return '⏰';
      default: return 'ℹ️';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      if (notification.relatedView) {
        const viewName = notification.relatedView.name as View;
        onViewChange(viewName);
        if (notification.actionData?.searchTerm) {
          onSearchChange(notification.actionData.searchTerm);
        }
      }
      setShowNotifications(false);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleLoadMore = () => {
    if (hasMore) {
      fetchNotifications(currentPage + 1);
    }
  };

  const handleAccountSettings = () => {
    setShowProfileSidebar(false);
    onViewChange('settings');
  };

  const handleLogout = () => {
    setShowProfileSidebar(false);
    onLogout();
  };

  const handleStatsClick = (statType: string) => {
    setShowProfileSidebar(false);
    switch (statType) {
      case 'contacts': onViewChange('contacts'); break;
      case 'opportunities': onViewChange('opportunities'); break;
      case 'tasks': onViewChange('tasks'); break;
      case 'appointments': onViewChange('calendar'); break;
      default: break;
    }
  };

  // ✅ Safe time formatter
  const formatTime = (timestamp?: string | Date) => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return 'Hier';
    return `Il y a ${days} jours`;
  };

  // Safe notification data access
  const getSafeNotificationData = (notification: any) => {
    return {
      id: notification.id || '',
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info',
      category: notification.category || 'general',
      read: Boolean(notification.read),
      timestamp: notification.timestamp,
      avatar: notification.avatar,
      time: notification.time,
      relatedView: notification.relatedView,
      actionData: notification.actionData
    };
  };

  return (
    <>
      {/* HEADER */}
      <header className="glass-effect border-b border-white/20 px-4 lg:px-8 py-4 lg:py-6 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="relative hidden sm:block">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap size={20} className="lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-1 animate-pulse">
                <Sparkles size={8} className="lg:w-2.5 lg:h-2.5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl lg:text-3xl font-bold text-gradient truncate">{getTitle()}</h2>
              <p className="text-slate-600 mt-1 font-medium text-sm lg:text-base hidden sm:block">
                {getDescription()}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center space-x-3 lg:space-x-6">
            {/* SEARCH BAR */}
            {['contacts','opportunities','tasks','calendar','email','join-organization'].includes(activeView) && (
              <div className="relative group hidden md:block">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder={t('searchWithAI')}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="input-modern pl-12 pr-6 py-3 w-64 lg:w-80 shadow-lg focus:shadow-xl"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg px-2 py-1">
                    <Sparkles size={12} className="text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* MOBILE SEARCH ICON */}
            {['contacts','opportunities','tasks','calendar','email','join-organization'].includes(activeView) && (
              <button className="md:hidden p-3 glass-effect rounded-xl hover:shadow-lg transition-all duration-300 group">
                <Search size={18} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
              </button>
            )}

            {/* NOTIFICATIONS */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 lg:p-3 glass-effect rounded-xl hover:shadow-lg transition-all duration-300 group"
              >
                <Bell size={18} className="lg:w-5 lg:h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 lg:h-6 lg:w-6 flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-[32rem] overflow-hidden">
                  {/* HEADER */}
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <Bell size={18} className="text-blue-600" />
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                          >
                            Tout marquer lu
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* FILTERS */}
                    <div className="flex items-center space-x-1 overflow-x-auto">
                      {[
                        { key: 'all', label: 'Toutes', count: displayNotifications.length },
                        { key: 'unread', label: 'Non lues', count: unreadCount },
                        { key: 'task', label: 'Tâches', count: displayNotifications.filter(n => n.category === 'task' || n.category === 'reminder').length },
                        { key: 'appointment', label: 'RDV', count: displayNotifications.filter(n => n.category === 'appointment').length },
                        { key: 'opportunity', label: 'Affaires', count: displayNotifications.filter(n => n.category === 'opportunity').length },
                      ].map((filter) => (
                        <button
                          key={filter.key}
                          onClick={() => setNotificationFilter(filter.key as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                            notificationFilter === filter.key
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-white hover:text-gray-800'
                          }`}
                        >
                          {filter.label} ({filter.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LIST */}
                  <div className="max-h-80 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="font-medium">Aucune notification</p>
                        <p className="text-sm">Vous êtes à jour !</p>
                      </div>
                    ) : (
                      filteredNotifications.map((notification, index) => {
                        const safeNotification = getSafeNotificationData(notification);
                        return (
                          <div
                            key={safeNotification.id || `notification-${index}-${safeNotification.timestamp || Date.now()}`}
                            className={`p-4 border-l-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group ${getNotificationColor(safeNotification.type)} ${!safeNotification.read ? 'bg-blue-50/30' : ''}`}
                            onClick={() => handleNotificationClick(safeNotification)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1 min-w-0">
                                <div className="flex-shrink-0 mt-0.5">
                                  {safeNotification.avatar ? (
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold">
                                      {safeNotification.avatar}
                                    </div>
                                  ) : (
                                    <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                                      {getNotificationIcon(safeNotification.type)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm">{getCategoryIcon(safeNotification.category)}</span>
                                    <h4 className="font-medium text-gray-900 text-sm truncate">{safeNotification.title}</h4>
                                    {!safeNotification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>}
                                  </div>
                                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{safeNotification.message}</p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-gray-400 text-xs">
                                      {safeNotification.time || formatTime(safeNotification.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                {!safeNotification.read && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        await markAsRead(safeNotification.id);
                                      } catch (error) {
                                        console.error('Failed to mark notification as read:', error);
                                      }
                                    }}
                                    className="text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded-md hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Marquer comme lu"
                                  >
                                    ✓
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* FOOTER */}
                  {filteredNotifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{filteredNotifications.length} notification(s) affichée(s)</span>
                        <div className="flex items-center space-x-2">
                          {hasMore && (
                            <button
                              onClick={handleLoadMore}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Charger plus
                            </button>
                          )}
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Fermer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PROFILE BUTTON */}
            <button
              onClick={() => setShowProfileSidebar(true)}
              className="flex items-center space-x-2 lg:space-x-3 glass-effect rounded-xl px-3 lg:px-4 py-2 lg:py-3 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl p-1.5 lg:p-2 group-hover:scale-110 transition-transform flex items-center justify-center">
                <span className="text-white font-bold text-xs lg:text-sm">{userInitials}</span>
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs lg:text-sm font-semibold text-slate-700 block truncate max-w-24 lg:max-w-32">
                  {userDisplayName}
                </span>
                <span className="text-xs text-slate-500 truncate max-w-24 lg:max-w-32 block">
                  {currentUser?.email || currentOrganization?.name}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* PROFILE SIDEBAR */}
      <ProfileSidebar
        isOpen={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
        onAccountSettings={handleAccountSettings}
        onLogout={handleLogout}
        onStatsClick={handleStatsClick}
      />
    </>
  );
};

export default Header;