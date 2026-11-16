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

    elements.loadSampleButton = document.getElementById("load-sample-button");
    elements.resetButton = document.getElementById("reset-button");
    elements.dataMessage = document.getElementById("data-message");

    bindEvents();
    restoreState();
    renderAll();
}

function bindEvents() {
    elements.memberForm.addEventListener("submit", handleAddMember);
    elements.relationshipForm.addEventListener("submit", handleAddRelationship);
    elements.loadSampleButton.addEventListener("click", handleLoadSample);
    elements.resetButton.addEventListener("click", handleReset);
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

    persistState();
    elements.relationshipSource.value = "";
    elements.relationshipTarget.value = "";
    renderRelationships();
    renderRelationshipOptions();

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

    persistState();
    renderRelationships();
    renderRelationshipOptions();

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

        const badge = document.createElement("span");
        badge.className = "entity__badge";
        badge.textContent = vertex.id;

        const name = document.createElement("span");
        name.className = "entity__name";
        name.textContent = vertex.name;

        main.append(badge, name);
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

    fillSelect(
        elements.relationshipSource,
        placeholder,
        elements.relationshipSource.value
    );
    fillSelect(
        elements.relationshipTarget,
        placeholder,
        elements.relationshipTarget.value
    );
}

function fillSelect(selectElement, placeholderText, selectedValue) {
    selectElement.textContent = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholderText;
    selectElement.append(placeholderOption);

    for (const vertex of state.vertices) {
        const option = document.createElement("option");
        option.value = vertex.id;
        option.textContent = vertex.id + " \u2014 " + vertex.name;
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
