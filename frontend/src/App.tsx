import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Paper,
} from '@mui/material';
import BiasAnalyzer from './components/BiasAnalyzer';
import { BiasAnalysis } from './types';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',    // Blue (left wing)
      light: '#64b5f6',
      dark: '#0d47a1',    // Dark Blue (extreme left)
    },
    secondary: {
      main: '#f44336',    // Red (right wing)
      light: '#ff7961',
      dark: '#b71c1c',    // Dark Red (extreme right)
    },
    success: {
      main: '#4caf50',    // Green (neutral)
      light: '#81c784',
      dark: '#388e3c',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '0.5px',
    },
    body1: {
      lineHeight: 1.8,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        },
      },
    },
  },
});

function App() {
  const [analysisResult, setAnalysisResult] = useState<BiasAnalysis | null>(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 33%, #b71c1c 66%, #d32f2f 100%)',
          position: 'relative',
          pt: 4,
          pb: 8,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M0 0h20L0 20z"/%3E%3Cpath d="M20 0v20H0z"/%3E%3C/g%3E%3C/svg%3E")',
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box
            sx={{
              textAlign: 'center',
              mb: 6,
              animation: 'fadeIn 1s ease-out',
              '@keyframes fadeIn': {
                from: {
                  opacity: 0,
                  transform: 'translateY(-20px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                color: '#ffffff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                mb: 3,
              }}
            >
              Political Bias Detector
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                maxWidth: '800px',
                margin: '0 auto',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                color="text.secondary"
                sx={{
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                Analyze political bias in text using advanced AI technology. Our system detects subtle biases across the political spectrum, from extreme left to extreme right positions.
              </Typography>
            </Paper>
          </Box>
          <Box
            sx={{
              animation: 'slideUp 1s ease-out 0.5s both',
              '@keyframes slideUp': {
                from: {
                  opacity: 0,
                  transform: 'translateY(20px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            <BiasAnalyzer onAnalysisComplete={setAnalysisResult} result={analysisResult} />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
