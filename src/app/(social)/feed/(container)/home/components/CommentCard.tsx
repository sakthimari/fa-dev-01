import { useState } from 'react';
import { CommentData, CommentService } from '../../../../../../services/CommentService';
import { useAuthContext } from '../../../../../../context/useAuthContext';
import { formatDistanceToNow } from 'date-fns';

interface CommentCardProps {
  comment: CommentData;
  onCommentDeleted: () => void;
}

const CommentCard = ({ comment, onCommentDeleted }: CommentCardProps) => {
  const { user } = useAuthContext();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!comment.id || isDeleting) return;

    if (window.confirm('Are you sure you want to delete this comment?')) {
      setIsDeleting(true);
      try {
        const success = await CommentService.deleteComment(comment.id, comment.postId);
        if (success) {
          onCommentDeleted();
        } else {
          alert('Failed to delete comment. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  const getProfilePhotoUrl = () => {
    if (comment.authorProfilePhoto) {
      return comment.authorProfilePhoto;
    }
    // Fallback to generated avatar
    const initials = comment.authorName
      .split(' ')
      .map((name: string) => name.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=40`;
  };

  const isOwner = (user as any)?.userId === comment.authorId;

  return (
    <div className="d-flex mb-3">
      {/* Profile Picture */}
      <div className="flex-shrink-0 me-2">
        <img
          src={getProfilePhotoUrl()}
          alt={comment.authorName}
          className="rounded-circle"
          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const initials = comment.authorName
              .split(' ')
              .map((name: string) => name.charAt(0))
              .join('')
              .substring(0, 2)
              .toUpperCase();
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=40`;
          }}
        />
      </div>

      {/* Comment Content */}
      <div className="flex-grow-1">
        <div className="bg-light rounded-3 p-3 position-relative">
          {/* Author Name and Time */}
          <div className="d-flex justify-content-between align-items-start mb-1">
            <h6 className="mb-0 fw-bold text-primary">{comment.authorName}</h6>
            <div className="d-flex align-items-center">
              <small className="text-muted me-2">{getTimeAgo(comment.createdAt)}</small>
              {isOwner && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  title="Delete comment"
                >
                  {isDeleting ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <i className="bi bi-trash"></i>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Comment Text */}
          <p className="mb-0 text-dark">{comment.content}</p>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
