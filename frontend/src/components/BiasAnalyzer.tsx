import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  CircularProgress,
  Typography,
  Alert,
  Fade,
  useTheme,
  Tooltip,
  IconButton,
  Collapse,
  Chip,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  const [showInfo, setShowInfo] = useState(false);
  const theme = useTheme();

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

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
      category: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      score: value,
      fill: getBiasColor(key),
    }));
  };

  const getBiasColor = (bias: string): string => {
    const colors = {
      'left_wing': '#2196f3',      // Blue
      'right_wing': '#f44336',     // Red
      'extreme_left': '#0d47a1',   // Dark Blue
      'extreme_right': '#b71c1c',  // Dark Red
      'neutral': '#4caf50',        // Green
      'mixed': '#ff9800',          // Orange
    };
    return colors[bias as keyof typeof colors] || '#757575';
  };

  const getBiasDescription = (bias: string): string => {
    const descriptions = {
      'left_wing': 'Shows progressive or liberal leanings with support for social programs and regulation',
      'right_wing': 'Indicates conservative viewpoints emphasizing traditional values and free markets',
      'extreme_left': 'Reflects radical left positions advocating systemic change or revolution',
      'extreme_right': 'Demonstrates far-right stances on nationalism or extreme conservative views',
      'neutral': 'Presents balanced or objective viewpoints without strong political bias',
      'mixed': 'Contains elements from multiple political perspectives',
    };
    return descriptions[bias as keyof typeof descriptions] || '';
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
          },
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            Analyze Text
            <Tooltip title="Enter any text to analyze its political bias. The system will evaluate the content and provide a detailed breakdown of political leanings.">
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Enter text to analyze"
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            },
          }}
        />
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAnalyze}
            disabled={loading}
            sx={{
              minWidth: 200,
              height: 48,
              borderRadius: 24,
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 500,
              background: loading ? '' : 'linear-gradient(45deg, #2962ff 30%, #768fff 90%)',
              boxShadow: '0 3px 12px 0 rgba(41, 98, 255, 0.3)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px 0 rgba(41, 98, 255, 0.4)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Analyze'}
          </Button>
        </Box>
        {error && (
          <Fade in={!!error}>
            <Alert
              severity="error"
              sx={{
                mt: 2,
                borderRadius: 2,
                animation: 'slideIn 0.5s ease-out',
                '@keyframes slideIn': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(-10px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}
      </Paper>

      {result && (
        <Fade in={!!result} timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              animation: 'fadeInUp 0.8s ease-out',
              '@keyframes fadeInUp': {
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
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  textAlign: 'center',
                  color: theme.palette.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Analysis Results
                <IconButton
                  onClick={() => setShowInfo(!showInfo)}
                  sx={{
                    ml: 1,
                    transform: showInfo ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.3s',
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Typography>
              
              <Collapse in={showInfo}>
                <Paper
                  sx={{
                    p: 2,
                    mt: 2,
                    mb: 3,
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="body2" paragraph>
                    The analysis examines text for political bias across the spectrum:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {Object.keys(result.bias_scores).map((bias) => (
                      <Tooltip key={bias} title={getBiasDescription(bias)}>
                        <Chip
                          label={bias.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          sx={{
                            backgroundColor: getBiasColor(bias),
                            color: '#fff',
                            '&:hover': { opacity: 0.9 },
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Paper>
              </Collapse>
            </Box>
            
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Overall Bias:{' '}
                <Tooltip title={getBiasDescription(result.overall_bias)}>
                  <span
                    style={{
                      color: getBiasColor(result.overall_bias),
                      fontWeight: 'bold',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                      cursor: 'help',
                    }}
                  >
                    {result.overall_bias.replace('_', ' ').toUpperCase()}
                  </span>
                </Tooltip>
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Confidence Score:{' '}
                <Tooltip title="Higher confidence indicates stronger evidence of the detected bias">
                  <span style={{ fontWeight: 500, cursor: 'help' }}>
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </Tooltip>
              </Typography>
            </Box>
            
            <Box sx={{ width: '100%', height: 400, mb: 4 }}>
              <ResponsiveContainer>
                <BarChart data={getChartData(result.bias_scores)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis
                    tick={{ fill: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.divider }}
                  />
                  <RechartsTooltip
                    content={({ active, payload }: { active: boolean | undefined, payload: any[] | undefined }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <Box
                            sx={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              p: 1.5,
                              borderRadius: 1,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            }}
                          >
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>{data.category}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Score: {(data.score * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="score"
                    radius={[4, 4, 0, 0]}
                  >
                    {getChartData(result.bias_scores).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill}
                        fillOpacity={0.8}
                        stroke={entry.fill}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(0,0,0,0.02)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontStyle: 'italic',
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}
              >
                <InfoIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                The analysis considers context and nuance in political language.
                Scores reflect both explicit bias indicators and subtle language patterns.
                Higher scores indicate stronger alignment with each political category.
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontStyle: 'italic',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  mt: 2,
                }}
              >
                It's important to note that many of these keywords are context-sensitive — the presence of a term alone does not always indicate bias, but rather the tone, framing, and intent with which it is used contributes to the perceived slant.
              </Typography>
            </Box>
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default BiasAnalyzer; 