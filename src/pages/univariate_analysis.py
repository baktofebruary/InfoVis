import streamlit as st
from pathlib import Path
import pandas as pd

import preprocess as pp
import plots as ourplots

data_path = Path(__file__).resolve().parent.parent.parent / "data/final_dataset_draft.csv"
raw = pd.read_csv(data_path)

df = pp.iso2_to_iso3(raw)

year_list = list(df.year.unique())[::-1]
collumn_list = set(df.columns)
collumn_list.remove("year")
collumn_list.remove("iso3")
collumn_list.remove("country_name")


st.header("Group X, Cost of living Analysis")
top_container = st.container(border=False)
col = top_container.columns((1, 2.5), gap='xsmall')

with col[0]:
    left_container = st.container(border=True, height="stretch")
    selected_year = left_container.slider("Select a year", 2005, 2024, 2024)
    df_selected_year = df[df.year == selected_year]

    selected_var = left_container.selectbox('Select a variable', collumn_list, index=0)

    color_theme_list = ['blues', 'cividis', 'greens', 'inferno', 'magma', 'plasma', 'reds', 'rainbow', 'turbo', 'viridis']
    selected_color_theme = left_container.selectbox('Select a color theme', color_theme_list)

    left_container.checkbox("Color blind mode")
    
    multisel_countries = left_container.multiselect(
        "You can also select countries here",
        df["iso3"].unique(),
        max_selections=5
    )
    if multisel_countries:
        df_line1 = df[
            df["iso3"].isin(multisel_countries)
        ]
    else:
        df_line1 = pd.DataFrame()

with col[1]:
    right_container = st.container(border=True, horizontal_alignment="right", height="stretch")
    right_container.write("Select a country on the map!")
    choropleth = ourplots.make_choropleth(df_selected_year, "iso3", selected_var, selected_color_theme)
    event = right_container.plotly_chart(choropleth, width="stretch", height="stretch", on_select="rerun")

    selected_countries = []

    if event and "selection" in event:
        selected_points = event["selection"]["points"]
        selected_countries = [p["location"] for p in selected_points]

    if selected_countries:
        df_line2 = df[
            df["iso3"].isin(selected_countries)
        ]
    else:
        df_line2 = pd.DataFrame()  # nothing selected

middle_container = st.container(border=True)
if not df_line1.empty and not df_line2.empty:
    middle_container.info("Please only select countries either from the drop-down menu or the map.")
elif not df_line1.empty:
    lineplot = ourplots.make_lineplot(df_line1, "year", selected_var, "country_name")
    middle_container.plotly_chart(lineplot)
elif not df_line2.empty:
    lineplot = ourplots.make_lineplot(df_line2, "year", selected_var, "country_name")
    middle_container.plotly_chart(lineplot)
else:
    middle_container.info("Select countries on the map or the dropdown to see trends")

ac = st.container(border=True)
ac.header("Animations")
cols = ac.columns((1,3))

#  with cols[0]:
left_buttons = st.container(border=True)
anim_var_x = left_buttons.selectbox("Select Variable X",collumn_list)
anim_var_y = left_buttons.selectbox("Select Variable Y",collumn_list)
# with cols[1]:
right_plot = st.container(border=True)
fig = ourplots.make_scatterplot_anim(df, anim_var_x, anim_var_y, "country_name")
right_plot.plotly_chart(fig, width="stretch", height="stretch")

st.header("Raw Data")
st.dataframe(df)