import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { labAPI } from "../services/api";

// Hide the last inference card after this many seconds without updates.
const INFERENCE_HIDE_AFTER_S = 60;

export default function LiveLab() {
    const [status, setStatus] = useState(null);
    const [attackType, setAttackType] = useState("syn");
    const [trafficType, setTrafficType] = useState("mixed");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [nowMs, setNowMs] = useState(Date.now());
    const [streamConnected, setStreamConnected] = useState(false);
    const [lastStatusOkAtMs, setLastStatusOkAtMs] = useState(null);

    useEffect(() => {
        loadStatus();
        const interval = setInterval(loadStatus, 4000);
        const tick = setInterval(() => setNowMs(Date.now()), 1000);

        let stream = null;
        let reconnectTimer = null;
        let backoffMs = 1000;

        const connect = () => {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }

            stream = labAPI.streamStatus(
                (update) => {
                    setStatus(update);
                    setError(null);
                },
                () => {
                    setStreamConnected(false);
                    try {
                        stream?.close();
                    } catch {
                        // ignore
                    }
                    reconnectTimer = setTimeout(connect, backoffMs);
                    backoffMs = Math.min(backoffMs * 2, 15000);
                },
                () => {
                    setStreamConnected(true);
                    backoffMs = 1000;
                }
            );
        };

        connect();

        return () => {
            clearInterval(interval);
            clearInterval(tick);
            try {
                stream?.close();
            } catch {
                // ignore
            }
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, []);

    async function loadStatus() {
        try {
            const s = await labAPI.status();
            setStatus(s);
            setError(null);
            setLastStatusOkAtMs(Date.now());
        } catch (e) {
            setError("Failed to fetch lab status");
        }
    }

    async function startAttack() {
        try {
            setLoading(true);
            setError(null);
            await labAPI.startAttack(attackType);
            await loadStatus();
        } catch (e) {
            setError(e.message || "Unable to start attack");
        } finally {
            setLoading(false);
        }
    }

    async function stopAttack() {
        try {
            setLoading(true);
            setError(null);
            await labAPI.stopAttack();
            await loadStatus();
        } catch (e) {
            setError(e.message || "Unable to stop attack");
        } finally {
            setLoading(false);
        }
    }

    async function startTraffic() {
        try {
            setLoading(true);
            setError(null);
            await labAPI.startTraffic(trafficType);
            await loadStatus();
        } catch (e) {
            setError(e.message || "Unable to start normal traffic");
        } finally {
            setLoading(false);
        }
    }

    async function stopTraffic() {
        try {
            setLoading(true);
            setError(null);
            await labAPI.stopTraffic();
            await loadStatus();
        } catch (e) {
            setError(e.message || "Unable to stop normal traffic");
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h2 className="mb-2 text-xl font-semibold text-slate-900">
                    Controlled Lab Simulation
                </h2>
                <p className="text-sm text-slate-500">
                    Generate normal traffic and attacks inside an isolated Docker lab and observe real-time inference
                </p>
            </div>

            {error && (
                <div className="p-4 mb-6 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                    {error}
                </div>
            )}

            {/* STATUS GRID */}
            <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
                <Stat title="Redis" value={status?.redis ? "Connected" : "Down"} />
                <Stat
                    title="Agent"
                    value={
                        status?.agent
                            ? status?.agent_capturing
                                ? "Capturing"
                                : status?.agent_last_capture_age_s != null
                                    ? `Online (Stale: ${Math.round(status.agent_last_capture_age_s)}s)`
                                    : "Online (No Data)"
                            : "Offline"
                    }
                />
                <Stat title="Victim" value={status?.victim ? "Online" : "Offline"} />
                <Stat
                    title="Traffic Stream"
                    value={status?.traffic_stream ? "Active" : "Idle"}
                />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6 text-xs text-slate-600">
                <span
                    className={`px-2 py-1 border rounded-full ${
                        streamConnected
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                >
                    SSE: {streamConnected ? "connected" : "reconnecting"}
                </span>
                <span className="px-2 py-1 border rounded-full bg-slate-50 text-slate-700 border-slate-200">
                    Status poll:{" "}
                    {lastStatusOkAtMs
                        ? `${Math.max(0, Math.round((nowMs - lastStatusOkAtMs) / 1000))}s ago`
                        : "never"}
                </span>
                {status?.consumer?.connected === false && (
                    <span className="px-2 py-1 border rounded-full bg-amber-50 text-amber-800 border-amber-200">
                        Inference consumer disconnected
                    </span>
                )}
            </div>

            {/* LAB CONTROL */}
            <div className="p-6 bg-white border shadow-sm border-slate-200 rounded-xl">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">
                    Controlled Lab Simulation
                </h3>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="p-4 border rounded-lg border-slate-200">
                        <p className="text-xs font-semibold text-slate-600">
                            Normal Traffic Generator
                        </p>

                        <div className="flex gap-3 mt-3">
                            <button
                                onClick={startTraffic}
                                disabled={status?.traffic_running || loading}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                            >
                                Start Traffic
                            </button>

                            <button
                                onClick={stopTraffic}
                                disabled={!status?.traffic_running || loading}
                                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                            >
                                Stop Traffic
                            </button>
                        </div>

                        <div className="mt-3">
                            <label className="text-xs font-medium text-slate-500">Traffic Type</label>
                            <select
                                value={trafficType}
                                onChange={(e) => setTrafficType(e.target.value)}
                                disabled={status?.traffic_running || loading}
                                className="block px-3 py-2 mt-1 text-sm bg-white border rounded-lg border-slate-300"
                            >
                                <option value="mixed">Mixed (HTTP + Ping)</option>
                                <option value="http">HTTP Only</option>
                                <option value="ping">Ping Only</option>
                            </select>
                        </div>

                        {status?.traffic_running && (
                            <p className="mt-3 text-sm text-slate-700">
                                Traffic running ({status?.traffic_type})
                            </p>
                        )}
                    </div>

                    <div className="p-4 border rounded-lg border-slate-200">
                        <p className="text-xs font-semibold text-slate-600">
                            Malicious Traffic Generator
                        </p>

                        <div className="flex gap-3 mt-3">
                    <button
                        onClick={startAttack}
                        disabled={status?.attack_running || loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        Start Attack
                    </button>

                    <button
                        onClick={stopAttack}
                        disabled={!status?.attack_running || loading}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                    >
                        Stop Attack
                    </button>
                </div>

                <div className="mt-3">
                    <label className="text-xs font-medium text-slate-500">Attack Type</label>
                    <select
                        value={attackType}
                        onChange={(e) => setAttackType(e.target.value)}
                        disabled={status?.attack_running || loading}
                        className="block px-3 py-2 mt-1 text-sm bg-white border rounded-lg border-slate-300"
                    >
                        <option value="syn">SYN Flood</option>
                        <option value="udp">UDP Flood</option>
                        <option value="http">HTTP Flood</option>
                        <option value="random">Random (Mixed)</option>
                    </select>
                </div>

                {status?.attack_running && (
                    <p className="mt-4 text-sm text-red-600">
                        Attack running ({status?.attack_type?.toUpperCase()}) — agent capturing live packets
                    </p>
                )}
                {!status?.attack_running && status?.agent && !status?.agent_capturing && (
                    <p className="mt-4 text-sm text-amber-600">
                        Agent is online but no recent captured packets detected.
                    </p>
                )}
                    </div>
                </div>
            </div>

            {/* LIVE FEED */}
            <div className="p-6 mt-8 bg-white border shadow-sm border-slate-200 rounded-xl">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">
                    Live Inference Feed
                </h3>

                {(() => {
                    const ts =
                        typeof status?.latest_results?.timestamp === "number"
                            ? status.latest_results.timestamp
                            : null;
                    const ageS = ts ? Math.max(0, Math.round(nowMs / 1000 - ts)) : null;
                    const expired = ageS != null && ageS > INFERENCE_HIDE_AFTER_S;

                    if (status?.latest_results && !expired) {
                        return <LiveInferenceCard result={status.latest_results} nowMs={nowMs} />;
                    }

                    return (
                        <div className="p-4 text-sm border rounded-lg text-slate-600 border-slate-200 bg-slate-50">
                            Waiting for inference...
                            <span className="block mt-1 text-xs text-slate-500">
                                {expired
                                    ? `Last inference update was ${ageS}s ago (expired).`
                                    : status?.traffic_stream
                                        ? "Traffic is flowing, but inference hasn’t produced results yet."
                                        : "Start normal traffic or an attack to generate flows."}
                            </span>
                        </div>
                    );
                })()}

                <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-500">
                    <span>
                        Consumer:{" "}
                        <span className={status?.consumer?.connected ? "text-emerald-700" : "text-red-700"}>
                            {status?.consumer?.connected ? "connected" : "disconnected"}
                        </span>
                    </span>
                    {status?.consumer?.last_error && (
                        <span className="px-2 py-1 text-red-700 border border-red-200 rounded bg-red-50">
                            {String(status.consumer.last_error)}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-6 mt-8 bg-white border shadow-sm border-slate-200 rounded-xl">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">
                    Debug (Redis + Capture)
                </h3>
                <p className="mb-4 text-xs text-slate-500">
                    Redis has data: {status?.redis_debug?.has_data ? "yes" : "no"} | stream size: {status?.redis_debug?.stream_length ?? 0}
                </p>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                        <p className="mb-2 text-xs font-semibold text-slate-700">
                            Redis + Consumer Snapshot
                        </p>
                        <div className="h-56 p-4 overflow-y-auto font-mono text-xs rounded-lg text-cyan-300 bg-slate-900">
                            {status?.redis_debug
                                ? JSON.stringify(status.redis_debug, null, 2)
                                : "No Redis debug data"}
                        </div>
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-semibold text-slate-700">
                            Latest Flow Sample (from last payload)
                        </p>
                        <div className="h-56 p-4 overflow-y-auto font-mono text-xs rounded-lg text-fuchsia-300 bg-slate-900">
                            {status?.redis_debug?.latest_flow_sample
                                ? JSON.stringify(status.redis_debug.latest_flow_sample, null, 2)
                                : "No captured flow sample yet"}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function Stat({ title, value }) {
    return (
        <div className="px-5 py-4 bg-white border shadow-sm border-slate-200 rounded-xl">
            <p className="text-xs font-medium uppercase text-slate-500">
                {title}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
                {value}
            </p>
        </div>
    );
}

function LiveInferenceCard({ result, nowMs }) {
    const ts = typeof result.timestamp === "number" ? result.timestamp : null;
    const dt = ts ? new Date(ts * 1000) : null;
    const ageS = ts ? Math.max(0, Math.round(nowMs / 1000 - ts)) : null;
    const stale = ageS != null ? ageS > 20 : false;

    const avg = typeof result.avg_probability === "number" ? result.avg_probability : null;
    const thr = typeof result.dynamic_threshold === "number" ? result.dynamic_threshold : null;

    const risk = (result.risk_level || "unknown").toLowerCase();
    const riskLabel = risk === "high" ? "High Risk" : risk === "medium" ? "Medium Risk" : risk === "low" ? "Low Risk" : "Unknown";
    const riskClass =
        risk === "high"
            ? "bg-red-50 text-red-700 border-red-200"
            : risk === "medium"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : risk === "low"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-50 text-slate-700 border-slate-200";

    const drift = Boolean(result.drift_detected);
    const attackSlots = typeof result.attack_slots === "number" ? result.attack_slots : null;
    const slotCount = typeof result.slot_count === "number" ? result.slot_count : null;
    const latencyMs = typeof result.batch_inference_time_ms === "number" ? result.batch_inference_time_ms : null;

    const pct = (v) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "—");
    const fmt = (v) => (typeof v === "number" ? v.toFixed(4) : "—");

    const barValue = avg != null ? Math.max(0, Math.min(1, avg)) : 0;
    const thrValue = thr != null ? Math.max(0, Math.min(1, thr)) : null;

    return (
        <div className={`bg-white border rounded-xl ${stale ? "border-amber-200" : "border-slate-200"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-slate-200">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold border rounded-full ${riskClass}`}>
                            {riskLabel}
                        </span>
                        {stale && (
                            <span className="px-2 py-1 text-xs font-semibold border rounded-full bg-amber-50 text-amber-800 border-amber-200">
                                Stale
                            </span>
                        )}
                        {drift && (
                            <span className="px-2 py-1 text-xs font-semibold text-purple-800 border border-purple-200 rounded-full bg-purple-50">
                                Drift Detected
                            </span>
                        )}
                        {result.is_attack_dynamic && (
                            <span className="px-2 py-1 text-xs font-semibold text-red-700 border border-red-200 rounded-full bg-red-50">
                                Above Dynamic Threshold
                            </span>
                        )}
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                        Avg Probability: <span className="tabular-nums">{pct(avg)}</span>{" "}
                        <span className="text-xs font-normal text-slate-500">(thr {pct(thr)})</span>
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        {dt ? dt.toLocaleString() : "Unknown time"}
                        {ageS != null ? ` (${ageS}s ago)` : ""}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <MetricPill label="Slots" value={slotCount != null ? String(slotCount) : "—"} />
                    <MetricPill label="Attack Slots" value={attackSlots != null ? String(attackSlots) : "—"} />
                    <MetricPill label="Latency" value={latencyMs != null ? `${Math.round(latencyMs)} ms` : "—"} />
                    <MetricPill label="Risk Score" value={typeof result.risk_score === "number" ? result.risk_score.toFixed(3) : "—"} />
                </div>
            </div>

            <div className="p-4">
                <ProbabilityBar value={barValue} threshold={thrValue} />
                <div className="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-2">
                    <div className="p-3 border rounded-lg border-slate-200 bg-slate-50">
                        <p className="text-xs font-medium text-slate-600">Probability (raw)</p>
                        <p className="mt-1 font-mono text-sm tabular-nums text-slate-900">{fmt(avg)}</p>
                    </div>
                    <div className="p-3 border rounded-lg border-slate-200 bg-slate-50">
                        <p className="text-xs font-medium text-slate-600">Dynamic Threshold (raw)</p>
                        <p className="mt-1 font-mono text-sm tabular-nums text-slate-900">{fmt(thr)}</p>
                    </div>
                </div>

                <details className="mt-4">
                    <summary className="text-sm cursor-pointer text-slate-700">
                        Raw JSON
                    </summary>
                    <pre className="p-3 mt-2 overflow-x-auto font-mono text-xs border rounded-lg text-slate-200 bg-slate-900 border-slate-800">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
}

function MetricPill({ label, value }) {
    return (
        <div className="px-3 py-2 border rounded-lg border-slate-200 bg-slate-50">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                {value}
            </p>
        </div>
    );
}

function ProbabilityBar({ value, threshold }) {
    const thresholdPct = typeof threshold === "number" ? `${Math.round(threshold * 100)}%` : null;
    const valPct = `${Math.round(value * 100)}%`;

    return (
        <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
                <span>0%</span>
                <span className="font-mono tabular-nums text-slate-600">{valPct}</span>
                <span>100%</span>
            </div>
            <div className="relative h-3 mt-2 overflow-hidden border rounded-full border-slate-200 bg-slate-100">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600"
                    style={{ width: `${Math.round(value * 100)}%` }}
                />
                {thresholdPct && (
                    <div
                        className="absolute top-0 bottom-0 w-[2px] bg-slate-900/80"
                        style={{ left: thresholdPct }}
                        title={`threshold ${thresholdPct}`}
                    />
                )}
            </div>
            {thresholdPct && (
                <p className="mt-2 text-xs text-slate-500">
                    Threshold marker at <span className="font-mono tabular-nums">{thresholdPct}</span>
                </p>
            )}
        </div>
    );
}
