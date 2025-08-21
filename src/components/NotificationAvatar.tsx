import React from 'react';
import type { NotificationType } from '@/types/data';

interface NotificationAvatarProps {
  notification: NotificationType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const NotificationAvatar: React.FC<NotificationAvatarProps> = ({ 
  notification, 
  size = 'md',
  className = '' 
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'avatar-sm',
    md: 'avatar',
    lg: 'avatar-lg'
  };
  
  const avatarClass = `${sizeClasses[size]} text-center ${className}`;
  
  // Simple logic: if notification has avatar URL, use it. Otherwise show initials.
  const avatarUrl = notification.avatar;
  const displayInitials = notification.inviterName?.charAt(0).toUpperCase() || notification.textAvatar?.text || '?';
  const bgVariant = notification.textAvatar?.variant || 'primary';
  
  // Debug logging
  console.log('NotificationAvatar Simple:', {
    title: notification.title,
    avatarUrl: notification.avatar,
    inviterName: notification.inviterName,
    displayInitials
  });
  
  return (
    <div className={avatarClass}>
      {avatarUrl ? (
        <img 
          className="avatar-img rounded-circle" 
          src={avatarUrl} 
          alt={notification.inviterName || 'User avatar'}
          onError={(e) => {
            console.warn('Failed to load avatar image:', avatarUrl);
            // On error, hide image and show initials instead
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const fallbackDiv = document.createElement('div');
              fallbackDiv.className = `avatar-img rounded-circle bg-${bgVariant} d-flex align-items-center justify-content-center`;
              fallbackDiv.style.width = '100%';
              fallbackDiv.style.height = '100%';
              fallbackDiv.innerHTML = `<span class="text-white fw-bold">${displayInitials}</span>`;
              parent.appendChild(fallbackDiv);
            }
          }}
          onLoad={() => {
            console.log('Avatar image loaded successfully for:', notification.inviterName);
          }}
        />
      ) : (
        <div 
          className={`avatar-img rounded-circle bg-${bgVariant} d-flex align-items-center justify-content-center`}
          title={notification.inviterName || 'User'}
        >
          <span className="text-white fw-bold">
            {displayInitials}
          </span>
        </div>
      )}
    </div>
  );
};

export default NotificationAvatar;
