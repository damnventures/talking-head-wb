#!/usr/bin/env python3

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow API calls
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.end_headers()

def run_server():
    # Change to the web-test directory
    web_dir = Path(__file__).parent
    os.chdir(web_dir)

    print(f"🚀 Starting TalkBitch test server...")
    print(f"📁 Serving from: {web_dir}")
    print(f"🌐 Server running at: http://localhost:{PORT}")
    print(f"📱 Open the URL above in your browser to test the app")
    print(f"⭐ Features:")
    print(f"   - Ready Player Me avatar integration")
    print(f"   - OpenAI ChatGPT conversations")
    print(f"   - Real-time chat interface")
    print(f"   - Mobile-responsive design")
    print()
    print(f"🔧 To stop the server, press Ctrl+C")
    print("=" * 50)

    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            # Try to open browser automatically
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print(f"✅ Browser opened automatically")
            except:
                print(f"⚠️  Could not open browser automatically")
                print(f"   Please manually open: http://localhost:{PORT}")

            print(f"🟢 Server is running! Waiting for connections...")
            httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 48:  # Port already in use
            print(f"❌ Port {PORT} is already in use!")
            print(f"   Try a different port or stop the other server")
        else:
            print(f"❌ Error starting server: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    run_server()