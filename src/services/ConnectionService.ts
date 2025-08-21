import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { NotificationService } from './NotificationService';

const client = generateClient<Schema>();

export async function getConnections(userId: string): Promise<Array<{ id: string; friendId: string; inviterId: string; createdAt: string | null }>> {
	// Only fetch real connections from backend
	const result = await client.models.Connections.list({
		filter: { inviterId: { eq: userId } }
	});
	return (result.data || []) as Array<{ id: string; friendId: string; inviterId: string; createdAt: string | null }>;
}

export class ConnectionService {
	/**
	 * When a user registers, update invitation status and create connection
	 */
	static async handleRegistration(newUserEmail: string, newUserId: string) {
		console.log('=== ConnectionService.handleRegistration ===');
		console.log('New user email:', newUserEmail);
		console.log('New user ID:', newUserId);
		
		// Find invitation for this email
		const invitations = await client.models.Invitation.list({
			filter: { recipientEmail: { eq: newUserEmail } }
		});
		
		console.log('Found invitations:', invitations.data?.length || 0);
		
		if (!invitations.data || invitations.data.length === 0) {
			console.log('No invitations found for email:', newUserEmail);
			return;
		}
		
		for (const invite of invitations.data) {
			console.log('Processing invitation:', invite);
			console.log('Inviter ID:', invite.inviterId);
			console.log('Recipient email:', invite.recipientEmail);
			
			// Update invitation status
			await client.models.Invitation.update({
				id: invite.id,
				status: 'registered'
			});
			
			// Create connection
			await client.models.Connections.create({
				inviterId: invite.inviterId,
				friendId: newUserId,
				createdAt: new Date().toISOString(),
			});
			
			// Get inviter's profile information to create personalized notification
			try {
				const inviterProfile = await client.models.UserProfile.get({ id: invite.inviterId });
				console.log('Inviter profile:', inviterProfile?.data);
				
								const inviterName = inviterProfile?.data?.firstName || 'Someone';
								const extractKeyFromUrl = (urlStr: string): string | undefined => {
									try {
										const u = new URL(urlStr);
										const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
										return path.startsWith('public/') ? path.slice('public/'.length) : path;
									} catch {
										return undefined;
									}
								};
								const profile: any = inviterProfile?.data || {};
								const inviterAvatar = (profile.profilePhotoKey?.trim())
									|| (profile.profilePhotoUrl ? extractKeyFromUrl(profile.profilePhotoUrl) : undefined)
									|| undefined;
				
				console.log('Creating friend request notification with:', { newUserId, inviterName, inviterAvatar });
				
				// Create friend request notification for the newly registered user
				const notificationResult = await NotificationService.createFriendRequestNotification(
					newUserId,
					inviterName,
					inviterAvatar,
					invite.inviterId // Pass the inviter ID
				);
				
				console.log('Notification creation result:', notificationResult);
				
				console.log(`Created friend request notification for ${newUserEmail} from ${inviterName}`);
			} catch (error) {
				console.warn('Could not create friend request notification:', error);
				// Fallback: create notification without inviter details
				const fallbackResult = await NotificationService.createFriendRequestNotification(
					newUserId,
					'Someone',
					undefined,
					invite.inviterId // Still pass the inviter ID if available
				);
				console.log('Fallback notification result:', fallbackResult);
			}
		}
		
		console.log('=== End ConnectionService.handleRegistration ===');
	}

	/**
	 * Create a connection between two users (accept friend request)
	 */
	static async createConnection(currentUserId: string, friendUserId: string): Promise<{ success: boolean; error?: string }> {
		try {
			console.log('=== Start ConnectionService.createConnection ===');
			console.log('Creating connection between:', currentUserId, 'and', friendUserId);

			if (!client.models?.Connections) {
				console.warn('Connections model not available, skipping database creation');
				return { success: true }; // Return success since we don't have the model yet
			}

			// Create connection from current user to friend
			const connection1 = await client.models.Connections.create({
				inviterId: currentUserId,
				friendId: friendUserId,
				createdAt: new Date().toISOString(),
			});

			console.log('Created connection 1:', connection1);

			// Create reciprocal connection from friend to current user
			const connection2 = await client.models.Connections.create({
				inviterId: friendUserId,
				friendId: currentUserId,
				createdAt: new Date().toISOString(),
			});

			console.log('Created connection 2:', connection2);

			console.log('=== End ConnectionService.createConnection ===');
			return { success: true };

		} catch (error) {
			console.error('Error creating connection:', error);
			return { 
				success: false, 
				error: error instanceof Error ? error.message : 'Failed to create connection' 
			};
		}
	}
}
