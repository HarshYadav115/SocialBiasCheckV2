export type BiasCategory = 'left_wing' | 'right_wing' | 'extreme_left' | 'extreme_right' | 'neutral';

export interface BiasScores {
  left_wing: number;
  right_wing: number;
  extreme_left: number;
  extreme_right: number;
  neutral: number;
}

export interface BiasAnalysis {
  text: string;
  bias_scores: BiasScores;
  overall_bias: string;
  confidence: number;
  detected_phrases: { [key: string]: string[] };
}