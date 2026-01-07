import { useState } from "react";

export default function PredictInference() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please upload a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await fetch(
        "http://localhost:8081/api/inference/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Inference failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">
          Prediction
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-slate-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md font-semibold text-white transition
              ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading ? "Running Inference..." : "Upload & Predict"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <h2 className="text-lg font-semibold text-emerald-800 mb-3">
              📊 Inference Result
            </h2>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Total Samples" value={result.total_samples} />
              <Stat label="Attack Count" value={result.attack_count} />
              <Stat label="Benign Count" value={result.benign_count} />
              <Stat
                label="Avg Confidence"
                value={result.average_confidence.toFixed(3)}
              />
              <Stat
                label="Processing Time"
                value={`${result.processing_time_ms.toFixed(0)} ms`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-md p-3 shadow-sm border">
      <p className="text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}
