import streamlit as st
import importlib
from pathlib import Path
import pandas as pd

import preprocess as pp
import plots as ourplots

ourplots = importlib.reload(ourplots)

data_path = Path(__file__).resolve().parent.parent.parent / "data/final_dataset_draft.csv"
raw = pd.read_csv(data_path)

df = pp.iso2_to_iso3(raw)

def get_selected_country_codes(event):
    if not event or "selection" not in event:
        return []

    selected_codes = []
    for point in event["selection"]["points"]:
        country_code = point.get("location")
        if country_code is None:
            custom_data = point.get("customdata")
            if isinstance(custom_data, (list, tuple)) and custom_data:
                country_code = custom_data[0]
            else:
                country_code = custom_data

        if country_code and country_code not in selected_codes:
            selected_codes.append(country_code)

    return selected_codes

year_list = list(df.year.unique())[::-1]
collumn_list_full = set(df.columns)
collumn_list_full.remove("year")
collumn_list_full.remove("iso3")
collumn_list_full.remove("country_name")
collumn_list = [
    "house_price_to_income_index",
    "housing_overburden",
    "house_price_index",
    "rent_price_index",
]


st.header("Group X, Cost of living Analysis")
top_container = st.container(border=False)

with top_container:
    controls_container = st.container(border=True)
    control_cols = controls_container.columns((1.4, 1.3, 1, 2), gap='small')

    with control_cols[0]:
        selected_var = st.selectbox('Select a variable', collumn_list, index=0)

    with control_cols[1]:
        color_theme_list = ['greens', 'blues', 'cividis', 'inferno', 'magma', 'plasma', 'reds', 'rainbow', 'turbo', 'viridis']
        selected_color_theme = st.selectbox('Select a color theme', color_theme_list)

    with control_cols[2]:
        st.checkbox("Color blind mode")

    with control_cols[3]:
        multisel_countries = st.multiselect(
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

    map_container = st.container(border=True, horizontal_alignment="right")
    map_container.write("Select a country on the map!")
    selected_countries = st.session_state.get("selected_countries_from_chart", [])
    highlighted_countries = list(dict.fromkeys(multisel_countries + selected_countries))
    choropleth = ourplots.make_choropleth_bar_anim(
        df,
        "iso3",
        selected_var,
        selected_color_theme,
        highlighted_countries
    )
    event = map_container.plotly_chart(
        choropleth,
        width="stretch",
        height="stretch",
        key="country_map_bar_chart",
        on_select="rerun"
    )

    updated_selected_countries = get_selected_country_codes(event)
    if updated_selected_countries != selected_countries:
        st.session_state["selected_countries_from_chart"] = updated_selected_countries
        st.rerun()

    selected_countries = updated_selected_countries

    if selected_countries:
        df_line2 = df[
            df["iso3"].isin(selected_countries)
        ]
    else:
        df_line2 = pd.DataFrame()  # nothing selected

middle_container = st.container(border=True)
df_average_line = df.groupby("year", as_index=False, sort=False)[selected_var].mean()
df_average_line["country_name"] = "Average (all countries)"

if not df_line1.empty and not df_line2.empty:
    middle_container.info("Please only select countries either from the drop-down menu or the map.")
elif not df_line1.empty or not df_line2.empty:
    df_selected_countries = df_line1 if not df_line1.empty else df_line2
    line_col, scatter_col = middle_container.columns((1, 1), gap='small')

    with line_col:
        df_lineplot = pd.concat([df_selected_countries, df_average_line], ignore_index=True)
        lineplot = ourplots.make_lineplot(df_lineplot, "year", selected_var, "country_name")
        st.plotly_chart(lineplot)

#TODO later fix the variable selection
    with scatter_col:
        scatter_controls = st.columns((1, 1), gap='small')
        with scatter_controls[0]:
            scatter_var_x = st.selectbox("Select Variable X", collumn_list_full, index=0, key="scatter_var_x")
        with scatter_controls[1]:
            # scatter_var_y = st.selectbox("Select Variable Y", collumn_list, index=1, key="scatter_var_y")
            scatter_var_y = selected_var

        scatterplot = ourplots.make_scatterplot(
            df_selected_countries,
            scatter_var_x,
            scatter_var_y,
            "country_name"
        )
        st.plotly_chart(scatterplot)
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
