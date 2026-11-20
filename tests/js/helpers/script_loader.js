// Helper bersama untuk unit test JavaScript.
//
// File di static/js/ adalah script biasa (bukan modul): variabel dideklarasikan
// dengan const dan fungsi dideklarasikan di scope global. Karena itu script
// dimuat ke dalam sandbox vm dengan global buatan (localStorage, fetch, ...).
// Fungsi global bisa diakses lewat context, sedangkan const dibaca memakai
// evaluate() karena tidak menjadi properti objek global.

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const STATIC_JS_DIR = path.join(PROJECT_ROOT, "static", "js");

function loadScript(fileName, globals = {}) {
    const source = fs.readFileSync(path.join(STATIC_JS_DIR, fileName), "utf8");
    const context = vm.createContext({ ...globals });

    vm.runInContext(source, context, { filename: fileName });

    return {
        context,
        evaluate(expression) {
            return vm.runInContext(expression, context);
        }
    };
}

// Stub localStorage yang cukup untuk perilaku getItem/setItem/removeItem.
function createLocalStorageStub(initialValues = {}) {
    const data = new Map(Object.entries(initialValues));

    return {
        getItem(key) {
            return data.has(key) ? data.get(key) : null;
        },
        setItem(key, value) {
            data.set(key, String(value));
        },
        removeItem(key) {
            data.delete(key);
        },
        clear() {
            data.clear();
        },
        entries() {
            return Array.from(data.entries());
        }
    };
}

module.exports = { PROJECT_ROOT, loadScript, createLocalStorageStub };
