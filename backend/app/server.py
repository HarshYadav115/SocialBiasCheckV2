from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from typing import Dict, List, Set, Tuple
import logging
from collections import defaultdict
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load bias keywords
KEYWORDS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'bias_keywords.json')
with open(KEYWORDS_PATH) as f:
    BIAS_KEYWORDS = json.load(f)

# Preprocess keywords for faster matching
PROCESSED_KEYWORDS = {
    'extreme_right': set(kw.lower() for kw in BIAS_KEYWORDS['extreme_right']['keywords']),
    'extreme_left': set(kw.lower() for kw in BIAS_KEYWORDS['extreme_left']['keywords']),
    'left_wing': {
        'economic': set(kw.lower() for kw in BIAS_KEYWORDS['left_wing']['economic']),
        'social': set(kw.lower() for kw in BIAS_KEYWORDS['left_wing']['social'])
    },
    'right_wing': {
        'economic': set(kw.lower() for kw in BIAS_KEYWORDS['right_wing']['economic']),
        'social': set(kw.lower() for kw in BIAS_KEYWORDS['right_wing']['social'])
    },
    'neutral': set(kw.lower() for kw in BIAS_KEYWORDS['neutral_terms'])
}

def find_phrase_matches(text: str, phrases: Set[str]) -> List[str]:
    """Optimized phrase matching with high sensitivity to individual keywords."""
    processed_text = text.lower()
    input_words = set(processed_text.split())
    matches = []
    
    for phrase in phrases:
        phrase_lower = phrase.lower()
        
        # Check for exact phrase match
        if phrase_lower in processed_text:
            matches.append(phrase)
            continue
        
        # Check for individual word matches
        phrase_words = set(phrase_lower.split())
        
        # For single words, check if they are contained within any input word
        if len(phrase_words) == 1:
            phrase_word = next(iter(phrase_words))
            for input_word in input_words:
                if phrase_word in input_word:
                    matches.append(phrase)
                    break
        # For multi-word phrases, check if any significant portion of words match
        else:
            common_words = input_words.intersection(phrase_words)
            # More lenient threshold - even one or two matching words might indicate bias
            if len(common_words) >= max(1, len(phrase_words) * 0.3):  # Even more reduced threshold
                matches.append(phrase)
                
    return matches

def calculate_bias_scores(text: str) -> Tuple[Dict[str, float], Dict[str, List[str]]]:
    """Calculate bias scores with increased sensitivity to keywords."""
    scores = {
        "left_wing": 0,
        "right_wing": 0,
        "extreme_left": 0,
        "extreme_right": 0,
        "neutral": 0
    }
    detected_phrases = defaultdict(list)
    
    # Process extreme categories first with higher weight
    for category in ['extreme_right', 'extreme_left']:
        matches = find_phrase_matches(text, PROCESSED_KEYWORDS[category])
        if matches:
            # Increased weight for extreme matches
            scores[category] += len(matches) * 2.0
            detected_phrases[category].extend(matches)
    
    # Process wing categories
    for wing in ['left_wing', 'right_wing']:
        for category in ['economic', 'social']:
            matches = find_phrase_matches(text, PROCESSED_KEYWORDS[wing][category])
            if matches:
                # Increased weight for wing matches
                scores[wing] += len(matches) * 1.2
                detected_phrases[wing].extend(matches)
    
    # Process neutral terms with reduced impact
    matches = find_phrase_matches(text, PROCESSED_KEYWORDS['neutral'])
    if matches:
        scores["neutral"] += len(matches) * 0.3  # Reduced neutral weight significantly
        detected_phrases["neutral"].extend(matches)
    
    # Add baseline scores for any matches to ensure non-neutral results
    for category in scores:
        if scores[category] > 0:
            scores[category] += 0.5  # Increased baseline score
    
    # Normalize scores
    total_score = sum(scores.values())
    if total_score > 0:
        for category in scores:
            scores[category] = scores[category] / total_score
    
    return scores, dict(detected_phrases)

def determine_overall_bias(scores: Dict[str, float]) -> Tuple[str, float]:
    """Determine overall bias with lower thresholds for bias detection."""
    max_score = max(scores.values())
    if max_score == 0:
        return "neutral", 0.0
    
    # Much lower threshold for detecting bias
    threshold = max_score * 0.5  # Significantly reduced threshold
    dominant_categories = [cat for cat, score in scores.items() if score >= threshold]
    
    # Handle extreme categories first
    extreme_categories = ["extreme_left", "extreme_right"]
    has_extreme = any(cat in extreme_categories for cat in dominant_categories)
    
    if has_extreme:
        # If both extreme categories are present
        if "extreme_left" in dominant_categories and "extreme_right" in dominant_categories:
            return "mixed extreme", max_score
        # Return the extreme category with highest score
        extreme_scores = {cat: scores[cat] for cat in extreme_categories if scores[cat] > 0}
        if extreme_scores:
            return max(extreme_scores.items(), key=lambda x: x[1])[0], max_score
    
    # Handle regular categories
    if "neutral" in dominant_categories:
        # Prefer non-neutral categories even with slightly lower scores
        non_neutral = {cat: score for cat, score in scores.items() 
                      if score > 0 and cat != "neutral" and cat not in extreme_categories}
        if non_neutral:
            return max(non_neutral.items(), key=lambda x: x[1])[0], max_score
    
    # Return highest scoring category, excluding neutral if possible
    non_neutral_scores = {cat: score for cat, score in scores.items() 
                         if score > 0 and cat != "neutral"}
    if non_neutral_scores:
        return max(non_neutral_scores.items(), key=lambda x: x[1])[0], max_score
    
    return max(scores.items(), key=lambda x: x[1])[0], max_score

class BiasAnalyzerHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        """Helper method to send CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            response = {'status': 'ok', 'message': 'Bias Analyzer API is running'}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_error(404, 'Not Found')

    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/analyze':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length == 0:
                    self.send_error(400, 'Empty request body')
                    return

                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                if not request_data.get('text', '').strip():
                    self.send_error(400, 'Text cannot be empty')
                    return
                
                bias_scores, detected_phrases = calculate_bias_scores(request_data['text'])
                overall_bias, confidence = determine_overall_bias(bias_scores)
                
                response_data = {
                    'text': request_data['text'],
                    'bias_scores': bias_scores,
                    'overall_bias': overall_bias,
                    'confidence': confidence,
                    'detected_phrases': detected_phrases
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode())
            except json.JSONDecodeError:
                self.send_error(400, 'Invalid JSON')
            except Exception as e:
                logger.error(f"Error analyzing text: {str(e)}")
                self.send_error(500, 'Internal Server Error')
        else:
            self.send_error(404, 'Not Found')

def run_server(port=8000):
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, BiasAnalyzerHandler)
    print(f'Starting server on http://127.0.0.1:{port}')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        httpd.server_close()

if __name__ == '__main__':
    run_server() 