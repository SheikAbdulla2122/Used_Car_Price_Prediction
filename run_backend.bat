@echo off
title AutoValue AI - FastAPI Backend Server
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
python -m uvicorn backend.main:app --reload --port 8000
pause
