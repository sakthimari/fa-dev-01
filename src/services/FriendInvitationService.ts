import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';
import { NotificationService } from './NotificationService';
import { ProfilePhotoService } from './ProfilePhotoService';

const client = generateClient<Schema>();

export class FriendInvitationService {
  /**
   * Send a friend request with profile photo
   */
  static async sendFriendRequest(
    fromUserId: string,
    fromUserName: string,
    toUserId: string,
    toUserName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get sender's profile photo
      const senderPhotoUrl = await ProfilePhotoService.getProfilePhotoUrl(fromUserId);
      
      // Create the friend request notification with profile photo
      const notification = {
        id: `friend-request-${fromUserId}-${Date.now()}`,
        title: `${fromUserName} sent you a friend request`,
        description: 'Wants to connect with you',
        time: new Date().toISOString(),
        isFriendRequest: true,
        isRead: false,
        inviterId: fromUserId,
        inviterName: fromUserName,
        avatar: senderPhotoUrl, // Include the actual profile photo URL
      };

      // Send notification to the target user
      const notificationResult = NotificationService.createNotification(toUserId, notification);

      if (notificationResult.success) {
        console.log(`Friend request sent from ${fromUserName} to ${toUserName}`);
        return { success: true };
      } else {
        return { success: false, error: notificationResult.error };
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user profile with photo for friend requests
   */
  static async getUserProfileForInvitation(userId: string): Promise<{
    userId: string;
    username: string;
    profilePhotoUrl: string | null;
  } | null> {
    try {
      // Get user profile from database
      const userProfile = await client.models.UserProfile.get({ userId });
      
      if (!userProfile?.data) {
        return null;
      }

      // Get or generate profile photo URL
      const profilePhotoUrl = await ProfilePhotoService.getProfilePhotoUrl(userId);

      return {
        userId,
        username: userProfile.data.username || 'Unknown User',
        profilePhotoUrl,
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Create a test friend request with proper profile photo
   */
  static async createTestFriendRequest(targetUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Create a test notification with generated avatar
      const notification = {
        id: `arya-friend-request-${Date.now()}`,
        title: 'Arya Stark sent you a friend request',
        description: 'Wants to connect with you',
        time: new Date().toISOString(),
        isFriendRequest: true,
        isRead: false,
        inviterId: 'arya-stark-123',
        inviterName: 'Arya Stark',
        avatar: ProfilePhotoService.getProfilePhotoWithFallback(
          'arya-stark-123',
          'Arya Stark',
          null // This will generate a nice avatar
        ),
      };

      const result = NotificationService.createNotification(targetUserId, notification);
      return result;
    } catch (error) {
      console.error('Error creating test friend request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
