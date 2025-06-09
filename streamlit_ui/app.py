import streamlit as st
import requests
import json
import plotly.graph_objects as go
import pandas as pd

# Configure the page
st.set_page_config(
    page_title="Bias Detection System",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .stTextArea textarea {
        height: 200px;
    }
    .bias-card {
        padding: 20px;
        border-radius: 5px;
        margin: 10px 0;
    }
    .extreme-left { background-color: rgba(255, 0, 0, 0.1); }
    .left-wing { background-color: rgba(255, 150, 150, 0.1); }
    .neutral { background-color: rgba(200, 200, 200, 0.1); }
    .right-wing { background-color: rgba(0, 0, 255, 0.1); }
    .extreme-right { background-color: rgba(0, 0, 150, 0.1); }
</style>
""", unsafe_allow_html=True)

# Title and description
st.title("🔍 Political Bias Detection System")
st.markdown("""
This tool analyzes text for potential political bias across different categories:
- **Extreme Left**: Strong leftist or revolutionary communist views
- **Left Wing**: Progressive economic and social policies
- **Neutral**: Balanced or unbiased content
- **Right Wing**: Conservative economic and social policies
- **Extreme Right**: Strong right-wing or nationalist views
""")

# API endpoint
API_URL = "http://localhost:8000/analyze"

def analyze_text(text):
    """Send text to API for analysis"""
    try:
        response = requests.post(API_URL, json={"text": text})
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error connecting to API: {str(e)}")
        return None

def create_bias_gauge(scores):
    """Create a gauge chart for bias visualization"""
    # Create labels and values
    categories = list(scores.keys())
    values = list(scores.values())
    
    # Create the gauge chart
    fig = go.Figure(go.Bar(
        x=values,
        y=categories,
        orientation='h',
        marker_color=['#FF4B4B', '#FF9999', '#CCCCCC', '#9999FF', '#4B4BFF'],
        text=[f'{v:.2%}' for v in values],
        textposition='auto',
    ))
    
    fig.update_layout(
        title='Bias Score Distribution',
        xaxis_title='Score',
        yaxis_title='Category',
        height=400,
        showlegend=False,
        xaxis=dict(range=[0, 1]),
        margin=dict(l=0, r=0, t=40, b=0)
    )
    
    return fig

def display_detected_phrases(phrases):
    """Display detected bias phrases by category"""
    if not phrases:
        return
    
    st.subheader("📝 Detected Phrases")
    cols = st.columns(3)
    
    # Group phrases by bias type
    categories = {
        "Extreme": (["extreme_left", "extreme_right"], 0),
        "Moderate": (["left_wing", "right_wing"], 1),
        "Neutral": (["neutral"], 2)
    }
    
    for category, (types, col_idx) in categories.items():
        with cols[col_idx]:
            st.markdown(f"**{category} Phrases:**")
            for bias_type in types:
                if bias_type in phrases and phrases[bias_type]:
                    st.markdown(f"*{bias_type}:*")
                    for phrase in phrases[bias_type]:
                        st.markdown(f"- {phrase}")

# Main text input
text_input = st.text_area("Enter text to analyze:", height=200)

# Analysis button
if st.button("Analyze Text"):
    if not text_input.strip():
        st.warning("Please enter some text to analyze.")
    else:
        with st.spinner("Analyzing text..."):
            result = analyze_text(text_input)
            
            if result:
                # Display overall bias
                bias_type = result["overall_bias"]
                confidence = result["confidence"]
                
                st.header("Analysis Results")
                
                # Create columns for the results
                col1, col2 = st.columns([2, 1])
                
                with col1:
                    # Display bias gauge
                    st.plotly_chart(create_bias_gauge(result["bias_scores"]), use_container_width=True)
                    
                with col2:
                    # Display overall bias result
                    st.markdown(f"""
                    ### Overall Bias: {bias_type.replace('_', ' ').title()}
                    **Confidence Score:** {confidence:.2%}
                    """)
                
                # Display detected phrases
                display_detected_phrases(result["detected_phrases"])
                
                # Show raw scores in an expander
                with st.expander("View Raw Scores"):
                    st.json(result["bias_scores"])

# Sidebar with information
with st.sidebar:
    st.header("ℹ️ About")
    st.markdown("""
    This bias detection system analyzes text for political bias using a comprehensive dataset of keywords and phrases.
    
    ### How it works:
    1. Enter your text in the input box
    2. Click "Analyze Text"
    3. View the results including:
        - Overall bias category
        - Confidence score
        - Detailed bias distribution
        - Detected bias phrases
    
    ### Bias Categories:
    - **Extreme Left/Right**: Strong ideological bias
    - **Left/Right Wing**: Moderate political bias
    - **Neutral**: Balanced or unbiased content
    """) 