from server import Server
import utils


if __name__ == "__main__":
    data = utils.preprocess_csv("server/data/world_data.csv")
    data = utils.get_cords(data)
    
    app = Server()
    app._temp_pca_data(data)
    app.start_server(debug = True)