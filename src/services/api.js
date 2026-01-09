const BASE = import.meta.env.VITE_API_BASE.replace(/\/$/, "");

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
