# Bias Detection System for Social Media Posts

A web-based system that detects political and ideological bias in social media posts using Natural Language Processing and Machine Learning techniques.

## Features

- Bias detection using predefined keyword datasets
- Sentiment analysis integration
- Web dashboard for real-time analysis
- Browser extension support (coming soon)

## Project Structure

```
BiasDetect3/
├── backend/              # FastAPI backend server
│   ├── app/
│   ├── models/          # ML models
│   └── data/            # Bias keywords and datasets
├── frontend/            # React frontend
└── requirements.txt     # Python dependencies
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the backend server:
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start the frontend development server:
```bash
npm start
```

## Technologies Used

- Backend: FastAPI, Python, scikit-learn, HuggingFace Transformers
- Frontend: React, TypeScript, Material-UI
- ML: NLTK, PyTorch 