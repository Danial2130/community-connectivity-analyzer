// Unit test untuk static/js/storage.js.
// Menguji perilaku nyata loadGraph/saveGraph/validateStoredGraph dengan stub
// localStorage. Tidak ada source code produksi yang diubah.

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { loadScript, createLocalStorageStub } = require("./helpers/script_loader");

// Objek yang dibuat di dalam sandbox vm punya prototype berbeda dari objek
// host. JSON round-trip menyamakannya sebelum perbandingan deepStrictEqual.
function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

function validStoredGraph(overrides = {}) {
    return {
        version: 1,
        vertices: [
            { id: "A", name: "Andi" },
            { id: "B", name: "Budi" }
        ],
        edges: [{ source: "A", target: "B" }],
        nextIdIndex: 2,
        ...overrides
    };
}

function setup(initialValues = {}) {
    const localStorage = createLocalStorageStub(initialValues);
    const loaded = loadScript("storage.js", { localStorage });

    return {
        localStorage,
        key: loaded.evaluate("STORAGE_KEY"),
        version: loaded.evaluate("STORAGE_VERSION"),
        saveGraph: loaded.context.saveGraph,
        loadGraph: loaded.context.loadGraph,
        validateStoredGraph: loaded.context.validateStoredGraph
    };
}

function setupWithStored(stored) {
    const storage = setup();
    storage.localStorage.setItem(storage.key, JSON.stringify(stored));
    return storage;
}

test("konstanta penyimpanan sesuai implementasi", () => {
    const storage = setup();

    assert.equal(storage.key, "communityConnectivityAnalyzer.graph");
    assert.equal(storage.version, 1);
});

test("loadGraph mengembalikan graph null tanpa error ketika belum ada data", () => {
    const storage = setup();

    assert.deepEqual(plain(storage.loadGraph()), { graph: null, error: null });
});

test("loadGraph menerima data valid dan memangkas spasi id serta nama", () => {
    const stored = validStoredGraph({
        vertices: [
            { id: " A ", name: " Andi " },
            { id: "B", name: "Budi" }
        ],
        edges: [{ source: " A ", target: "B" }]
    });
    const storage = setupWithStored(stored);

    const result = storage.loadGraph();

    assert.equal(result.error, null);
    assert.deepEqual(plain(result.graph.vertices), [
        { id: "A", name: "Andi" },
        { id: "B", name: "Budi" }
    ]);
    assert.deepEqual(plain(result.graph.edges), [{ source: "A", target: "B" }]);
    assert.equal(result.graph.nextIdIndex, 2);
});

test("loadGraph menghapus JSON rusak dan melaporkan error", () => {
    const storage = setup();
    storage.localStorage.setItem(storage.key, "{ini bukan json");

    const result = storage.loadGraph();

    assert.equal(result.graph, null);
    assert.match(result.error, /Data tersimpan rusak dan telah dihapus/);
    assert.equal(storage.localStorage.getItem(storage.key), null);
});

test("loadGraph menolak versi penyimpanan yang tidak dikenal", () => {
    const storage = setupWithStored(validStoredGraph({ version: 99 }));

    const result = storage.loadGraph();

    assert.equal(result.graph, null);
    assert.match(result.error, /Data tersimpan tidak valid dan telah dihapus/);
    assert.equal(storage.localStorage.getItem(storage.key), null);
});

test("loadGraph menolak vertices atau edges yang bukan array", () => {
    for (const invalid of [
        validStoredGraph({ vertices: {} }),
        validStoredGraph({ edges: "A-B" }),
        validStoredGraph({ vertices: null })
    ]) {
        const storage = setupWithStored(invalid);

        assert.equal(storage.loadGraph().graph, null);
        assert.equal(storage.localStorage.getItem(storage.key), null);
    }
});

test("loadGraph menolak vertex dengan id atau nama bukan string", () => {
    for (const badVertex of [
        { id: 1, name: "Andi" },
        { id: "A", name: 123 },
        null,
        "A"
    ]) {
        const stored = validStoredGraph({ vertices: [badVertex] });
        assert.equal(setupWithStored(stored).loadGraph().graph, null);
    }
});

test("loadGraph menolak id atau nama kosong setelah dipangkas", () => {
    for (const badVertex of [
        { id: "   ", name: "Andi" },
        { id: "A", name: "  " }
    ]) {
        const stored = validStoredGraph({ vertices: [badVertex] });
        assert.equal(setupWithStored(stored).loadGraph().graph, null);
    }
});

test("loadGraph menolak ID duplikat", () => {
    const stored = validStoredGraph({
        vertices: [
            { id: "A", name: "Andi" },
            { id: "A", name: "Budi" }
        ],
        edges: []
    });

    assert.equal(setupWithStored(stored).loadGraph().graph, null);
});

test("loadGraph menolak nama duplikat tanpa memedulikan huruf besar", () => {
    const stored = validStoredGraph({
        vertices: [
            { id: "A", name: "Andi" },
            { id: "B", name: "ANDI" }
        ],
        edges: []
    });

    assert.equal(setupWithStored(stored).loadGraph().graph, null);
});

test("loadGraph menolak edge yang merujuk vertex tidak dikenal", () => {
    const stored = validStoredGraph({
        edges: [{ source: "A", target: "Z" }]
    });

    assert.equal(setupWithStored(stored).loadGraph().graph, null);
});

test("loadGraph menolak self-loop", () => {
    const stored = validStoredGraph({
        edges: [{ source: "A", target: "A" }]
    });

    assert.equal(setupWithStored(stored).loadGraph().graph, null);
});

test("loadGraph menolak edge duplikat dengan urutan terbalik", () => {
    const stored = validStoredGraph({
        edges: [
            { source: "A", target: "B" },
            { source: "B", target: "A" }
        ]
    });

    assert.equal(setupWithStored(stored).loadGraph().graph, null);
});

test("loadGraph memakai nextIdIndex 0 ketika nilainya tidak valid", () => {
    for (const value of [-1, 1.5, "2", null]) {
        const stored = validStoredGraph({ nextIdIndex: value });
        const result = setupWithStored(stored).loadGraph();

        assert.equal(result.error, null);
        assert.equal(result.graph.nextIdIndex, 0);
    }
});

test("loadGraph melaporkan error ketika localStorage tidak dapat diakses", () => {
    const localStorage = {
        getItem() {
            throw new Error("SecurityError");
        },
        setItem() {},
        removeItem() {}
    };
    const loaded = loadScript("storage.js", { localStorage });

    const result = loaded.context.loadGraph();

    assert.equal(result.graph, null);
    assert.match(result.error, /Penyimpanan browser tidak dapat diakses/);
});

test("loadGraph tidak melempar error ketika removeItem gagal", () => {
    const localStorage = createLocalStorageStub();
    localStorage.setItem("communityConnectivityAnalyzer.graph", "rusak");
    localStorage.removeItem = () => {
        throw new Error("QuotaError");
    };
    const loaded = loadScript("storage.js", { localStorage });

    const result = loaded.context.loadGraph();

    assert.equal(result.graph, null);
    assert.match(result.error, /Data tersimpan rusak/);
});

test("validateStoredGraph menolak nilai non-objek", () => {
    const storage = setup();

    for (const value of [null, [], "graf", 42, true]) {
        assert.equal(storage.validateStoredGraph(value), null);
    }
});

test("saveGraph menyimpan versi, vertices, edges, dan nextIdIndex", () => {
    const storage = setup();
    const graph = {
        vertices: [{ id: "A", name: "Andi" }],
        edges: [],
        nextIdIndex: 5
    };

    const result = storage.saveGraph(graph);

    assert.deepEqual(plain(result), { ok: true, error: null });
    assert.deepEqual(
        JSON.parse(storage.localStorage.getItem(storage.key)),
        { version: 1, ...graph }
    );
});

test("saveGraph lalu loadGraph mengembalikan data yang sama", () => {
    const storage = setup();
    const graph = {
        vertices: [
            { id: "A", name: "Andi" },
            { id: "B", name: "Budi" }
        ],
        edges: [{ source: "A", target: "B" }],
        nextIdIndex: 2
    };

    storage.saveGraph(graph);

    assert.deepEqual(plain(storage.loadGraph()), { graph, error: null });
});

test("saveGraph melaporkan error ketika penulisan gagal", () => {
    const localStorage = createLocalStorageStub();
    localStorage.setItem = () => {
        throw new Error("QuotaExceededError");
    };
    const loaded = loadScript("storage.js", { localStorage });

    const result = loaded.context.saveGraph({
        vertices: [],
        edges: [],
        nextIdIndex: 0
    });

    assert.equal(result.ok, false);
    assert.match(result.error, /Data tidak dapat disimpan di browser/);
});
