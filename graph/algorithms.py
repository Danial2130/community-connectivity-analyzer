"""Algoritma graf untuk Community Connectivity Analyzer.

Model graf yang digunakan:
- tidak berarah (undirected),
- tidak berbobot (unweighted),
- tanpa self-loop,
- tanpa edge duplikat.

Seluruh algoritma memakai adjacency list dan diimplementasikan sendiri
menggunakan Python standard library (tanpa NetworkX atau library graf lain).
"""

from collections import deque


class GraphValidationError(ValueError):
    """Dilempar ketika data graf melanggar aturan model graf."""


def build_adjacency_list(vertices, edges):
    """Mengubah daftar vertex dan edge menjadi adjacency list.

    Parameter:
        vertices: list of dict, setiap dict berisi "id" dan "name".
        edges: list of dict, setiap dict berisi "source" dan "target".

    Return:
        dict {id_vertex: [id_tetangga, ...]}.

    Setiap edge disimpan pada kedua arah karena graf tidak berarah.
    Vertex tanpa edge tetap muncul sebagai key dengan list kosong.

    Kompleksitas: O(V + E).
    """
    if not isinstance(vertices, list):
        raise GraphValidationError("Daftar vertices harus berupa list.")
    if not isinstance(edges, list):
        raise GraphValidationError("Daftar edges harus berupa list.")

    adjacency_list = {}
    vertex_ids = set()

    for vertex in vertices:
        if not isinstance(vertex, dict):
            raise GraphValidationError("Setiap vertex harus berupa dict.")

        vertex_id = vertex.get("id")
        vertex_name = vertex.get("name")

        if not isinstance(vertex_id, str) or vertex_id == "":
            raise GraphValidationError(
                "ID vertex tidak boleh kosong dan harus berupa string."
            )
        if vertex_id != vertex_id.strip():
            raise GraphValidationError(
                "ID vertex tidak boleh memiliki spasi di awal atau akhir."
            )
        if not isinstance(vertex_name, str) or vertex_name.strip() == "":
            raise GraphValidationError(
                "Nama vertex tidak boleh kosong dan harus berupa string."
            )
        if vertex_id in vertex_ids:
            raise GraphValidationError(f"ID vertex '{vertex_id}' duplikat.")

        vertex_ids.add(vertex_id)
        adjacency_list[vertex_id] = []

    used_pairs = set()

    for edge in edges:
        if not isinstance(edge, dict):
            raise GraphValidationError("Setiap edge harus berupa dict.")

        source = edge.get("source")
        target = edge.get("target")

        if not isinstance(source, str) or not isinstance(target, str):
            raise GraphValidationError("Source dan target harus berupa string.")
        if source not in vertex_ids:
            raise GraphValidationError(f"Source '{source}' tidak terdaftar.")
        if target not in vertex_ids:
            raise GraphValidationError(f"Target '{target}' tidak terdaftar.")
        if source == target:
            raise GraphValidationError(
                f"Self-loop pada vertex '{source}' tidak diperbolehkan."
            )

        # Pasangan disimpan dalam urutan tetap agar A-B dan B-A dianggap sama.
        pair_key = (source, target) if source < target else (target, source)
        if pair_key in used_pairs:
            raise GraphValidationError(
                f"Edge duplikat antara '{source}' dan '{target}'."
            )

        used_pairs.add(pair_key)
        adjacency_list[source].append(target)
        adjacency_list[target].append(source)

    return adjacency_list


def calculate_degrees(adjacency_list):
    """Menghitung jumlah tetangga setiap vertex.

    Return:
        dict {id_vertex: degree}.

    Vertex tanpa tetangga otomatis memiliki degree 0.

    Kompleksitas: O(V + E) karena total elemen tetangga adalah 2|E|.
    """
    return {
        vertex: len(neighbors)
        for vertex, neighbors in adjacency_list.items()
    }


def find_isolated_members(degrees):
    """Mengembalikan daftar vertex dengan degree 0.

    Urutan mengikuti urutan key pada dictionary degrees.

    Kompleksitas: O(V).
    """
    return [
        vertex
        for vertex, degree in degrees.items()
        if degree == 0
    ]


def _depth_first_visit(adjacency_list, start, visited):
    """DFS iteratif yang memakai visited bersama.

    `visited` sengaja diterima sebagai parameter agar connected components
    dapat memakai satu set visited untuk seluruh graf. Dengan demikian setiap
    vertex dan edge hanya diproses satu kali.

    Kompleksitas: O(V + E) untuk seluruh penelusuran.
    """
    order = []
    stack = [start]

    while stack:
        vertex = stack.pop()

        if vertex in visited:
            continue

        visited.add(vertex)
        order.append(vertex)

        # Push terbalik agar tetangga pertama pada adjacency list dikunjungi
        # lebih dulu, sehingga urutan hasil deterministik.
        for neighbor in reversed(adjacency_list[vertex]):
            stack.append(neighbor)

    return order


def dfs(adjacency_list, start):
    """Menelusuri graf dari `start` menggunakan Depth-First Search.

    Return:
        list ID vertex sesuai urutan kunjungan.

    Hanya vertex yang dapat dijangkau dari `start` yang dikunjungi.

    Kompleksitas: O(V + E).
    """
    if start not in adjacency_list:
        raise GraphValidationError(f"Vertex awal '{start}' tidak terdaftar.")

    return _depth_first_visit(adjacency_list, start, set())


def find_connected_components(adjacency_list):
    """Mencari seluruh connected components menggunakan DFS.

    Return:
        list of list ID vertex. Setiap vertex muncul tepat satu kali.
        Vertex terisolasi menjadi komponen berisi satu vertex.

    Kompleksitas: O(V + E) karena seluruh komponen memakai satu set visited.
    """
    visited = set()
    components = []

    for vertex in adjacency_list:
        if vertex not in visited:
            components.append(
                _depth_first_visit(adjacency_list, vertex, visited)
            )

    return components


def bfs_parents(adjacency_list, start):
    """Menjalankan BFS dari `start` dan mengembalikan parent map.

    Return:
        dict {id_vertex: id_parent}. Parent dari `start` adalah None.
        Vertex yang tidak dapat dijangkau tidak muncul pada dictionary.

    Parent map sekaligus berfungsi sebagai visited set.

    Kompleksitas: O(V + E).
    """
    if start not in adjacency_list:
        raise GraphValidationError(f"Vertex awal '{start}' tidak terdaftar.")

    parents = {start: None}
    queue = deque([start])

    while queue:
        vertex = queue.popleft()

        for neighbor in adjacency_list[vertex]:
            if neighbor not in parents:
                parents[neighbor] = vertex
                queue.append(neighbor)

    return parents


def reconstruct_path(parents, start, end):
    """Merekonstruksi jalur dari `start` ke `end` menggunakan parent map.

    Return:
        list ID vertex dari start ke end, atau list kosong jika jalur tidak
        dapat direkonstruksi.

    Parent map yang tidak lengkap ditangani dengan aman: sebelum mengakses
    parent dari vertex saat ini, fungsi memeriksa apakah vertex tersebut ada
    di parent map.

    Kompleksitas: O(V).
    """
    if start not in parents or end not in parents:
        return []

    if start == end:
        return [start]

    path = [end]
    seen = {end}
    current = end

    while current != start:
        if current not in parents:
            return []

        current = parents[current]

        if current is None or current in seen:
            return []

        path.append(current)
        seen.add(current)

    path.reverse()
    return path


def bfs_shortest_path(adjacency_list, start, end):
    """Mencari jalur terpendek dari `start` ke `end` menggunakan BFS.

    Return:
        dict {"found": bool, "path": list, "distance": int | None}

    Karena graf tidak berbobot, jalur pertama yang ditemukan BFS adalah jalur
    dengan jumlah edge paling sedikit.

    Kompleksitas: O(V + E).
    """
    if start not in adjacency_list:
        raise GraphValidationError(f"Vertex awal '{start}' tidak terdaftar.")
    if end not in adjacency_list:
        raise GraphValidationError(f"Vertex tujuan '{end}' tidak terdaftar.")

    if start == end:
        return {"found": True, "path": [start], "distance": 0}

    parents = bfs_parents(adjacency_list, start)

    if end not in parents:
        return {"found": False, "path": [], "distance": None}

    path = reconstruct_path(parents, start, end)

    return {
        "found": True,
        "path": path,
        "distance": len(path) - 1,
    }
