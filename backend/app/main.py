from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from typing import Dict, List, Set, Tuple
import re
from collections import defaultdict
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Bias Detection API")

# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with your Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load bias keywords with absolute path for Vercel
KEYWORDS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'bias_keywords.json')
with open(KEYWORDS_PATH) as f:
    BIAS_KEYWORDS = json.load(f)

class TextInput(BaseModel):
    text: str

class BiasAnalysis(BaseModel):
    text: str
    bias_scores: Dict[str, float]
    overall_bias: str
    confidence: float
    detected_phrases: Dict[str, List[str]]  # New field to show matched phrases

def get_ngrams(text: str, n: int) -> Set[str]:
    """Generate n-grams from text."""
    words = text.split()
    return set(' '.join(words[i:i+n]) for i in range(len(words)-n+1))

def find_phrase_matches(text: str, phrases: List[str]) -> List[str]:
    """Find matching phrases in text, handling word boundaries, variations, and partial matches."""
    text = text.lower()
    text_words = text.split()
    matches = []
    
    for phrase in phrases:
        phrase = phrase.lower()
        phrase_words = phrase.split()
        
        # First try exact phrase match (case insensitive)
        if phrase in text:
            logger.debug(f"Exact match found for phrase: {phrase}")
            matches.append(phrase)
            continue
            
        # Then try matching individual words and their variations
        matched_words = 0
        word_matches = []
        
        # Create sets of text words and their substrings for more efficient matching
        text_word_set = set(text_words)
        text_substrings = {w[i:j] for w in text_words 
                          for i in range(len(w)) 
                          for j in range(i + 3, len(w) + 1)}  # Min 3 chars for substring
        
        for phrase_word in phrase_words:
            # Check for exact word match
            if phrase_word in text_word_set:
                matched_words += 1
                word_matches.append(phrase_word)
                continue
                
            # Check if any word in text contains this phrase word
            # or if phrase word contains any text word
            found_match = False
            for text_word in text_words:
                # Check various matching conditions
                if (phrase_word in text_word or 
                    text_word in phrase_word or
                    phrase_word in text_substrings or
                    any(sub in phrase_word for sub in text_substrings if len(sub) >= 3)):
                    matched_words += 1
                    word_matches.append(f"{phrase_word}=>{text_word}")
                    found_match = True
                    break
            
            if found_match:
                continue
                
            # Check for common word variations
            word_variations = [
                phrase_word.rstrip('s'),  # Handle plurals
                phrase_word.rstrip('ed'),  # Handle past tense
                phrase_word.rstrip('ing'),  # Handle gerund
                phrase_word + 's',  # Handle singular to plural
                phrase_word + 'ed',  # Handle present to past
                phrase_word + 'ing'  # Handle to gerund
            ]
            
            for variation in word_variations:
                if variation in text_word_set or variation in text_substrings:
                    matched_words += 1
                    word_matches.append(f"{phrase_word}=>{variation}")
                    break
        
        # Lower the threshold to 60% for more flexible matching
        match_ratio = matched_words / len(phrase_words)
        if match_ratio >= 0.6:
            logger.debug(f"Partial match found for phrase: {phrase}")
            logger.debug(f"Matched words ({match_ratio:.1%}): {', '.join(word_matches)}")
            matches.append(phrase)
    
    return matches

def calculate_bias_scores(text: str) -> Tuple[Dict[str, float], Dict[str, List[str]]]:
    """Calculate bias scores and return detected phrases."""
    # Initialize scores and detected phrases
    scores = {
        "left_wing": 0,
        "right_wing": 0,
        "extreme_left": 0,
        "extreme_right": 0,
        "neutral": 0
    }
    detected_phrases = defaultdict(list)
    
    # Process extreme categories first (higher priority)
    # Process extreme right keywords
    matches = find_phrase_matches(text, BIAS_KEYWORDS["extreme_right"]["keywords"])
    if matches:
        logger.info(f"Found {len(matches)} extreme right matches: {matches}")
        scores["extreme_right"] += len(matches) * 2.0  # Higher weight for extreme terms
        detected_phrases["extreme_right"].extend(matches)
    
    # Process extreme left keywords
    matches = find_phrase_matches(text, BIAS_KEYWORDS["extreme_left"]["keywords"])
    if matches:
        logger.info(f"Found {len(matches)} extreme left matches: {matches}")
        scores["extreme_left"] += len(matches) * 2.0  # Higher weight for extreme terms
        detected_phrases["extreme_left"].extend(matches)
    
    # Process left wing keywords
    for category in ["economic", "social"]:
        matches = find_phrase_matches(text, BIAS_KEYWORDS["left_wing"][category])
        if matches:
            logger.info(f"Found {len(matches)} left wing {category} matches: {matches}")
            scores["left_wing"] += len(matches) * 1.0
            detected_phrases["left_wing"].extend(matches)
    
    # Process right wing keywords
    for category in ["economic", "social"]:
        matches = find_phrase_matches(text, BIAS_KEYWORDS["right_wing"][category])
        if matches:
            logger.info(f"Found {len(matches)} right wing {category} matches: {matches}")
            scores["right_wing"] += len(matches) * 1.0
            detected_phrases["right_wing"].extend(matches)
    
    # Process neutral terms last (lower priority)
    matches = find_phrase_matches(text, BIAS_KEYWORDS["neutral_terms"])
    if matches:
        logger.info(f"Found {len(matches)} neutral matches: {matches}")
        scores["neutral"] += len(matches) * 0.75  # Adjusted weight for neutral terms
        detected_phrases["neutral"].extend(matches)
    
    # Log raw scores before normalization
    logger.info(f"Raw scores before normalization: {scores}")
    
    # Normalize scores
    total_score = sum(scores.values())
    if total_score > 0:
        for category in scores:
            scores[category] = scores[category] / total_score
            
    # Log final normalized scores
    logger.info(f"Final normalized scores: {scores}")
    
    return scores, dict(detected_phrases)

def determine_overall_bias(scores: Dict[str, float]) -> tuple[str, float]:
    """Determine overall bias and confidence level."""
    # Calculate the dominant bias
    max_score = max(scores.values())
    if max_score == 0:
        return "neutral", 0.0
    
    # Find categories with scores close to max_score (within 15%)
    threshold = max_score * 0.85  # Increased threshold for mixed bias detection
    dominant_categories = [cat for cat, score in scores.items() if score >= threshold]
    
    # Special handling for extreme categories
    extreme_categories = ["extreme_left", "extreme_right"]
    has_extreme = any(cat in extreme_categories for cat in dominant_categories)
    
    if has_extreme:
        # If an extreme category is dominant, prefer it
        extreme_scores = {cat: scores[cat] for cat in extreme_categories if cat in dominant_categories}
        if extreme_scores:
            dominant_category = max(extreme_scores.items(), key=lambda x: x[1])[0]
            return dominant_category, scores[dominant_category]
    
    if len(dominant_categories) > 1:
        return "mixed", max_score
    
    dominant_category = dominant_categories[0]
    confidence = max_score
    
    return dominant_category, confidence

@app.post("/analyze", response_model=BiasAnalysis)
async def analyze_text(input_data: TextInput):
    logger.info(f"Received analysis request for text: {input_data.text[:100]}...")
    
    if not input_data.text.strip():
        logger.warning("Received empty text for analysis")
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        # Calculate bias scores and get detected phrases
        bias_scores, detected_phrases = calculate_bias_scores(input_data.text)
        
        # Determine overall bias and confidence
        overall_bias, confidence = determine_overall_bias(bias_scores)
        
        result = BiasAnalysis(
            text=input_data.text,
            bias_scores=bias_scores,
            overall_bias=overall_bias,
            confidence=confidence,
            detected_phrases=detected_phrases
        )
        logger.info(f"Analysis complete. Overall bias: {overall_bias}, Confidence: {confidence:.2f}")
        return result
        
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/categories")
async def get_categories():
    return {
        "categories": list(BIAS_KEYWORDS.keys()),
        "description": "Available bias categories for analysis"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 