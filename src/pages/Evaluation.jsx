import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { inferenceAPI } from "../services/api";

export default function Evaluation() {
    const [data, setData] = useState("{\n  \n}");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function runEvaluation() {
        setLoading(true);
        setError(null);

        try {
            const { model } = useModel();

            const payload = {
                model,
                ...JSON.parse(data),
            };
            const res = await inferenceAPI.evaluate(payload);

            setResult(res);
        } catch (err) {
            setError("Invalid JSON or evaluation failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout>
            <h2 className="text-xl font-semibold mb-4">Model Evaluation</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <label className="block mb-2 font-medium">Labeled Dataset</label>
                    <textarea
                        rows={16}
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="w-full p-3 font-mono text-sm border rounded"
                    />

                    <button
                        onClick={runEvaluation}
                        disabled={loading}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        {loading ? "Evaluating..." : "Run Evaluation"}
                    </button>
                </div>

                <div>
                    <label className="block mb-2 font-medium">Evaluation Result</label>
                    <pre className="h-[420px] bg-gray-900 text-blue-400 p-4 rounded overflow-auto text-sm">
                        {result ? JSON.stringify(result, null, 2) : "—"}
                    </pre>
                </div>
            </div>

            {error && <p className="mt-4 text-red-600">{error}</p>}
        </DashboardLayout>
    );
}
