@echo off
start cmd /k "cd backend && python -m uvicorn app.main:app --reload"
start cmd /k "cd frontend && npm start" 