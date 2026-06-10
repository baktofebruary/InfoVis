import streamlit as st

st.set_page_config(
    page_title='Housing Affordability Across European Countries',
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded")

pg = st.navigation([
    st.Page("pages/streamlit_app.py", title="Homepage")
])

pg.run()