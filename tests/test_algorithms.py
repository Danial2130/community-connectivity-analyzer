"""Unit test untuk graph/algorithms.py (Milestone 4).

Menguji adjacency list, degree, DFS, connected components, BFS,
rekonstruksi jalur, validasi graf, dan edge case sesuai dokumentasi.
"""

import pytest

from graph.algorithms import (
    GraphValidationError,
    bfs_parents,
    bfs_shortest_path,
    build_adjacency_list,
    calculate_degrees,
    dfs,
    find_connected_components,
    find_isolated_members,
    reconstruct_path,
)


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


def assert_valid_path(adjacency_list, path, start, end, distance):
    """Memastikan path benar-benar jalur valid dengan jarak yang sesuai."""
    assert path[0] == start
    assert path[-1] == end
    assert len(path) - 1 == distance
    assert len(path) == len(set(path)), "jalur tidak boleh mengulang vertex"

    for source, target in zip(path, path[1:]):
        assert target in adjacency_list[source]


@pytest.fixture
def sample_adjacency():
    return build_adjacency_list(SAMPLE_VERTICES, SAMPLE_EDGES)


@pytest.fixture
def sample_degrees(sample_adjacency):
    return calculate_degrees(sample_adjacency)


# ---------------------------------------------------------------------------
# Build adjacency list
# ---------------------------------------------------------------------------


def test_sample_adjacency_list_matches_prd(sample_adjacency):
    assert sample_adjacency == {
        "A": ["B", "C"],
        "B": ["A", "C"],
        "C": ["A", "B", "D"],
        "D": ["C", "E"],
        "E": ["D"],
        "F": [],
    }


def test_each_edge_is_stored_in_both_directions(sample_adjacency):
    for edge in SAMPLE_EDGES:
        assert edge["target"] in sample_adjacency[edge["source"]]
        assert edge["source"] in sample_adjacency[edge["target"]]


def test_adjacency_list_keeps_vertex_input_order(sample_adjacency):
    assert list(sample_adjacency) == ["A", "B", "C", "D", "E", "F"]


def test_empty_graph_produces_empty_adjacency_list():
    assert build_adjacency_list([], []) == {}


def test_duplicate_names_are_allowed_because_identity_is_id():
    vertices = [
        {"id": "A", "name": "Andi"},
        {"id": "B", "name": "Andi"},
    ]
    adjacency = build_adjacency_list(vertices, [])
    assert list(adjacency) == ["A", "B"]


def test_vertex_id_with_internal_space_is_allowed():
    vertices = [{"id": "A B", "name": "Andi"}]
    assert build_adjacency_list(vertices, []) == {"A B": []}


@pytest.mark.parametrize(
    "vertices, edges",
    [
        ("bukan list", []),
        ([], "bukan list"),
        (["bukan dict"], []),
        ([{"name": "Andi"}], []),
        ([{"id": None, "name": "Andi"}], []),
        ([{"id": "", "name": "Andi"}], []),
        ([{"id": "   ", "name": "Andi"}], []),
        ([{"id": " A", "name": "Andi"}], []),
        ([{"id": "A ", "name": "Andi"}], []),
        ([{"id": " A ", "name": "Andi"}], []),
        ([{"id": "A"}], []),
        ([{"id": "A", "name": ""}], []),
        ([{"id": "A", "name": "   "}], []),
        ([{"id": "A", "name": 123}], []),
        (
            [
                {"id": "A", "name": "Andi"},
                {"id": "A", "name": "Budi"},
            ],
            [],
        ),
        (SAMPLE_VERTICES, ["bukan dict"]),
        (SAMPLE_VERTICES, [{"source": "A"}]),
        (SAMPLE_VERTICES, [{"source": "A", "target": None}]),
        (SAMPLE_VERTICES, [{"source": "A", "target": "Z"}]),
        (SAMPLE_VERTICES, [{"source": "Z", "target": "A"}]),
        (SAMPLE_VERTICES, [{"source": "A", "target": "A"}]),
        (
            SAMPLE_VERTICES,
            [
                {"source": "A", "target": "B"},
                {"source": "A", "target": "B"},
            ],
        ),
        (
            SAMPLE_VERTICES,
            [
                {"source": "A", "target": "B"},
                {"source": "B", "target": "A"},
            ],
        ),
        (SAMPLE_VERTICES, [{"source": " A", "target": "B"}]),
    ],
)
def test_invalid_graph_is_rejected(vertices, edges):
    with pytest.raises(GraphValidationError):
        build_adjacency_list(vertices, edges)


# ---------------------------------------------------------------------------
# Degree dan isolated member
# ---------------------------------------------------------------------------


def test_sample_degrees_match_prd(sample_degrees):
    assert sample_degrees == {
        "A": 2,
        "B": 2,
        "C": 3,
        "D": 2,
        "E": 1,
        "F": 0,
    }


def test_empty_graph_has_no_degrees():
    assert calculate_degrees({}) == {}


def test_vertex_without_edges_has_degree_zero():
    adjacency = build_adjacency_list(make_vertices("A"), [])
    assert calculate_degrees(adjacency) == {"A": 0}


def test_sum_of_degrees_equals_twice_the_edge_count(sample_degrees):
    assert sum(sample_degrees.values()) == 2 * len(SAMPLE_EDGES)


def test_sample_isolated_member_is_fajar(sample_degrees):
    assert find_isolated_members(sample_degrees) == ["F"]


def test_no_isolated_members_when_all_vertices_connected():
    adjacency = build_adjacency_list(
        make_vertices("A", "B", "C"),
        make_edges(("A", "B"), ("B", "C")),
    )
    assert find_isolated_members(calculate_degrees(adjacency)) == []


def test_all_vertices_can_be_isolated():
    adjacency = build_adjacency_list(make_vertices("A", "B", "C"), [])
    degrees = calculate_degrees(adjacency)
    assert find_isolated_members(degrees) == ["A", "B", "C"]


def test_empty_graph_has_no_isolated_members():
    assert find_isolated_members({}) == []


# ---------------------------------------------------------------------------
# DFS
# ---------------------------------------------------------------------------


def test_dfs_visit_order_from_a(sample_adjacency):
    assert dfs(sample_adjacency, "A") == ["A", "B", "C", "D", "E"]


def test_dfs_from_isolated_vertex_only_visits_that_vertex(sample_adjacency):
    assert dfs(sample_adjacency, "F") == ["F"]


def test_dfs_only_visits_reachable_vertices(sample_adjacency):
    visited = dfs(sample_adjacency, "B")
    assert set(visited) == {"A", "B", "C", "D", "E"}
    assert "F" not in visited


def test_dfs_does_not_visit_a_vertex_twice(sample_adjacency):
    visited = dfs(sample_adjacency, "C")
    assert len(visited) == len(set(visited))


def test_dfs_rejects_unknown_start_vertex(sample_adjacency):
    with pytest.raises(GraphValidationError):
        dfs(sample_adjacency, "Z")


def test_dfs_on_empty_graph_rejects_any_start():
    with pytest.raises(GraphValidationError):
        dfs({}, "A")


# ---------------------------------------------------------------------------
# Connected components
# ---------------------------------------------------------------------------


def test_sample_has_two_components(sample_adjacency):
    assert find_connected_components(sample_adjacency) == [
        ["A", "B", "C", "D", "E"],
        ["F"],
    ]


def test_fully_connected_graph_has_one_component():
    adjacency = build_adjacency_list(
        make_vertices("A", "B", "C", "D"),
        make_edges(("A", "B"), ("B", "C"), ("C", "D"), ("D", "A")),
    )
    assert find_connected_components(adjacency) == [["A", "B", "C", "D"]]


def test_graph_without_edges_has_singleton_components():
    adjacency = build_adjacency_list(make_vertices("A", "B", "C"), [])
    assert find_connected_components(adjacency) == [["A"], ["B"], ["C"]]


def test_multiple_separate_components_with_isolated_vertex():
    adjacency = build_adjacency_list(
        make_vertices("A", "B", "C", "D", "E"),
        make_edges(("A", "B"), ("C", "D")),
    )
    assert find_connected_components(adjacency) == [
        ["A", "B"],
        ["C", "D"],
        ["E"],
    ]


def test_every_vertex_appears_in_exactly_one_component(sample_adjacency):
    components = find_connected_components(sample_adjacency)
    flattened = [vertex for component in components for vertex in component]

    assert len(flattened) == len(set(flattened))
    assert set(flattened) == set(sample_adjacency)


def test_empty_graph_has_no_components():
    assert find_connected_components({}) == []


# ---------------------------------------------------------------------------
# BFS dan rekonstruksi jalur
# ---------------------------------------------------------------------------


def test_bfs_parent_map_from_a(sample_adjacency):
    assert bfs_parents(sample_adjacency, "A") == {
        "A": None,
        "B": "A",
        "C": "A",
        "D": "C",
        "E": "D",
    }


def test_bfs_parent_map_from_isolated_vertex(sample_adjacency):
    assert bfs_parents(sample_adjacency, "F") == {"F": None}


def test_bfs_rejects_unknown_start_vertex(sample_adjacency):
    with pytest.raises(GraphValidationError):
        bfs_parents(sample_adjacency, "Z")


def test_bfs_on_empty_graph_rejects_any_start():
    with pytest.raises(GraphValidationError):
        bfs_parents({}, "A")


def test_shortest_path_from_a_to_e_matches_prd(sample_adjacency):
    assert bfs_shortest_path(sample_adjacency, "A", "E") == {
        "found": True,
        "path": ["A", "C", "D", "E"],
        "distance": 3,
    }


def test_shortest_path_is_reversible(sample_adjacency):
    assert bfs_shortest_path(sample_adjacency, "E", "A") == {
        "found": True,
        "path": ["E", "D", "C", "A"],
        "distance": 3,
    }


def test_unreachable_vertices_return_not_found(sample_adjacency):
    assert bfs_shortest_path(sample_adjacency, "A", "F") == {
        "found": False,
        "path": [],
        "distance": None,
    }


def test_start_and_end_same_vertex_returns_single_vertex_path(sample_adjacency):
    assert bfs_shortest_path(sample_adjacency, "A", "A") == {
        "found": True,
        "path": ["A"],
        "distance": 0,
    }


def test_start_and_end_same_isolated_vertex(sample_adjacency):
    assert bfs_shortest_path(sample_adjacency, "F", "F") == {
        "found": True,
        "path": ["F"],
        "distance": 0,
    }


def test_bfs_chooses_direct_edge_over_longer_path():
    adjacency = build_adjacency_list(
        make_vertices("A", "B", "D"),
        make_edges(("A", "B"), ("B", "D"), ("A", "D")),
    )
    result = bfs_shortest_path(adjacency, "A", "D")

    assert result["found"] is True
    assert result["distance"] == 1
    assert result["path"] == ["A", "D"]


def test_equal_length_shortest_paths_are_both_valid():
    adjacency = build_adjacency_list(
        make_vertices("A", "B", "C", "D"),
        make_edges(("A", "B"), ("B", "D"), ("A", "C"), ("C", "D")),
    )
    result = bfs_shortest_path(adjacency, "A", "D")

    assert result["found"] is True
    assert result["distance"] == 2
    assert result["path"] in (["A", "B", "D"], ["A", "C", "D"])
    assert_valid_path(adjacency, result["path"], "A", "D", 2)


def test_sample_shortest_path_is_a_valid_minimum_path(sample_adjacency):
    result = bfs_shortest_path(sample_adjacency, "A", "E")
    assert_valid_path(sample_adjacency, result["path"], "A", "E", 3)


def test_shortest_path_rejects_unknown_endpoints(sample_adjacency):
    with pytest.raises(GraphValidationError):
        bfs_shortest_path(sample_adjacency, "Z", "A")

    with pytest.raises(GraphValidationError):
        bfs_shortest_path(sample_adjacency, "A", "Z")


def test_shortest_path_on_empty_graph_rejects_any_endpoint():
    with pytest.raises(GraphValidationError):
        bfs_shortest_path({}, "A", "B")


def test_reconstruct_path_builds_path_from_parent_map():
    parents = {"A": None, "B": "A", "C": "B", "D": "C"}
    assert reconstruct_path(parents, "A", "D") == ["A", "B", "C", "D"]


def test_reconstruct_path_missing_end_returns_empty_list():
    parents = {"A": None, "B": "A"}
    assert reconstruct_path(parents, "A", "D") == []


def test_reconstruct_path_missing_start_returns_empty_list():
    parents = {"B": "A", "C": "B"}
    assert reconstruct_path(parents, "A", "C") == []


def test_reconstruct_path_handles_incomplete_parent_map():
    # Parent B menunjuk X yang tidak ada di parent map.
    parents = {"A": None, "B": "X"}
    assert reconstruct_path(parents, "A", "B") == []


def test_reconstruct_path_handles_chain_that_ends_at_none():
    parents = {"A": None, "B": "C", "C": None}
    assert reconstruct_path(parents, "A", "B") == []


def test_reconstruct_path_handles_parent_cycle():
    parents = {"A": "B", "B": "C", "C": "B"}
    assert reconstruct_path(parents, "A", "B") == []


def test_reconstruct_path_start_equals_end():
    assert reconstruct_path({"A": None}, "A", "A") == ["A"]
    assert reconstruct_path({}, "A", "A") == []


# ---------------------------------------------------------------------------
# Uji skala: memastikan DFS/BFS tidak memakai rekursi dan tetap wajar
# ---------------------------------------------------------------------------


def test_large_chain_graph_does_not_hit_recursion_limit():
    size = 1000
    vertex_ids = [f"V{index}" for index in range(size)]
    vertices = make_vertices(*vertex_ids)
    edges = make_edges(
        *(
            (f"V{index}", f"V{index + 1}")
            for index in range(size - 1)
        )
    )

    adjacency = build_adjacency_list(vertices, edges)

    components = find_connected_components(adjacency)
    assert len(components) == 1
    assert len(components[0]) == size

    visited = dfs(adjacency, "V0")
    assert len(visited) == size

    result = bfs_shortest_path(adjacency, "V0", f"V{size - 1}")
    assert result["found"] is True
    assert result["distance"] == size - 1
    assert len(result["path"]) == size
