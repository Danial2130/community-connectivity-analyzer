// Pemeriksaan QA untuk responsivitas dan aksesibilitas dasar.
// Temuan tidak diperbaiki otomatis; hasilnya dilaporkan untuk keputusan.

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

const VIEWPORTS = [
    { name: "1280x900 desktop", width: 1280, height: 900, mobile: false },
    { name: "820x900 tablet", width: 820, height: 900, mobile: false },
    { name: "390x844 mobile portrait", width: 390, height: 844, mobile: true },
    { name: "320x700 mobile kecil", width: 320, height: 700, mobile: true },
    { name: "844x390 mobile landscape", width: 844, height: 390, mobile: true }
];

const findings = [];

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pressKey(client, key, code, virtualKeyCode) {
    await client.send("Input.dispatchKeyEvent", {
        type: "keyDown", key, code,
        windowsVirtualKeyCode: virtualKeyCode,
        nativeVirtualKeyCode: virtualKeyCode
    });
    await client.send("Input.dispatchKeyEvent", {
        type: "keyUp", key, code,
        windowsVirtualKeyCode: virtualKeyCode,
        nativeVirtualKeyCode: virtualKeyCode
    });
}

function record(name, ok, detail = "") {
    findings.push({ name, ok, detail });
    console.log(`${ok ? "✔" : "✖"} ${name}${detail ? " — " + detail : ""}`);
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

async function waitFor(client, expression, label, timeout = 10000) {
    const started = Date.now();

    while (Date.now() - started < timeout) {
        if (await client.evaluate(expression)) {
            return;
        }
        await delay(50);
    }

    throw new Error(`Timeout menunggu ${label}.`);
}

async function startFlask(port, baseUrl) {
    const child = spawn(PYTHON, ["-c", [
        "from app import app",
        `app.run(host="127.0.0.1", port=${port}, debug=False, use_reloader=False)`
    ].join("\n")], { cwd: PROJECT_ROOT, stdio: ["ignore", "pipe", "pipe"] });

    for (let attempt = 0; attempt < 100; attempt += 1) {
        try {
            if ((await fetch(baseUrl + "/")).ok) {
                return child;
            }
        } catch (error) {
            // Belum siap.
        }
        await delay(100);
    }

    child.kill("SIGTERM");
    throw new Error("Flask tidak siap dalam 10 detik.");
}

async function startChrome() {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cca-qa-chrome-"));
    const child = spawn(CHROME, [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--remote-debugging-port=0",
        `--user-data-dir=${profile}`,
        "about:blank"
    ], { stdio: ["ignore", "pipe", "pipe"] });

    const portFile = path.join(profile, "DevToolsActivePort");
    for (let attempt = 0; attempt < 100 && !fs.existsSync(portFile); attempt += 1) {
        await delay(100);
    }

    if (!fs.existsSync(portFile)) {
        child.kill("SIGTERM");
        throw new Error("Chrome tidak menulis DevToolsActivePort.");
    }

    const debuggingPort = fs.readFileSync(portFile, "utf8").trim().split("\n")[0];
    const targets = await (await fetch(`http://127.0.0.1:${debuggingPort}/json/list`)).json();
    const page = targets.find((target) => target.type === "page");
    const client = new CdpClient(page.webSocketDebuggerUrl);
    await client.connect();

    return { child, client, profile };
}

async function checkResponsiveness(client) {
    for (const viewport of VIEWPORTS) {
        await client.send("Emulation.setDeviceMetricsOverride", {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            mobile: viewport.mobile
        });
        await delay(300);

        const metrics = await client.evaluate(`(() => {
            const canvas = document.getElementById("graph-canvas");
            const analyze = document.getElementById("analyze-button").getBoundingClientRect();
            const legend = document.getElementById("graph-legend").getBoundingClientRect();
            return {
                innerWidth: window.innerWidth,
                scrollWidth: document.documentElement.scrollWidth,
                canvasWidth: canvas.getBoundingClientRect().width,
                canvasHeight: canvas.getBoundingClientRect().height,
                analyzeLeft: analyze.left,
                analyzeRight: analyze.right,
                legendRight: legend.right
            };
        })()`);

        const noOverflow = metrics.scrollWidth <= metrics.innerWidth + 1;
        record(`Responsif ${viewport.name}: tanpa overflow horizontal`, noOverflow,
            `scrollWidth=${metrics.scrollWidth}, innerWidth=${metrics.innerWidth}`);
        record(`Responsif ${viewport.name}: kanvas terukur`, metrics.canvasWidth > 0 && metrics.canvasWidth <= metrics.innerWidth + 1,
            `canvasWidth=${Math.round(metrics.canvasWidth)}, height=${Math.round(metrics.canvasHeight)}`);
        record(`Responsif ${viewport.name}: tombol analisis dalam viewport`,
            metrics.analyzeLeft >= -1 && metrics.analyzeRight <= metrics.innerWidth + 1,
            `left=${Math.round(metrics.analyzeLeft)}, right=${Math.round(metrics.analyzeRight)}`);
    }
}

async function checkAccessibility(client) {
    await client.send("Emulation.clearDeviceMetricsOverride");

    const snapshot = await client.evaluate(`(() => {
        const controls = Array.from(document.querySelectorAll("input, select, textarea"));
        const buttons = Array.from(document.querySelectorAll("button"));
        const canvas = document.getElementById("graph-canvas");
        return {
            lang: document.documentElement.lang,
            hasViewportMeta: document.querySelector('meta[name="viewport"]') !== null,
            unlabeledControls: controls
                .filter((element) => element.id === "" ||
                    document.querySelector('label[for="' + element.id + '"]') === null)
                .map((element) => element.id || element.tagName),
            unnamedButtons: buttons
                .filter((button) => button.textContent.trim() === "" &&
                    !button.hasAttribute("aria-label"))
                .map((button) => button.id || button.className),
            liveRegions: document.querySelectorAll("[aria-live]").length,
            graphRole: canvas.getAttribute("role"),
            graphLabel: canvas.getAttribute("aria-label"),
            graphTabIndex: canvas.tabIndex,
            skipLink: Array.from(document.querySelectorAll("a[href]"))
                .some((link) => ["#main", "#content", "#utama"].includes(link.getAttribute("href"))),
            sectionLabels: document.querySelectorAll("section[aria-labelledby]").length
        };
    })()`);

    record("A11y: atribut lang", snapshot.lang === "id", `lang=${snapshot.lang}`);
    record("A11y: meta viewport", snapshot.hasViewportMeta);
    record("A11y: semua kontrol punya label", snapshot.unlabeledControls.length === 0,
        snapshot.unlabeledControls.join(", "));
    record("A11y: semua tombol punya nama", snapshot.unnamedButtons.length === 0,
        snapshot.unnamedButtons.join(", "));
    record("A11y: region aria-live tersedia", snapshot.liveRegions > 0,
        `jumlah=${snapshot.liveRegions}`);
    record("A11y: graf punya role img dan label", snapshot.graphRole === "img" &&
        typeof snapshot.graphLabel === "string" && snapshot.graphLabel.length > 0,
        `role=${snapshot.graphRole}`);
    record("A11y: skip link", snapshot.skipLink,
        snapshot.skipLink ? "" : "tidak ada tautan lompat ke konten utama");
    record("A11y: graf dapat difokus dengan keyboard", snapshot.graphTabIndex >= 0,
        `tabIndex=${snapshot.graphTabIndex}`);
    record("A11y: bagian memiliki label", snapshot.sectionLabels >= 5,
        `jumlah=${snapshot.sectionLabels}`);

    // Skip link harus menjadi elemen pertama yang menerima Tab dan memindahkan
    // fragmen ke <main> ketika ditekan Enter.
    await client.evaluate("document.activeElement.blur()");
    await pressKey(client, "Tab", "Tab", 9);
    const skipFocused = await client.evaluate(
        'document.activeElement.classList.contains("skip-link")'
    );
    record("A11y: skip link menerima Tab pertama", skipFocused,
        `elemen=${await client.evaluate("document.activeElement.className || document.activeElement.tagName")}`);
    await pressKey(client, "Enter", "Enter", 13);
    const skipHash = await client.evaluate("window.location.hash");
    record("A11y: skip link aktif dengan Enter", skipHash === "#main",
        `hash=${skipHash}`);

    // Fokus lewat keyboard dipakai karena :focus-visible tidak selalu aktif
    // ketika elemen difokuskan secara programatis.
    await client.evaluate('document.getElementById("member-name").focus()');
    await client.send("Input.dispatchKeyEvent", {
        type: "keyDown", key: "Tab", code: "Tab",
        windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9
    });
    await client.send("Input.dispatchKeyEvent", {
        type: "keyUp", key: "Tab", code: "Tab",
        windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9
    });

    const focusStyle = await client.evaluate(`(() => {
        const element = document.activeElement;
        const style = getComputedStyle(element);
        return {
            id: element.id,
            tag: element.tagName,
            focusVisible: element.matches(":focus-visible"),
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            boxShadow: style.boxShadow
        };
    })()`);
    const hasFocusStyle = focusStyle.boxShadow !== "none" ||
        (focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth !== "0px");
    record("A11y: indikator fokus terlihat", hasFocusStyle,
        `elemen=${focusStyle.tag}#${focusStyle.id}, focusVisible=${focusStyle.focusVisible}, outline=${focusStyle.outlineStyle} ${focusStyle.outlineWidth}, shadow=${focusStyle.boxShadow}`);

    const contrast = await client.evaluate(`(() => {
        function channels(color) {
            const values = color.match(/[\\d.]+/g).map(Number);
            return [values[0], values[1], values[2]];
        }
        function luminance(color) {
            const rgb = channels(color).map((value) => {
                const scaled = value / 255;
                return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
        }
        function backgroundOf(element) {
            let current = element;
            while (current !== null) {
                const color = getComputedStyle(current).backgroundColor;
                if (color !== "transparent" && !color.includes("rgba(0, 0, 0, 0)")) {
                    return color;
                }
                current = current.parentElement;
            }
            return "rgb(255, 255, 255)";
        }
        function ratio(foreground, background) {
            const a = luminance(foreground);
            const b = luminance(background);
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        }
        const targets = [
            ["deskripsi panel", ".panel__description"],
            ["catatan form", ".form-note"],
            ["legenda graf", ".graph-legend"],
            ["teks tombol utama", ".button--primary"]
        ];
        return targets.map(([name, selector]) => {
            const element = document.querySelector(selector);
            if (element === null) {
                return { name, value: null };
            }
            const style = getComputedStyle(element);
            return {
                name,
                value: Math.round(ratio(style.color, backgroundOf(element)) * 100) / 100,
                fontSize: parseFloat(style.fontSize)
            };
        });
    })()`);

    for (const item of contrast) {
        const threshold = item.fontSize >= 24 ? 3 : 4.5;
        record(`A11y: kontras ${item.name}`, item.value !== null && item.value >= threshold,
            item.value === null ? "elemen tidak ditemukan" : `${item.value}:1 (minimum ${threshold}:1)`);
    }
}

async function main() {
    let flask = null;
    let chrome = null;

    try {
        const port = await getFreePort();
        const baseUrl = `http://127.0.0.1:${port}`;
        flask = await startFlask(port, baseUrl);
        chrome = await startChrome();
        const client = chrome.client;

        await client.evaluate("window.__ccaQaMarker = 'before-navigation'");
        await client.send("Page.navigate", { url: baseUrl + "/" });
        await waitFor(client,
            'window.__ccaQaMarker === undefined && document.readyState === "complete"',
            "halaman siap");
        await waitFor(client, 'typeof window.cytoscape === "function"', "Cytoscape termuat");
        await client.evaluate('document.getElementById("load-sample-button").click()');
        await waitFor(client, 'document.querySelectorAll("#member-list > li").length === 6', "sample data");

        await checkResponsiveness(client);
        await checkAccessibility(client);
    } catch (error) {
        record("Eksekusi QA", false, error.message);
    } finally {
        if (chrome !== null) {
            chrome.client.close();
            chrome.child.kill("SIGTERM");
            await delay(500);
            for (let attempt = 0; attempt < 10; attempt += 1) {
                try {
                    fs.rmSync(chrome.profile, { recursive: true, force: true });
                    break;
                } catch (error) {
                    await delay(200);
                }
            }
        }
        if (flask !== null) {
            flask.kill("SIGTERM");
        }
    }

    const failed = findings.filter((item) => !item.ok);
    console.log(`\nQA: ${findings.length - failed.length}/${findings.length} pemeriksaan lulus.`);
    if (failed.length > 0) {
        console.log("Temuan:");
        for (const item of failed) {
            console.log(`- ${item.name}${item.detail ? ": " + item.detail : ""}`);
        }
        process.exitCode = 1;
    }
}

main();
