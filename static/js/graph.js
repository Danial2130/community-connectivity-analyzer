// Visualisasi graf menggunakan Cytoscape.js.
// Modul ini hanya menampilkan data graf yang sudah dikelola frontend dan hasil
// analisis dari backend. Tidak ada algoritma graf yang dihitung di sini.

"use strict";

// Palet warna komponen. Warna dipakai bergiliran jika jumlah komponen lebih
// banyak daripada jumlah warna yang tersedia.
const GRAPH_COMPONENT_COLORS = [
    { background: "#e0e7ff", border: "#6366f1" },
    { background: "#dcfce7", border: "#16a34a" },
    { background: "#fef3c7", border: "#d97706" },
    { background: "#fce7f3", border: "#db2777" },
    { background: "#dbeafe", border: "#2563eb" },
    { background: "#ede9fe", border: "#7c3aed" }
];

const GRAPH_COMPONENT_CLASSES = GRAPH_COMPONENT_COLORS
    .map((color, index) => "graph-component-" + index)
    .join(" ");

// Opsi layout force-directed. Animasi dimatikan agar posisi langsung final
// dan hasilnya mudah diperiksa saat pengujian.
const GRAPH_LAYOUT_OPTIONS = {
    name: "cose",
    animate: false,
    fit: true,
    padding: 30,
    randomize: true,
    nodeRepulsion: 8000,
    idealEdgeLength: 90,
    gravity: 0.3,
    nodeOverlap: 16,
    componentSpacing: 60,
    numIter: 800
};

let graphInstance = null;
let graphCanvas = null;
let graphPlaceholder = null;
let graphLegend = null;
let graphErrorMessage = null;
let graphSignature = null;
let graphResizeTimeout = null;
let graphIsBroken = false;

// ---------------------------------------------------------------------------
// Inisialisasi
// ---------------------------------------------------------------------------

function initGraph() {
    graphCanvas = document.getElementById("graph-canvas");
    graphPlaceholder = document.getElementById("graph-workspace");
    graphLegend = document.getElementById("graph-legend");
    graphErrorMessage = document.getElementById("graph-error");

    if (graphCanvas === null || typeof cytoscape !== "function") {
        disableGraph(
            "Pustaka visualisasi tidak dapat dimuat. Analisis dan pencarian " +
            "jalur tetap dapat digunakan."
        );
        return;
    }

    try {
        graphInstance = cytoscape({
            container: graphCanvas,
            elements: [],
            style: createGraphStyles(),
            layout: { name: "preset" },
            minZoom: 0.4,
            maxZoom: 2.5,
            wheelSensitivity: 0.2,
            boxSelectionEnabled: false
        });
    } catch (error) {
        graphInstance = null;
        disableGraph(
            "Visualisasi tidak dapat ditampilkan. Analisis dan pencarian jalur " +
            "tetap dapat digunakan."
        );
        return;
    }

    window.addEventListener("resize", handleGraphResize);
}

// Menampilkan pesan ketika visualisasi tidak dapat dipakai. Fitur lain di
// halaman tetap berjalan karena modul ini tidak melempar error ke app.js.
function disableGraph(message) {
    graphIsBroken = true;
    graphInstance = null;

    if (graphCanvas !== null) {
        graphCanvas.hidden = true;
    }

    if (graphPlaceholder !== null) {
        graphPlaceholder.hidden = false;
    }

    if (graphLegend !== null) {
        graphLegend.hidden = true;
    }

    if (graphErrorMessage !== null) {
        graphErrorMessage.textContent = message;
        graphErrorMessage.hidden = false;
    }
}

// ---------------------------------------------------------------------------
// Render data graf
// ---------------------------------------------------------------------------

// Membangun ulang elemen graf hanya ketika data benar-benar berubah.
// Perubahan UI lain (misalnya mengisi ulang dropdown) tidak memicu layout baru.
function updateGraph(vertices, edges) {
    if (graphInstance === null || graphIsBroken) {
        return;
    }

    const signature = JSON.stringify(vertices) + "|" + JSON.stringify(edges);

    if (signature === graphSignature) {
        return;
    }

    graphSignature = signature;

    try {
        renderGraphElements(vertices, edges);
    } catch (error) {
        disableGraph(
            "Visualisasi tidak dapat diperbarui. Analisis dan pencarian jalur " +
            "tetap dapat digunakan."
        );
    }
}

function renderGraphElements(vertices, edges) {
    graphInstance.elements().remove();

    const vertexIds = {};
    const nodeElements = [];

    vertices.forEach((vertex) => {
        if (vertex === null || typeof vertex !== "object") {
            return;
        }

        if (typeof vertex.id !== "string" || vertex.id === "") {
            return;
        }

        if (vertexIds[vertex.id] === true) {
            return;
        }

        vertexIds[vertex.id] = true;
        nodeElements.push({
            group: "nodes",
            data: {
                id: vertex.id,
                label: typeof vertex.name === "string" ? vertex.name : vertex.id
            }
        });
    });

    const edgeElements = [];

    edges.forEach((edge, index) => {
        if (edge === null || typeof edge !== "object") {
            return;
        }

        if (edge.source === edge.target) {
            return;
        }

        if (vertexIds[edge.source] !== true || vertexIds[edge.target] !== true) {
            return;
        }

        edgeElements.push({
            group: "edges",
            data: {
                id: "edge-" + index,
                source: edge.source,
                target: edge.target
            }
        });
    });

    graphInstance.add(nodeElements);
    graphInstance.add(edgeElements);

    const hasData = nodeElements.length > 0;

    graphCanvas.hidden = !hasData;
    graphPlaceholder.hidden = hasData;
    graphLegend.hidden = !hasData;

    graphCanvas.setAttribute(
        "aria-label",
        "Visualisasi jaringan: " + nodeElements.length + " anggota dan " +
        edgeElements.length + " hubungan."
    );

    if (!hasData) {
        return;
    }

    graphInstance.resize();
    runGraphLayout();
}

function runGraphLayout() {
    if (graphInstance === null || graphInstance.nodes().length === 0) {
        return;
    }

    graphInstance.layout(GRAPH_LAYOUT_OPTIONS).run();
}

// ---------------------------------------------------------------------------
// Penanda hasil analisis (data dari backend)
// ---------------------------------------------------------------------------

// Menerapkan warna komponen dan penanda anggota belum terhubung berdasarkan
// response /api/analyze. Tidak ada perhitungan komponen atau degree di sini.
function showAnalysisMarkers(analysis) {
    if (graphInstance === null || graphIsBroken) {
        return;
    }

    clearAnalysisMarkers();

    if (analysis === null || typeof analysis !== "object") {
        return;
    }

    const components = Array.isArray(analysis.components)
        ? analysis.components
        : [];
    const isolatedMembers = Array.isArray(analysis.isolated_members)
        ? analysis.isolated_members
        : [];

    components.forEach((memberIds, index) => {
        if (!Array.isArray(memberIds)) {
            return;
        }

        const className =
            "graph-component-" + (index % GRAPH_COMPONENT_COLORS.length);

        memberIds.forEach((memberId) => {
            const node = graphInstance.getElementById(memberId);

            if (node.length > 0) {
                node.addClass(className);
            }
        });
    });

    isolatedMembers.forEach((memberId) => {
        const node = graphInstance.getElementById(memberId);

        if (node.length > 0) {
            node.addClass("graph-isolated");
        }
    });
}

function clearAnalysisMarkers() {
    if (graphInstance === null) {
        return;
    }

    graphInstance.elements()
        .removeClass(GRAPH_COMPONENT_CLASSES)
        .removeClass("graph-isolated");
}

// ---------------------------------------------------------------------------
// Sorotan jalur terpendek (data dari backend)
// ---------------------------------------------------------------------------

// Menyorot node dan edge yang ada pada array path dari /api/shortest-path,
// lalu meredupkan elemen lain. Untuk path satu node (awal = tujuan), hanya
// node tersebut yang diberi kelas jalur.
function highlightShortestPath(path) {
    if (graphInstance === null || graphIsBroken) {
        return;
    }

    clearPathHighlight();

    if (!Array.isArray(path) || path.length === 0) {
        return;
    }

    let markedNodeCount = 0;

    path.forEach((memberId) => {
        const node = graphInstance.getElementById(memberId);

        if (node.length > 0) {
            node.addClass("graph-path-node");
            markedNodeCount += 1;
        }
    });

    if (markedNodeCount === 0) {
        return;
    }

    for (let index = 1; index < path.length; index += 1) {
        const edge = findGraphEdge(path[index - 1], path[index]);

        if (edge !== null) {
            edge.addClass("graph-path-edge");
        }
    }

    graphInstance.elements().filter((element) => {
        return !element.hasClass("graph-path-node") &&
            !element.hasClass("graph-path-edge");
    }).addClass("graph-dimmed");
}

function clearPathHighlight() {
    if (graphInstance === null) {
        return;
    }

    graphInstance.elements()
        .removeClass("graph-path-node")
        .removeClass("graph-path-edge")
        .removeClass("graph-dimmed");
}

// Mencari edge berdasarkan pasangan ID. Relasi bersifat dua arah, jadi urutan
// source/target tidak menentukan.
function findGraphEdge(sourceId, targetId) {
    let result = null;

    graphInstance.edges().forEach((edge) => {
        if (result !== null) {
            return;
        }

        const source = edge.data("source");
        const target = edge.data("target");

        if (
            (source === sourceId && target === targetId) ||
            (source === targetId && target === sourceId)
        ) {
            result = edge;
        }
    });

    return result;
}

// ---------------------------------------------------------------------------
// Ukuran canvas dan style
// ---------------------------------------------------------------------------

// Canvas perlu diberi tahu ketika ukuran panel berubah (misalnya breakpoint
// responsif). Fungsi ini tidak menjalankan layout ulang.
function handleGraphResize() {
    if (graphResizeTimeout !== null) {
        clearTimeout(graphResizeTimeout);
    }

    graphResizeTimeout = setTimeout(() => {
        graphResizeTimeout = null;
        resizeGraph();
    }, 150);
}

function resizeGraph() {
    if (graphInstance === null || graphCanvas === null || graphCanvas.hidden) {
        return;
    }

    graphInstance.resize();
}

function createGraphStyles() {
    const styles = [
        {
            selector: "node",
            style: {
                "background-color": "#e2e8f0",
                "border-color": "#64748b",
                "border-width": 2,
                "width": 32,
                "height": 32,
                "label": "data(label)",
                "color": "#1e293b",
                "font-size": 11,
                "font-weight": 600,
                "text-valign": "bottom",
                "text-halign": "center",
                "text-margin-y": 5,
                "text-wrap": "wrap",
                "text-max-width": 90,
                "text-background-color": "#ffffff",
                "text-background-opacity": 0.85,
                "text-background-padding": 2,
                "text-background-shape": "roundrectangle"
            }
        },
        {
            selector: "edge",
            style: {
                "width": 2,
                "line-color": "#94a3b8",
                "curve-style": "bezier"
            }
        }
    ];

    GRAPH_COMPONENT_COLORS.forEach((color, index) => {
        styles.push({
            selector: "node.graph-component-" + index,
            style: {
                "background-color": color.background,
                "border-color": color.border
            }
        });
    });

    styles.push(
        {
            selector: "node.graph-isolated",
            style: {
                "background-color": "#fff7ed",
                "border-color": "#f97316",
                "border-style": "dashed",
                "border-width": 3,
                "color": "#9a3412"
            }
        },
        {
            selector: "node.graph-path-node",
            style: {
                "background-color": "#ccfbf1",
                "border-color": "#0f766e",
                "border-width": 4,
                "color": "#0f766e"
            }
        },
        {
            selector: "edge.graph-path-edge",
            style: {
                "width": 4,
                "line-color": "#0f766e"
            }
        },
        {
            selector: ".graph-dimmed",
            style: {
                "opacity": 0.2
            }
        }
    );

    return styles;
}
