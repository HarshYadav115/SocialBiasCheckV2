import React, { useState, ChangeEvent } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { BiasAnalysis } from '../types';

interface Props {
  onAnalysisComplete: (result: BiasAnalysis) => void;
  result: BiasAnalysis | null;
}

const BiasAnalyzer: React.FC<Props> = ({ onAnalysisComplete, result }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<BiasAnalysis>('http://localhost:8000/analyze', { text });
      onAnalysisComplete(response.data);
    } catch (err) {
      setError('Failed to analyze text. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = (biasScores: BiasAnalysis['bias_scores']) => {
    return Object.entries(biasScores).map(([key, value]) => ({
      category: key.replace('_', ' ').toUpperCase(),
      score: value,
    }));
  };

  const getBiasColor = (bias: string): string => {
    const colors = {
      'left_wing': '#2196f3',
      'right_wing': '#f44336',
      'extreme_left': '#1565c0',
      'extreme_right': '#b71c1c',
      'neutral': '#4caf50',
      'mixed': '#ff9800',
    };
    return colors[bias as keyof typeof colors] || '#757575';
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Enter text to analyze (Press Enter to analyze)"
          value={text}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAnalyze}
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Analyze'}
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {result && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Analysis Results
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Overall Bias:{' '}
              <span style={{ color: getBiasColor(result.overall_bias), fontWeight: 'bold' }}>
                {result.overall_bias.replace('_', ' ').toUpperCase()}
              </span>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confidence Score: {(result.confidence * 100).toFixed(1)}%
            </Typography>
          </Box>
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={getChartData(result.bias_scores)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default BiasAnalyzer; 