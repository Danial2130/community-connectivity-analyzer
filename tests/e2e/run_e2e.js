// Harness E2E untuk Community Connectivity Analyzer.
// Menjalankan Flask + Chrome headless dan memeriksa alur utama lewat CDP.
// Tidak memakai library automation dan tidak mengubah source aplikasi.

"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const { CdpClient } = require("./cdp_client");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const PYTHON = path.join(PROJECT_ROOT, ".venv", "bin", "python");
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";

const results = [];
let client = null;
let flaskProcess = null;
let chromeProcess = null;
let chromeProfile = null;
let baseUrl = "";

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function record(name, ok, detail = "") {
    results.push({ name, ok, detail });
    console.log(`${ok ? "✔" : "✖"} ${name}${detail ? " — " + detail : ""}`);
}

function checkEqual(name, actual, expected) {
    record(name, actual === expected, `diperoleh ${JSON.stringify(actual)}, diharapkan ${JSON.stringify(expected)}`);
}

function checkContains(name, actual, expected) {
    const ok = typeof actual === "string" && actual.includes(expected);
    record(name, ok, ok ? "" : `tidak mengandung ${JSON.stringify(expected)}`);
}

function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.on("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
    });
}

async function startFlask(port) {
    const child = spawn(PYTHON, ["-c", [
        "from app import app",
        `app.run(host="127.0.0.1", port=${port}, debug=False, use_reloader=False)`
    ].join("\n")], {
        cwd: PROJECT_ROOT,
        stdio: ["ignore", "pipe", "pipe"]
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
    });

    for (let attempt = 0; attempt < 100; attempt += 1) {
        try {
            const response = await fetch(baseUrl + "/");
            if (response.ok) {
                return child;
            }
        } catch (error) {
            // Server belum siap.
        }
        await delay(100);
    }

    child.kill("SIGTERM");
    throw new Error("Flask tidak siap dalam 10 detik. " + stderr.slice(-500));
}

async function startChrome() {
    chromeProfile = fs.mkdtempSync(path.join(os.tmpdir(), "cca-e2e-chrome-"));

    const child = spawn(CHROME, [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--remote-debugging-port=0",
        `--user-data-dir=${chromeProfile}`,
        "--window-size=1280,900",
        "about:blank"
    ], { stdio: ["ignore", "pipe", "pipe"] });

    let portFile = path.join(chromeProfile, "DevToolsActivePort");
    for (let attempt = 0; attempt < 100; attempt += 1) {
        if (fs.existsSync(portFile)) {
            break;
        }
        await delay(100);
    }

    if (!fs.existsSync(portFile)) {
        child.kill("SIGTERM");
        throw new Error("Chrome tidak menulis DevToolsActivePort.");
    }

    const debuggingPort = fs.readFileSync(portFile, "utf8").trim().split("\n")[0];
    const targets = await (await fetch(`http://127.0.0.1:${debuggingPort}/json/list`)).json();
    const page = targets.find((target) => target.type === "page");

    if (page === undefined) {
        child.kill("SIGTERM");
        throw new Error("Tidak ada target halaman Chrome.");
    }

    const cdp = new CdpClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    return { child, cdp };
}

async function waitFor(expression, label, timeout = 10000) {
    const started = Date.now();

    while (Date.now() - started < timeout) {
        if (await client.evaluate(expression)) {
            return;
        }
        await delay(50);
    }

    throw new Error(`Timeout menunggu ${label}.`);
}

async function navigate(url) {
    await client.evaluate("window.__ccaE2eMarker = 'before-navigation'");
    await client.send("Page.navigate", { url });
    await waitFor(
        'window.__ccaE2eMarker === undefined && document.readyState === "complete"',
        "halaman selesai dimuat"
    );
}

async function preparePage(expectCytoscape = true) {
    await waitFor(
        'document.getElementById("member-form") !== null',
        "form anggota tersedia"
    );
    if (expectCytoscape) {
        await waitFor(
            'typeof window.cytoscape === "function"',
            "Cytoscape termuat"
        );
    }
}

function textOf(selector) {
    return client.evaluate(`document.querySelector(${JSON.stringify(selector)}).textContent.trim()`);
}

function countOf(selector) {
    return client.evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
}

function click(selector) {
    return client.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}

function submit(selector) {
    return client.evaluate(`document.querySelector(${JSON.stringify(selector)}).requestSubmit()`);
}

function setSelect(selector, value) {
    return client.evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        element.value = ${JSON.stringify(value)};
        element.dispatchEvent(new Event("change", { bubbles: true }));
        return element.value;
    })()`);
}

async function addMember(name) {
    await client.evaluate(`(() => {
        document.getElementById("member-name").value = ${JSON.stringify(name)};
        document.getElementById("member-form").requestSubmit();
    })()`);
}

async function addRelationship(source, target) {
    await setSelect("#relationship-source", source);
    await setSelect("#relationship-target", target);
    await submit("#relationship-form");
}

async function runScenarios() {
    await navigate(baseUrl + "/");
    await preparePage();

    checkEqual("Kondisi awal: tombol analisis nonaktif", await client.evaluate('document.getElementById("analyze-button").disabled'), true);
    checkEqual("Kondisi awal: kanvas graf tersembunyi", await client.evaluate('document.getElementById("graph-canvas").hidden'), true);

    // Data contoh dan visualisasi M7.
    await click("#load-sample-button");
    await waitFor('document.querySelectorAll("#member-list > li").length === 6', "6 anggota dari sample");
    checkEqual("Sample: 6 anggota", await countOf("#member-list > li"), 6);
    checkEqual("Sample: 5 hubungan", await countOf("#relationship-list > li"), 5);
    checkEqual("Graf: 6 node dan 5 edge", await client.evaluate('document.getElementById("graph-canvas").getAttribute("aria-label")'), "Visualisasi jaringan: 6 anggota dan 5 hubungan.");
    checkEqual("Graf: kanvas terlihat", await client.evaluate('document.getElementById("graph-canvas").hidden'), false);
    checkEqual("Graf: legenda terlihat", await client.evaluate('document.getElementById("graph-legend").hidden'), false);

    // Analisis dari backend.
    await click("#analyze-button");
    await waitFor('document.getElementById("stat-vertex-count").textContent.trim() === "6"', "hasil analisis");
    checkEqual("Analisis: total hubungan", await textOf("#stat-edge-count"), "5");
    checkEqual("Analisis: jumlah komponen", await textOf("#stat-component-count"), "2");
    checkEqual("Analisis: jumlah terisolasi", await textOf("#stat-isolated-count"), "1");
    checkContains("Analisis: Fajar terisolasi", await textOf("#isolated-list"), "Fajar");
    checkContains("Analisis: degree maksimum 3", await textOf("#degree-list"), "3 koneksi");

    // Shortest path dan sorotan jalur.
    await setSelect("#path-start", "A");
    await setSelect("#path-end", "E");
    await submit("#shortest-path-form");
    await waitFor('document.getElementById("path-result").textContent.includes("Jarak: 3 hubungan.")', "hasil shortest path");
    checkEqual("Shortest path: A-C-D-E", await client.evaluate('Array.from(document.querySelectorAll("#path-result .path-step__badge")).map((element) => element.textContent).join("-")'), "A-C-D-E");
    checkContains("Shortest path: jalur ditemukan", await textOf("#path-result .path-result__title"), "Jalur ditemukan");

    // Reset.
    await client.evaluate("window.confirm = () => true");
    await click("#reset-button");
    await waitFor('document.querySelectorAll("#member-list > li").length === 0', "reset anggota");
    checkEqual("Reset: hubungan kosong", await countOf("#relationship-list > li"), 0);
    checkEqual("Reset: kanvas tersembunyi", await client.evaluate('document.getElementById("graph-canvas").hidden'), true);
    checkEqual("Reset: tombol analisis nonaktif", await client.evaluate('document.getElementById("analyze-button").disabled'), true);

    // CRUD manual dan validasi input.
    await addMember("Andi");
    await addMember("Budi");
    await addMember("");
    checkContains("Validasi: nama kosong ditolak", await textOf("#member-message"), "wajib diisi");
    await addMember("andi");
    checkContains("Validasi: nama duplikat ditolak", await textOf("#member-message"), "sudah digunakan");

    await submit("#relationship-form");
    checkContains("Validasi: pilihan kosong ditolak", await textOf("#relationship-message"), "Pilih anggota pertama dan anggota kedua");
    await addRelationship("A", "A");
    checkContains("Validasi: self-loop ditolak", await textOf("#relationship-message"), "tidak boleh sama");
    await addRelationship("A", "B");
    checkEqual("CRUD: hubungan ditambahkan", await countOf("#relationship-list > li"), 1);
    await addRelationship("B", "A");
    checkContains("Validasi: hubungan duplikat ditolak", await textOf("#relationship-message"), "sudah ada");

    await client.evaluate(`document.querySelector('button[aria-label="Hapus hubungan Andi dan Budi"]').click()`);
    checkEqual("CRUD: hubungan dihapus", await countOf("#relationship-list > li"), 0);
    await client.evaluate(`document.querySelector('button[aria-label="Hapus anggota Andi"]').click()`);
    checkEqual("CRUD: anggota dihapus", await countOf("#member-list > li"), 1);
    checkEqual("Graf: ikut berubah saat anggota dihapus", await client.evaluate('document.getElementById("graph-canvas").getAttribute("aria-label")'), "Visualisasi jaringan: 1 anggota dan 0 hubungan.");

    // Persistensi setelah reload.
    await navigate(baseUrl + "/");
    await preparePage();
    await waitFor('document.querySelectorAll("#member-list > li").length === 1', "data tersimpan setelah reload");
    checkContains("Persistensi: anggota tersisa", await textOf("#member-list > li"), "Budi");
    await addMember("Citra");
    checkEqual("Graf: berubah saat anggota ditambah", await client.evaluate('document.getElementById("graph-canvas").getAttribute("aria-label")'), "Visualisasi jaringan: 2 anggota dan 0 hubungan.");
    await addRelationship("B", "C");
    checkEqual("Graf: berubah saat hubungan ditambah", await client.evaluate('document.getElementById("graph-canvas").getAttribute("aria-label")'), "Visualisasi jaringan: 2 anggota dan 1 hubungan.");

    // Fallback ketika pustaka visualisasi gagal dimuat.
    const errorsBeforeFallback = client.exceptions.length;
    await client.send("Network.enable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Fetch.enable", {
        patterns: [{ urlPattern: "*cytoscape.min.js*", requestStage: "Request" }]
    });
    client.on("Fetch.requestPaused", (params) => {
        client.send("Fetch.failRequest", {
            requestId: params.requestId,
            errorReason: "Failed"
        });
    });

    await navigate(baseUrl + "/");
    await preparePage(false);
    await waitFor('!document.getElementById("graph-error").hidden', "pesan fallback graf");
    checkContains("Fallback: pesan ditampilkan", await textOf("#graph-error"), "Pustaka visualisasi tidak dapat dimuat");
    checkEqual("Fallback: kanvas tersembunyi", await client.evaluate('document.getElementById("graph-canvas").hidden'), true);
    checkEqual("Fallback: placeholder terlihat", await client.evaluate('document.getElementById("graph-workspace").hidden'), false);

    await client.evaluate("window.confirm = () => true");
    await click("#load-sample-button");
    await click("#analyze-button");
    await waitFor('document.getElementById("stat-vertex-count").textContent.trim() === "6"', "analisis saat fallback");
    checkEqual("Fallback: analisis tetap berjalan", await textOf("#stat-edge-count"), "5");

    await client.send("Fetch.disable");

    const newExceptions = client.exceptions.slice(errorsBeforeFallback);
    checkEqual("Tidak ada exception JavaScript pada alur fungsional", errorsBeforeFallback, 0);
    checkEqual("Tidak ada exception JavaScript baru saat fallback", newExceptions.length, 0);
}

async function main() {
    try {
        const port = await getFreePort();
        baseUrl = `http://127.0.0.1:${port}`;

        flaskProcess = await startFlask(port);
        const chrome = await startChrome();
        chromeProcess = chrome.child;
        client = chrome.cdp;

        await runScenarios();
    } catch (error) {
        record("Eksekusi harness", false, error.message);
    } finally {
        if (client !== null) {
            client.close();
        }
        if (chromeProcess !== null) {
            chromeProcess.kill("SIGTERM");
            await delay(500);
        }
        if (flaskProcess !== null) {
            flaskProcess.kill("SIGTERM");
        }
        if (chromeProfile !== null) {
            // Chrome dapat menulis sisa file setelah SIGTERM, jadi hapus
            // direktori profil dengan beberapa kali percobaan.
            for (let attempt = 0; attempt < 10; attempt += 1) {
                try {
                    fs.rmSync(chromeProfile, { recursive: true, force: true });
                    break;
                } catch (error) {
                    await delay(200);
                }
            }
        }
    }

    const failed = results.filter((result) => !result.ok);
    console.log(`\nE2E: ${results.length - failed.length}/${results.length} pemeriksaan lulus.`);
    if (failed.length > 0) {
        console.log("Pemeriksaan gagal:");
        for (const result of failed) {
            console.log(`- ${result.name}${result.detail ? ": " + result.detail : ""}`);
        }
        process.exitCode = 1;
    }
}

main();
