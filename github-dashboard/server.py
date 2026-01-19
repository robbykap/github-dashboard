import http.server
import socketserver
import webbrowser
import os
import sys
import json
from typing import Dict, Any

# Add current directory to path for package imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.routes import get_route_handler
from utils.validation import validate_tokens
from config.constants import DEFAULT_PORT

PORT = int(os.environ.get('PORT', DEFAULT_PORT))


class GitHubAssistantHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(200)
        self.end_headers()

    def do_GET(self) -> None:
        # Check if this is an API route
        if self.path.startswith('/api/'):
            handler = get_route_handler(self.path)
            if handler:
                try:
                    response_data = handler()
                    self._send_json_response(response_data)
                except Exception as e:
                    self._send_error_response(str(e), 500)
            else:
                self._send_error_response(f"Route not found: {self.path}", 404)
        else:
            # Serve static files for non-API routes
            super().do_GET()

    def do_POST(self) -> None:
        handler = get_route_handler(self.path)
        if handler:
            try:
                request_data = self._read_request_body()
                response_data = handler(request_data)
                self._send_json_response(response_data)
            except Exception as e:
                self._send_error_response(str(e), 500)
        else:
            self._send_error_response(f"Route not found: {self.path}", 404)

    def _read_request_body(self) -> Dict[str, Any]:
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        return json.loads(post_data.decode('utf-8'))

    def _send_json_response(self, data: Dict[str, Any]) -> None:
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error_response(self, error_message: str, status_code: int = 500) -> None:
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        error_data = {
            'success': False,
            'error': error_message
        }
        self.wfile.write(json.dumps(error_data).encode())

    def log_message(self, format: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {format % args}")


def run_server() -> None:
    validate_tokens()
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer(("", PORT), GitHubAssistantHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        webbrowser.open(f'http://localhost:{PORT}')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    run_server()
