from server import Server
import utils


if __name__ == "__main__":
    app = Server()
    app._temp_pca_data("data/world_data.csv")
    app.start_server(debug = True)