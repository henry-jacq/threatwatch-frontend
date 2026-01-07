import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { inferenceAPI } from "../services/api";
import { useModel } from "../context/ModelContext";

export default function InferencePlayground() {
    const [input, setInput] = useState("{\n  \n}");
    const [output, setOutput] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function runInference() {
        setLoading(true);
        setError(null);

        try {
            const { model } = useModel();

            const payload = {
                model,
                ...JSON.parse(input),
            };
            const res = await inferenceAPI.predict(payload);

            setOutput(res);
        } catch (err) {
            setError("Invalid JSON or inference failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout>
            <h2 className="text-xl font-semibold mb-4">Inference Playground</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <label className="block mb-2 font-medium">Input JSON</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={16}
                        className="w-full p-3 font-mono text-sm border rounded"
                    />
                    <button
                        onClick={runInference}
                        disabled={loading}
                        className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        {loading ? "Running..." : "Run Prediction"}
                    </button>
                </div>

                <div>
                    <label className="block mb-2 font-medium">Output</label>
                    <pre className="h-[420px] bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
                        {output ? JSON.stringify(output, null, 2) : "—"}
                    </pre>
                </div>
            </div>

            {error && <p className="mt-4 text-red-600">{error}</p>}
        </DashboardLayout>
    );
}
