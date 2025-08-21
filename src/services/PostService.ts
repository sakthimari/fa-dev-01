import { generateClient } from 'aws-amplify/data'
import { getCurrentUser } from 'aws-amplify/auth'
import type { Schema } from '../../amplify/data/resource'
import { ImageUploadService } from './ImageUploadService'

const client = generateClient<Schema>()

export interface CreatePostData {
  content: string
  images?: File[]
}

export interface PostData {
  id: string
  content: string
  imageKeys: string[]
  imageUrls: string[]
  authorId: string
  authorName: string
  authorProfilePhoto: string
  createdAt: string
  updatedAt: string
  likes: number
  comments: number
}

export class PostService {
  /**
   * Create a new post with optional images
   */
  static async createPost(postData: CreatePostData): Promise<PostData> {
    try {
      const user = await getCurrentUser()
      
      // Get user profile for author info
      let userProfile
      try {
        userProfile = await client.models.UserProfile.list({
          filter: { 
            owner: { eq: user.userId }
          }
        })
      } catch (error) {
        console.warn('Failed to get user profile by owner, trying by id:', error)
        userProfile = await client.models.UserProfile.list({
          filter: { id: { eq: user.userId } }
        })
      }
      
      const profile = userProfile.data[0]
      
      // Build author name with fallback logic
      let authorName = 'User'
      if (profile?.firstName || profile?.lastName) {
        authorName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      } else if (user.signInDetails?.loginId) {
        // Use the part before @ in email as fallback, make it look like a proper name
        const emailPart = user.signInDetails.loginId.split('@')[0]
        // Convert "sakthimari" to "Sakthimari"
        authorName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1)
      }
      
      // Get the profile photo URL using the key
      let authorProfilePhoto = ''
      if (profile?.profilePhotoKey) {
        try {
          const { getImageUrl } = await import('@/utils/imageUtils')
          authorProfilePhoto = await getImageUrl(profile.profilePhotoKey) || ''
          console.log('Got profile photo URL from key:', authorProfilePhoto)
        } catch (error) {
          console.warn('Failed to get profile photo URL:', error)
          authorProfilePhoto = profile?.profilePhotoUrl || ''
        }
      } else if (profile?.profilePhotoUrl) {
        authorProfilePhoto = profile.profilePhotoUrl
        console.log('Using stored profile photo URL:', authorProfilePhoto)
      }
      
      console.log('Final author data:', { authorName, authorProfilePhoto })

      let imageKeys: string[] = []
      let imageUrls: string[] = []

      // Upload images if provided
      if (postData.images && postData.images.length > 0) {
        const uploadPromises = postData.images.map(async (image) => {
          const timestamp = Date.now()
          const extension = image.name.split('.').pop()
          const filename = `post-${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`
          
          try {
            // Try to upload to feed-photos folder first
            const uploadResult = await ImageUploadService.uploadFeedPhoto(image, filename)
            return {
              key: uploadResult.key,
              url: uploadResult.url || ''
            }
          } catch (error) {
            // Fallback to public folder if feed-photos fails
            console.warn('Failed to upload to feed-photos, falling back to public folder:', error)
            const uploadResult = await ImageUploadService.uploadFeedPhotoPublic(image, filename)
            return {
              key: uploadResult.key,
              url: uploadResult.url || ''
            }
          }
        })

        const uploadResults = await Promise.all(uploadPromises)
        imageKeys = uploadResults.map(result => result.key)
        imageUrls = uploadResults.map(result => result.url)
      }

      // Create the post
      const result = await client.models.Post.create({
        content: postData.content,
        imageKeys,
        imageUrls,
        authorId: user.userId,
        authorName,
        authorProfilePhoto,
        likes: 0,
        comments: 0
      })

      if (!result.data) {
        throw new Error('Failed to create post')
      }

      return {
        id: result.data.id,
        content: result.data.content || '',
        imageKeys: (result.data.imageKeys || []).filter((key): key is string => key !== null),
        imageUrls: (result.data.imageUrls || []).filter((url): url is string => url !== null),
        authorId: result.data.authorId || '',
        authorName: result.data.authorName || '',
        authorProfilePhoto: result.data.authorProfilePhoto || '',
        createdAt: result.data.createdAt || new Date().toISOString(),
        updatedAt: result.data.updatedAt || new Date().toISOString(),
        likes: result.data.likes || 0,
        comments: result.data.comments || 0
      }
    } catch (error) {
      console.error('Error creating post:', error)
      throw new Error('Failed to create post. Please try again.')
    }
  }

  /**
   * Get all posts for the feed (only from connected users and own posts)
   */
  static async getPosts(limit: number = 20, nextToken?: string): Promise<{
    posts: PostData[]
    nextToken?: string
  }> {
    try {
      const currentUser = await getCurrentUser()
      const currentUserId = currentUser.userId
      
      // Get user's connections to filter posts
      let connections: Array<{ id: string; friendId: string; inviterId: string; createdAt: string | null }> = []
      try {
        const { getConnections } = await import('./ConnectionService')
        connections = await getConnections(currentUserId)
      } catch (error) {
        console.warn('Failed to load connections, showing only own posts:', error)
      }
      
      // Create array of allowed user IDs (connections + current user)
      const allowedUserIds = [
        currentUserId, // Include own posts
        ...connections.map(conn => conn.friendId) // Include posts from connected friends
      ]
      
      console.log('Loading feed for user:', currentUserId)
      console.log('User connections:', connections.length)
      console.log('Allowed post authors:', allowedUserIds)

      // If user has no connections, only show their own posts
      if (connections.length === 0) {
        console.log('User has no connections, showing only own posts')
      }

      const result = await client.models.Post.list({
        limit: limit * 2, // Get more posts since we'll filter them
        nextToken,
        authMode: 'userPool'
      })

      // Filter posts to only include those from connected users or self
      const filteredPosts = result.data.filter(post => {
        if (!post.authorId) return false // Skip posts without author ID
        const isAllowed = allowedUserIds.includes(post.authorId)
        if (!isAllowed) {
          console.log('Filtering out post from non-connected user:', post.authorId)
        }
        return isAllowed
      })

      // Take only the requested limit after filtering
      const postsToProcess = filteredPosts.slice(0, limit)

      console.log(`Loaded ${result.data.length} total posts, filtered to ${postsToProcess.length} from connected users`)

      // Process posts and regenerate image URLs from keys
      const posts: PostData[] = await Promise.all(
        postsToProcess.map(async (post) => {
          let freshImageUrls: string[] = []
          
          // Regenerate image URLs from keys to ensure they're not expired
          if (post.imageKeys && post.imageKeys.length > 0) {
            try {
              const { getImageUrl } = await import('@/utils/imageUtils')
              const urlPromises = post.imageKeys
                .filter((key): key is string => key !== null && key !== '')
                .map(async (key) => {
                  try {
                    return await getImageUrl(key)
                  } catch (error) {
                    console.warn('Failed to get URL for image key:', key, error)
                    return null
                  }
                })
              
              const urls = await Promise.all(urlPromises)
              freshImageUrls = urls.filter((url): url is string => url !== null && url !== '')
              
              console.log('Regenerated image URLs for post:', post.id, freshImageUrls)
            } catch (error) {
              console.warn('Failed to regenerate image URLs for post:', post.id, error)
              // Fallback to stored URLs if regeneration fails
              freshImageUrls = (post.imageUrls || []).filter((url): url is string => url !== null)
            }
          }

          // Regenerate profile photo URL if we have the profile
          let freshAuthorProfilePhoto = post.authorProfilePhoto || ''
          if (post.authorId) {
            try {
              // Try to get the user's current profile to regenerate the photo URL
              const userProfile = await client.models.UserProfile.list({
                filter: { 
                  owner: { eq: post.authorId }
                }
              })
              
              const profile = userProfile.data[0]
              if (profile?.profilePhotoKey) {
                try {
                  const { getImageUrl } = await import('@/utils/imageUtils')
                  const freshPhotoUrl = await getImageUrl(profile.profilePhotoKey)
                  if (freshPhotoUrl) {
                    freshAuthorProfilePhoto = freshPhotoUrl
                    console.log('Regenerated profile photo URL for post author:', post.authorName, freshPhotoUrl)
                  }
                } catch (error) {
                  console.warn('Failed to regenerate profile photo URL for author:', post.authorName, error)
                }
              }
            } catch (error) {
              console.warn('Failed to get profile for author:', post.authorName, error)
            }
          }

          return {
            id: post.id,
            content: post.content || '',
            imageKeys: (post.imageKeys || []).filter((key): key is string => key !== null),
            imageUrls: freshImageUrls,
            authorId: post.authorId || '',
            authorName: post.authorName || '',
            authorProfilePhoto: freshAuthorProfilePhoto,
            createdAt: post.createdAt || '',
            updatedAt: post.updatedAt || '',
            likes: post.likes || 0,
            comments: post.comments || 0
          }
        })
      )

      // Sort by creation date (newest first)
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return {
        posts,
        nextToken: result.nextToken || undefined
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      throw new Error('Failed to load posts. Please try again.')
    }
  }

  /**
   * Delete a post (only by the author)
   */
  static async deletePost(postId: string): Promise<void> {
    try {
      await client.models.Post.delete({ id: postId })
    } catch (error) {
      console.error('Error deleting post:', error)
      throw new Error('Failed to delete post. Please try again.')
    }
  }

  /**
   * Like/unlike a post
   */
  static async toggleLike(postId: string): Promise<void> {
    try {
      // This is a simplified implementation
      // In a real app, you'd have a separate Likes table to track individual likes
      const post = await client.models.Post.get({ id: postId })
      if (post.data) {
        await client.models.Post.update({
          id: postId,
          likes: (post.data.likes || 0) + 1
        })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      throw new Error('Failed to update like. Please try again.')
    }
  }

  /**
   * Debug method to check current user's connections
   */
  static async debugUserConnections(): Promise<void> {
    try {
      const currentUser = await getCurrentUser()
      const currentUserId = currentUser.userId
      
      console.log('=== DEBUG USER CONNECTIONS ===')
      console.log('Current user ID:', currentUserId)
      console.log('Current user email:', currentUser.signInDetails?.loginId)
      
      const { getConnections } = await import('./ConnectionService')
      const connections = await getConnections(currentUserId)
      
      console.log('Total connections:', connections.length)
      connections.forEach((conn, index) => {
        console.log(`Connection ${index + 1}:`, {
          id: conn.id,
          friendId: conn.friendId,
          inviterId: conn.inviterId,
          createdAt: conn.createdAt
        })
      })
      
      const allowedUserIds = [currentUserId, ...connections.map(conn => conn.friendId)]
      console.log('Posts will be shown from these user IDs:', allowedUserIds)
      console.log('=== END DEBUG ===')
    } catch (error) {
      console.error('Debug connections error:', error)
    }
  }
}
