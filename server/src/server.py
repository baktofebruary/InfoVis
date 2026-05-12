from flask import Flask, jsonify
from flask_cors import CORS
import utils

class Server:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        self._setup_routes()
    
    def _setup_routes(self):
        @self.app.route("/pca")
        def pca_endpoint():
            return jsonify(self._pca_cords)
        
    def start_server(self, debug = False):
        self.app.run(debug = debug)
        
    def _temp_pca_data(self, data_location):
        df = utils.preprocess_csv(data_location)
        self._pca_cords= utils.get_pca_cords(df)