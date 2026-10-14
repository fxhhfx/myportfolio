@echo off
echo Starting local server...
echo Open http://localhost:8080 in your browser
echo Press Ctrl+C to stop the server
cd /d "%~dp0dist"
python -m http.server 8080
