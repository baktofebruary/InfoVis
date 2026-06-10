import streamlit as st
from pathlib import Path
import pandas as pd

import preprocess as pp
import plots as ourplots

import importlib
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

def apply_pending_country_toggle(max_countries=5):
    pending_country_codes = st.session_state.pop("pending_country_toggle", [])
    if not pending_country_codes:
        return

    current_countries = list(st.session_state.get("country_dropdown", []))
    for country_code in pending_country_codes:
        if country_code in current_countries:
            current_countries.remove(country_code)
        elif len(current_countries) < max_countries:
            current_countries.append(country_code)

    st.session_state["country_dropdown"] = current_countries

def queue_country_toggle(country_codes):
    if not country_codes:
        return

    st.session_state["pending_country_toggle"] = list(dict.fromkeys(country_codes))
    st.session_state["selection_reset_nonce"] = st.session_state.get("selection_reset_nonce", 0) + 1
    st.rerun()

def reset_selections(default_year):
    st.session_state["country_dropdown"] = []
    st.session_state["pending_country_toggle"] = []
    st.session_state["selected_year"] = int(default_year)
    st.session_state["selection_reset_nonce"] = st.session_state.get("selection_reset_nonce", 0) + 1

year_list = sorted(df.year.unique())
column_list_full = set(df.columns)
column_list_full.remove("year")
column_list_full.remove("iso3")
column_list_full.remove("country_name")
column_list_full.remove("housing_burden_category")
column_list_full = sorted(column_list_full, key=ourplots.format_column_label)


st.header("Group 43, Cost of living Analysis")

apply_pending_country_toggle()

##### CONTROLER #####
top_container = st.container(border=True)
control_cols = top_container.columns((1.4, 1.3, 1, 2, 1), gap='small')
selection_reset_nonce = st.session_state.get("selection_reset_nonce", 0)

with control_cols[0]:
    selected_var = st.selectbox(
        'Select a variable',
        column_list_full,
        index=0,
        format_func=ourplots.format_column_label
    )
    selected_var_label = ourplots.format_column_label(selected_var)

with control_cols[1]:
    color_theme_list = ['reds', 'greens', 'blues', 'cividis', 'inferno', 'magma', 'plasma', 'rainbow', 'turbo', 'viridis']
    selected_color_theme = st.selectbox('Select a color theme', color_theme_list)

with control_cols[2]:
    selected_year = st.slider(
        "Year",
        min_value=int(min(year_list)),
        max_value=int(max(year_list)),
        value=int(max(year_list)),
        step=1,
        key="selected_year"
    )

with control_cols[3]:
    multisel_countries = st.multiselect(
        "You can also select countries here",
        df["iso3"].unique(),
        max_selections=5,
        key="country_dropdown"
    )

with control_cols[4]:
    st.button(
        "Reset selections",
        on_click=reset_selections,
        args=(max(year_list),)
    )

df_selected_countries = df[df["iso3"].isin(multisel_countries)]

df_year = df[df["year"] == selected_year]
color_range = (df[selected_var].min(), df[selected_var].max())
highlighted_countries = multisel_countries

##### CHOROPLETH MAP #####
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

##### BAR CHART #####
bar_container = st.container(border=True)
bar_container.write(f"All countries by {selected_var_label} in {selected_year}")
bar_chart = ourplots.make_country_bar_chart(
    df_year,
    "iso3",
    selected_var,
    selected_color_theme,
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
toggled_countries = list(dict.fromkeys(map_selected_countries + bar_selected_countries))

if toggled_countries:
    queue_country_toggle(toggled_countries)

##### LINE AND SCATTER PLOTS #####
middle_container = st.container(border=True)

if not df_selected_countries.empty:
    line_col, scatter_col = middle_container.columns((1, 1), gap='small')
    
    df_average_line = df.groupby("year", as_index=False, sort=False)[selected_var].mean()
    df_average_line["country_name"] = "Average (all countries)"

    ##### LINE PLOT #####
    with line_col:
        df_lineplot = pd.concat([df_selected_countries, df_average_line], ignore_index=True)
        lineplot = ourplots.make_lineplot(df_lineplot, "year", selected_var, "country_name")
        st.plotly_chart(lineplot)

    ##### SCATTER PLOT #####
    with scatter_col:
        scatter_var_x = st.session_state.get("scatter_var_x", column_list_full[0])
        scatter_var_y = selected_var

        scatterplot = ourplots.make_scatterplot(
            df_selected_countries,
            scatter_var_x,
            scatter_var_y,
            "country_name"
        )
        st.plotly_chart(scatterplot)

        st.selectbox(
            "Select Variable X",
            column_list_full,
            index=column_list_full.index(scatter_var_x),
            key="scatter_var_x",
            format_func=ourplots.format_column_label
        )
else:
    middle_container.info("Select countries on the map, bar chart, or dropdown to see trends")

##### HEATMAP AND PIE CHART #####
heatmap_container = st.container(border=True)
heatmap_container.header("Housing Overburden by Country and Year")
heatmap_col, pie_col = heatmap_container.columns((1.7, 1), gap='small')
_, category_colors = ourplots.get_housing_overburden_category_style(selected_color_theme)

##### HEATMAP #####
with heatmap_col:
    st.markdown(
        f"""
        <div style="display:flex; gap:16px; align-items:center; margin:0 0 8px 0; font-size:0.9rem;">
            <span><span style="display:inline-block; width:12px; height:12px; background:{category_colors["Low"]}; margin-right:6px;"></span>L = Low</span>
            <span><span style="display:inline-block; width:12px; height:12px; background:{category_colors["Medium"]}; margin-right:6px;"></span>M = Medium</span>
            <span><span style="display:inline-block; width:12px; height:12px; background:{category_colors["High"]}; margin-right:6px;"></span>H = High</span>
        </div>
        """,
        unsafe_allow_html=True
    )
    heatmap = ourplots.make_housing_overburden_category_heatmap(
        df,
        selected_year,
        highlighted_countries,
        selected_color_theme
    )
    st.plotly_chart(heatmap, width="stretch")

##### PIE CHART #####
with pie_col:
    st.markdown(
        f"""
        <div style="display:flex; align-items:center; margin:0 0 8px 0; font-size:0.9rem;">
            <span>Housing Overburden in Europe in <b>{selected_year}</b></span>
        </div>
        """,
        unsafe_allow_html=True
    )
    pie = ourplots.make_housing_overburden_category_pie(df_year, selected_color_theme)
    st.plotly_chart(pie, width="stretch")
