import streamlit as st
from pathlib import Path
import pandas as pd
import preprocess as pp

from plots import make_choropleth, make_heatmap, make_lineplot

data_path = Path(__file__).resolve().parent.parent.parent / "data/final_dataset_draft.csv"
raw = pd.read_csv(data_path)

df = pp.iso2_to_iso3(raw)

year_list = list(df.year.unique())[::-1]
collumn_list = set(df.columns)
collumn_list.remove("year")
collumn_list.remove("iso3")
collumn_list.remove("country_name")

top_container = st.container(border=False)
col = top_container.columns((1, 2.5), gap='xsmall')

with col[0]:
    left_container = st.container(border=True)
    selected_year = left_container.slider("Select a year", 2005, 2024, 2024)
    df_selected_year = df[df.year == selected_year]

    selected_var = left_container.selectbox('Select a variable', collumn_list, index=0)

    color_theme_list = ['blues', 'cividis', 'greens', 'inferno', 'magma', 'plasma', 'reds', 'rainbow', 'turbo', 'viridis']
    selected_color_theme = left_container.selectbox('Select a color theme', color_theme_list)

    left_container.checkbox("Color blind mode")
with col[1]:
    right_container = st.container(border=True,horizontal_alignment="right")
    choropleth = make_choropleth(df_selected_year, "iso3", selected_var, selected_color_theme)
    event = right_container.plotly_chart(choropleth, width="stretch", on_select="rerun")

    selected_countries = []

    if event and "selection" in event:
        selected_points = event["selection"]["points"]
        selected_countries = [p["location"] for p in selected_points]

    if selected_countries:
        df_line = df[
            df["iso3"].isin(selected_countries)
        ]
    else:
        df_line = pd.DataFrame()  # nothing selected

col = st.columns((1, 1, 1), gap='xsmall')

with col[0]:
    if not df_line.empty:
        lineplot = make_lineplot(df_line, "year", selected_var, "country_name")
        # Do not expand to fill the container
        st.plotly_chart(lineplot, height=416)
    else:
        st.info("Select countries on the map to see trends")
    pass
    # heatmap = make_heatmap(df, 'year', 'country_name', selected_var, selected_color_theme)
    # st.altair_chart(heatmap, width="stretch")

st.header("Raw Data")
st.dataframe(df)