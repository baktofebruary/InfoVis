from pathlib import Path

import pandas as pd
import streamlit as st

import preprocess as pp

data_path = Path(__file__).resolve().parent.parent / "data/city/estat_prc_colc_rents.tsv"
raw = pp.read_dataset(data_path)

id_col = raw.columns[0]
id_parts = raw[id_col].astype(str).str.split(",", expand=True)
id_parts.columns = ["freq", "building", "currency", "geo"]

df = pd.concat([id_parts, raw.drop(columns=[id_col])], axis=1)
df = df.rename(columns=lambda c: str(c).strip())
year_cols = [c for c in df.columns if c.isdigit()]

st.title("InfoVis Project Group 43")

freq = st.selectbox("Frequency", sorted(df["freq"].unique()))
building = st.selectbox("Building", sorted(df["building"].unique()))
currency = st.selectbox("Currency", sorted(df["currency"].unique()))
geo = st.selectbox("Geo", sorted(df["geo"].unique()))

filtered = df[
    (df["freq"] == freq)
    & (df["building"] == building)
    & (df["currency"] == currency)
    & (df["geo"] == geo)
]

if filtered.empty:
    st.warning("No data found for the selected filters.")
else:
    series = filtered.iloc[0][year_cols]
    series.index = pd.to_datetime(series.index, format="%Y")
    st.line_chart(series)