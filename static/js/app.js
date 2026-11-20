// Koordinasi antarmuka dan state graf.
// Modul ini belum menjalankan algoritma graf; analisis akan dilakukan di backend.

"use strict";

const SAMPLE_GRAPH = {
    vertices: [
        { id: "A", name: "Andi" },
        { id: "B", name: "Budi" },
        { id: "C", name: "Citra" },
        { id: "D", name: "Deni" },
        { id: "E", name: "Eka" },
        { id: "F", name: "Fajar" }
    ],
    edges: [
        { source: "A", target: "B" },
        { source: "A", target: "C" },
        { source: "B", target: "C" },
        { source: "C", target: "D" },
        { source: "D", target: "E" }
    ],
    nextIdIndex: 6
};

const state = {
    vertices: [],
    edges: [],
    nextIdIndex: 0
};

const elements = {};

let analysisRequestId = 0;
let pathRequestId = 0;
let isAnalyzing = false;
let isFindingPath = false;

// Status analisis menggambarkan kondisi UI, bukan hasil perhitungan backend.
let analysisState = "idle";

const ANALYSIS_STATUS_TEXT = {
    idle: "Belum dianalisis",
    running: "Sedang dianalisis",
    success: "Analisis berhasil",
    stale: "Data berubah setelah analisis terakhir"
};

document.addEventListener("DOMContentLoaded", init);

function init() {
    elements.memberForm = document.getElementById("member-form");
    elements.memberName = document.getElementById("member-name");
    elements.memberMessage = document.getElementById("member-message");
    elements.memberList = document.getElementById("member-list");
    elements.memberEmpty = document.getElementById("member-empty");

    elements.relationshipForm = document.getElementById("relationship-form");
    elements.relationshipSource = document.getElementById("relationship-source");
    elements.relationshipTarget = document.getElementById("relationship-target");
    elements.relationshipMessage = document.getElementById("relationship-message");
    elements.relationshipList = document.getElementById("relationship-list");
    elements.relationshipEmpty = document.getElementById("relationship-empty");
    elements.relationshipEmptyTitle = elements.relationshipEmpty.querySelector(".empty-state__title");
    elements.relationshipEmptyText = elements.relationshipEmpty.querySelector(".empty-state__text");

    elements.loadSampleButton = document.getElementById("load-sample-button");
    elements.resetButton = document.getElementById("reset-button");
    elements.dataMessage = document.getElementById("data-message");

    elements.analyzeButton = document.getElementById("analyze-button");
    elements.analysisStatus = document.getElementById("analysis-status");
    elements.analysisMessage = document.getElementById("analysis-message");
    elements.analysisNote = document.getElementById("analysis-note");
    elements.statVertexCount = document.getElementById("stat-vertex-count");
    elements.statEdgeCount = document.getElementById("stat-edge-count");
    elements.statComponentCount = document.getElementById("stat-component-count");
    elements.statIsolatedCount = document.getElementById("stat-isolated-count");
    elements.degreeSummary = document.getElementById("degree-summary");
    elements.highestDegree = document.getElementById("highest-degree");
    elements.lowestDegree = document.getElementById("lowest-degree");
    elements.degreeList = document.getElementById("degree-list");
    elements.isolatedList = document.getElementById("isolated-list");
    elements.componentList = document.getElementById("component-list");

    elements.pathForm = document.getElementById("shortest-path-form");
    elements.pathStart = document.getElementById("path-start");
    elements.pathEnd = document.getElementById("path-end");
    elements.pathSubmit = document.getElementById("path-submit");
    elements.pathMessage = document.getElementById("path-message");
    elements.pathNote = document.getElementById("path-note");
    elements.pathResult = document.getElementById("path-result");

    initGraph();

    bindEvents();
    restoreState();
    setAnalysisStatus("idle");
    renderAll();
}

function bindEvents() {
    elements.memberForm.addEventListener("submit", handleAddMember);
    elements.relationshipForm.addEventListener("submit", handleAddRelationship);
    elements.loadSampleButton.addEventListener("click", handleLoadSample);
    elements.resetButton.addEventListener("click", handleReset);

    elements.analyzeButton.addEventListener("click", handleAnalyze);
    elements.pathForm.addEventListener("submit", handleShortestPath);
    elements.pathStart.addEventListener("change", handlePathSelectionChange);
    elements.pathEnd.addEventListener("change", handlePathSelectionChange);
}

// ---------------------------------------------------------------------------
// State dan penyimpanan
// ---------------------------------------------------------------------------

function restoreState() {
    const result = loadGraph();

    if (result.graph !== null) {
        state.vertices = result.graph.vertices;
        state.edges = result.graph.edges;
        state.nextIdIndex = result.graph.nextIdIndex;
        skipUsedIds();
    }

    if (result.error !== null) {
        showMessage(elements.dataMessage, result.error, "error");
    }
}

// Memastikan ID berikutnya tidak bertabrakan dengan ID yang sudah dipakai.
function skipUsedIds() {
    const usedIds = new Set(state.vertices.map((vertex) => vertex.id));

    while (usedIds.has(idFromIndex(state.nextIdIndex))) {
        state.nextIdIndex += 1;
    }
}

// Mengubah indeks 0, 1, 2, ... menjadi A, B, C, ..., Z, AA, AB, ...
function idFromIndex(index) {
    let label = "";
    let number = index + 1;

    while (number > 0) {
        const remainder = (number - 1) % 26;
        label = String.fromCharCode(65 + remainder) + label;
        number = Math.floor((number - 1) / 26);
    }

    return label;
}

function persistState() {
    const result = saveGraph(state);

    if (!result.ok) {
        showMessage(elements.dataMessage, result.error, "error");
    }

    return result.ok;
}

// ---------------------------------------------------------------------------
// Pengelolaan anggota
// ---------------------------------------------------------------------------

function handleAddMember(event) {
    event.preventDefault();

    const name = elements.memberName.value.trim();

    if (name === "") {
        showMessage(elements.memberMessage, "Nama anggota wajib diisi.", "error");
        elements.memberName.focus();
        return;
    }

    const normalizedName = name.toLowerCase();
    const duplicate = state.vertices.some(
        (vertex) => vertex.name.toLowerCase() === normalizedName
    );

    if (duplicate) {
        showMessage(elements.memberMessage, 'Nama anggota "' + name + '" sudah digunakan.', "error");
        elements.memberName.focus();
        elements.memberName.select();
        return;
    }

    const id = idFromIndex(state.nextIdIndex);
    state.vertices.push({ id: id, name: name });
    state.nextIdIndex += 1;

    handleGraphChanged();
    persistState();
    renderAll();

    elements.memberName.value = "";
    elements.memberName.focus();
    showMessage(
        elements.memberMessage,
        'Anggota "' + name + '" ditambahkan dengan ID ' + id + ".",
        "success"
    );
}

function handleDeleteMember(id) {
    const vertex = findVertex(id);

    if (vertex === null) {
        return;
    }

    const relatedEdgeCount = state.edges.filter(
        (edge) => edge.source === id || edge.target === id
    ).length;

    state.vertices = state.vertices.filter((item) => item.id !== id);
    state.edges = state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
    );

    handleGraphChanged();
    persistState();
    renderAll();

    const message = relatedEdgeCount > 0
        ? 'Anggota "' + vertex.name + '" beserta ' + relatedEdgeCount + " hubungan terkait dihapus."
        : 'Anggota "' + vertex.name + '" dihapus.';
    showMessage(elements.memberMessage, message, "success");
}

// ---------------------------------------------------------------------------
// Pengelolaan hubungan
// ---------------------------------------------------------------------------

function handleAddRelationship(event) {
    event.preventDefault();

    const source = elements.relationshipSource.value;
    const target = elements.relationshipTarget.value;

    if (source === "" || target === "") {
        showMessage(elements.relationshipMessage, "Pilih anggota pertama dan anggota kedua.", "error");
        return;
    }

    if (source === target) {
        showMessage(elements.relationshipMessage, "Anggota pertama dan anggota kedua tidak boleh sama.", "error");
        return;
    }

    const sourceVertex = findVertex(source);
    const targetVertex = findVertex(target);

    if (sourceVertex === null || targetVertex === null) {
        showMessage(elements.relationshipMessage, "Anggota yang dipilih tidak ditemukan.", "error");
        return;
    }

    if (relationshipExists(source, target)) {
        showMessage(
            elements.relationshipMessage,
            'Hubungan antara "' + sourceVertex.name + '" dan "' + targetVertex.name + '" sudah ada.',
            "error"
        );
        return;
    }

    state.edges.push({ source: source, target: target });

    handleGraphChanged();
    persistState();
    elements.relationshipSource.value = "";
    elements.relationshipTarget.value = "";
    renderAll();

    showMessage(
        elements.relationshipMessage,
        'Hubungan antara "' + sourceVertex.name + '" dan "' + targetVertex.name + '" ditambahkan.',
        "success"
    );
}

function handleDeleteRelationship(index) {
    const edge = state.edges[index];

    if (edge === undefined) {
        return;
    }

    const sourceVertex = findVertex(edge.source);
    const targetVertex = findVertex(edge.target);

    state.edges.splice(index, 1);

    handleGraphChanged();
    persistState();
    renderAll();

    if (sourceVertex !== null && targetVertex !== null) {
        showMessage(
            elements.relationshipMessage,
            'Hubungan antara "' + sourceVertex.name + '" dan "' + targetVertex.name + '" dihapus.',
            "success"
        );
    }
}

function relationshipExists(source, target) {
    return state.edges.some(
        (edge) =>
            (edge.source === source && edge.target === target) ||
            (edge.source === target && edge.target === source)
    );
}

// ---------------------------------------------------------------------------
// Sample data dan reset
// ---------------------------------------------------------------------------

function handleLoadSample() {
    const hasData = state.vertices.length > 0 || state.edges.length > 0;

    if (hasData) {
        const confirmed = window.confirm(
            "Data yang ada akan diganti dengan data contoh. Lanjutkan?"
        );

        if (!confirmed) {
            return;
        }
    }

    state.vertices = SAMPLE_GRAPH.vertices.map((vertex) => ({ ...vertex }));
    state.edges = SAMPLE_GRAPH.edges.map((edge) => ({ ...edge }));
    state.nextIdIndex = SAMPLE_GRAPH.nextIdIndex;

    handleGraphChanged();
    persistState();
    renderAll();

    elements.memberName.value = "";
    hideMessage(elements.memberMessage);
    hideMessage(elements.relationshipMessage);
    showMessage(elements.dataMessage, "Data contoh berhasil dimuat: 6 anggota dan 5 hubungan.", "success");
}

function handleReset() {
    const confirmed = window.confirm(
        "Hapus seluruh anggota dan hubungan? Tindakan ini tidak dapat dibatalkan."
    );

    if (!confirmed) {
        return;
    }

    state.vertices = [];
    state.edges = [];
    state.nextIdIndex = 0;

    handleGraphChanged();
    persistState();
    renderAll();

    elements.memberName.value = "";
    hideMessage(elements.memberMessage);
    hideMessage(elements.relationshipMessage);
    showMessage(elements.dataMessage, "Seluruh data berhasil dihapus.", "success");
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderAll() {
    renderMembers();
    renderRelationships();
    renderRelationshipOptions();
    renderShortestPathOptions();
    updateGraph(state.vertices, state.edges);
}

function renderMembers() {
    elements.memberList.textContent = "";
    elements.memberList.hidden = state.vertices.length === 0;
    elements.memberEmpty.hidden = state.vertices.length > 0;

    for (const vertex of state.vertices) {
        const item = document.createElement("li");
        item.className = "entity";

        const main = document.createElement("div");
        main.className = "entity__main";

        const name = document.createElement("span");
        name.className = "entity__name";
        name.textContent = vertex.name;

        main.append(name);
        item.append(main, createDeleteButton(
            "Hapus anggota " + vertex.name,
            () => handleDeleteMember(vertex.id)
        ));
        elements.memberList.append(item);
    }
}

function renderRelationships() {
    elements.relationshipList.textContent = "";
    elements.relationshipList.hidden = state.edges.length === 0;
    elements.relationshipEmpty.hidden = state.edges.length > 0;

    if (state.vertices.length === 0) {
        elements.relationshipEmptyTitle.textContent = "Belum ada anggota";
        elements.relationshipEmptyText.textContent =
            "Tambahkan anggota terlebih dahulu untuk membuat hubungan.";
    } else {
        elements.relationshipEmptyTitle.textContent = "Belum ada hubungan";
        elements.relationshipEmptyText.textContent =
            "Pilih dua anggota di atas untuk membuat hubungan pertama.";
    }

    state.edges.forEach((edge, index) => {
        const sourceVertex = findVertex(edge.source);
        const targetVertex = findVertex(edge.target);

        if (sourceVertex === null || targetVertex === null) {
            return;
        }

        const item = document.createElement("li");
        item.className = "entity";

        const main = document.createElement("div");
        main.className = "entity__main";

        const sourceName = document.createElement("span");
        sourceName.className = "entity__name";
        sourceName.textContent = sourceVertex.name;

        const arrow = document.createElement("span");
        arrow.className = "entity__arrow";
        arrow.textContent = "\u2194";
        arrow.setAttribute("aria-hidden", "true");

        const targetName = document.createElement("span");
        targetName.className = "entity__name";
        targetName.textContent = targetVertex.name;

        main.append(sourceName, arrow, targetName);
        item.append(main, createDeleteButton(
            "Hapus hubungan " + sourceVertex.name + " dan " + targetVertex.name,
            () => handleDeleteRelationship(index)
        ));
        elements.relationshipList.append(item);
    });
}

function renderRelationshipOptions() {
    const placeholder = state.vertices.length === 0 ? "Belum ada anggota" : "Pilih anggota";

    // Hubungan menampilkan nama saja; ID tetap disimpan sebagai value option.
    fillSelect(
        elements.relationshipSource,
        placeholder,
        elements.relationshipSource.value,
        false
    );
    fillSelect(
        elements.relationshipTarget,
        placeholder,
        elements.relationshipTarget.value,
        false
    );
}

function renderShortestPathOptions() {
    const placeholder = state.vertices.length === 0 ? "Belum ada anggota" : "Pilih anggota";

    // Sama seperti dropdown Hubungan: nama saja yang terlihat, ID tetap di value.
    fillSelect(elements.pathStart, placeholder, elements.pathStart.value, false);
    fillSelect(elements.pathEnd, placeholder, elements.pathEnd.value, false);
    updateControls();
}

function fillSelect(selectElement, placeholderText, selectedValue, includeId = true) {
    selectElement.textContent = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholderText;
    selectElement.append(placeholderOption);

    for (const vertex of state.vertices) {
        const option = document.createElement("option");
        option.value = vertex.id;
        // Teks yang terlihat bisa disesuaikan, tetapi value selalu ID simpul.
        option.textContent = includeId
            ? vertex.id + " \u2014 " + vertex.name
            : vertex.name;
        selectElement.append(option);
    }

    const valueExists = state.vertices.some((vertex) => vertex.id === selectedValue);
    selectElement.value = valueExists ? selectedValue : "";
}

function createDeleteButton(accessibilityLabel, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button--small button--danger";
    button.textContent = "Hapus";
    button.setAttribute("aria-label", accessibilityLabel);
    button.addEventListener("click", onClick);
    return button;
}

// ---------------------------------------------------------------------------
// Integrasi API: analisis dan shortest path
// ---------------------------------------------------------------------------

function setAnalysisStatus(status) {
    analysisState = status;
    elements.analysisStatus.dataset.state = status;
    elements.analysisStatus.textContent = ANALYSIS_STATUS_TEXT[status];
}

async function handleAnalyze() {
    if (isAnalyzing) {
        return;
    }

    const requestId = analysisRequestId + 1;
    analysisRequestId = requestId;
    isAnalyzing = true;
    setAnalysisStatus("running");

    resetAnalysisView();
    updateControls();
    elements.analyzeButton.textContent = "Menganalisis...";
    elements.analyzeButton.setAttribute("aria-busy", "true");
    showMessage(
        elements.analysisMessage,
        "Menghubungi server untuk menganalisis graf...",
        "info"
    );

    try {
        const data = await requestAnalysis(
            state.vertices.map((vertex) => ({ ...vertex })),
            state.edges.map((edge) => ({ ...edge }))
        );

        if (requestId !== analysisRequestId) {
            return;
        }

        renderAnalysis(data);
        setAnalysisStatus("success");
        showMessage(elements.analysisMessage, "Analisis selesai.", "success");
    } catch (error) {
        if (requestId !== analysisRequestId) {
            return;
        }

        resetAnalysisView();
        setAnalysisStatus("idle");
        showMessage(
            elements.analysisMessage,
            getClientErrorMessage(error),
            "error"
        );
    } finally {
        if (requestId === analysisRequestId) {
            isAnalyzing = false;
            elements.analyzeButton.textContent = "Jalankan Analisis";
            elements.analyzeButton.removeAttribute("aria-busy");
            updateControls();
        }
    }
}

async function handleShortestPath(event) {
    event.preventDefault();

    if (isFindingPath) {
        return;
    }

    const start = elements.pathStart.value;
    const end = elements.pathEnd.value;

    if (start === "" || end === "") {
        showMessage(
            elements.pathMessage,
            "Pilih anggota awal dan anggota tujuan terlebih dahulu.",
            "error"
        );
        return;
    }

    const requestId = pathRequestId + 1;
    pathRequestId = requestId;
    isFindingPath = true;

    resetPathView();
    updateControls();
    elements.pathSubmit.textContent = "Mencari...";
    elements.pathSubmit.setAttribute("aria-busy", "true");
    showMessage(
        elements.pathMessage,
        "Mencari jalur terpendek...",
        "info"
    );

    try {
        const data = await requestShortestPath(
            state.vertices.map((vertex) => ({ ...vertex })),
            state.edges.map((edge) => ({ ...edge })),
            start,
            end
        );

        if (requestId !== pathRequestId) {
            return;
        }

        renderPathResult(data, start, end);
        hideMessage(elements.pathMessage);
    } catch (error) {
        if (requestId !== pathRequestId) {
            return;
        }

        resetPathView();
        showMessage(
            elements.pathMessage,
            getClientErrorMessage(error),
            "error"
        );
    } finally {
        if (requestId === pathRequestId) {
            isFindingPath = false;
            elements.pathSubmit.textContent = "Cari Jalur";
            elements.pathSubmit.removeAttribute("aria-busy");
            updateControls();
        }
    }
}

function handlePathSelectionChange() {
    if (isFindingPath) {
        return;
    }

    resetPathView();
}

// Membatalkan hasil lama ketika data graf berubah. Request yang masih
// berjalan akan diabaikan karena nomor request sudah berubah.
function handleGraphChanged() {
    const previousStatus = analysisState;

    analysisRequestId += 1;
    pathRequestId += 1;
    isAnalyzing = false;
    isFindingPath = false;

    elements.analyzeButton.textContent = "Jalankan Analisis";
    elements.analyzeButton.removeAttribute("aria-busy");
    elements.pathSubmit.textContent = "Cari Jalur";
    elements.pathSubmit.removeAttribute("aria-busy");

    resetAnalysisView();
    resetPathView();

    // Data yang diubah membuat hasil lama tidak relevan lagi.
    if (previousStatus === "success" || previousStatus === "stale") {
        setAnalysisStatus("stale");
    } else {
        setAnalysisStatus("idle");
    }

    updateControls();
}

function updateControls() {
    const hasVertices = state.vertices.length > 0;

    elements.analyzeButton.disabled = !hasVertices || isAnalyzing;
    elements.pathStart.disabled = !hasVertices || isFindingPath;
    elements.pathEnd.disabled = !hasVertices || isFindingPath;
    elements.pathSubmit.disabled = !hasVertices || isFindingPath;

    if (hasVertices) {
        elements.analysisNote.textContent =
            "Data graf akan dikirim ke server saat analisis dijalankan.";
        elements.pathNote.textContent =
            "Pilih dua anggota, termasuk anggota yang sama.";
    } else {
        elements.analysisNote.textContent =
            "Tambahkan minimal satu anggota untuk menjalankan analisis.";
        elements.pathNote.textContent =
            "Tambahkan minimal satu anggota untuk mencari jalur.";
    }
}

function getClientErrorMessage(error) {
    if (
        error !== null &&
        typeof error === "object" &&
        typeof error.message === "string" &&
        error.message !== ""
    ) {
        return error.message;
    }

    return "Terjadi kesalahan yang tidak diketahui.";
}

function renderAnalysis(data) {
    const isolatedMembers = Array.isArray(data.isolated_members)
        ? data.isolated_members
        : [];
    const components = Array.isArray(data.components) ? data.components : [];

    elements.statVertexCount.textContent = String(data.vertex_count);
    elements.statEdgeCount.textContent = String(data.edge_count);
    elements.statComponentCount.textContent = String(data.component_count);
    elements.statIsolatedCount.textContent = String(isolatedMembers.length);

    renderDegreeSummary(data.highest_degree, data.lowest_degree);
    renderDegreeList(data.degrees);
    renderIsolatedMembers(isolatedMembers);
    renderComponents(components);
    showAnalysisMarkers(data);
}

function renderDegreeSummary(highest, lowest) {
    if (highest === null || lowest === null) {
        elements.degreeSummary.hidden = true;
        elements.highestDegree.textContent = "\u2014";
        elements.lowestDegree.textContent = "\u2014";
        return;
    }

    elements.highestDegree.textContent = formatDegreeSummary(highest);
    elements.lowestDegree.textContent = formatDegreeSummary(lowest);
    elements.degreeSummary.hidden = false;
}

function formatDegreeSummary(summary) {
    if (
        summary === null ||
        typeof summary !== "object" ||
        !Array.isArray(summary.members)
    ) {
        return "\u2014";
    }

    const members = summary.members.map(formatMemberLabel).join(", ");
    return members + " \u2014 " + summary.value + " koneksi";
}

function renderDegreeList(degrees) {
    if (
        state.vertices.length === 0 ||
        degrees === null ||
        typeof degrees !== "object" ||
        Array.isArray(degrees)
    ) {
        renderEmptyState(
            elements.degreeList,
            "Belum ada hasil analisis",
            "Jalankan analisis untuk melihat jumlah koneksi setiap anggota."
        );
        return;
    }

    elements.degreeList.className = "degree-list";
    elements.degreeList.textContent = "";

    for (const vertex of state.vertices) {
        const degree = degrees[vertex.id];
        const item = document.createElement("div");
        item.className = "degree-item";

        const main = document.createElement("div");
        main.className = "degree-item__main";

        const badge = document.createElement("span");
        badge.className = "entity__badge";
        badge.textContent = vertex.id;

        const name = document.createElement("span");
        name.className = "entity__name";
        name.textContent = vertex.name;

        const value = document.createElement("span");
        value.className = "degree-item__value";
        value.textContent = degree === undefined
            ? "\u2014"
            : degree + " koneksi";

        main.append(badge, name);
        item.append(main, value);
        elements.degreeList.append(item);
    }
}

function renderIsolatedMembers(memberIds) {
    elements.isolatedList.textContent = "";

    if (memberIds.length === 0) {
        renderEmptyState(
            elements.isolatedList,
            "Tidak ada anggota yang belum terhubung",
            "Semua anggota memiliki minimal satu hubungan."
        );
        return;
    }

    elements.isolatedList.className = "member-chips";

    for (const memberId of memberIds) {
        const chip = document.createElement("span");
        chip.className = "member-chip";
        chip.textContent = formatMemberLabel(memberId);
        elements.isolatedList.append(chip);
    }
}

function renderComponents(components) {
    elements.componentList.textContent = "";

    if (components.length === 0) {
        renderEmptyState(
            elements.componentList,
            "Tidak ada komponen",
            "Belum ada anggota yang dapat dikelompokkan."
        );
        return;
    }

    elements.componentList.className = "component-list";

    components.forEach((memberIds, index) => {
        const card = document.createElement("article");
        card.className = "component-card";

        const title = document.createElement("h4");
        title.className = "component-card__title";
        title.textContent =
            "Kelompok " + (index + 1) + " (" + memberIds.length + " anggota)";

        const members = document.createElement("p");
        members.className = "component-card__members";
        members.textContent = memberIds.map(formatMemberLabel).join(", ");

        card.append(title, members);
        elements.componentList.append(card);
    });
}

function renderPathResult(result, start, end) {
    elements.pathResult.textContent = "";
    elements.pathResult.className = "path-result";
    clearPathHighlight();

    if (
        result === null ||
        typeof result !== "object" ||
        result.found !== true
    ) {
        const title = document.createElement("p");
        title.className = "path-result__title";
        title.textContent = "Jalur tidak ditemukan";

        const text = document.createElement("p");
        text.className = "path-result__text";
        text.textContent =
            formatMemberLabel(start) + " dan " + formatMemberLabel(end) +
            " tidak terhubung dalam jaringan saat ini.";

        elements.pathResult.append(title, text);
        return;
    }

    const title = document.createElement("p");
    title.className = "path-result__title";
    title.textContent = "Jalur ditemukan";

    const steps = document.createElement("div");
    steps.className = "path-steps";

    const path = Array.isArray(result.path) ? result.path : [];

    path.forEach((memberId, index) => {
        if (index > 0) {
            const arrow = document.createElement("span");
            arrow.className = "path-arrow";
            arrow.textContent = "\u2192";
            arrow.setAttribute("aria-hidden", "true");
            steps.append(arrow);
        }

        const step = document.createElement("span");
        step.className = "path-step";

        const badge = document.createElement("span");
        badge.className = "path-step__badge";
        badge.textContent = memberId;

        const name = document.createElement("span");
        name.className = "path-step__name";
        const vertex = findVertex(memberId);
        name.textContent = vertex === null ? memberId : vertex.name;

        step.append(badge, name);
        steps.append(step);
    });

    const distance = document.createElement("p");
    distance.className = "path-distance";

    if (result.distance === 0) {
        distance.textContent =
            "Anggota awal dan tujuan sama. Jarak: 0 hubungan.";
    } else {
        distance.textContent = "Jarak: " + result.distance + " hubungan.";
    }

    elements.pathResult.append(title, steps, distance);
    highlightShortestPath(path);
}

function resetAnalysisView() {
    elements.statVertexCount.textContent = "\u2014";
    elements.statEdgeCount.textContent = "\u2014";
    elements.statComponentCount.textContent = "\u2014";
    elements.statIsolatedCount.textContent = "\u2014";

    elements.degreeSummary.hidden = true;
    elements.highestDegree.textContent = "\u2014";
    elements.lowestDegree.textContent = "\u2014";

    renderEmptyState(
        elements.degreeList,
        "Belum ada hasil analisis",
        "Jalankan analisis untuk melihat jumlah koneksi setiap anggota."
    );
    renderEmptyState(
        elements.isolatedList,
        "Belum ada hasil analisis",
        "Anggota dengan degree nol akan ditampilkan setelah analisis."
    );
    renderEmptyState(
        elements.componentList,
        "Belum ada hasil analisis",
        "Kelompok anggota yang saling terhubung akan ditampilkan setelah analisis."
    );

    clearAnalysisMarkers();
    hideMessage(elements.analysisMessage);
}

function resetPathView() {
    clearPathHighlight();
    elements.pathResult.className = "empty-state";
    elements.pathResult.textContent = "";

    const title = document.createElement("p");
    title.className = "empty-state__title";
    title.textContent = "Belum ada hasil";

    const text = document.createElement("p");
    text.className = "empty-state__text";
    text.textContent =
        "Jalur, urutan anggota, dan jarak akan ditampilkan di sini.";

    elements.pathResult.append(title, text);
    hideMessage(elements.pathMessage);
}

function renderEmptyState(container, titleText, messageText) {
    container.className = "empty-state empty-state--compact";
    container.textContent = "";

    if (titleText !== null) {
        const title = document.createElement("p");
        title.className = "empty-state__title";
        title.textContent = titleText;
        container.append(title);
    }

    const message = document.createElement("p");
    message.className = "empty-state__text";
    message.textContent = messageText;
    container.append(message);
}

function formatMemberLabel(memberId) {
    const vertex = findVertex(memberId);
    return vertex === null ? memberId : vertex.name + " (" + memberId + ")";
}

// ---------------------------------------------------------------------------
// Utilitas
// ---------------------------------------------------------------------------

function findVertex(id) {
    const vertex = state.vertices.find((item) => item.id === id);
    return vertex === undefined ? null : vertex;
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = "message message--" + type;
    element.hidden = false;
}

function hideMessage(element) {
    element.textContent = "";
    element.hidden = true;
}
