import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './firebase';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Theme: tree-stem brown primary and forest green secondary
const theme = createTheme({
  palette: {
    primary: {
      main: '#6B4C3B'
    },
    secondary: {
      main: '#2E7D32'
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
