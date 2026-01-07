import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

export default function PcapConvert() {
    const [file, setFile] = useState(null);
    const [outputName, setOutputName] = useState("converted");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    function handleFileChange(e) {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        // 🔘 Auto-fill output name from filename (remove extension)
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setOutputName(baseName);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(
                `http://localhost:8000/api/pcap/convert?output_name=${encodeURIComponent(outputName)}`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "PCAP conversion failed");
            }

            setResult(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout>
            <h2 className="text-xl font-semibold mb-4">
                PCAP Conversion
            </h2>

            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-lg shadow-sm max-w-xl"
            >
                {/* Output name */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Output CSV Name
                </label>
                <input
                    type="text"
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    className="block w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* PCAP file */}
                <input
                    type="file"
                    accept=".pcap,.pcapng"
                    onChange={handleFileChange}
                    className="block w-full mb-4"
                />

                <button
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Convert PCAP"}
                </button>
            </form>

            {error && (
                <p className="mt-4 text-red-600">
                    {error}
                </p>
            )}

            {result && (
                <div className="mt-6 max-w-xl">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>

                    {/* 📥 Download button */}
                    <a
                        href={`http://localhost:8000/${result.output_file}`}
                        download
                        className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                        📥 Download CSV
                    </a>
                </div>
            )}
        </DashboardLayout>
    );
}
