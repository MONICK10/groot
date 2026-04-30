import React, { useState, useRef } from 'react';
import {
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Box,
  Card,
  CardMedia,
  CircularProgress
} from '@mui/material';
import {
  PhotoCamera,
  VideoCall,
  EmojiEmotions,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { api, endpoints } from '../config/api';

const CreateBlink = ({ onBlinkCreated }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check word count
    if (content.split(' ').length > 15) {
      setError('Blink cannot exceed 15 words');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user data from storage
      const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
      if (!userData || !userData.id) {
        setError('You must be logged in to create a blink');
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('content', content);
      formData.append('userId', userData.id);
      
      if (fileInputRef.current?.files[0]) {
        formData.append('media', fileInputRef.current.files[0]);
        formData.append('mediaType', mediaType);
      }

      await api.post(endpoints.blinks, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Clear form
      setContent('');
      setMediaPreview(null);
      setMediaType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh blinks list
      if (onBlinkCreated) {
        onBlinkCreated();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating blink');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaUpload = (type) => {
    fileInputRef.current.setAttribute('accept', type === 'photo' ? 'image/*' : 'video/*');
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear previous error
      setError('');
      
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        setError('Only image and video files are allowed');
        fileInputRef.current.value = '';
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        fileInputRef.current.value = '';
        return;
      }

      // Set media type first
      setMediaType(isImage ? 'image' : 'video');

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreview(reader.result);
      };
      reader.onerror = () => {
        setError('Error reading file');
        setMediaPreview(null);
        setMediaType(null);
        fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onEmojiClick = (emojiObject) => {
    setContent(prevContent => prevContent + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <Paper style={{ padding: '2rem', maxWidth: '500px', margin: '2rem auto' }}>
      <Typography variant="h5" gutterBottom>
        Create a Blink
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="What's on your mind? (15 words max)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={!!error}
          helperText={error || `${content.split(' ').length}/15 words`}
          style={{ marginBottom: '1rem' }}
        />
        
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <IconButton 
            color="primary" 
            onClick={() => handleMediaUpload('photo')}
            title="Upload Photo"
          >
            <PhotoCamera />
          </IconButton>
          <IconButton 
            color="primary" 
            onClick={() => handleMediaUpload('video')}
            title="Upload Video"
          >
            <VideoCall />
          </IconButton>
          <IconButton 
            color="primary" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add Emoji"
          >
            <EmojiEmotions />
          </IconButton>
        </Box>

        {showEmojiPicker && (
          <Box sx={{ mb: 2, position: 'relative' }}>
            <Card sx={{ position: 'absolute', zIndex: 1 }}>
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </Card>
          </Box>
        )}

        {mediaPreview && (
          <Card sx={{ mb: 2, position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
              <IconButton
                size="small"
                onClick={handleRemoveMedia}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            {mediaType === 'image' ? (
              <CardMedia
                component="img"
                image={mediaPreview}
                alt="Upload preview"
                sx={{
                  maxHeight: 300,
                  objectFit: 'contain',
                  bgcolor: '#f5f5f5'
                }}
              />
            ) : (
              <CardMedia
                component="video"
                src={mediaPreview}
                controls
                sx={{
                  maxHeight: 300,
                  bgcolor: '#f5f5f5'
                }}
              />
            )}
          </Card>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSubmitting}
          startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
        >
          {isSubmitting ? 'Posting...' : 'Post Blink'}
        </Button>
      </form>
    </Paper>
  );
};

export default CreateBlink;