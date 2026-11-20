"""Pemeriksaan QA untuk aset vendor dan urutan pemuatan script (Milestone 8).

Test ini melengkapi test root yang sudah ada: fokusnya pada ketersediaan aset
Cytoscape lokal dan urutan dependency di halaman.
"""

from app import app as flask_app


SCRIPT_ORDER = (
    "js/storage.js",
    "js/api.js",
    "vendor/cytoscape.min.js",
    "js/graph.js",
    "js/app.js",
)


def test_root_memuat_semua_script_frontend():
    response = flask_app.test_client().get("/")

    assert response.status_code == 200
    html = response.get_data(as_text=True)
    for script in SCRIPT_ORDER:
        assert script in html


def test_root_memuat_script_dalam_urutan_yang_benar():
    response = flask_app.test_client().get("/")
    html = response.get_data(as_text=True)

    positions = [html.index(script) for script in SCRIPT_ORDER]

    assert positions == sorted(positions)


def test_aset_cytoscape_lokal_dapat_diakses():
    response = flask_app.test_client().get("/static/vendor/cytoscape.min.js")

    assert response.status_code == 200
    assert "javascript" in response.content_type
    assert b"The Cytoscape Consortium" in response.data[:500]
