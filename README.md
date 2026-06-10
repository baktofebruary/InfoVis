# Group 43, InfoVis Project

## Info about the project
In this project, we tried to analize how housing costs have changed during the last two decades. We used publicly available datasets from `eurostat`, with many not directly tied to housing, but also related but not limited to migration, income and fertility rate. We did the analysis in a JupyterNotebook in the `notebooks` folder, and we implemented the web interface for the visualizations with the help of libraries such as `streamlit` and for the visualization: `matplotlib`, `plotly` and `seaborn`.

## Requirements (Not strict but we can't verify reproducibility)
- `Python 3.14.5`
- The libraries are in `requirements.txt`

## How to run
- Create a virtual environment\
`python3.14 -m venv venv`
- Activate the created environment
    - `.\venv\Scripts\activate` For Windows
    - `source ./venv/bin/activate` For GNU/Linux

## Run the App
- From the project directory\
`streamlit run src/main.py`