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

year_list = sorted(df.year.unique())
collumn_list_full = set(df.columns)
collumn_list_full.remove("year")
collumn_list_full.remove("iso3")
collumn_list_full.remove("country_name")
collumn_list_full.remove("housing_burden_category")
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
    control_cols = controls_container.columns((1.4, 1.3, 1, 1, 2), gap='small')
    selection_reset_nonce = st.session_state.get("selection_reset_nonce", 0)

    with control_cols[0]:
        selected_var = st.selectbox('Select a variable', collumn_list, index=0)

    with control_cols[1]:
        color_theme_list = ['greens', 'blues', 'cividis', 'inferno', 'magma', 'plasma', 'reds', 'rainbow', 'turbo', 'viridis']
        selected_color_theme = st.selectbox('Select a color theme', color_theme_list)

    with control_cols[2]:
        if st.button("Reset selections"):
            st.session_state["selected_countries_from_chart"] = []
            st.session_state["country_dropdown"] = []
            st.session_state["selected_year"] = int(max(year_list))
            st.session_state["selection_reset_nonce"] = selection_reset_nonce + 1
            st.rerun()

    with control_cols[3]:
        selected_year = st.slider(
            "Year",
            min_value=int(min(year_list)),
            max_value=int(max(year_list)),
            value=int(max(year_list)),
            step=1,
            key="selected_year"
        )

    with control_cols[4]:
        multisel_countries = st.multiselect(
            "You can also select countries here",
            df["iso3"].unique(),
            max_selections=5,
            key="country_dropdown"
        )

    if multisel_countries:
        df_line1 = df[
            df["iso3"].isin(multisel_countries)
        ]
    else:
        df_line1 = pd.DataFrame()

    df_year = df[df["year"] == selected_year]
    color_range = (df[selected_var].min(), df[selected_var].max())
    selected_countries = st.session_state.get("selected_countries_from_chart", [])
    highlighted_countries = list(dict.fromkeys(multisel_countries + selected_countries))

    map_container = st.container(border=True, horizontal_alignment="right")
    map_container.write(f"Select a country on the map! Year: {selected_year}")
    choropleth = ourplots.make_choropleth(
        df_year,
        "iso3",
        selected_var,
        selected_color_theme,
        color_range,
        highlighted_countries
    )
    map_event = map_container.plotly_chart(
        choropleth,
        width="stretch",
        height="stretch",
        key=f"country_map_chart_{selection_reset_nonce}",
        on_select="rerun"
    )

    bar_container = st.container(border=True)
    bar_container.write(f"All countries by {selected_var.replace('_', ' ')} in {selected_year}")
    bar_chart = ourplots.make_country_bar_chart(
        df_year,
        "iso3",
        selected_var,
        selected_color_theme,
        color_range,
        highlighted_countries
    )
    bar_event = bar_container.plotly_chart(
        bar_chart,
        width="stretch",
        key=f"country_bar_chart_{selection_reset_nonce}",
        on_select="rerun"
    )

    map_selected_countries = get_selected_country_codes(map_event)
    bar_selected_countries = get_selected_country_codes(bar_event)
    updated_selected_countries = list(dict.fromkeys(map_selected_countries + bar_selected_countries))

    if updated_selected_countries and updated_selected_countries != selected_countries:
        st.session_state["selected_countries_from_chart"] = updated_selected_countries
        st.rerun()

    selected_countries = updated_selected_countries or selected_countries

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

heatmap_container = st.container(border=True)
heatmap_container.header("Housing Burden Category by Country and Year")
heatmap_col, pie_col = heatmap_container.columns((1.7, 1), gap='small')

with heatmap_col:
    heatmap = ourplots.make_housing_burden_category_heatmap(df, selected_year, highlighted_countries)
    st.plotly_chart(heatmap, width="stretch")

with pie_col:
    # st.write(f"Housing Burden Categories in {selected_year}")
    pie = ourplots.make_housing_burden_category_pie(df_year)
    st.plotly_chart(pie, width="stretch")

# ac = st.container(border=True)
# ac.header("Animations")
# cols = ac.columns((1,3))

# #  with cols[0]:
# left_buttons = st.container(border=True)
# anim_var_x = left_buttons.selectbox("Select Variable X",collumn_list)
# anim_var_y = left_buttons.selectbox("Select Variable Y",collumn_list)
# # with cols[1]:
# right_plot = st.container(border=True)
# fig = ourplots.make_scatterplot_anim(df, anim_var_x, anim_var_y, "country_name")
# right_plot.plotly_chart(fig, width="stretch", height="stretch")

# st.header("Raw Data")
# st.dataframe(df)
