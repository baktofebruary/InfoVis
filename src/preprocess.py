from pathlib import Path
import pandas as pd

def iso2_to_iso3(df_to_merge:pd.DataFrame)->pd.DataFrame:
    data = {
        "eurostat_iso2": [
            'EU27_2020','BE','BG','CZ','DK','DE','EE','IE','EL','ES','FR','HR','IT',
            'CY','LV','LT','LU','HU','MT','NL','AT','PL','PT','RO','SI',
            'SK','FI','SE'
        ],
        "iso3": [
            '','BEL','BGR','CZE','DNK','DEU','EST','IRL','GRC','ESP','FRA','HRV','ITA',
            'CYP','LVA','LTU','LUX','HUN','MLT','NLD','AUT','POL','PRT','ROU','SVN',
            'SVK','FIN','SWE'
        ],
        "country_name": [
            'Europian Union','Belgium','Bulgaria','Czechia','Denmark','Germany','Estonia',
            'Ireland','Greece','Spain','France','Croatia','Italy',
            'Cyprus','Latvia','Lithuania','Luxembourg','Hungary','Malta',
            'Netherlands','Austria','Poland','Portugal','Romania',
            'Slovenia','Slovakia','Finland','Sweden'
        ]
    }

    df_map = pd.DataFrame(data)
    
    # merge on ISO2 column
    merged_df = df_to_merge.merge(
        df_map,
        left_on="eurostat_iso2",
        right_on="eurostat_iso2",
        how="left"
    )

    return merged_df

def read_dataset(path: Path, names_to_split:list, convert_numeric = True) -> pd.DataFrame:
    df = pd.read_csv(
        path,
        sep='\t',
        na_values=': '
    )
    
    # Split the first column    
    first_col = df.columns[0]
    df[names_to_split] = df[first_col].str.split(',', expand=True)
    df = df.drop(columns=[first_col])

    # Move the newly created columns to the front
    df = df[names_to_split + [col for col in df.columns if col not in names_to_split]]

    if convert_numeric:
        # We remove all the characters from every collumn, except the the first len(names_to_split)
        # and convert to numeric values
        df[df.columns[len(names_to_split):]] = (
            df.iloc[:, len(names_to_split):]
            .astype(str)
            .replace(r'[\sA-Za-z:]+$', '', regex=True)
            .apply(pd.to_numeric)
        )
    
    return df

if __name__ == "__main__":
    df = read_dataset(Path("data/country/estat_tipsho60.tsv"), names_to_split=["freq", "unit", "eurostat_iso2"])
    
    df = df.melt(
        id_vars=['freq', 'unit', 'eurostat_iso2'],
        var_name='year',
        value_name='value'
    )

    df_merged = iso2_to_iso3(df)

    print(df_merged)