import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { pcapAPI } from "../services/api";

/* Helpers */

function getFileMeta(file) {
    if (!file) return null;

    const ext = file.name.split(".").pop().toLowerCase();

    let type = "PCAP";
    let badge = "bg-emerald-100 text-emerald-700";

    return {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type,
        badge,
    };
}

/* Page */

export default function PcapConvert() {
    const [file, setFile] = useState(null);
    const [outputName, setOutputName] = useState("converted");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    function handleFileChange(e) {
        const f = e.target.files[0];
        if (!f) return;

        setFile(f);
        setOutputName(f.name.replace(/\.[^/.]+$/, ""));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!file || loading) return;

        setLoading(true);
        setError(null);

        try {
            const blob = await pcapAPI.convert(file, outputName);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${outputName}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message || "PCAP conversion failed");
        } finally {
            setLoading(false);
        }
    }

    const fileMeta = getFileMeta(file);

    return (
        <DashboardLayout>
            {/* HEADER */}
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
                PCAP Conversion
            </h2>

            <p className="mb-6 text-sm text-slate-600">
                Convert packet capture files into flow-based CSV format for analysis
                and inference.
            </p>

            {/* MAIN CARD */}
            <div className="bg-white border shadow-sm border-slate-200 rounded-xl">
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* OUTPUT NAME */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">
                            Output CSV Name
                        </label>
                        <input
                            value={outputName}
                            onChange={(e) => setOutputName(e.target.value)}
                            className="block w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            placeholder="converted"
                        />
                        <label className="text-xs text-slate-500">
                            Name of the output CSV file (without extension)
                        </label>
                    </div>

                    {/* FILE INPUT */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Input PCAP File
                        </label>

                        <label className="flex flex-col items-center justify-center w-full px-4 py-6 transition border-2 border-dashed rounded-lg cursor-pointer border-slate-300 bg-slate-50 hover:bg-slate-100">
                            <input
                                type="file"
                                accept=".pcap,.pcapng"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700">
                                    Click to upload PCAP
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    .pcap or .pcapng files supported
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
                                    className="text-xs text-slate-500 hover:text-slate-700 hover:cursor-pointer"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading || !file}
                            className="px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-slate-900 disabled:opacity-50 hover:bg-slate-800 hover:disabled:cursor-not-allowed hover:cursor-pointer"
                        >
                            {loading ? "Converting…" : "Convert & Download CSV"}
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
        </DashboardLayout>
    );
}
