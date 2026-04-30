import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Link, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api, endpoints, handleApiError } from '../config/api';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e, retryCount = 0) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(endpoints.signup, {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      if (response.data && response.data.user) {
        // Optional: Store user data if needed
        navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const result = await handleApiError(error, retryCount);
      if (result === 'retrying') {
        return handleSubmit(e, retryCount + 1);
      }
      setError(error.response?.data?.message || 'Error signing up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper style={{ padding: '2rem', maxWidth: '400px', margin: '2rem auto' }}>
      <Typography variant="h5" align="center" gutterBottom>
        Create Account
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          margin="normal"
          required
        />
        {error && (
          <Typography color="error" align="center" style={{ margin: '1rem 0' }}>
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          style={{ marginTop: '1rem' }}
        >
          Sign Up
        </Button>
        <Typography align="center" style={{ marginTop: '1rem' }}>
          Already have an account? <Link href="/login">Sign In</Link>
        </Typography>
      </form>
    </Paper>
  );
};

export default SignUp;