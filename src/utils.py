from pathlib import Path
import pandas as pd

data_path = Path("data/")

def read_rent_avg() -> pd.DataFrame:
    return pd.read_csv("data/city/estat_prc_colc_rents.tsv", sep='\t')
    
    
if __name__ == "__main__":
    df = read_rent_avg()
    print(df.head())