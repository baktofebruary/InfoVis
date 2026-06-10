import pandas as pd

EUROPE_COUNTRIES = [
    ("ALB", "Albania"),
    ("AND", "Andorra"),
    ("AUT", "Austria"),
    ("BLR", "Belarus"),
    ("BEL", "Belgium"),
    ("BIH", "Bosnia and Herzegovina"),
    ("BGR", "Bulgaria"),
    ("HRV", "Croatia"),
    ("CYP", "Cyprus"),
    ("CZE", "Czechia"),
    ("DNK", "Denmark"),
    ("EST", "Estonia"),
    ("FIN", "Finland"),
    ("FRA", "France"),
    ("DEU", "Germany"),
    ("GRC", "Greece"),
    ("HUN", "Hungary"),
    ("ISL", "Iceland"),
    ("IRL", "Ireland"),
    ("ITA", "Italy"),
    ("XKX", "Kosovo"),
    ("LVA", "Latvia"),
    ("LIE", "Liechtenstein"),
    ("LTU", "Lithuania"),
    ("LUX", "Luxembourg"),
    ("MLT", "Malta"),
    ("MDA", "Moldova"),
    ("MCO", "Monaco"),
    ("MNE", "Montenegro"),
    ("NLD", "Netherlands"),
    ("MKD", "North Macedonia"),
    ("NOR", "Norway"),
    ("POL", "Poland"),
    ("PRT", "Portugal"),
    ("ROU", "Romania"),
    ("SMR", "San Marino"),
    ("SRB", "Serbia"),
    ("SVK", "Slovakia"),
    ("SVN", "Slovenia"),
    ("ESP", "Spain"),
    ("SWE", "Sweden"),
    ("CHE", "Switzerland"),
    ("TUR", "Turkey"),
    ("UKR", "Ukraine"),
    ("GBR", "United Kingdom"),
    ("VAT", "Vatican City"),
]

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

def add_all_european_countries_for_map(df_year: pd.DataFrame) -> pd.DataFrame:
    europe_df = pd.DataFrame(EUROPE_COUNTRIES, columns=["iso3", "country_name"])
    data_df = df_year.drop(columns=["country_name"], errors="ignore")
    return europe_df.merge(data_df, on="iso3", how="left")
