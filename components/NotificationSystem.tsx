import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Globe, FileSpreadsheet, Zap } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  details?: string;
  duration?: number;
};

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-400" />;
  }
};

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onRemove }) => {
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          onRemove(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-[10000] space-y-3">
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onRemove={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

const NotificationCard: React.FC<{
  notification: Notification;
  onRemove: () => void;
}> = ({ notification, onRemove }) => {
  const getBackgroundClass = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/95 border-green-500/30';
      case 'error':
        return 'bg-red-900/95 border-red-500/30';
      case 'warning':
        return 'bg-yellow-900/95 border-yellow-500/30';
      case 'info':
      default:
        return 'bg-blue-900/95 border-blue-500/30';
    }
  };

  return (
    <div
      className={`
        ${getBackgroundClass(notification.type)}
        backdrop-blur-md border rounded-xl p-4 max-w-md
        shadow-2xl text-white transform transition-all duration-300
        hover:scale-105 hover:shadow-3xl
        animate-in slide-in-from-right-full fade-in
      `}
    >
      <div className="flex items-start gap-3">
        <NotificationIcon type={notification.type} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base leading-tight">
              {notification.title}
            </h3>
            <Button
              onClick={onRemove}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm opacity-90 leading-relaxed mb-2">
            {notification.message}
          </p>
          
          {notification.details && (
            <div className="text-xs opacity-75 bg-black/20 rounded-lg p-2 mt-2">
              {notification.details}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (title: string, message: string, details?: string, duration = 6000) => {
    addNotification({ type: 'success', title, message, details, duration });
  };

  const showError = (title: string, message: string, details?: string, duration = 8000) => {
    addNotification({ type: 'error', title, message, details, duration });
  };

  const showWarning = (title: string, message: string, details?: string, duration = 7000) => {
    addNotification({ type: 'warning', title, message, details, duration });
  };

  const showInfo = (title: string, message: string, details?: string, duration = 5000) => {
    addNotification({ type: 'info', title, message, details, duration });
  };

  // CSS Fix notification
  const showCSSFixed = () => {
    showSuccess(
      '🎨 CSS Loading Fixed!',
      'Tailwind CSS is now loading properly. PostCSS conflict resolved.',
      'Version 2024.12.16.23.00 - Removed postcss.config.cjs conflict',
      8000
    );
  };

  // Language validation notification
  const showLanguageValidation = (validatedCount: number, totalCount: number) => {
    if (validatedCount === totalCount) {
      showSuccess(
        '🌍 Language Validation Complete',
        `All ${validatedCount} languages validated successfully`,
        'Ready for Universal Translation with enhanced validation',
        6000
      );
    } else {
      showWarning(
        '⚠️ Language Validation Issues',
        `${validatedCount}/${totalCount} languages validated`,
        `${totalCount - validatedCount} invalid language codes removed`,
        7000
      );
    }
  };

  // Translation error notification
  const showTranslationError = (language: string, error: string) => {
    showError(
      '❌ Translation Failed',
      `Failed to translate to ${language}`,
      `Error: ${error}. Check translation service status.`,
      10000
    );
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCSSFixed,
    showLanguageValidation,
    showTranslationError
  };
};

export default NotificationSystem;