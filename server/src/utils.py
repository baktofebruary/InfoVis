from pathlib import Path
import pandas as pd
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
    return df

def calculate_pca(data: pd.DataFrame):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(data)
    
    pca = PCA(n_components = 2)
    coords = pca.fit_transform(X_scaled)
    return pca, coords

def get_variables_data(data: pd.DataFrame, variable_columns):
        
    variables = []

    for col in variable_columns:
        values = pd.to_numeric(data[col], errors="coerce")
        valid_val = values.dropna()

        if valid_val.empty:
            continue
            
        variables.append({
            'key': col,
            'min': float(valid_val.min()),
            'max': float(valid_val.max()),
        })

    return variables


def get_country_values(data: pd.DataFrame, variables: list):
    country_values = {}

    for _, row in data.iterrows():
        metrics = {}

        for variable in variables:
            value = pd.to_numeric(row[variable['key']], errors="coerce")

            if pd.notna(value):
                metrics[variable["key"]] = float(value)
        country_values[row["Country Name"]] = metrics   

    return country_values


def get_country_values_by_year(data: pd.DataFrame, variables: list):
    country_values_by_year = {}

    for year, group in data.groupby("year"):
        country_values_by_year[int(year)] = get_country_values(group, variables)

    return country_values_by_year


def get_time_series(data: pd.DataFrame, variables: list):
    country_series = {}

    for country_name, group in data.groupby("Country Name"):
        country_series[country_name] = {}
        group_sorted = group.sort_values("year")
        for var in variables:
            key = var["key"]
            time_series=[]
            for _, row in group_sorted.iterrows():
                value = pd.to_numeric(row[key], errors="coerce")
                if pd.notna(value):
                    time_series.append({
                        "year": int(row["year"]),
                        "value": float(value),
                    })
            country_series[country_name][key] = time_series


    return country_series

def get_pca_cords(data: pd.DataFrame):
    df = data[data["year"] == 2020]
    country_names = df['Country Name'].values
    
    X = df.drop(columns=['Country Name', "Country Code", 'year'])
    
    pca, coords = calculate_pca(X)
    variables = get_variables_data(data, X.columns)
    country_values = get_country_values(df, variables)
    country_values_by_year = get_country_values_by_year(data, variables)
    country_series = get_time_series(data, variables)
    years = sorted(int(year) for year in data["year"].dropna().unique())
    
    result = {
        "year": 2020,
        "years": years,
        "countries": country_names.tolist(),
        "x": coords[:, 0].tolist(),
        "y": coords[:, 1].tolist(),
        "explained_variance": pca.explained_variance_ratio_.tolist(),
        "feature_loadings": pca.components_.tolist(),
        "variables": variables,
        "country_values": country_values,
        "country_values_by_year": country_values_by_year,
        "country_series": country_series,
    }

    return result
    
if __name__ == "__main__":
    data = preprocess_csv("data/world_data.csv")
    
