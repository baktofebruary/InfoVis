import plotly.express as px
import plotly.graph_objects as go
import altair as alt
import streamlit as st
import pandas as pd

# PAGE 1
def make_choropleth(df, input_id, input_column, color_theme):
    choropleth = px.choropleth(df,
                    locations=input_id,
                    locationmode="ISO-3",
                    color=input_column,
                    hover_name=input_id,
                    color_continuous_scale=color_theme
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

def make_choropleth_anim(df, input_id, input_column, color_theme):
    color_min = df[input_column].min()
    color_max = df[input_column].max()

    choropleth = px.choropleth(df,
                    locations=input_id,
                    locationmode="ISO-3",
                    color=input_column,
                    hover_name=input_id,
                    animation_frame="year",
                    color_continuous_scale=color_theme,
                    range_color=(color_min, color_max)
                    )

    choropleth.update_geos(
        fitbounds="locations",
        visible=False
    )

    return choropleth

def make_choropleth_bar_anim(df, input_id, input_column, color_theme):
    years = sorted(df["year"].dropna().unique())
    color_min = df[input_column].min()
    color_max = df[input_column].max()

    def get_year_df(year):
        return df[df["year"] == year].sort_values(input_column, ascending=False)

    def make_choropleth_trace(year_df):
        return go.Choropleth(
            locations=year_df[input_id],
            z=year_df[input_column],
            text=year_df["country_name"],
            geo="geo",
            locationmode="ISO-3",
            colorscale=color_theme,
            zmin=color_min,
            zmax=color_max,
            colorbar=dict(title=input_column),
            hovertemplate="%{text}<br>" + input_column + ": %{z}<extra></extra>",
        )

    def make_bar_trace(year_df):
        return go.Bar(
            x=year_df["country_name"],
            y=year_df[input_column],
            marker_color=year_df[input_column],
            marker=dict(
                color=year_df[input_column],
                colorscale=color_theme,
                cmin=color_min,
                cmax=color_max,
                showscale=False,
            ),
            xaxis="x",
            yaxis="y",
            hovertemplate="%{x}<br>" + input_column + ": %{y}<extra></extra>",
        )

    initial_year = years[0]
    initial_df = get_year_df(initial_year)
    fig = go.Figure(data=[
        make_choropleth_trace(initial_df),
        make_bar_trace(initial_df),
    ])

    fig.frames = [
        go.Frame(
            name=str(year),
            data=[
                make_choropleth_trace(get_year_df(year)),
                make_bar_trace(get_year_df(year)),
            ],
            traces=[0, 1],
        )
        for year in years
    ]

    slider_steps = [
        dict(
            method="animate",
            label=str(year),
            args=[
                [str(year)],
                dict(mode="immediate", frame=dict(duration=500, redraw=True), transition=dict(duration=0)),
            ],
        )
        for year in years
    ]

    layout_options = dict(
        plot_bgcolor='rgba(0, 0, 0, 0)',
        paper_bgcolor='rgba(0, 0, 0, 0)',
        margin=dict(l=10, r=10, t=120, b=40),
        clickmode='event+select',
        height=900,
        showlegend=False,
        geo=dict(
            domain=dict(x=[0.0, 1.0], y=[0.43, 0.93]),
            fitbounds="locations",
            visible=False,
        ),
        xaxis=dict(
            domain=[0.04, 0.98],
            anchor="y",
            tickangle=-45,
            title="",
        ),
        yaxis=dict(
            domain=[0.03, 0.34],
            anchor="x",
            title=input_column,
            rangemode="tozero",
        ),
        updatemenus=[
            dict(
                type="buttons",
                direction="left",
                x=0.0,
                xanchor="left",
                y=1.12,
                yanchor="bottom",
                showactive=False,
                buttons=[
                    dict(
                        label="Play",
                        method="animate",
                        args=[
                            None,
                            dict(frame=dict(duration=700, redraw=True), transition=dict(duration=0), fromcurrent=True),
                        ],
                    ),
                    dict(
                        label="Pause",
                        method="animate",
                        args=[
                            [None],
                            dict(frame=dict(duration=0, redraw=False), mode="immediate", transition=dict(duration=0)),
                        ],
                    ),
                ],
            )
        ],
        sliders=[
            dict(
                active=0,
                currentvalue=dict(prefix="Year: "),
                x=0.16,
                xanchor="left",
                y=1.09,
                yanchor="bottom",
                len=0.82,
                pad=dict(t=0, b=0),
                steps=slider_steps,
            )
        ],
    )
    if st.context.theme.type != "light":
        layout_options["template"] = "plotly_dark"

    fig.update_layout(**layout_options)

    return fig

def make_heatmap(input_df, input_y, input_x, input_color, color_theme):
    heatmap = alt.Chart(input_df).mark_rect().encode(
            y=alt.Y(f'{input_y}:O', sort='descending', axis=alt.Axis(title="Year", titleFontSize=18, titlePadding=15, titleFontWeight=900, labelAngle=0)),
            x=alt.X(f'{input_x}:O', axis=alt.Axis(title="", titleFontSize=18, titlePadding=15, titleFontWeight=900)),
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

def make_lineplot(df, input_x, input_y, input_id):
    lineplot = px.line(
                df,
                x=input_x,
                y=input_y,
                color=input_id,
                markers=True
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
        }
    )

    return scatterplot

def make_scatterplot_anim(input_df:pd.DataFrame, input_x, input_y, color, size = None):
    
    fig = px.scatter(
            input_df,
            input_x,
            input_y,
            color=color,
            animation_frame="year"
        )
    fig.update_layout(
        showlegend=False
    )
    return fig
