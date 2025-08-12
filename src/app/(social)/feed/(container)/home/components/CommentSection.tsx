import { useState, useEffect } from 'react';
import { CommentData, CommentService } from '../../../../../../services/CommentService';
import { useAuthContext } from '../../../../../../context/useAuthContext';
import { useProfile } from '../../../../../../hooks/useProfile';
import CommentCard from './CommentCard';

interface CommentSectionProps {
  postId: string;
  initialCommentCount?: number;
  onCommentCountChange?: (newCount: number) => void;
}

const CommentSection = ({ postId, initialCommentCount = 0, onCommentCountChange }: CommentSectionProps) => {
  const { user } = useAuthContext();
  const { profile } = useProfile();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  console.log('CommentSection rendering for postId:', postId);
  console.log('User:', user);
  console.log('Profile:', profile);

  // Load comments when section is expanded
  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const fetchedComments = await CommentService.getCommentsByPostId(postId);
      setComments(fetchedComments);
      setCommentCount(fetchedComments.length);
      onCommentCountChange?.(fetchedComments.length);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted!');
    console.log('Comment text:', newComment);
    
    if (!newComment.trim()) {
      console.log('No comment text provided');
      return;
    }

    setIsSubmitting(true);
    try {
      const commentData = {
        content: newComment.trim(),
        postId,
      };

      console.log('Final comment data to send:', commentData);

      const createdComment = await CommentService.createComment(commentData);
      
      console.log('Comment creation result:', createdComment);

      if (createdComment) {
        console.log('Comment created successfully!');
        // Add the new comment to the list
        setComments(prevComments => [createdComment, ...prevComments]);
        setNewComment('');
        setCommentCount(prev => prev + 1);
        onCommentCountChange?.(commentCount + 1);
        
        // Show comments if they weren't visible
        if (!showComments) {
          setShowComments(true);
        }
      } else {
        console.error('Comment creation returned null');
        alert('Failed to create comment. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleSubmitComment:', error);
      alert('Error creating comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentDeleted = () => {
    // Reload comments to get fresh count
    loadComments();
  };

  const getProfilePhotoUrl = () => {
    if (profile?.profilePhotoUrl) {
      return profile.profilePhotoUrl;
    }
    // Fallback to generated avatar
    if (profile?.firstName && profile?.lastName) {
      const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=32`;
    }
    return `https://ui-avatars.com/api/?name=U&background=6366f1&color=fff&size=32`;
  };

  return (
    <div className="border-top pt-3">
      {/* Comment Count and Toggle */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          type="button"
          className="btn btn-link text-decoration-none p-0"
          onClick={() => setShowComments(!showComments)}
        >
          <i className={`bi bi-chat me-2 ${showComments ? 'text-primary' : 'text-muted'}`}></i>
          <span className={showComments ? 'text-primary' : 'text-muted'}>
            {commentCount === 0 ? 'No comments' : `${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
          </span>
        </button>
        
        {commentCount > 0 && (
          <small className="text-muted">
            {showComments ? 'Hide comments' : 'Show comments'}
          </small>
        )}
      </div>

      {/* Comment Creation Form */}
      <form onSubmit={handleSubmitComment} className="mb-3">
        <div className="d-flex">
          <div className="flex-shrink-0 me-2">
            <img
              src={getProfilePhotoUrl()}
              alt="Your profile"
              className="rounded-circle"
              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
            />
          </div>
          <div className="flex-grow-1">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  <i className="bi bi-send"></i>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {showComments && (
        <div className="comments-list">
          {isLoading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading comments...</span>
              </div>
            </div>
          ) : comments.length > 0 ? (
            <div className="border-top pt-3">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onCommentDeleted={handleCommentDeleted}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-muted">
              <i className="bi bi-chat-square-text fs-3 d-block mb-2"></i>
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
