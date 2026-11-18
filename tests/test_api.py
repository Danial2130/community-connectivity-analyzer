"""Test untuk REST API (Milestone 5).

Menguji POST /api/analyze dan POST /api/shortest-path, termasuk validasi
input, format response, dan penanganan error HTTP.
"""

import json

import pytest

from app import app as flask_app


SAMPLE_VERTICES = [
    {"id": "A", "name": "Andi"},
    {"id": "B", "name": "Budi"},
    {"id": "C", "name": "Citra"},
    {"id": "D", "name": "Deni"},
    {"id": "E", "name": "Eka"},
    {"id": "F", "name": "Fajar"},
]

SAMPLE_EDGES = [
    {"source": "A", "target": "B"},
    {"source": "A", "target": "C"},
    {"source": "B", "target": "C"},
    {"source": "C", "target": "D"},
    {"source": "D", "target": "E"},
]


def make_vertices(*vertex_ids):
    """Membuat daftar vertex sederhana dari sekumpulan ID."""
    return [
        {"id": vertex_id, "name": "Nama " + vertex_id}
        for vertex_id in vertex_ids
    ]


def make_edges(*pairs):
    """Membuat daftar edge dari pasangan (source, target)."""
    return [
        {"source": source, "target": target}
        for source, target in pairs
    ]


def graph_payload(vertices, edges, **extra_fields):
    """Membuat payload graf untuk endpoint API."""
    payload = {"vertices": vertices, "edges": edges}
    payload.update(extra_fields)
    return payload


def assert_error_response(response, status_code):
    """Memastikan response error memakai format JSON yang konsisten."""
    assert response.status_code == status_code
    body = response.get_json()
    assert body["success"] is False
    assert isinstance(body["error"]["message"], str)
    assert body["error"]["message"] != ""
    assert set(body) == {"success", "error"}
    assert set(body["error"]) == {"message"}
    return body


@pytest.fixture
def client():
    flask_app.config.update(
        TESTING=True,
        PROPAGATE_EXCEPTIONS=False,
    )
    with flask_app.test_client() as test_client:
        yield test_client


# ---------------------------------------------------------------------------
# POST /api/analyze — response sukses
# ---------------------------------------------------------------------------


def test_analyze_sample_dataset_matches_prd(client):
    response = client.post(
        "/api/analyze",
        json=graph_payload(SAMPLE_VERTICES, SAMPLE_EDGES),
    )

    assert response.status_code == 200
    assert response.get_json() == {
        "success": True,
        "data": {
            "degrees": {
                "A": 2,
                "B": 2,
                "C": 3,
                "D": 2,
                "E": 1,
                "F": 0,
            },
            "isolated_members": ["F"],
            "components": [
                ["A", "B", "C", "D", "E"],
                ["F"],
            ],
            "component_count": 2,
            "vertex_count": 6,
            "edge_count": 5,
            "highest_degree": {"value": 3, "members": ["C"]},
            "lowest_degree": {"value": 0, "members": ["F"]},
        },
    }


def test_analyze_returns_all_members_for_tied_degrees(client):
    vertices = make_vertices("A", "B", "C", "D", "E")
    # Segitiga A-B-C membuat A=2, B=2, C=2, sedangkan D=0 dan E=0.
    edges = make_edges(("A", "B"), ("A", "C"), ("B", "C"))

    response = client.post(
        "/api/analyze", json=graph_payload(vertices, edges)
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["degrees"] == {"A": 2, "B": 2, "C": 2, "D": 0, "E": 0}
    assert data["highest_degree"] == {
        "value": 2,
        "members": ["A", "B", "C"],
    }
    assert data["lowest_degree"] == {
        "value": 0,
        "members": ["D", "E"],
    }


def test_analyze_all_vertices_isolated(client):
    vertices = make_vertices("A", "B", "C")

    response = client.post(
        "/api/analyze", json=graph_payload(vertices, [])
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["degrees"] == {"A": 0, "B": 0, "C": 0}
    assert data["isolated_members"] == ["A", "B", "C"]
    assert data["components"] == [["A"], ["B"], ["C"]]
    assert data["component_count"] == 3
    assert data["vertex_count"] == 3
    assert data["edge_count"] == 0
    assert data["highest_degree"] == {
        "value": 0,
        "members": ["A", "B", "C"],
    }
    assert data["lowest_degree"] == {
        "value": 0,
        "members": ["A", "B", "C"],
    }


def test_analyze_empty_graph_returns_null_degree_summaries(client):
    response = client.post(
        "/api/analyze", json=graph_payload([], [])
    )

    assert response.status_code == 200
    assert response.get_json() == {
        "success": True,
        "data": {
            "degrees": {},
            "isolated_members": [],
            "components": [],
            "component_count": 0,
            "vertex_count": 0,
            "edge_count": 0,
            "highest_degree": None,
            "lowest_degree": None,
        },
    }


def test_analyze_single_vertex_without_edges(client):
    response = client.post(
        "/api/analyze", json=graph_payload(make_vertices("A"), [])
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["degrees"] == {"A": 0}
    assert data["isolated_members"] == ["A"]
    assert data["highest_degree"] == {"value": 0, "members": ["A"]}
    assert data["lowest_degree"] == {"value": 0, "members": ["A"]}


def test_analyze_ignores_extra_json_fields(client):
    payload = graph_payload(
        make_vertices("A", "B"),
        make_edges(("A", "B")),
        catatan="field tambahan harus diabaikan",
    )

    response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["degrees"] == {"A": 1, "B": 1}
    assert data["edge_count"] == 1


def test_analyze_accepts_json_content_type_with_charset(client):
    response = client.post(
        "/api/analyze",
        data=json.dumps(graph_payload(SAMPLE_VERTICES, SAMPLE_EDGES)),
        content_type="application/json; charset=utf-8",
    )

    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_analyze_is_stateless_between_requests(client):
    first = client.post(
        "/api/analyze",
        json=graph_payload(
            make_vertices("A", "B"), make_edges(("A", "B"))
        ),
    )
    second = client.post(
        "/api/analyze", json=graph_payload(make_vertices("A"), [])
    )
    third = client.post(
        "/api/analyze",
        json=graph_payload(
            make_vertices("A", "B"), make_edges(("A", "B"))
        ),
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert third.status_code == 200

    assert first.get_json() == third.get_json()
    second_data = second.get_json()["data"]
    assert second_data["degrees"] == {"A": 0}
    assert second_data["vertex_count"] == 1


# ---------------------------------------------------------------------------
# POST /api/analyze — error
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "payload",
    [
        graph_payload(
            SAMPLE_VERTICES,
            [{"source": "A", "target": "Z"}],
        ),
        graph_payload(
            SAMPLE_VERTICES,
            [{"source": "A", "target": "A"}],
        ),
        graph_payload(
            SAMPLE_VERTICES,
            [
                {"source": "A", "target": "B"},
                {"source": "B", "target": "A"},
            ],
        ),
        graph_payload(
            [
                {"id": "A", "name": "Andi"},
                {"id": "A", "name": "Budi"},
            ],
            [],
        ),
        graph_payload(
            [{"id": "A", "name": "   "}],
            [],
        ),
        {"edges": []},
        {"vertices": []},
        graph_payload("bukan list", []),
        graph_payload([], "bukan list"),
    ],
)
def test_analyze_rejects_invalid_graph(client, payload):
    response = client.post("/api/analyze", json=payload)
    assert_error_response(response, 400)


def test_analyze_rejects_unknown_vertex_with_specific_message(client):
    response = client.post(
        "/api/analyze",
        json=graph_payload(
            SAMPLE_VERTICES,
            [{"source": "A", "target": "Z"}],
        ),
    )

    body = assert_error_response(response, 400)
    assert "tidak terdaftar" in body["error"]["message"]


def test_analyze_rejects_self_loop_with_specific_message(client):
    response = client.post(
        "/api/analyze",
        json=graph_payload(
            SAMPLE_VERTICES,
            [{"source": "B", "target": "B"}],
        ),
    )

    body = assert_error_response(response, 400)
    assert "Self-loop" in body["error"]["message"]


def test_analyze_rejects_reversed_duplicate_edge(client):
    response = client.post(
        "/api/analyze",
        json=graph_payload(
            SAMPLE_VERTICES,
            [
                {"source": "A", "target": "B"},
                {"source": "B", "target": "A"},
            ],
        ),
    )

    body = assert_error_response(response, 400)
    assert "duplikat" in body["error"]["message"]


def test_analyze_rejects_malformed_json(client):
    response = client.post(
        "/api/analyze",
        data="{ini bukan json",
        content_type="application/json",
    )

    assert_error_response(response, 400)


def test_analyze_rejects_json_array_body(client):
    response = client.post("/api/analyze", json=[SAMPLE_VERTICES])

    assert_error_response(response, 400)


@pytest.mark.parametrize(
    "content_type",
    ["text/plain", None],
)
def test_analyze_rejects_non_json_content_type(client, content_type):
    body = json.dumps(graph_payload(SAMPLE_VERTICES, SAMPLE_EDGES))

    response = client.post(
        "/api/analyze",
        data=body,
        content_type=content_type,
    )

    assert_error_response(response, 415)


def test_analyze_rejects_get_method(client):
    response = client.get("/api/analyze")
    assert_error_response(response, 405)


# ---------------------------------------------------------------------------
# POST /api/shortest-path — response sukses
# ---------------------------------------------------------------------------


def shortest_path_payload(start, end, vertices=None, edges=None):
    """Membuat payload shortest path dengan dataset PRD sebagai default."""
    return {
        "vertices": SAMPLE_VERTICES if vertices is None else vertices,
        "edges": SAMPLE_EDGES if edges is None else edges,
        "start": start,
        "end": end,
    }


def test_shortest_path_a_to_e_matches_prd(client):
    response = client.post(
        "/api/shortest-path", json=shortest_path_payload("A", "E")
    )

    assert response.status_code == 200
    assert response.get_json() == {
        "success": True,
        "data": {
            "found": True,
            "path": ["A", "C", "D", "E"],
            "distance": 3,
        },
    }


def test_shortest_path_is_reversible(client):
    response = client.post(
        "/api/shortest-path", json=shortest_path_payload("E", "A")
    )

    assert response.status_code == 200
    assert response.get_json()["data"] == {
        "found": True,
        "path": ["E", "D", "C", "A"],
        "distance": 3,
    }


def test_shortest_path_start_equals_end(client):
    response = client.post(
        "/api/shortest-path", json=shortest_path_payload("A", "A")
    )

    assert response.status_code == 200
    assert response.get_json()["data"] == {
        "found": True,
        "path": ["A"],
        "distance": 0,
    }


def test_shortest_path_start_equals_end_on_isolated_vertex(client):
    response = client.post(
        "/api/shortest-path", json=shortest_path_payload("F", "F")
    )

    assert response.status_code == 200
    assert response.get_json()["data"] == {
        "found": True,
        "path": ["F"],
        "distance": 0,
    }


def test_shortest_path_unreachable_returns_not_found(client):
    response = client.post(
        "/api/shortest-path", json=shortest_path_payload("A", "F")
    )

    assert response.status_code == 200
    assert response.get_json()["data"] == {
        "found": False,
        "path": [],
        "distance": None,
    }


def test_shortest_path_on_empty_graph_rejects_endpoints(client):
    response = client.post(
        "/api/shortest-path",
        json=shortest_path_payload(
            "A", "B", vertices=[], edges=[]
        ),
    )

    assert_error_response(response, 400)


# ---------------------------------------------------------------------------
# POST /api/shortest-path — error
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "start, end",
    [
        ("Z", "A"),
        ("A", "Z"),
    ],
)
def test_shortest_path_rejects_unknown_vertex(client, start, end):
    response = client.post(
        "/api/shortest-path",
        json=shortest_path_payload(start, end),
    )

    body = assert_error_response(response, 400)
    assert "tidak terdaftar" in body["error"]["message"]


@pytest.mark.parametrize(
    "start, end",
    [
        (None, "A"),
        ("A", None),
        (123, "A"),
        ("A", 123),
        ("", "A"),
        ("A", ""),
        ("   ", "A"),
        ("A", "   "),
    ],
)
def test_shortest_path_rejects_invalid_endpoint_values(client, start, end):
    response = client.post(
        "/api/shortest-path",
        json=shortest_path_payload(start, end),
    )

    assert_error_response(response, 400)


@pytest.mark.parametrize(
    "payload",
    [
        {
            "vertices": SAMPLE_VERTICES,
            "edges": SAMPLE_EDGES,
            "end": "E",
        },
        {
            "vertices": SAMPLE_VERTICES,
            "edges": SAMPLE_EDGES,
            "start": "A",
        },
        {
            "edges": SAMPLE_EDGES,
            "start": "A",
            "end": "E",
        },
        {
            "vertices": SAMPLE_VERTICES,
            "start": "A",
            "end": "E",
        },
    ],
)
def test_shortest_path_rejects_missing_fields(client, payload):
    response = client.post("/api/shortest-path", json=payload)
    assert_error_response(response, 400)


def test_shortest_path_rejects_invalid_graph(client):
    response = client.post(
        "/api/shortest-path",
        json={
            "vertices": SAMPLE_VERTICES,
            "edges": [{"source": "A", "target": "A"}],
            "start": "A",
            "end": "E",
        },
    )

    body = assert_error_response(response, 400)
    assert "Self-loop" in body["error"]["message"]


def test_shortest_path_rejects_malformed_json(client):
    response = client.post(
        "/api/shortest-path",
        data="bukan json",
        content_type="application/json",
    )

    assert_error_response(response, 400)


def test_shortest_path_rejects_non_json_content_type(client):
    response = client.post(
        "/api/shortest-path",
        data=json.dumps(shortest_path_payload("A", "E")),
        content_type="text/plain",
    )

    assert_error_response(response, 415)


def test_shortest_path_rejects_get_method(client):
    response = client.get("/api/shortest-path")
    assert_error_response(response, 405)


# ---------------------------------------------------------------------------
# Penanganan error umum, 500, dan regresi halaman utama
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("method", ["get", "post", "put", "delete"])
def test_unknown_endpoint_returns_json_404(client, method):
    response = getattr(client, method)("/api/tidak-ada")
    assert_error_response(response, 404)


def test_root_page_still_returns_html(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.mimetype == "text/html"


def test_unexpected_error_returns_generic_500(client, monkeypatch):
    def broken_degrees(adjacency_list):
        raise RuntimeError("detail internal yang tidak boleh bocor")

    monkeypatch.setattr(
        "routes.graph_routes.calculate_degrees", broken_degrees
    )

    response = client.post(
        "/api/analyze",
        json=graph_payload(
            make_vertices("A", "B"), make_edges(("A", "B"))
        ),
    )

    body = assert_error_response(response, 500)
    assert body["error"]["message"] == "Terjadi kesalahan pada server."
    assert "detail internal" not in response.get_data(as_text=True)
    assert "Traceback" not in response.get_data(as_text=True)


def test_unexpected_error_on_shortest_path_returns_generic_500(
    client, monkeypatch
):
    def broken_shortest_path(adjacency_list, start, end):
        raise RuntimeError("detail internal shortest path")

    monkeypatch.setattr(
        "routes.graph_routes.bfs_shortest_path", broken_shortest_path
    )

    response = client.post(
        "/api/shortest-path", json=shortest_path_payload("A", "E")
    )

    body = assert_error_response(response, 500)
    assert body["error"]["message"] == "Terjadi kesalahan pada server."
    assert "detail internal" not in response.get_data(as_text=True)
