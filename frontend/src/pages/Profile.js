import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Check,
  Clear,
  ExpandMore,
  PersonRemove
} from '@mui/icons-material';
import { endpoints, handleApiError } from '../config/api';

const Profile = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const userData =
    JSON.parse(localStorage.getItem('userData')) ||
    JSON.parse(sessionStorage.getItem('userData')) ||
    {};

  // Fetch user data + requests on load
  useEffect(() => {
    if (userData.id) {
      fetchUserData();
      fetchFriendRequests();
    }
  }, [userData.id]);

  const fetchUserData = async (retryCount = 0) => {
    try {
      const response = await fetch(`${endpoints.users}/${userData.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserName(data.name);
        setFriends(data.friends || []);
        setError('');
      } else {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }
    } catch (error) {
      const result = await handleApiError(error, retryCount);
      if (result === 'retrying') {
        return fetchUserData(retryCount + 1);
      }
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data');
    }
  };

  const fetchFriendRequests = async (retryCount = 0) => {
    try {
      const response = await fetch(`${endpoints.friendRequests}/${userData.id}`);
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);
        setError('');
      } else {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }
    } catch (error) {
      const result = await handleApiError(error, retryCount);
      if (result === 'retrying') {
        return fetchFriendRequests(retryCount + 1);
      }
      console.error('Error fetching friend requests:', error);
      setError('Failed to fetch friend requests');
    }
  };

  // ✅ Accept or Reject Friend Request
  const handleFriendRequest = async (request, status) => {
    try {
      setLoading(true);
      setError('');
      setInfo('');

      console.log('Accepting request from:', request); // Debug log

      const response = await fetch(
        `${endpoints.friendRequest}/${request._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fromUser: request.fromUser._id, // The sender's ID
            toUser: userData.id,           // Current user's ID (receiver)
            status
          })
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        // Update local state
        setFriendRequests((prevRequests) =>
          prevRequests.filter((r) => r._id !== request._id)
        );
        
        if (status === 'accepted') {
          // Add the new friend to the friends list
          const newFriend = {
            _id: request.fromUser._id,
            name: request.fromUser.name,
            email: request.fromUser.email,
            profileImage: request.fromUser.profileImage
          };
          setFriends(prevFriends => [...prevFriends, newFriend]);
          setInfo('✅ Friend request accepted');
        } else {
          setInfo('❌ Friend request rejected');
        }
        
        // Refresh data
        fetchUserData();
      } else {
        console.error('Server error:', data); // Debug log
        setError(data.message || 'Failed to update friend request');
      }
    } catch (error) {
      console.error('Error updating friend request:', error);
      setError('Error updating friend request');
    } finally {
      setLoading(false);
      setTimeout(fetchFriendRequests, 600);
    }
  };

  // 🗑️ Remove Friend
  const handleRemoveFriend = async (friendId) => {
    try {
      setLoading(true);
      setError('');
      setInfo('');

      const response = await fetch(endpoints.friends, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          friendId
        })
      });

      const data = await response.json();
      if (response.ok) {
        setFriends((prev) => prev.filter((f) => f._id !== friendId));
        setInfo('Friend removed successfully');
      } else {
        setError(data.message || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      setError('Error removing friend');
    } finally {
      setLoading(false);
      setTimeout(fetchUserData, 600);
    }
  };

  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Status Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {info && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {info}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left - Profile Info */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <input
              accept="image/*"
              type="file"
              id="profile-image-upload"
              hidden
              onChange={handleImageUpload}
            />
            <label htmlFor="profile-image-upload">
              <Avatar
                src={profileImage}
                sx={{
                  width: 200,
                  height: 200,
                  mx: 'auto',
                  mb: 2,
                  cursor: 'pointer'
                }}
              />
            </label>
            <Typography variant="h5" gutterBottom>
              {userName || 'User'}
            </Typography>
            <Button
              variant="contained"
              component="label"
              htmlFor="profile-image-upload"
              disabled={loading}
            >
              Change Photo
            </Button>
          </Paper>
        </Grid>

        {/* Right - Friends + Requests */}
        <Grid item xs={12} md={8}>
          {/* 🧑‍🤝‍🧑 Friends List */}
          <Accordion
            expanded={expandedPanel === 'friends'}
            onChange={handlePanelChange('friends')}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiAccordionSummary-expandIconWrapper': {
                  color: 'white'
                }
              }}
            >
              <Typography variant="h6">
                Friends ({friends.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List>
                {friends.map((friend) => (
                  <ListItem
                    key={friend._id}
                    secondaryAction={
                      <Tooltip title="Remove Friend">
                        <span>
                          <IconButton
                            onClick={() => handleRemoveFriend(friend._id)}
                            color="error"
                            size="small"
                            disabled={loading}
                          >
                            {loading ? (
                              <CircularProgress size={16} />
                            ) : (
                              <PersonRemove />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    }
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {friend.name ? friend.name.charAt(0) : '?'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={friend.name || 'Unknown'}
                      secondary={friend.email || ''}
                    />
                  </ListItem>
                ))}
                {friends.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No friends yet"
                      sx={{
                        color: 'text.secondary',
                        textAlign: 'center',
                        py: 2
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* 📨 Friend Requests */}
          <Accordion
            expanded={expandedPanel === 'requests'}
            onChange={handlePanelChange('requests')}
            sx={{ mt: 2 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                bgcolor: 'secondary.main',
                color: 'white',
                '& .MuiAccordionSummary-expandIconWrapper': {
                  color: 'white'
                }
              }}
            >
              <Typography variant="h6">
                Friend Requests ({friendRequests.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List>
                {friendRequests.map((req) => (
                  <ListItem
                    key={req._id}
                    secondaryAction={
                      <Box>
                        <Tooltip title="Accept Request">
                          <IconButton
                            onClick={() => handleFriendRequest(req, 'accepted')}
                            color="success"
                            size="small"
                            disabled={loading}
                          >
                            {loading ? <CircularProgress size={16} /> : <Check />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject Request">
                          <IconButton
                            onClick={() => handleFriendRequest(req, 'rejected')}
                            color="error"
                            size="small"
                            disabled={loading}
                          >
                            {loading ? <CircularProgress size={16} /> : <Clear />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {req.fromUser ? req.fromUser.name.charAt(0) : '?'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={req.fromUser ? req.fromUser.name : 'Unknown User'}
                      secondary={req.fromUser ? req.fromUser.email : ''}
                    />
                  </ListItem>
                ))}
                {friendRequests.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No pending friend requests"
                      sx={{
                        color: 'text.secondary',
                        textAlign: 'center',
                        py: 2
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
