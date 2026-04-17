from flask import Flask, jsonify
from flask_cors import CORS

class Server:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        self._setup_routes()
    
    def _setup_routes(self):
        @self.app.route("/")
        def index():
            return "Hello, World!"

        @self.app.route("/pca")
        def pca_endpoint():
            return jsonify(self._pca_data)
        
    def start_server(self, debug = False):
        self.app.run(debug = debug)
        
    def _temp_pca_data(self, data):
        self._pca_data = data