import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { pcapAPI } from "../services/api";

export default function PcapConvert() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/pcap/convert", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("PCAP conversion failed");

            setResult(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout>
            <h2 className="text-xl font-semibold mb-4">PCAP Conversion</h2>

            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-lg shadow-sm max-w-xl"
            >
                <input
                    type="file"
                    accept=".pcap,.pcapng"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="block w-full mb-4"
                />

                <button
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Convert PCAP"}
                </button>
            </form>

            {error && <p className="mt-4 text-red-600">{error}</p>}

            {result && (
                <pre className="mt-6 bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </DashboardLayout>
    );
}
