#!/bin/bash

# TalkBitch Local Test Server
# Simple script to run the local web test

echo "🚀 TalkBitch - Avatar Chat Test"
echo "================================"
echo ""
echo "Starting local web server..."
echo "This will open your browser automatically"
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    python3 server.py
elif command -v python &> /dev/null; then
    python server.py
else
    echo "❌ Python not found!"
    echo "Please install Python 3 to run the test server"
    echo ""
    echo "Alternative: Open index.html directly in your browser"
    echo "Note: Some features may not work due to CORS restrictions"
    exit 1
fi