import React, { useState, useEffect } from 'react';
import { Container, CircularProgress, Box, Alert } from '@mui/material';
import axios from 'axios';
import Blink from '../components/Blink';
import CreateBlink from '../components/CreateBlink';
import { endpoints } from '../config/api';

const Home = () => {
  const [blinks, setBlinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBlinks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(endpoints.blinks);
      setBlinks(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching blinks:', error);
      setError('Failed to load blinks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlinks();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" style={{ marginTop: '2rem' }}>
      <CreateBlink onBlinkCreated={fetchBlinks} />
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {blinks.map(blink => (
        <Blink key={blink._id} blink={blink} />
      ))}
    </Container>
  );
};

export default Home;