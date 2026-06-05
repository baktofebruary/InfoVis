from pathlib import Path

import pandas as pd
import streamlit as st

import preprocess as pp

from plots import make_choropleth, make_heatmap, make_lineplot

data_path = Path(__file__).resolve().parent.parent / "data/country/estat_tipsho60.tsv"
raw = pp.read_dataset(data_path, names_to_split=["freq", "unit", "eurostat_iso2"])

df_long = raw.melt(
    id_vars=['freq', 'unit', 'eurostat_iso2'],
    var_name='year',
    value_name='value'
)

df_long = pp.iso2_to_iso3(df_long)

st.set_page_config(
    page_title='Cost of living Dashboard',
    page_icon="🏂",
    layout="wide",
    initial_sidebar_state="expanded")

def page1():
    # Side Bar  
    with st.sidebar:
        st.title('Cost of living Dashboard')
        
        year_list = list(df_long.year.unique())[::-1]
        unit_list = list(df_long.unit.unique())[::-1]

        selected_year = st.selectbox('Select a year', year_list, index=0)
        selected_unit = st.selectbox('Select a unit_type', unit_list, index=0)

        df_selected_year = df_long[(df_long.year == selected_year) & (df_long.unit == selected_unit)]
        df_selected_unit = df_long[df_long.unit == selected_unit]

        color_theme_list = ['blues', 'cividis', 'greens', 'inferno', 'magma', 'plasma', 'reds', 'rainbow', 'turbo', 'viridis']
        selected_color_theme = st.selectbox('Select a color theme', color_theme_list)

    col = st.columns((1.5, 4.5, 2), gap='medium')

    with col[1]:
        choropleth = make_choropleth(df_selected_year, "iso3", "value", selected_color_theme)
        event = st.plotly_chart(choropleth, width="stretch", on_select="rerun")

        selected_countries = []

        if event and "selection" in event:
            selected_points = event["selection"]["points"]
            selected_countries = [p["location"] for p in selected_points]


        if selected_countries:
            df_line = df_selected_unit[
                df_selected_unit["iso3"].isin(selected_countries)
            ]
        else:
            df_line = pd.DataFrame()  # nothing selected

        heatmap = make_heatmap(df_selected_unit, 'year', 'country_name', 'value', selected_color_theme)
        st.altair_chart(heatmap, width="stretch")

    with col[2]:
        if not df_line.empty:
            lineplot = make_lineplot(df_line, "year", "value", "country_name")
            st.plotly_chart(lineplot, width="stretch")
        else:
            st.info("Select countries on the map to see trends")


def page2():
    pass

pg = st.navigation([
    st.Page(page1, title="Univariate Analysis"),
    st.Page(page2, title="Multivariate Analysis"),
    st.Page(
        "https://docs.streamlit.io",
        title="Streamlit Docs",
        icon=":material/open_in_new:"
    ),
])
pg.run()