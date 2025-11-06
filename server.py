import http.server
import socketserver
import os
import mimetypes

PORT = 8000

# Ensure JavaScript files are served with correct MIME type
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def guess_type(self, path):
        # Override to ensure .js files are served as JavaScript modules
        result = super().guess_type(path)
        # Handle both Python 3.12 and 3.13+ return formats
        if isinstance(result, tuple) and len(result) >= 2:
            mimetype, encoding = result[0], result[1]
        else:
            mimetype, encoding = result, None
        
        if path.endswith('.js'):
            return 'application/javascript'
        return mimetype

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print(f"Open http://localhost:{PORT}/index.html for login page")
    print(f"Open http://localhost:{PORT}/home.html for member home page")
    print(f"Open http://localhost:{PORT}/signup.html for signup page")
    print(f"Open http://localhost:{PORT}/booking.html for booking page")
    print(f"Open http://localhost:{PORT}/test-booking.html for diagnostics")
    httpd.serve_forever() 