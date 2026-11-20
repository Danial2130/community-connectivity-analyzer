// Klien Chrome DevTools Protocol minimal untuk harness E2E.
// Memakai WebSocket global bawaan Node.js, tanpa dependensi automation.

"use strict";

class CdpClient {
    constructor(webSocketUrl) {
        this.webSocketUrl = webSocketUrl;
        this.socket = null;
        this.nextId = 1;
        this.pending = new Map();
        this.handlers = new Map();
        this.consoleErrors = [];
        this.exceptions = [];
    }

    async connect() {
        this.socket = new WebSocket(this.webSocketUrl);

        await new Promise((resolve, reject) => {
            this.socket.addEventListener("open", resolve, { once: true });
            this.socket.addEventListener("error", () => {
                reject(new Error("Gagal terhubung ke Chrome DevTools Protocol."));
            }, { once: true });
        });

        this.socket.addEventListener("message", (event) => {
            this._handleMessage(event.data);
        });

        await this.send("Runtime.enable");
        await this.send("Page.enable");
        await this.send("Log.enable");
    }

    on(method, handler) {
        const handlers = this.handlers.get(method) || [];
        handlers.push(handler);
        this.handlers.set(method, handlers);
    }

    _handleMessage(raw) {
        let message;

        try {
            message = JSON.parse(raw);
        } catch (error) {
            return;
        }

        if (message.id !== undefined) {
            const entry = this.pending.get(message.id);
            if (entry === undefined) {
                return;
            }
            this.pending.delete(message.id);

            if (message.error) {
                entry.reject(new Error(message.error.message || "Permintaan CDP gagal."));
            } else {
                entry.resolve(message.result);
            }
            return;
        }

        const handlers = this.handlers.get(message.method) || [];
        for (const handler of handlers) {
            handler(message.params || {});
        }

        if (message.method === "Runtime.exceptionThrown") {
            const detail = message.params.exceptionDetails;
            const text = detail.exception && detail.exception.description
                ? detail.exception.description
                : detail.text;
            this.exceptions.push(text);
        }

        if (message.method === "Runtime.consoleAPICalled" &&
            message.params.type === "error") {
            const text = message.params.args
                .map((arg) => arg.value !== undefined ? arg.value : arg.description)
                .join(" ");
            this.consoleErrors.push(text);
        }

        if (message.method === "Log.entryAdded" &&
            message.params.entry.level === "error") {
            const text = message.params.entry.text;
            if (!this.consoleErrors.includes(text)) {
                this.consoleErrors.push(text);
            }
        }
    }

    send(method, params = {}) {
        const id = this.nextId++;

        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.socket.send(JSON.stringify({ id, method, params }));
        });
    }

    async evaluate(expression) {
        const response = await this.send("Runtime.evaluate", {
            expression,
            returnByValue: true,
            awaitPromise: true
        });

        if (response.exceptionDetails) {
            const detail = response.exceptionDetails.exception &&
                response.exceptionDetails.exception.description
                ? response.exceptionDetails.exception.description
                : response.exceptionDetails.text;
            throw new Error("Evaluasi JavaScript gagal: " + detail);
        }

        return response.result.value;
    }

    close() {
        if (this.socket !== null && this.socket.readyState <= 1) {
            this.socket.close();
        }
    }
}

module.exports = { CdpClient };
