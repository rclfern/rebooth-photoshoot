"""Local Streamlit preview of the static Re:Booth frontend."""

import base64
import json
from pathlib import Path

import streamlit as st

PUBLIC = Path(__file__).resolve().parent / "public"


def image_data_url(path):
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


st.set_page_config(page_title="Re:Booth preview", layout="wide")
html = (PUBLIC / "index.html").read_text(encoding="utf-8")
css = (PUBLIC / "styles.css").read_text(encoding="utf-8")
js = (PUBLIC / "app.js").read_text(encoding="utf-8")
logo = PUBLIC / "assets" / "rebooth-logo.png"
images = (PUBLIC / "frames").glob("*.png")
assets = {f"./{path.relative_to(PUBLIC).as_posix()}": image_data_url(path) for path in images}

html = html.replace('<link rel="stylesheet" href="./styles.css">', f"<style>{css}</style>")
html = html.replace(
    '<script src="./app.js" defer></script>',
    f"<script>window.reshootAssets = {json.dumps(assets)};</script>",
)
html = html.replace("./assets/rebooth-logo.png", image_data_url(logo))
html = html.replace("</body>", f"<script>{js}</script></body>")
st.iframe(html, height=1000)
