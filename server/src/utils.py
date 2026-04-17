from pathlib import Path
import pandas as pd
from pandas import DataFrame, read_csv
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

def preprocess_csv(csv_path: Path) -> pd.DataFrame:
    """
    Load and preprocess CSV data by filtering for specified countries.

    This function reads a CSV file and returns a filtered DataFrame containing
    only data for a predefined set of relevant countries.

    Args:
        csv_path (Path): Path to the CSV file.

    Returns:
        pd.DataFrame: Filtered DataFrame with data for relevant countries only.
    """
    raw_data = pd.read_csv(csv_path)
    countries = ["Afghanistan", "Albania", "Algeria", "Angola",
                "Argentina", "Armenia", "Australia", "Austria",
                "Azerbaijan", "Brazil", "Bulgaria", "Cameroon",
                "Chile", "China", "Colombia", "Croatia", "Cuba",
                "Cyprus", "Czech Republic", "Ecuador", "Egypt, Arab Rep.",
                "Arab Rep.", "Eritrea", "Ethiopia", "France",
                "Germany", "Ghana", "Greece", "India",
                "Indonesia", "Iran, Islamic Rep.", "Iraq",
                "Ireland", "Italy", "Japan", "Jordan", "Kazakhstan",
                "Kenya", "Lebanon", "Malta", "Mexico", "Morocco",
                "Pakistan", "Peru", "Philippines", "Russian Federation",
                "Syrian Arab Republic", "Tunisia", "Turkey", "Ukraine"]
    
    df = raw_data[raw_data["Country Name"].isin(countries)]
    df_2020 = df[df["year"] == 2020]
    
    return df_2020


def get_cords(data: pd.DataFrame):
    country_names = data['Country Name'].values
    
    X = data.drop(columns=['Country Name', "Country Code", 'year'])
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    pca = PCA(n_components = 2)
    coords = pca.fit_transform(X_scaled)
    
    
    result = {
        "year": 2020,
        "countries": country_names.tolist(),
        "x": coords[:, 0].tolist(),
        "y": coords[:, 1].tolist(),
        "explained_variance": pca.explained_variance_ratio_.tolist(),
        "feature_loadings": pca.components_.tolist()
    }

    return result
    
    
if __name__ == "__main__":
    data = preprocess_csv("data/world_data.csv")
    