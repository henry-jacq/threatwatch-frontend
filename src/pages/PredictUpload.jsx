import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

export default function PredictInference() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/inference/predict", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Inference failed");
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
                DDoS Traffic Prediction
            </h2>

            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-lg shadow-sm max-w-xl"
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="block w-full mb-4"
                />

                <button
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? "Running Inference..." : "Upload & Predict"}
                </button>
            </form>

            {error && (
                <p className="mt-4 text-red-600">
                    {error}
                </p>
            )}

            {result && (
                <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded text-sm max-w-xl">
                    <pre className="overflow-x-auto">
{JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </DashboardLayout>
    );
}
