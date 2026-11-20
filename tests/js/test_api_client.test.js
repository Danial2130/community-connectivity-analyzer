// Unit test untuk static/js/api.js.
// Stub fetch dan Response dipakai untuk menguji perilaku aktual postJson,
// requestAnalysis, dan requestShortestPath tanpa server sungguhan.

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { loadScript } = require("./helpers/script_loader");

// Objek dari sandbox vm punya prototype host yang berbeda; samakan dulu
// sebelum perbandingan deepStrictEqual.
function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

// Tiruan minimal Response yang dipakai api.js: ok, status, dan json().
function createResponseStub({ ok = true, status = 200, body = null, jsonError = null } = {}) {
    return {
        ok,
        status,
        async json() {
            if (jsonError !== null) {
                throw jsonError;
            }
            return body;
        }
    };
}

function setup(fetchImpl) {
    const calls = [];
    const fetchStub = async (url, init) => {
        calls.push({ url, init });
        return fetchImpl(url, init);
    };
    const loaded = loadScript("api.js", { fetch: fetchStub });

    return {
        calls,
        analyzeUrl: loaded.evaluate("API_ANALYZE_URL"),
        pathUrl: loaded.evaluate("API_SHORTEST_PATH_URL"),
        connectionError: loaded.evaluate("API_CONNECTION_ERROR"),
        requestAnalysis: loaded.context.requestAnalysis,
        requestShortestPath: loaded.context.requestShortestPath,
        postJson: loaded.context.postJson
    };
}

const VERTICES = [{ id: "A", name: "Andi" }];
const EDGES = [{ source: "A", target: "B" }];
const ANALYSIS_DATA = { vertex_count: 1, edge_count: 0 };
const PATH_DATA = { found: true, path: ["A"], distance: 0 };

test("konstanta URL dan pesan koneksi sesuai implementasi", () => {
    const api = setup(() => createResponseStub());

    assert.equal(api.analyzeUrl, "/api/analyze");
    assert.equal(api.pathUrl, "/api/shortest-path");
    assert.match(api.connectionError, /Tidak dapat terhubung ke server/);
});

test("requestAnalysis mengirim POST JSON dengan vertices dan edges", async () => {
    const api = setup(() => createResponseStub({ body: { success: true, data: ANALYSIS_DATA } }));

    const result = await api.requestAnalysis(VERTICES, EDGES);

    assert.deepEqual(plain(result), ANALYSIS_DATA);
    assert.equal(api.calls.length, 1);
    assert.equal(api.calls[0].url, "/api/analyze");
    assert.equal(api.calls[0].init.method, "POST");
    assert.deepEqual(plain(api.calls[0].init.headers), { "Content-Type": "application/json" });
    assert.deepEqual(JSON.parse(api.calls[0].init.body), {
        vertices: VERTICES,
        edges: EDGES
    });
});

test("requestShortestPath mengirim start dan end beserta graf", async () => {
    const api = setup(() => createResponseStub({ body: { success: true, data: PATH_DATA } }));

    const result = await api.requestShortestPath(VERTICES, EDGES, "A", "B");

    assert.deepEqual(plain(result), PATH_DATA);
    assert.equal(api.calls[0].url, "/api/shortest-path");
    assert.deepEqual(JSON.parse(api.calls[0].init.body), {
        vertices: VERTICES,
        edges: EDGES,
        start: "A",
        end: "B"
    });
});

test("fetch yang gagal diterjemahkan ke pesan koneksi", async () => {
    const api = setup(async () => {
        throw new Error("NetworkError");
    });

    await assert.rejects(
        () => api.requestAnalysis(VERTICES, []),
        { message: api.connectionError }
    );
});

test("respons sukses yang bukan JSON dianggap tidak valid", async () => {
    const api = setup(() => createResponseStub({ jsonError: new SyntaxError("bad json") }));

    await assert.rejects(
        () => api.requestAnalysis(VERTICES, []),
        { message: "Respons server tidak valid." }
    );
});

test("respons error 400 memakai pesan dari backend", async () => {
    const api = setup(() => createResponseStub({
        ok: false,
        status: 400,
        body: { success: false, error: { message: "Data graf tidak valid." } }
    }));

    await assert.rejects(
        () => api.requestAnalysis(VERTICES, []),
        { message: "Data graf tidak valid." }
    );
});

test("respons error 500 tanpa pesan memakai fallback HTTP status", async () => {
    const api = setup(() => createResponseStub({
        ok: false,
        status: 500,
        body: { success: false }
    }));

    await assert.rejects(
        () => api.requestAnalysis(VERTICES, []),
        { message: "Permintaan gagal dengan status HTTP 500." }
    );
});

test("pesan error kosong juga memakai fallback HTTP status", async () => {
    const api = setup(() => createResponseStub({
        ok: false,
        status: 404,
        body: { error: { message: "" } }
    }));

    await assert.rejects(
        () => api.requestAnalysis(VERTICES, []),
        { message: "Permintaan gagal dengan status HTTP 404." }
    );
});

test("respons error dengan format aneh tetap memakai fallback", async () => {
    const api = setup(() => createResponseStub({
        ok: false,
        status: 422,
        body: { error: "bukan objek" }
    }));

    await assert.rejects(
        () => api.requestAnalysis(VERTICES, []),
        { message: "Permintaan gagal dengan status HTTP 422." }
    );
});

test("respons sukses ditolak ketika success bukan true", async () => {
    const api = setup(() => createResponseStub({
        body: { success: false, data: ANALYSIS_DATA }
    }));

    await assert.rejects(
        () => api.requestAnalysis(VERTICES, []),
        { message: "Respons server tidak valid." }
    );
});

test("respons sukses ditolak ketika data null atau tidak ada", async () => {
    for (const body of [
        { success: true, data: null },
        { success: true },
        null,
        []
    ]) {
        const api = setup(() => createResponseStub({ body }));

        await assert.rejects(
            () => api.requestAnalysis(VERTICES, []),
            { message: "Respons server tidak valid." }
        );
    }
});

test("data berupa array diterima karena hanya ditolak ketika null", async () => {
    const body = { success: true, data: [1, 2] };
    const api = setup(() => createResponseStub({ body }));

    assert.deepEqual(plain(await api.requestAnalysis(VERTICES, [])), [1, 2]);
});

test("postJson mengembalikan tepat field data, bukan seluruh body", async () => {
    const api = setup(() => createResponseStub({
        body: { success: true, data: { a: 1 }, error: null }
    }));

    const result = await api.postJson("/api/analyze", {});

    assert.deepEqual(plain(result), { a: 1 });
});
