"""REST API untuk analisis graf dan pencarian jalur terpendek.

Endpoint:
- POST /api/analyze
- POST /api/shortest-path

Modul ini hanya menangani HTTP request/response. Seluruh perhitungan graf
tetap berada di graph/algorithms.py.
"""

from flask import Blueprint, jsonify, request

from graph.algorithms import (
    GraphValidationError,
    bfs_shortest_path,
    build_adjacency_list,
    calculate_degrees,
    find_connected_components,
    find_isolated_members,
)


graph_api = Blueprint("graph_api", __name__, url_prefix="/api")


def _error_response(message, status_code):
    """Membuat response error dengan format yang konsisten."""
    return jsonify({
        "success": False,
        "error": {"message": message},
    }), status_code


def _read_json_object():
    """Membaca body JSON dan memastikan bentuknya objek.

    Return:
        (payload, None) jika valid, atau (None, response_error) jika tidak.
    """
    if not request.is_json:
        return None, _error_response(
            "Content-Type harus application/json.", 415
        )

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return None, _error_response(
            "Body request harus berupa objek JSON yang valid.", 400
        )

    return payload, None


def _degree_summary(degrees, use_highest):
    """Merangkum degree tertinggi atau terendah beserta seluruh anggotanya.

    Return None jika graf tidak memiliki vertex.
    """
    if not degrees:
        return None

    if use_highest:
        value = max(degrees.values())
    else:
        value = min(degrees.values())

    members = [
        vertex
        for vertex, degree in degrees.items()
        if degree == value
    ]

    return {"value": value, "members": members}


@graph_api.post("/analyze")
def analyze_graph():
    """Menghitung degree, isolated member, dan connected components."""
    payload, error = _read_json_object()
    if error is not None:
        return error

    vertices = payload.get("vertices")
    edges = payload.get("edges")

    try:
        adjacency_list = build_adjacency_list(vertices, edges)
    except GraphValidationError as validation_error:
        return _error_response(str(validation_error), 400)

    degrees = calculate_degrees(adjacency_list)
    isolated_members = find_isolated_members(degrees)
    components = find_connected_components(adjacency_list)

    data = {
        "degrees": degrees,
        "isolated_members": isolated_members,
        "components": components,
        "component_count": len(components),
        "vertex_count": len(vertices),
        "edge_count": len(edges),
        "highest_degree": _degree_summary(degrees, use_highest=True),
        "lowest_degree": _degree_summary(degrees, use_highest=False),
    }

    return jsonify({"success": True, "data": data})


@graph_api.post("/shortest-path")
def shortest_path():
    """Mencari jalur terpendek antara dua vertex menggunakan BFS."""
    payload, error = _read_json_object()
    if error is not None:
        return error

    start = payload.get("start")
    end = payload.get("end")

    if not isinstance(start, str) or start.strip() == "":
        return _error_response(
            "Parameter 'start' wajib diisi dan berupa string.", 400
        )
    if not isinstance(end, str) or end.strip() == "":
        return _error_response(
            "Parameter 'end' wajib diisi dan berupa string.", 400
        )

    vertices = payload.get("vertices")
    edges = payload.get("edges")

    try:
        adjacency_list = build_adjacency_list(vertices, edges)
        result = bfs_shortest_path(adjacency_list, start, end)
    except GraphValidationError as validation_error:
        return _error_response(str(validation_error), 400)

    return jsonify({"success": True, "data": result})
