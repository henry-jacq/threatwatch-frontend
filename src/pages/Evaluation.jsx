import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const BASE = import.meta.env.VITE_API_BASE.replace(/\/$/, "");

/* Helpers */

function getFileMeta(file) {
    if (!file) return null;

    return {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: "CSV",
        badge: "bg-sky-100 text-sky-700",
    };
}

/* Page */

export default function Evaluation() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function runEvaluation(e) {
        e.preventDefault();
        if (!file || loading) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const fd = new FormData();
            fd.append("file", file);

            const res = await fetch(`${BASE}/api/inference/evaluate`, {
                method: "POST",
                body: fd,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Evaluation failed");
            }

            setResult(await res.json());
        } catch (err) {
            setError(err.message || "Evaluation error");
        } finally {
            setLoading(false);
        }
    }

    const fileMeta = getFileMeta(file);

    return (
        <DashboardLayout>
            {/* HEADER */}
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
                Model Evaluation
                <span className="ml-2 text-sm font-normal text-slate-500">
                    Labeled Dataset
                </span>
            </h2>

            <p className="mb-6 text-sm text-slate-600">
                Upload a labeled CSV file to evaluate model performance and accuracy.
            </p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* LEFT: INPUT */}
                <div className="bg-white border shadow-sm border-slate-200 rounded-xl">
                    <form onSubmit={runEvaluation} className="p-6 space-y-5">
                        {/* FILE INPUT */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Labeled CSV File
                            </label>

                            <label className="flex flex-col items-center justify-center w-full px-4 py-6 transition border-2 border-dashed rounded-lg cursor-pointer border-slate-300 bg-slate-50 hover:bg-slate-100">
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />

                                <div className="text-center">
                                    <p className="text-sm font-medium text-slate-700">
                                        Click to upload CSV
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Must contain a <code>Label</code> column
                                    </p>
                                </div>
                            </label>

                            {/* FILE PREVIEW */}
                            {fileMeta && (
                                <div className="flex items-center justify-between p-3 text-sm bg-white border rounded-lg border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`px-2 py-0.5 text-xs font-medium rounded ${fileMeta.badge}`}
                                        >
                                            {fileMeta.type}
                                        </span>

                                        <div>
                                            <p className="font-medium text-slate-900 truncate max-w-[220px]">
                                                {fileMeta.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {fileMeta.size}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="text-xs text-slate-500 hover:text-slate-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ACTION */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={!file || loading}
                                className="px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-slate-900 disabled:opacity-50 hover:bg-slate-800 hover:disabled:cursor-not-allowed hover:cursor-pointer"
                            >
                                {loading ? "Evaluating…" : "Run Evaluation"}
                            </button>
                        </div>

                        {/* ERROR */}
                        {error && (
                            <div className="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                                {error}
                            </div>
                        )}
                    </form>
                </div>

                {/* RIGHT: RESULTS */}
                <div className="space-y-4">
                    {/* METRICS */}
                    <div className="grid grid-cols-2 gap-4">
                        <Metric label="Accuracy" value={result?.accuracy} />
                        <Metric label="Precision" value={result?.precision} />
                        <Metric label="Recall" value={result?.recall} />
                        <Metric label="F1 Score" value={result?.f1_score} />
                    </div>

                    {/* COUNTS */}
                    <div className="grid grid-cols-3 gap-4">
                        <Metric label="Samples" value={result?.total_samples} />
                        <Metric label="Attacks" value={result?.attack_count} />
                        <Metric label="Benign" value={result?.benign_count} />
                    </div>

                    {/* RAW JSON */}
                    <details className="bg-white border shadow-sm border-slate-200 rounded-xl">
                        <summary className="px-4 py-3 text-sm font-medium cursor-pointer text-slate-700">
                            Raw Evaluation Output
                        </summary>
                        <pre className="p-4 overflow-auto text-xs text-slate-200 bg-slate-900 rounded-b-xl">
                            {result ? JSON.stringify(result, null, 2) : "—"}
                        </pre>
                    </details>
                </div>
            </div>
        </DashboardLayout>
    );
}

/* Components */

function Metric({ label, value }) {
    return (
        <div className="p-4 bg-white border shadow-sm border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
                {value !== undefined && value !== null
                    ? typeof value === "number"
                        ? value.toFixed(4)
                        : value
                    : "—"}
            </p>
        </div>
    );
}
