import { useState, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const BASE = import.meta.env.VITE_API_BASE.replace(/\/$/, "");

const STAGE_LABELS = {
  job_started: "Job Started",
  preprocessing: "Preprocessing Data",
  progress: "Running Inference",
  done: "Completed",
  cancelled: "Cancelled",
};

/* Helpers */

function getFileMeta(file) {
  if (!file) return null;

  const ext = file.name.split(".").pop().toLowerCase();

  let type = "Unknown";
  let badge = "bg-slate-100 text-slate-600";

  if (ext === "csv") {
    type = "CSV";
    badge = "bg-blue-100 text-blue-700";
  } else if (ext === "pcap" || ext === "pcapng") {
    type = "PCAP";
    badge = "bg-emerald-100 text-emerald-700";
  }

  return {
    name: file.name,
    size: (file.size / 1024).toFixed(1) + " KB",
    type,
    badge,
  };
}

/* Page */

export default function PredictInference() {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [counts, setCounts] = useState(null);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState(null);

  const eventSourceRef = useRef(null);

  async function startInference() {
    if (!file || running) return;

    eventSourceRef.current?.close();

    setRunning(true);
    setStage("job_started");
    setProgress(0);
    setCounts(null);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${BASE}/api/inference/predict/stream`, {
      method: "POST",
      body: fd,
    });

    const { job_id } = await res.json();
    setJobId(job_id);

    const es = new EventSource(
      `${BASE}/api/inference/predict/stream/${job_id}`
    );
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.stage) setStage(data.stage);

      if (data.stage === "progress") {
        const pct = Math.round((data.current / data.total) * 100);
        setProgress(pct);
        setCounts({ current: data.current, total: data.total });
      }

      if (data.stage === "done") {
        setResult(data);
        setProgress(100);
        setRunning(false);
        es.close();
      }

      if (data.stage === "cancelled") {
        setRunning(false);
        es.close();
      }
    };
  }

  async function cancelInference() {
    if (!jobId) return;

    await fetch(`${BASE}/api/inference/cancel/${jobId}`, { method: "POST" });
    eventSourceRef.current?.close();
    setRunning(false);
    setStage("cancelled");
  }

  const fileMeta = getFileMeta(file);

  return (
    <DashboardLayout>
      {/* HEADER */}
      <h2 className="mb-3 text-xl font-semibold text-slate-900">
        Live Inference
        <span className="ml-2 text-sm font-normal text-slate-500">
          CSV / PCAP
        </span>
      </h2>

      <p className="mb-6 text-sm text-slate-600">
        Upload a CSV or PCAP file to run live inference using the deployed model.
      </p>

      {/* RESULTS */}
      {result && (
        // the card should be in single row grid with split cols

        <div className="grid grid-cols-4 gap-6 mb-6">
          <ResultCard label="Total Samples" value={result.total_samples} />
          <ResultCard label="Attacks Detected" value={result.attack_count} />
          <ResultCard label="Benign Traffic" value={result.benign_count} />
          <ResultCard
            label="Avg Confidence"
            value={result.average_confidence.toFixed(4)}
          />
        </div>
      )}

      {/* MAIN CARD */}
      <div className="bg-white border shadow-sm border-slate-200 rounded-xl">
        <div className="p-6 space-y-5">
          {/* FILE INPUT */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Input File
            </label>

            <label className="flex flex-col items-center justify-center w-full px-4 py-6 transition border-2 border-dashed rounded-lg cursor-pointer border-slate-300 bg-slate-50 hover:bg-slate-100">
              <input
                type="file"
                accept=".csv,.pcap,.pcapng"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />

              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  Click to upload
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  CSV or PCAP files supported
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
                  onClick={() => setFile(null)}
                  className="text-xs text-slate-500 hover:text-slate-700 hover:cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* LIVE STATUS */}
          {stage && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {STAGE_LABELS[stage] || stage}
                </span>
                <span className="text-sm text-slate-500">
                  {progress}%
                </span>
              </div>

              <div className="w-full h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full transition-all duration-300 bg-emerald-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {counts && (
                <p className="text-xs text-slate-500">
                  {counts.current.toLocaleString()} /{" "}
                  {counts.total.toLocaleString()} samples
                </p>
              )}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex gap-3">
            <button
              onClick={startInference}
              disabled={running || !file}
              className="px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-slate-900 disabled:opacity-50 hover:bg-slate-800 hover:disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {running ? "Running…" : "Start Inference"}
            </button>

            {running && (
              <button
                onClick={cancelInference}
                className="px-4 py-2 text-sm font-medium transition rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}

/* -------------------------------------------------- */
/* Small UI Components                                */
/* -------------------------------------------------- */

function ResultCard({ label, value }) {
  return (
    <div className="p-4 bg-white border shadow-sm border-slate-200 rounded-xl">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}
