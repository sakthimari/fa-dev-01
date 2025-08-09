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
   * Get all posts for the feed
   */
  static async getPosts(limit: number = 20, nextToken?: string): Promise<{
    posts: PostData[]
    nextToken?: string
  }> {
    try {
      const result = await client.models.Post.list({
        limit,
        nextToken,
        authMode: 'userPool'
      })

      // Process posts and regenerate image URLs from keys
      const posts: PostData[] = await Promise.all(
        result.data.map(async (post) => {
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
}
