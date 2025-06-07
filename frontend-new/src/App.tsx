import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import BiasAnalyzer from './components/BiasAnalyzer';
import { BiasAnalysis } from './types';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [analysisResult, setAnalysisResult] = useState<BiasAnalysis | null>(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Political Bias Detector
          </Typography>
          <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary">
            Analyze political bias in social media posts using AI
          </Typography>
          <BiasAnalyzer onAnalysisComplete={setAnalysisResult} result={analysisResult} />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
