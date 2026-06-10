from pathlib import Path
import pandas as pd

def iso2_to_iso3(df_to_merge:pd.DataFrame)->pd.DataFrame:
    data = {
        "eurostat_iso2": [
            'BE','BG','CZ','DK','DE','EE','IE','EL','ES','FR','HR','IT',
            'CY','LV','LT','LU','HU','MT','NL','AT','PL','PT','RO','SI',
            'SK','FI','SE'
        ],
        "iso3": [
            'BEL','BGR','CZE','DNK','DEU','EST','IRL','GRC','ESP','FRA','HRV','ITA',
            'CYP','LVA','LTU','LUX','HUN','MLT','NLD','AUT','POL','PRT','ROU','SVN',
            'SVK','FIN','SWE'
        ],
        "country_name": [
            'Belgium','Bulgaria','Czechia','Denmark','Germany','Estonia',
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
        left_on="country",
        right_on="eurostat_iso2",
        how="left"
    )
    merged_df = merged_df.drop(columns=["eurostat_iso2", "country"])
    return merged_df