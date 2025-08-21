import type { NotificationType } from '@/types/data';
import type { BootstrapVariantType } from '@/types/component';

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  description?: string;
  avatar?: string;
  textAvatar?: {
    text: string;
    variant: BootstrapVariantType;
  };
  isFriendRequest?: boolean;
  isRead?: boolean;
  inviterId?: string; // ID of the user who sent the friend request
  inviterName?: string; // Name of the user who sent the friend request
}

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(request: CreateNotificationRequest): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // For now, we'll use local storage since we don't have a Notification model yet
      // In a real implementation, this would create a record in the database
      
      const notification: NotificationType = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: request.title,
        description: request.description,
        avatar: request.avatar,
        textAvatar: request.textAvatar,
        time: new Date(),
        isFriendRequest: request.isFriendRequest || false,
        isRead: request.isRead || false,
        inviterId: request.inviterId,
        inviterName: request.inviterName,
      };

      // Store in localStorage for this user
      const storageKey = `notifications_${request.userId}`;
      const existingNotifications = this.getUserNotifications(request.userId);
      
      const updatedNotifications = [notification, ...existingNotifications];
      localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));

      console.log('Created notification:', notification);
      
      return {
        success: true,
        notificationId: notification.id
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create notification'
      };
    }
  }

  /**
   * Get all notifications for a user
   */
  static getUserNotifications(userId: string): NotificationType[] {
    try {

      const storageKey = `notifications_${userId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        return [];
      }
      
      const notifications = JSON.parse(stored);

      
      
      // Convert time strings back to Date objects
      return notifications.map((notif: any) => ({
        ...notif,
        time: new Date(notif.time)
      }));

    
      

    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(userId: string, notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const notifications = this.getUserNotifications(userId);
      const updatedNotifications = notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      );
      
      const storageKey = `notifications_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));
      
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark notification as read'
      };
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(userId: string, notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const notifications = this.getUserNotifications(userId);
      const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
      
      const storageKey = `notifications_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete notification'
      };
    }
  }

  /**
   * Create a friend request notification
   */
  static async createFriendRequestNotification(
    recipientUserId: string, 
    inviterName: string, 
    inviterAvatar?: string,
    inviterId?: string
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    // Create a text avatar fallback if no image avatar is provided
    const textAvatar = !inviterAvatar ? {
      text: inviterName.charAt(0).toUpperCase(),
      variant: 'primary' as const
    } : undefined;

    return this.createNotification({
      userId: recipientUserId,
      title: `${inviterName} sent you a friend request.`,
      avatar: inviterAvatar,
      textAvatar: textAvatar,
      isFriendRequest: true,
      isRead: false,
      inviterId: inviterId,
      inviterName: inviterName,
    });
  }

  /**
   * Get unread notification count for a user
   */
  static getUnreadCount(userId: string): number {
    const notifications = this.getUserNotifications(userId);
    return notifications.filter(notif => !notif.isRead).length;
  }
}
