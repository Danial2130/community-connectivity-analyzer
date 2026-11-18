// Komunikasi dengan REST API Flask.
// Modul ini hanya mengirim data dan membaca response; tidak menghitung
// algoritma graf dan tidak memanipulasi DOM.

"use strict";

const API_ANALYZE_URL = "/api/analyze";
const API_SHORTEST_PATH_URL = "/api/shortest-path";
const API_CONNECTION_ERROR =
    "Tidak dapat terhubung ke server. Pastikan aplikasi Flask berjalan.";

// Mengirim graf ke backend untuk menghitung degree, isolated member,
// connected components, dan ringkasan degree.
async function requestAnalysis(vertices, edges) {
    return postJson(API_ANALYZE_URL, {
        vertices: vertices,
        edges: edges
    });
}

// Mengirim graf dan dua vertex ke backend untuk mencari jalur terpendek.
async function requestShortestPath(vertices, edges, start, end) {
    return postJson(API_SHORTEST_PATH_URL, {
        vertices: vertices,
        edges: edges,
        start: start,
        end: end
    });
}

// Mengirim request JSON dan mengembalikan field data dari response sukses.
async function postJson(url, payload) {
    let response;

    try {
        response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        throw new Error(API_CONNECTION_ERROR);
    }

    let body = null;

    try {
        body = await response.json();
    } catch (error) {
        body = null;
    }

    if (!response.ok) {
        const message = readErrorMessage(body);

        if (message !== null) {
            throw new Error(message);
        }

        throw new Error(
            "Permintaan gagal dengan status HTTP " + response.status + "."
        );
    }

    if (
        body === null ||
        typeof body !== "object" ||
        body.success !== true ||
        body.data === null ||
        typeof body.data !== "object"
    ) {
        throw new Error("Respons server tidak valid.");
    }

    return body.data;
}

// Mengambil pesan error dari format response backend.
// Mengembalikan null jika response tidak memiliki pesan yang dapat dipakai.
function readErrorMessage(body) {
    if (
        body === null ||
        typeof body !== "object" ||
        body.error === null ||
        typeof body.error !== "object" ||
        typeof body.error.message !== "string" ||
        body.error.message === ""
    ) {
        return null;
    }

    return body.error.message;
}
