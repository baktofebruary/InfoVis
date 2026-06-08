import streamlit as st
from pathlib import Path
import pandas as pd

import preprocess as pp
from plots import make_radarchart

data_path = Path(__file__).resolve().parent.parent.parent / "data/final_dataset_draft.csv"
raw = pd.read_csv(data_path)

df = pp.iso2_to_iso3(raw)

unique_cols = list(df.columns)
unique_countries = list(df["iso3"].unique())

with st.sidebar:
    selected_vars = st.multiselect(
        "Select variables",
        unique_cols,
        max_selections=10
    )

    selected_countries = st.multiselect(
        "Select Countries",
        unique_countries,
        max_selections=10
    )

col = st.columns((1, 1), gap='small')

with col[0]:
    df_selected_year = df[df.year == 2020]
    radarchart = make_radarchart(df_selected_year, selected_vars, selected_countries)
    st.plotly_chart(radarchart)

with col[1]:
    pass
