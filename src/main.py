import streamlit as st

def page2():
    pass

st.set_page_config(
    page_title='Cost of living Dashboard',
    page_icon="🏂",
    layout="wide",
    initial_sidebar_state="expanded")

pg = st.navigation([
    st.Page("pages/univariate_analysis.py", title="Univariate Analysis"),
    st.Page("pages/multivariate_analysis.py", title="Multivariate Analysis"),
    st.Page(
        "https://docs.streamlit.io",
        title="Streamlit Docs",
        icon=":material/open_in_new:"
    ),
])
pg.run()