import plotly.express as px
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