const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const BASE = API_BASE.replace(/\/$/, "");

async function jsonFetch(path) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "API error");
    }
    return res.json();
}

async function formFetch(path, formData) {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "API error");
    }
    return res.json();
}

export const inferenceAPI = {
    health: () => jsonFetch("/api/inference/health"),
    status: () => jsonFetch("/api/inference/status"),

    models: () => jsonFetch("/api/inference/models"),
    activeModel: () => jsonFetch("/api/inference/models/active"),

    switchModel: (modelId) =>
        fetch(`${BASE}/api/inference/models/${modelId}`, {
            method: "POST",
        }).then((r) => {
            if (!r.ok) throw new Error("Model switch failed");
            return r.json();
        }),

    predictCSV: (file) => {
        const fd = new FormData();
        fd.append("file", file);
        return formFetch("/api/inference/predict", fd);
    },

    predictPCAP: (file) => {
        const fd = new FormData();
        fd.append("file", file);
        return formFetch("/api/inference/predict/pcap", fd);
    },

    evaluate: (file) => {
        const fd = new FormData();
        fd.append("file", file);
        return formFetch("/api/inference/evaluate", fd);
    },
};

export const pcapAPI = {
    convert: async (file, outputName) => {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch(
            `${BASE}/api/pcap/convert?output_name=${encodeURIComponent(outputName)}`,
            { method: "POST", body: fd }
        );

        if (!res.ok) throw new Error("PCAP conversion failed");

        return res.blob();
    },
};

export const labAPI = {
    status: () => jsonFetch("/api/lab/status"),
    setAttackers: (count) => {
        const qs = new URLSearchParams({ count: String(count) });
        return fetch(`${BASE}/api/lab/attackers/set?${qs.toString()}`, {
            method: "POST",
        }).then(async (r) => {
            const body = await r.json();
            if (!r.ok) {
                throw new Error(body?.detail?.error || "Failed to set attacker count");
            }
            return body;
        });
    },
    streamStatus: (onMessage, onError, onOpen) => {
        const es = new EventSource(`${BASE}/api/lab/stream`);
        es.onopen = () => {
            if (onOpen) onOpen();
        };
        es.onmessage = (evt) => {
            try {
                onMessage(JSON.parse(evt.data));
            } catch {
                // Ignore malformed frames.
            }
        };
        es.onerror = (evt) => {
            if (onError) onError(evt);
        };
        return es;
    },

    startAttack: (type = "syn", intensity = "medium", { pps = null, interval_ms = null } = {}) => {
        const qs = new URLSearchParams({ type, intensity });
        if (pps != null) qs.set("pps", String(pps));
        if (interval_ms != null) qs.set("interval_ms", String(interval_ms));
        return fetch(`${BASE}/api/lab/attack/start?${qs.toString()}`, {
            method: "POST",
        }).then(async (r) => {
            const body = await r.json();
            if (!r.ok) {
                throw new Error(body?.detail?.error || "Failed to start attack");
            }
            return body;
        });
    },

    stopAttack: () =>
        fetch(`${BASE}/api/lab/attack/stop`, {
            method: "POST",
        }).then(async (r) => {
            const body = await r.json();
            if (!r.ok) {
                throw new Error(body?.detail?.error || "Failed to stop attack");
            }
            return body;
        }),

    startTraffic: (type = "mixed", intensity = "medium", { interval_ms = null } = {}) => {
        const qs = new URLSearchParams({ type, intensity });
        if (interval_ms != null) qs.set("interval_ms", String(interval_ms));
        return fetch(`${BASE}/api/lab/traffic/start?${qs.toString()}`, {
            method: "POST",
        }).then(async (r) => {
            const body = await r.json();
            if (!r.ok) {
                throw new Error(body?.detail?.error || "Failed to start normal traffic");
            }
            return body;
        });
    },

    stopTraffic: () =>
        fetch(`${BASE}/api/lab/traffic/stop`, {
            method: "POST",
        }).then(async (r) => {
            const body = await r.json();
            if (!r.ok) {
                throw new Error(body?.detail?.error || "Failed to stop normal traffic");
            }
            return body;
        }),
};
