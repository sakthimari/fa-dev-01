import { useState, useEffect } from 'react'
import { Alert, Button } from 'react-bootstrap'
import { PostService, type PostData } from '@/services/PostService'
import RealPostCard from './RealPostCard'
import LoadMoreButton from './LoadMoreButton'
import { BsArrowClockwise } from 'react-icons/bs'

const RealFeeds = () => {
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextToken, setNextToken] = useState<string | undefined>()
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefreshing, setAutoRefreshing] = useState(false)

  // Load initial posts
  useEffect(() => {
    loadPosts()
  }, [])

  // Listen for post creation events to auto-refresh the feed
  useEffect(() => {
    const handlePostCreated = () => {
      console.log('Post created event received, refreshing feed...')
      setAutoRefreshing(true)
      // Add a small delay to ensure the backend has processed the new post
      setTimeout(async () => {
        await handleRefresh()
        setAutoRefreshing(false)
      }, 1000) // 1 second delay
    }

    // Add event listener
    window.addEventListener('postCreated', handlePostCreated)

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('postCreated', handlePostCreated)
    }
  }, [])

  const loadPosts = async (loadMore: boolean = false) => {
    try {
      if (!loadMore) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      console.log('Loading posts...')
      const result = await PostService.getPosts(20, loadMore ? nextToken : undefined)
      console.log('Loaded posts:', result.posts)
      
      if (loadMore) {
        setPosts(prev => [...prev, ...result.posts])
      } else {
        setPosts(result.posts)
      }
      
      setNextToken(result.nextToken)
    } catch (err) {
      console.error('Error loading posts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      setError(null)
      console.log('Refreshing posts...')
      await loadPosts()
    } catch (err) {
      console.error('Error refreshing posts:', err)
      setError('Failed to refresh posts')
    } finally {
      setRefreshing(false)
    }
  }

  const handleLoadMore = () => {
    if (nextToken && !loadingMore) {
      loadPosts(true)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await PostService.deletePost(postId)
      setPosts(prev => prev.filter(post => post.id !== postId))
    } catch (err) {
      console.error('Error deleting post:', err)
      setError('Failed to delete post')
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      await PostService.toggleLike(postId)
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 }
          : post
      ))
    } catch (err) {
      console.error('Error liking post:', err)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading posts...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
        <button 
          className="btn btn-link p-0 ms-2" 
          onClick={() => loadPosts()}
        >
          Try again
        </button>
      </Alert>
    )
  }

  return (
    <>
      <style>
        {`
          .spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {/* Auto-refresh notification */}
      {autoRefreshing && (
        <Alert variant="info" className="mb-3 py-2">
          <div className="d-flex align-items-center">
            <BsArrowClockwise className="spin me-2" />
            <small>Updating feed with your new post...</small>
          </div>
        </Alert>
      )}
      
      {/* Refresh button */}
      <div className="mb-3 d-flex justify-content-end">
        <Button 
          variant="outline-secondary" 
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <BsArrowClockwise className={`me-1 ${refreshing ? 'spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Posts'}
        </Button>
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted mb-3">No posts yet</p>
          <p className="text-muted small">Be the first to share something!</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <RealPostCard 
              key={post.id}
              post={post}
              onDelete={handleDeletePost}
              onLike={handleLikePost}
            />
          ))}
          
          {nextToken && (
            <div className="text-center mt-4">
              <button 
                className="btn btn-primary-soft"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading more...
                  </>
                ) : (
                  'Load more posts'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default RealFeeds
