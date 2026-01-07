const RAW_BASE = import.meta.env.VITE_API_BASE || "";
const BASE_URL = RAW_BASE.replace(/\/+$/, "");

async function apiFetch(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
        },
        ...options,
    });

    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }

    return res.json();
}

export const inferenceAPI = {
    health: () => apiFetch("/api/inference/health"),
    stats: () => apiFetch("/api/inference/stats"),
    predict: (payload) =>
        apiFetch("/api/inference/predict", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    evaluate: (payload) =>
        apiFetch("/api/inference/evaluate", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
};

export const pcapAPI = {
    stats: (csvFile) =>
        apiFetch(`/api/pcap/stats?csv_file=${encodeURIComponent(csvFile)}`),

    convert: (formData) =>
        fetch(`${BASE_URL}/api/pcap/convert`, {
            method: "POST",
            body: formData,
        }).then((r) => {
            if (!r.ok) throw new Error("PCAP convert failed");
            return r.json();
        }),
};

