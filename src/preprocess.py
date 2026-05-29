from pathlib import Path
import pandas as pd

def read_dataset(path: Path, convert_numeric = True) -> pd.DataFrame:
    df = pd.read_csv(
        path,
        sep='\t',
        na_values=': '
    )

    if convert_numeric:
        # We remove all the characters from every collumn, except the first one
        # and convert to numeric values
        df[df.columns[1:]] = (
            df.iloc[:, 1:]
            .astype(str)
            .replace(r'[\sA-Za-z:]+$', '', regex=True)
            .apply(pd.to_numeric)
        )
    
    return df

if __name__ == "__main__":
    df = read_dataset("data/country/estat_tipsho60.tsv")
    print(df.head(3))