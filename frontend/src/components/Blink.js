import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  IconButton,
  TextField,
  Box,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import { endpoints } from '../config/api';
import {
  Favorite,
  Comment,
  Send,
  PersonAdd,
  CheckCircle
} from '@mui/icons-material';

const Blink = ({ blink }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [requestStatus, setRequestStatus] = useState('none'); // 'none' | 'pending' | 'friends'
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  // ✅ Load user data from localStorage/sessionStorage
  const userData =
    JSON.parse(localStorage.getItem('userData')) ||
    JSON.parse(sessionStorage.getItem('userData')) ||
    {};

  const isOwnPost = userData.id === blink?.userId?._id;

  // ✅ Fetch and track current request/friendship status
  const checkRequestStatus = async () => {
    if (!userData.id || isOwnPost) return;
    try {
      const response = await fetch(
        `${endpoints.friendRequests}/check/${userData.id}/${blink.userId._id}`
      );
      if (response.ok) {
        const { status, requestId } = await response.json();
        setRequestStatus(status || 'none');
        setRequestId(requestId || null);
      } else {
        console.error('Failed to check friend status:', response.status);
      }
    } catch (err) {
      console.error('Error checking request status:', err);
    }
  };

  useEffect(() => {
    checkRequestStatus();
  }, [userData.id, blink?.userId?._id, isOwnPost]);

  // ❤️ Like handler (placeholder)
  const handleLike = () => {
    console.log('Like clicked');
  };

  // 💬 Add Comment handler
  const handleAddComment = () => {
    if (newComment.trim()) {
      console.log('Adding comment:', newComment);
      setNewComment('');
    }
  };

  // 👥 Send Friend Request
  const handleFriendRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      setInfo(null);

      if (!userData.id) {
        setError('Please log in to send friend requests');
        return;
      }

      if (!blink.userId?._id) {
        setError('Missing target user data.');
        console.error('Missing user data:', {
          userId: userData.id,
          targetUserId: blink.userId?._id
        });
        return;
      }

      const response = await fetch(endpoints.friendRequest, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromUser: userData.id,
          toUser: blink.userId._id
        })
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (response.ok) {
        setRequestStatus('pending');
        if (data.requestId) setRequestId(data.requestId);
        setInfo('Friend request sent successfully!');
      } else {
        const errorMsg = data.message || 'Failed to send friend request';
        setError(errorMsg);
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
      }
    } catch (error) {
      setError('Error sending friend request');
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setTimeout(checkRequestStatus, 800); // auto-refresh state
    }
  };

  // ❌ Cancel Friend Request
  const handleCancelRequest = async () => {
    if (!requestId) {
      setError('No request to cancel');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setInfo(null);

      const response = await fetch(
        `${endpoints.friendRequest}/${requestId}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      console.log('Cancel response:', data);
      if (response.ok) {
        setRequestStatus('none');
        setRequestId(null);
        setInfo('Friend request cancelled');
      } else {
        setError(data.message || 'Failed to cancel request');
      }
    } catch (err) {
      setError('Error cancelling friend request');
      console.error('Error cancelling request:', err);
    } finally {
      setLoading(false);
      setTimeout(checkRequestStatus, 800);
    }
  };

  // 🚫 Remove Friend
  const handleRemoveFriend = async () => {
    try {
      setLoading(true);
      setError(null);
      setInfo(null);

      const response = await fetch(endpoints.friends, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          friendId: blink.userId._id
        })
      });

      const data = await response.json();
      console.log('Remove friend response:', data);
      if (response.ok) {
        setRequestStatus('none');
        setInfo('Removed from friends');
      } else {
        setError(data.message || 'Failed to remove friend');
      }
    } catch (err) {
      setError('Error removing friend');
      console.error('Error removing friend:', err);
    } finally {
      setLoading(false);
      setTimeout(checkRequestStatus, 800);
    }
  };

  if (!blink) return null;

  // 🧠 UI Rendering
  return (
    <Card sx={{ marginBottom: '1rem' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6">
            {blink.userId?.name || 'Anonymous'}
          </Typography>

          {!isOwnPost && (
            <>
              <Tooltip
                title={
                  requestStatus === 'friends'
                    ? 'Friends - Remove'
                    : requestStatus === 'pending'
                    ? 'Cancel Friend Request'
                    : 'Send Friend Request'
                }
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={
                      requestStatus === 'none'
                        ? handleFriendRequest
                        : requestStatus === 'pending'
                        ? handleCancelRequest
                        : handleRemoveFriend
                    }
                    data-testid="friend-action-button"
                    disabled={loading}
                    color={
                      requestStatus === 'friends'
                        ? 'success'
                        : requestStatus === 'pending'
                        ? 'warning'
                        : 'primary'
                    }
                    sx={{
                      transition: '0.2s ease',
                      '&.Mui-disabled': {
                        color:
                          requestStatus === 'friends'
                            ? 'success.main'
                            : 'inherit'
                      }
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : requestStatus === 'friends' ? (
                      <CheckCircle />
                    ) : requestStatus === 'pending' ? (
                      <Send />
                    ) : (
                      <PersonAdd />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert severity="success" sx={{ mt: 1, mb: 1 }}>
            {info}
          </Alert>
        )}

        <Typography color="textSecondary" gutterBottom>
          {new Date(blink.createdAt).toLocaleDateString()}
        </Typography>

        <Typography variant="body2" sx={{ marginBottom: 1 }}>
          {blink.content}
        </Typography>

        {blink.mediaDataUrl && (
          <Box sx={{ mt: 2, mb: 2 }}>
            {blink.mediaType === 'image' ? (
              <CardMedia
                component="img"
                image={blink.mediaDataUrl}
                alt="Blink media"
                sx={{
                  maxHeight: 400,
                  objectFit: 'contain',
                  backgroundColor: '#f5f5f5'
                }}
              />
            ) : blink.mediaType === 'video' ? (
              <CardMedia
                component="video"
                src={blink.mediaDataUrl}
                controls
                sx={{
                  maxHeight: 400,
                  backgroundColor: '#f5f5f5'
                }}
              />
            ) : null}
          </Box>
        )}
      </CardContent>

      <CardActions disableSpacing>
        <IconButton onClick={handleLike} color="primary">
          <Favorite />
        </IconButton>
        <IconButton
          onClick={() => setShowComments(!showComments)}
          color="primary"
        >
          <Comment />
        </IconButton>
      </CardActions>

      {showComments && (
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
            />
            <IconButton onClick={handleAddComment} color="primary">
              <Send />
            </IconButton>
          </Box>
        </CardContent>
      )}
    </Card>
  );
};

export default Blink;
