// Pengelolaan data graf di localStorage.
// Modul ini hanya menyimpan, memuat, dan memvalidasi bentuk data.
// Validasi aturan graf (misalnya relasi duplikat saat input) dilakukan di app.js.

"use strict";

const STORAGE_KEY = "communityConnectivityAnalyzer.graph";
const STORAGE_VERSION = 1;

// Menyimpan seluruh state graf. Dipanggil setiap kali data berubah.
function saveGraph(graph) {
    const storedGraph = {
        version: STORAGE_VERSION,
        vertices: graph.vertices,
        edges: graph.edges,
        nextIdIndex: graph.nextIdIndex
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedGraph));
        return { ok: true, error: null };
    } catch (error) {
        return {
            ok: false,
            error: "Data tidak dapat disimpan di browser. Periksa pengaturan penyimpanan."
        };
    }
}

// Memuat data tersimpan. Hasil selalu berbentuk { graph, error }.
// graph bernilai null jika belum ada data atau data tidak dapat digunakan.
function loadGraph() {
    let rawData;

    try {
        rawData = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        return {
            graph: null,
            error: "Penyimpanan browser tidak dapat diakses. Data hanya bertahan selama halaman terbuka."
        };
    }

    if (rawData === null) {
        return { graph: null, error: null };
    }

    let parsedData;
    try {
        parsedData = JSON.parse(rawData);
    } catch (error) {
        removeStoredGraph();
        return {
            graph: null,
            error: "Data tersimpan rusak dan telah dihapus. Aplikasi dimulai dengan data kosong."
        };
    }

    const graph = validateStoredGraph(parsedData);
    if (graph === null) {
        removeStoredGraph();
        return {
            graph: null,
            error: "Data tersimpan tidak valid dan telah dihapus. Aplikasi dimulai dengan data kosong."
        };
    }

    return { graph: graph, error: null };
}

function removeStoredGraph() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // Tidak ada tindakan tambahan: data memang tidak dapat diakses.
    }
}

// Memeriksa struktur data yang dibaca dari localStorage.
// Mengembalikan objek graf yang sudah dibersihkan, atau null jika tidak valid.
function validateStoredGraph(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    if (value.version !== STORAGE_VERSION) {
        return null;
    }

    if (!Array.isArray(value.vertices) || !Array.isArray(value.edges)) {
        return null;
    }

    const vertices = [];
    const usedIds = new Set();
    const usedNames = new Set();

    for (const item of value.vertices) {
        if (item === null || typeof item !== "object") {
            return null;
        }
        if (typeof item.id !== "string" || typeof item.name !== "string") {
            return null;
        }

        const id = item.id.trim();
        const name = item.name.trim();
        const normalizedName = name.toLowerCase();

        if (id === "" || name === "") {
            return null;
        }
        if (usedIds.has(id) || usedNames.has(normalizedName)) {
            return null;
        }

        usedIds.add(id);
        usedNames.add(normalizedName);
        vertices.push({ id: id, name: name });
    }

    const edges = [];
    const usedPairs = new Set();

    for (const item of value.edges) {
        if (item === null || typeof item !== "object") {
            return null;
        }
        if (typeof item.source !== "string" || typeof item.target !== "string") {
            return null;
        }

        const source = item.source.trim();
        const target = item.target.trim();

        if (!usedIds.has(source) || !usedIds.has(target)) {
            return null;
        }
        if (source === target) {
            return null;
        }

        const pairKey = source < target ? source + "|" + target : target + "|" + source;
        if (usedPairs.has(pairKey)) {
            return null;
        }

        usedPairs.add(pairKey);
        edges.push({ source: source, target: target });
    }

    let nextIdIndex = 0;
    if (Number.isInteger(value.nextIdIndex) && value.nextIdIndex >= 0) {
        nextIdIndex = value.nextIdIndex;
    }

    return { vertices: vertices, edges: edges, nextIdIndex: nextIdIndex };
}
