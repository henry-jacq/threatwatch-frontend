import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

export default function Evaluation() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function runEvaluation(e) {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(
                "http://localhost:8081/api/inference/evaluate",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Evaluation failed");
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
                Model Evaluation
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <form onSubmit={runEvaluation}>
                    <label className="block mb-2 font-medium">
                        Labeled Dataset (CSV with Label column)
                    </label>

                    <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="block w-full mb-4"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Evaluating..." : "Run Evaluation"}
                    </button>
                </form>

                {/* Result Section */}
                <div>
                    <label className="block mb-2 font-medium">
                        Evaluation Result
                    </label>

                    <pre className="h-[420px] bg-gray-900 text-blue-400 p-4 rounded overflow-auto text-sm">
                        {result ? JSON.stringify(result, null, 2) : "—"}
                    </pre>
                </div>
            </div>

            {error && (
                <p className="mt-4 text-red-600">
                    {error}
                </p>
            )}
        </DashboardLayout>
    );
}
