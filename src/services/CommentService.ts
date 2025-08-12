import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { ProfileService } from './ProfileService';
import { getImageUrl } from '../utils/imageUtils';

const client = generateClient<Schema>();

export interface CreateCommentInput {
  content: string;
  postId: string;
}

export interface CommentData {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorProfilePhoto: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: string;
}

export class CommentService {
  /**
   * Create a new comment
   */
  static async createComment(input: CreateCommentInput): Promise<CommentData | null> {
    try {
      console.log('Creating comment with input:', input);
      
      // Get current user
      console.log('Step 1: Getting current user...');
      const user = await getCurrentUser();
      console.log('Current user:', user);
      
      if (!user || !user.userId) {
        console.error('No user or userId found');
        return null;
      }
      
      // Get user profile for author info
      console.log('Step 2: Getting user profile...');
      let userProfile;
      try {
        userProfile = await client.models.UserProfile.list({
          filter: { 
            owner: { eq: user.userId }
          }
        });
        console.log('Profile query result:', userProfile);
      } catch (error) {
        console.warn('Failed to get user profile by owner, trying by id:', error);
        userProfile = await client.models.UserProfile.list({
          filter: { id: { eq: user.userId } }
        });
        console.log('Profile query result (by id):', userProfile);
      }
      
      const profile = userProfile.data[0];
      console.log('User profile:', profile);
      
      let authorName = 'Anonymous User';
      let authorProfilePhoto = null;
      
      if (!profile) {
        console.warn('User profile not found, using fallback author info');
        // Use user data from auth if profile not found
        if (user.signInDetails?.loginId) {
          authorName = user.signInDetails.loginId.split('@')[0]; // Use email prefix
        } else if ((user as any).username) {
          authorName = (user as any).username;
        }
      } else {
        authorName = `${profile.firstName} ${profile.lastName}`;
        authorProfilePhoto = profile.profilePhotoUrl || null;
      }
      
      console.log('Step 3: Preparing comment data...');
      const commentInput = {
        content: input.content,
        postId: input.postId,
        authorId: user.userId,
        authorName: authorName,
        authorProfilePhoto: authorProfilePhoto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Comment input for creation:', commentInput);
      
      console.log('Step 4: Creating comment in database...');
      const response = await client.models.Comment.create(commentInput);
      
      console.log('Comment creation response:', response);
      console.log('Response data:', response.data);
      console.log('Response errors:', response.errors);

      if (response.data) {
        console.log('Comment created successfully:', response.data);
        
        // Increment comment count on the post
        await this.incrementPostCommentCount(input.postId);
        
        // Generate fresh profile photo URL
        const commentWithFreshUrl = await this.generateFreshCommentUrls([response.data]);
        return commentWithFreshUrl[0] || null;
      } else {
        console.error('Comment creation failed - no data in response:', response);
        console.error('Response errors:', response.errors);
        
        // Print detailed error information
        if (response.errors && response.errors.length > 0) {
          response.errors.forEach((error, index) => {
            console.error(`Error ${index + 1}:`, error);
          });
        }
        
        return null;
      }
    } catch (error) {
      console.error('Error creating comment - full error:', error);
      console.error('Error details:', {
        message: (error as any)?.message,
        name: (error as any)?.name,
        stack: (error as any)?.stack
      });
      return null;
    }
  }

  /**
   * Get comments for a specific post
   */
  static async getCommentsByPostId(postId: string): Promise<CommentData[]> {
    try {
      console.log('Fetching comments for post:', postId);
      
      const response = await client.models.Comment.list({
        filter: {
          postId: {
            eq: postId
          }
        }
      });

      if (response.data) {
        // Generate fresh URLs for all comments
        const commentsWithFreshUrls = await this.generateFreshCommentUrls(response.data);
        
        // Sort by creation date (newest first)
        return commentsWithFreshUrls.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  /**
   * Delete a comment (only by owner)
   */
  static async deleteComment(commentId: string, postId: string): Promise<boolean> {
    try {
      console.log('Deleting comment:', commentId);
      
      const response = await client.models.Comment.delete({ id: commentId });
      
      if (response.data) {
        // Decrement comment count on the post
        await this.decrementPostCommentCount(postId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  /**
   * Generate fresh URLs for comment authors' profile photos
   */
  private static async generateFreshCommentUrls(comments: any[]): Promise<CommentData[]> {
    const commentsWithFreshUrls = await Promise.all(
      comments.map(async (comment) => {
        let freshProfilePhotoUrl = comment.authorProfilePhoto;
        
        if (comment.authorProfilePhoto) {
          try {
            // Try to get fresh URL from ProfileService first
            const profileData = await ProfileService.getProfileByUserId(comment.authorId);
            if (profileData?.profilePhotoUrl) {
              freshProfilePhotoUrl = profileData.profilePhotoUrl;
            } else {
              // Fallback to direct S3 URL generation
              freshProfilePhotoUrl = await getImageUrl(comment.authorProfilePhoto);
            }
          } catch (error) {
            console.warn('Could not generate fresh profile photo URL for comment:', error);
            freshProfilePhotoUrl = comment.authorProfilePhoto;
          }
        }

        return {
          id: comment.id,
          content: comment.content,
          postId: comment.postId,
          authorId: comment.authorId,
          authorName: comment.authorName,
          authorProfilePhoto: freshProfilePhotoUrl,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          owner: comment.owner,
        };
      })
    );

    return commentsWithFreshUrls;
  }

  /**
   * Increment comment count on a post
   */
  private static async incrementPostCommentCount(postId: string): Promise<void> {
    try {
      // Get current post
      const postResponse = await client.models.Post.get({ id: postId });
      if (postResponse.data) {
        const currentCount = (postResponse.data as any).comments || 0;
        await client.models.Post.update({
          id: postId,
          comments: currentCount + 1,
        });
      }
    } catch (error) {
      console.warn('Could not increment comment count:', error);
    }
  }

  /**
   * Decrement comment count on a post
   */
  private static async decrementPostCommentCount(postId: string): Promise<void> {
    try {
      // Get current post
      const postResponse = await client.models.Post.get({ id: postId });
      if (postResponse.data) {
        const currentCount = (postResponse.data as any).comments || 0;
        await client.models.Post.update({
          id: postId,
          comments: Math.max(0, currentCount - 1), // Ensure it doesn't go below 0
        });
      }
    } catch (error) {
      console.warn('Could not decrement comment count:', error);
    }
  }

  /**
   * Get comment count for a post
   */
  static async getCommentCount(postId: string): Promise<number> {
    try {
      const response = await client.models.Comment.list({
        filter: {
          postId: {
            eq: postId
          }
        }
      });
      
      return response.data?.length || 0;
    } catch (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }
  }
}
