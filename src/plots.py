import plotly.express as px
import plotly.graph_objects as go
import altair as alt
import streamlit as st
import pandas as pd

VARIABLE_LABELS = {
    "country": "Country",
    "year": "Year",
    "house_price_to_income_index": "House Price to Income Index",
    "housing_overburden": "Housing Overburden",
    "house_price_index": "House Price Index",
    "population": "Population",
    "net_migration": "Net Migration",
    "living_with_parents": "Living With Parents",
    "mean_childbirth_age": "Mean Childbirth Age",
    "fertility_rate": "Fertility Rate",
    "rent_price_index": "Rent Price Index",
    "housing_burden_category": "Housing Burden Category",
    "iso3": "ISO3",
    "country_name": "Country",
}

def format_column_label(column_name):
    return VARIABLE_LABELS.get(str(column_name), str(column_name).replace("_", " ").title())

# PAGE 1
def make_choropleth(df, input_id, input_column, color_theme, color_range=None, selected_countries=None):
    selected_countries = selected_countries or []
    input_label = format_column_label(input_column)
    choropleth = px.choropleth(df,
                    locations=input_id,
                    locationmode="ISO-3",
                    color=input_column,
                    hover_name=input_id,
                    color_continuous_scale=color_theme,
                    range_color=color_range,
                    labels={input_column: input_label}
                    )
    if selected_countries:
        selected_points = [
            point_index
            for point_index, country_code in enumerate(df[input_id])
            if country_code in selected_countries
        ]
        choropleth.update_traces(
            selectedpoints=selected_points,
            selected=dict(marker=dict(opacity=1)),
            unselected=dict(marker=dict(opacity=0.25)),
        )

    if st.context.theme.type == "light":
        choropleth.update_layout(
            plot_bgcolor='rgba(0, 0, 0, 0)',
            paper_bgcolor='rgba(0, 0, 0, 0)',
            margin=dict(l=0, r=0, t=0, b=0),
            clickmode='event+select'
        )
    else:
        choropleth.update_layout(
            template='plotly_dark',
            plot_bgcolor='rgba(0, 0, 0, 0)',
            paper_bgcolor='rgba(0, 0, 0, 0)',
            margin=dict(l=0, r=0, t=0, b=0),
            clickmode='event+select'
        )

    choropleth.update_geos(
        fitbounds="locations",
        visible=False
    )


    return choropleth

def make_country_bar_chart(df, input_id, input_column, color_theme, color_range=None, selected_countries=None):
    selected_countries = selected_countries or []
    input_label = format_column_label(input_column)
    _, category_colors = get_housing_burden_category_style(color_theme)
    bar_df = df.dropna(subset=[input_column]).sort_values(input_column, ascending=False).copy()
    selected_df = bar_df[bar_df[input_id].isin(selected_countries)]

    bar_chart = go.Figure()
    bar_chart.add_trace(
        go.Bar(
            x=bar_df["country_name"],
            y=bar_df[input_column],
            customdata=bar_df[input_id],
            marker=dict(color=category_colors["High"]),
            hovertemplate=(
                "%{x}<br>"
                "ISO3: %{customdata}<br>"
                + input_label + ": %{y}<extra></extra>"
            ),
            selectedpoints=[
                point_index
                for point_index, country_code in enumerate(bar_df[input_id])
                if country_code in selected_countries
            ] if selected_countries else None,
            selected=dict(marker=dict(opacity=1)),
            unselected=dict(marker=dict(opacity=0.25 if selected_countries else 1)),
        )
    )
    bar_chart.add_trace(
        go.Bar(
            x=selected_df["country_name"],
            y=selected_df[input_column],
            customdata=selected_df[input_id],
            marker=dict(
                color="rgba(0,0,0,0)",
                line=dict(color="#111111", width=3),
            ),
            hoverinfo="skip",
            showlegend=False,
        )
    )

    bar_chart.update_layout(
        barmode="overlay",
        showlegend=False,
        margin=dict(l=10, r=10, t=10, b=80),
        xaxis=dict(title="", tickangle=-45),
        yaxis=dict(title=input_label, rangemode="tozero"),
        height=430,
    )
    if st.context.theme.type != "light":
        bar_chart.update_layout(template="plotly_dark")

    return bar_chart

# def make_choropleth_anim(df, input_id, input_column, color_theme):
#     input_label = format_column_label(input_column)
#     color_min = df[input_column].min()
#     color_max = df[input_column].max()

#     choropleth = px.choropleth(df,
#                     locations=input_id,
#                     locationmode="ISO-3",
#                     color=input_column,
#                     hover_name=input_id,
#                     animation_frame="year",
#                     color_continuous_scale=color_theme,
#                     range_color=(color_min, color_max),
#                     labels={input_column: input_label, "year": format_column_label("year")}
#                     )

#     choropleth.update_geos(
#         fitbounds="locations",
#         visible=False
#     )

#     return choropleth

# def make_choropleth_bar_anim(df, input_id, input_column, color_theme, selected_countries=None):
#     selected_countries = selected_countries or []
#     input_label = format_column_label(input_column)
#     years = sorted(df["year"].dropna().unique())
#     color_min = df[input_column].min()
#     color_max = df[input_column].max()

#     def get_year_df(year):
#         return df[df["year"] == year].sort_values(input_column, ascending=False)

#     def get_selected_points(year_df):
#         if not selected_countries:
#             return None

#         return [
#             point_index
#             for point_index, country_code in enumerate(year_df[input_id])
#             if country_code in selected_countries
#         ]

#     def make_choropleth_trace(year_df):
#         return go.Choropleth(
#             locations=year_df[input_id],
#             z=year_df[input_column],
#             text=year_df["country_name"],
#             customdata=year_df[input_id],
#             geo="geo",
#             locationmode="ISO-3",
#             colorscale=color_theme,
#             zmin=color_min,
#             zmax=color_max,
#             colorbar=dict(title=input_label),
#             hovertemplate="%{text}<br>" + input_label + ": %{z}<extra></extra>",
#             selectedpoints=get_selected_points(year_df),
#             selected=dict(marker=dict(opacity=1)),
#             unselected=dict(marker=dict(opacity=0.35 if selected_countries else 1)),
#         )

#     def make_bar_trace(year_df):
#         return go.Bar(
#             x=year_df["country_name"],
#             y=year_df[input_column],
#             customdata=year_df[input_id],
#             marker_color=year_df[input_column],
#             marker=dict(
#                 color=year_df[input_column],
#                 colorscale=color_theme,
#                 cmin=color_min,
#                 cmax=color_max,
#                 showscale=False,
#             ),
#             xaxis="x",
#             yaxis="y",
#             hovertemplate="%{x}<br>" + input_label + ": %{y}<extra></extra>",
#             selectedpoints=get_selected_points(year_df),
#             selected=dict(marker=dict(opacity=1)),
#             unselected=dict(marker=dict(opacity=0.25 if selected_countries else 1)),
#         )

#     def make_bar_highlight_trace(year_df):
#         selected_df = year_df[year_df[input_id].isin(selected_countries)]

#         return go.Bar(
#             x=selected_df["country_name"],
#             y=selected_df[input_column],
#             customdata=selected_df[input_id],
#             marker=dict(
#                 color="rgba(0,0,0,0)",
#                 line=dict(color="#111111", width=3),
#             ),
#             xaxis="x",
#             yaxis="y",
#             hoverinfo="skip",
#             showlegend=False,
#         )

#     initial_year = years[0]
#     initial_df = get_year_df(initial_year)
#     fig = go.Figure(data=[
#         make_choropleth_trace(initial_df),
#         make_bar_trace(initial_df),
#         make_bar_highlight_trace(initial_df),
#     ])

#     fig.frames = [
#         go.Frame(
#             name=str(year),
#             data=[
#                 make_choropleth_trace(get_year_df(year)),
#                 make_bar_trace(get_year_df(year)),
#                 make_bar_highlight_trace(get_year_df(year)),
#             ],
#             traces=[0, 1, 2],
#         )
#         for year in years
#     ]

#     slider_steps = [
#         dict(
#             method="animate",
#             label=str(year),
#             args=[
#                 [str(year)],
#                 dict(mode="immediate", frame=dict(duration=500, redraw=True), transition=dict(duration=0)),
#             ],
#         )
#         for year in years
#     ]

#     layout_options = dict(
#         plot_bgcolor='rgba(0, 0, 0, 0)',
#         paper_bgcolor='rgba(0, 0, 0, 0)',
#         margin=dict(l=10, r=10, t=120, b=40),
#         clickmode='event+select',
#         height=900,
#         showlegend=False,
#         barmode="overlay",
#         geo=dict(
#             domain=dict(x=[0.0, 1.0], y=[0.43, 0.93]),
#             fitbounds="locations",
#             visible=False,
#         ),
#         xaxis=dict(
#             domain=[0.04, 0.98],
#             anchor="y",
#             tickangle=-45,
#             title="",
#         ),
#         yaxis=dict(
#             domain=[0.03, 0.34],
#             anchor="x",
#             title=input_label,
#             rangemode="tozero",
#         ),
#         updatemenus=[
#             dict(
#                 type="buttons",
#                 direction="left",
#                 x=0.0,
#                 xanchor="left",
#                 y=1.12,
#                 yanchor="bottom",
#                 showactive=False,
#                 buttons=[
#                     dict(
#                         label="Play",
#                         method="animate",
#                         args=[
#                             None,
#                             dict(frame=dict(duration=700, redraw=True), transition=dict(duration=0), fromcurrent=True),
#                         ],
#                     ),
#                     dict(
#                         label="Pause",
#                         method="animate",
#                         args=[
#                             [None],
#                             dict(frame=dict(duration=0, redraw=False), mode="immediate", transition=dict(duration=0)),
#                         ],
#                     ),
#                 ],
#             )
#         ],
#         sliders=[
#             dict(
#                 active=0,
#                 currentvalue=dict(prefix="Year: "),
#                 x=0.16,
#                 xanchor="left",
#                 y=1.09,
#                 yanchor="bottom",
#                 len=0.82,
#                 pad=dict(t=0, b=0),
#                 steps=slider_steps,
#             )
#         ],
#     )
#     if st.context.theme.type != "light":
#         layout_options["template"] = "plotly_dark"

#     fig.update_layout(**layout_options)

#     return fig

def make_heatmap(input_df, input_y, input_x, input_color, color_theme):
    heatmap = alt.Chart(input_df).mark_rect().encode(
            y=alt.Y(f'{input_y}:O', sort='descending', axis=alt.Axis(title=format_column_label(input_y), titleFontSize=18, titlePadding=15, titleFontWeight=900, labelAngle=0)),
            x=alt.X(f'{input_x}:O', axis=alt.Axis(title=format_column_label(input_x), titleFontSize=18, titlePadding=15, titleFontWeight=900)),
            color=alt.Color(f'max({input_color}):Q',
                             legend=None,
                             scale=alt.Scale(scheme=color_theme)),
            stroke=alt.value('black'),
            strokeWidth=alt.value(0.25),
        ).configure_axis(
            labelFontSize=12,
            titleFontSize=12
        )
    return heatmap

def get_housing_burden_category_style(color_theme=None):
    category_order = ["Low", "Medium", "High"]
    fallback_colors = {
        "Low": "#2ca25f",
        "Medium": "#feb24c",
        "High": "#de2d26",
    }
    if color_theme:
        try:
            sampled_colors = px.colors.sample_colorscale(color_theme, [0.15, 0.5, 0.85])
            return category_order, dict(zip(category_order, sampled_colors))
        except (TypeError, ValueError):
            pass

    return category_order, fallback_colors

def make_housing_burden_category_heatmap(df, selected_year=None, selected_countries=None, color_theme=None):
    selected_countries = selected_countries or []
    category_order, category_colors = get_housing_burden_category_style(color_theme)
    heatmap_df = df.sort_values(["country_name", "year"]).copy()
    category_codes = {category: index for index, category in enumerate(category_order)}
    years = sorted(heatmap_df["year"].unique())
    countries = sorted(heatmap_df["country_name"].unique(), reverse=True)
    year_positions = list(range(len(years)))
    country_positions = list(range(len(countries)))

    category_grid = (
        heatmap_df
        .pivot(index="country_name", columns="year", values="housing_burden_category")
        .reindex(index=countries, columns=years)
    )
    code_grid = category_grid.apply(lambda column: column.map(category_codes)).astype(float)
    label_grid = category_grid.replace({
        "Low": "L",
        "Medium": "M",
        "High": "H",
    })
    hover_grid = [
        [
            [country, year, category_grid.loc[country, year]]
            for year in years
        ]
        for country in countries
    ]

    heatmap = go.Figure(
        data=go.Heatmap(
            z=code_grid,
            x=year_positions,
            y=country_positions,
            customdata=hover_grid,
            text=label_grid,
            texttemplate="%{text}",
            textfont=dict(color="#111111", size=10),
            colorscale=[
                [0.0, category_colors["Low"]],
                [0.3333, category_colors["Low"]],
                [0.3334, category_colors["Medium"]],
                [0.6666, category_colors["Medium"]],
                [0.6667, category_colors["High"]],
                [1.0, category_colors["High"]],
            ],
            zmin=0,
            zmax=2,
            showscale=False,
            hovertemplate=(
                "Country: %{customdata[0]}<br>"
                "Year: %{customdata[1]}<br>"
                + format_column_label("housing_burden_category") + ": %{customdata[2]}<extra></extra>"
            ),
        )
    )
    if selected_year in years:
        selected_year_index = years.index(selected_year)
        heatmap.add_shape(
            type="rect",
            x0=selected_year_index - 0.5,
            x1=selected_year_index + 0.5,
            y0=-0.5,
            y1=len(countries) - 0.5,
            xref="x",
            yref="y",
            line=dict(color="#111111", width=3),
            fillcolor="rgba(0,0,0,0)",
        )

    selected_country_names = (
        heatmap_df[heatmap_df["iso3"].isin(selected_countries)]["country_name"]
        .dropna()
        .unique()
    )
    for country_name in selected_country_names:
        if country_name in countries:
            country_index = countries.index(country_name)
            heatmap.add_shape(
                type="rect",
                x0=-0.5,
                x1=len(years) - 0.5,
                y0=country_index - 0.5,
                y1=country_index + 0.5,
                xref="x",
                yref="y",
                line=dict(color="#111111", width=3),
                fillcolor="rgba(0,0,0,0)",
            )

    heatmap.update_layout(
        margin=dict(l=0, r=0, t=10, b=0),
        xaxis=dict(tickmode="array", tickvals=year_positions, ticktext=years, tickangle=0),
        yaxis=dict(title="", tickmode="array", tickvals=country_positions, ticktext=countries, automargin=True),
        height=500,
    )

    return heatmap

def make_housing_burden_category_pie(df_year, color_theme=None):
    category_order, category_colors = get_housing_burden_category_style(color_theme)
    category_counts = (
        df_year["housing_burden_category"]
        .value_counts()
        .reindex(category_order, fill_value=0)
        .reset_index()
    )
    category_counts.columns = ["housing_burden_category", "count"]
    category_counts = category_counts[category_counts["count"] > 0]

    pie = px.pie(
        category_counts,
        names="housing_burden_category",
        values="count",
        color="housing_burden_category",
        color_discrete_map=category_colors,
        category_orders={"housing_burden_category": category_order},
        hole=0.35,
    )
    pie.update_traces(
        textinfo="label+percent",
        hovertemplate="%{label}<br>Countries: %{value}<br>%{percent}<extra></extra>",
    )
    pie.update_layout(
        showlegend=False,
        margin=dict(l=10, r=10, t=10, b=10),
        height=500,
    )

    return pie

def make_lineplot(df, input_x, input_y, input_id):
    lineplot = px.line(
                df,
                x=input_x,
                y=input_y,
                color=input_id,
                markers=True,
                labels={
                    input_x: format_column_label(input_x),
                    input_y: format_column_label(input_y),
                    input_id: format_column_label(input_id),
                }
            )
    
    lineplot.update_layout(
        legend=dict(
            orientation="h",
            yanchor="top",
            y=-0.2,                
            xanchor="center",
            x=0.5
        )
    )

    return lineplot

def make_scatterplot(input_df: pd.DataFrame, input_x, input_y, color):
    scatterplot = px.scatter(
        input_df,
        x=input_x,
        y=input_y,
        color=color,
        hover_name=color,
        hover_data={
            "year": True,
            input_x: True,
            input_y: True,
            color: False,
        },
        labels={
            "year": format_column_label("year"),
            input_x: format_column_label(input_x),
            input_y: format_column_label(input_y),
            color: format_column_label(color),
        }
    )

    return scatterplot

def make_scatterplot_anim(input_df:pd.DataFrame, input_x, input_y, color, size = None):
    
    fig = px.scatter(
            input_df,
            input_x,
            input_y,
            color=color,
            animation_frame="year",
            labels={
                "year": format_column_label("year"),
                input_x: format_column_label(input_x),
                input_y: format_column_label(input_y),
                color: format_column_label(color),
            }
        )
    fig.update_layout(
        showlegend=False
    )
    return fig
