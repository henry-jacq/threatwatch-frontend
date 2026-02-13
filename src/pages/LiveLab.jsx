import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { labAPI } from "../services/api";

// Hide the last inference card after this many seconds without updates.
const INFERENCE_HIDE_AFTER_S = 60;
const SLOW_BACKEND_TOAST_MS = 2000;

export default function LiveLab() {
    const [status, setStatus] = useState(null);
    const [attackType, setAttackType] = useState("udp");
    const [attackIntensity, setAttackIntensity] = useState("medium");
    const [trafficType, setTrafficType] = useState("mixed");
    const [attackerCountInput, setAttackerCountInput] = useState("1");
    const [attackersDirty, setAttackersDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [nowMs, setNowMs] = useState(Date.now());
    const [streamConnected, setStreamConnected] = useState(false);
    const [lastStatusOkAtMs, setLastStatusOkAtMs] = useState(null);
    const [toasts, setToasts] = useState([]);

    function pushToast({ type = "info", title, message, ttlMs = 4500 }) {
        const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const toast = { id, type, title, message };
        setToasts((prev) => [...prev, toast]);
        if (ttlMs && ttlMs > 0) {
            window.setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, ttlMs);
        }
        return id;
    }

    function dismissToast(id) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }

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
            if (!attackersDirty) {
                setAttackerCountInput(String(s?.attacker_count ?? 1));
            }
        } catch (e) {
            setError("Failed to fetch lab status");
        }
    }

    async function applyAttackers() {
        const n = Number(attackerCountInput);
        if (!Number.isFinite(n) || n < 1) {
            setError("Attackers must be a positive number");
            return;
        }
        const desired = Math.min(10, Math.max(1, Math.floor(n)));
        const pendingId = pushToast({
            type: "info",
            title: "Scaling attackers",
            message: `Applying attacker count = ${desired}...`,
            ttlMs: 0,
        });
        const slowTimer = window.setTimeout(() => {
            pushToast({
                type: "warning",
                title: "Backend is busy",
                message: "Scaling attackers is taking longer than expected...",
                ttlMs: 4000,
            });
        }, SLOW_BACKEND_TOAST_MS);
        try {
            setLoading(true);
            setError(null);
            await labAPI.setAttackers(desired);
            setAttackersDirty(false);
            await loadStatus();
            pushToast({
                type: "success",
                title: "Attackers updated",
                message: `Attacker count set to ${desired}.`,
            });
        } catch (e) {
            setError(e.message || "Unable to set attacker count");
            pushToast({
                type: "error",
                title: "Scaling failed",
                message: String(e.message || "Unable to set attacker count"),
            });
        } finally {
            window.clearTimeout(slowTimer);
            dismissToast(pendingId);
            setLoading(false);
        }
    }

    async function startAttack() {
        const pendingId = pushToast({
            type: "info",
            title: "Starting attack",
            message: `Starting ${attackType.toUpperCase()} (${attackIntensity})...`,
            ttlMs: 0,
        });
        const slowTimer = window.setTimeout(() => {
            pushToast({
                type: "warning",
                title: "Backend is busy",
                message: "Starting the attack is taking longer than expected...",
                ttlMs: 4000,
            });
        }, SLOW_BACKEND_TOAST_MS);
        try {
            setLoading(true);
            setError(null);
            await labAPI.startAttack(attackType, attackIntensity);
            await loadStatus();
            pushToast({
                type: "success",
                title: "Attack started",
                message: `${attackType.toUpperCase()} started (${attackIntensity}).`,
            });
        } catch (e) {
            setError(e.message || "Unable to start attack");
            pushToast({
                type: "error",
                title: "Start attack failed",
                message: String(e.message || "Unable to start attack"),
            });
        } finally {
            window.clearTimeout(slowTimer);
            dismissToast(pendingId);
            setLoading(false);
        }
    }

    async function stopAttack() {
        const pendingId = pushToast({
            type: "info",
            title: "Stopping attack",
            message: "Sending stop request...",
            ttlMs: 0,
        });
        const slowTimer = window.setTimeout(() => {
            pushToast({
                type: "warning",
                title: "Backend is busy",
                message: "Stopping the attack is taking longer than expected...",
                ttlMs: 4000,
            });
        }, SLOW_BACKEND_TOAST_MS);
        try {
            setLoading(true);
            setError(null);
            await labAPI.stopAttack();
            await loadStatus();
            pushToast({
                type: "success",
                title: "Attack stopped",
                message: "Attack stopped.",
            });
        } catch (e) {
            setError(e.message || "Unable to stop attack");
            pushToast({
                type: "error",
                title: "Stop attack failed",
                message: String(e.message || "Unable to stop attack"),
            });
        } finally {
            window.clearTimeout(slowTimer);
            dismissToast(pendingId);
            setLoading(false);
        }
    }

    async function startTraffic() {
        const pendingId = pushToast({
            type: "info",
            title: "Starting traffic",
            message: `Starting ${trafficType.toUpperCase()}...`,
            ttlMs: 0,
        });
        const slowTimer = window.setTimeout(() => {
            pushToast({
                type: "warning",
                title: "Backend is busy",
                message: "Starting normal traffic is taking longer than expected...",
                ttlMs: 4000,
            });
        }, SLOW_BACKEND_TOAST_MS);
        try {
            setLoading(true);
            setError(null);
            await labAPI.startTraffic(trafficType);
            await loadStatus();
            pushToast({
                type: "success",
                title: "Traffic started",
                message: `${trafficType.toUpperCase()} started.`,
            });
        } catch (e) {
            setError(e.message || "Unable to start normal traffic");
            pushToast({
                type: "error",
                title: "Start traffic failed",
                message: String(e.message || "Unable to start normal traffic"),
            });
        } finally {
            window.clearTimeout(slowTimer);
            dismissToast(pendingId);
            setLoading(false);
        }
    }

    async function stopTraffic() {
        const pendingId = pushToast({
            type: "info",
            title: "Stopping traffic",
            message: "Sending stop request...",
            ttlMs: 0,
        });
        const slowTimer = window.setTimeout(() => {
            pushToast({
                type: "warning",
                title: "Backend is busy",
                message: "Stopping normal traffic is taking longer than expected...",
                ttlMs: 4000,
            });
        }, SLOW_BACKEND_TOAST_MS);
        try {
            setLoading(true);
            setError(null);
            await labAPI.stopTraffic();
            await loadStatus();
            pushToast({
                type: "success",
                title: "Traffic stopped",
                message: "Normal traffic stopped.",
            });
        } catch (e) {
            setError(e.message || "Unable to stop normal traffic");
            pushToast({
                type: "error",
                title: "Stop traffic failed",
                message: String(e.message || "Unable to stop normal traffic"),
            });
        } finally {
            window.clearTimeout(slowTimer);
            dismissToast(pendingId);
            setLoading(false);
        }
    }

    return (
        <DashboardLayout>
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
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
                    title="Victim + Agent"
                    value={
                        status?.victim
                            ? status?.agent
                                ? status?.agent_capturing
                                    ? "Online (Capturing)"
                                    : status?.agent_last_capture_age_s != null
                                        ? `Online (No Recent Data: ${Math.round(status.agent_last_capture_age_s)}s)`
                                        : "Online (No Data)"
                                : "Degraded (Agent Offline)"
                            : "Offline"
                    }
                />
                <Stat
                    title="Attackers"
                    value={
                        status?.attacker_count != null
                            ? `${status?.attacker_running_count ?? 0}/${status.attacker_count} online`
                            : status?.attacker
                                ? "Online"
                                : "Offline"
                    }
                />
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

                <div className="p-4 mb-6 border rounded-lg border-slate-200 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-600">
                        Lab Topology
                    </p>
                    <div className="flex flex-wrap items-end gap-3 mt-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500">Attackers</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                step={1}
                                value={attackerCountInput}
                                onChange={(e) => {
                                    setAttackerCountInput(e.target.value);
                                    setAttackersDirty(true);
                                }}
                                disabled={loading}
                                className="block w-28 px-3 py-2 mt-1 text-sm bg-white border rounded-lg border-slate-300 cursor-text disabled:cursor-not-allowed"
                            />
                        </div>
                        <button
                            onClick={applyAttackers}
                            disabled={loading || !attackersDirty}
                            className="px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Apply
                        </button>
                        <span className="text-xs text-slate-500">
                            More attackers simulates distributed sources (traffic and attacks run from all attackers).
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="p-4 border rounded-lg border-slate-200">
                        <p className="text-xs font-semibold text-slate-600">
                            Normal Traffic Generator
                        </p>

                        <div className="flex gap-3 mt-3">
                            <button
                                onClick={startTraffic}
                                disabled={status?.traffic_running || loading}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Start Traffic
                            </button>

                            <button
                                onClick={stopTraffic}
                                disabled={!status?.traffic_running || loading}
                                className="px-4 py-2 text-sm font-medium rounded-lg cursor-pointer text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="block px-3 py-2 mt-1 text-sm bg-white border rounded-lg border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <option value="cic_benign">CICDDoS2019-like Benign Mix</option>
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
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg cursor-pointer hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Start Attack
                    </button>

                    <button
                        onClick={stopAttack}
                        disabled={!status?.attack_running || loading}
                        className="px-4 py-2 text-sm font-medium rounded-lg cursor-pointer text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="block px-3 py-2 mt-1 text-sm bg-white border rounded-lg border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <option value="udp">UDP Flood</option>
                        <option value="dns">DNS Flood (UDP/53)</option>
                        <option value="ntp">NTP Flood (UDP/123)</option>
                        <option value="ssdp">SSDP Flood (UDP/1900)</option>
                        <option value="http">HTTP Flood</option>
                    </select>
                </div>

                <div className="mt-3">
                    <label className="text-xs font-medium text-slate-500">Attack Load</label>
                    <select
                        value={attackIntensity}
                        onChange={(e) => setAttackIntensity(e.target.value)}
                        disabled={status?.attack_running || loading}
                        className="block px-3 py-2 mt-1 text-sm bg-white border rounded-lg border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                {status?.attack_running && (
                    <p className="mt-4 text-sm text-red-600">
                        Attack running ({status?.attack_type?.toUpperCase()}, {status?.attack_intensity || "medium"}) — agent capturing live packets
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
                {status?.attacker_names?.length > 0 && (
                    <p className="mb-4 text-xs text-slate-500">
                        Attackers: {status.attacker_names.join(", ")}
                    </p>
                )}
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

            {/* ARCHITECTURE */}
            <div className="p-6 mt-8 bg-white border shadow-sm border-slate-200 rounded-xl">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">
                    Lab Architecture (How The Live Test Works)
                </h3>
                <p className="mb-6 text-xs text-slate-500">
                    End-to-end view of the isolated Docker lab, capture pipeline, Redis ingest, and real-time inference stream used to validate the GNN model.
                </p>
                <ArchitectureDiagram status={status} />
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

function ToastStack({ toasts, onDismiss }) {
    const styles = (type) => {
        if (type === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
        if (type === "error") return "border-red-200 bg-red-50 text-red-900";
        if (type === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
        return "border-slate-200 bg-white text-slate-900";
    };

    return (
        <div className="fixed z-50 flex flex-col gap-2 pointer-events-none top-4 right-4">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto w-[340px] max-w-[90vw] border rounded-xl shadow-sm ${styles(t.type)}`}
                >
                    <div className="flex items-start justify-between gap-3 p-3">
                        <div>
                            <p className="text-sm font-semibold">{t.title}</p>
                            {t.message && <p className="mt-1 text-xs opacity-80">{t.message}</p>}
                        </div>
                        <button
                            onClick={() => onDismiss(t.id)}
                            className="px-2 py-1 text-xs font-medium rounded cursor-pointer bg-black/5 hover:bg-black/10"
                            aria-label="Dismiss notification"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ))}
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
                                No Recent Updates
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

function ArchitectureDiagram({ status }) {
    const attackers = status?.attacker_count ?? 1;
    const attackersOnline = status?.attacker_running_count ?? (status?.attacker ? attackers : 0);
    const redisLen = status?.redis_debug?.stream_length ?? 0;
    const consumerConnected = Boolean(status?.consumer?.connected);
    const capturing = Boolean(status?.agent_capturing);
    const trafficActive = Boolean(status?.traffic_stream);
    const victimOnline = Boolean(status?.victim);
    const agentOnline = Boolean(status?.agent);
    const redisOnline = Boolean(status?.redis);
    const freshResults = Boolean(status?.streaming);
    const riskLevel = status?.latest_results?.risk_level ? String(status.latest_results.risk_level) : null;

    const dot = (ok) => (
        <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
                ok ? "bg-emerald-500" : "bg-slate-300"
            }`}
        />
    );

    return (
        <div>
            {/* Mobile: stacked flow */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
                <MiniNode
                    title={`Attackers (${attackersOnline}/${attackers})`}
                    meta="Generate traffic"
                    left={dot(attackersOnline === attackers && attackers > 0)}
                />
                <MiniArrow label="lab-net traffic" />
                <MiniNode
                    title="Victim + Agent"
                    meta={capturing ? "Capturing packets" : "No recent packets"}
                    left={dot(victimOnline && agentOnline)}
                />
                <MiniArrow label="flows (windowed)" />
                <MiniNode
                    title={`Redis Stream (backlog ${redisLen})`}
                    meta={trafficActive ? "Ingest active" : "Ingest idle"}
                    left={dot(redisOnline)}
                />
                <MiniArrow label="XREADGROUP + ACK/DEL" />
                <MiniNode
                    title="Backend Consumer"
                    meta={consumerConnected ? "Connected" : "Disconnected"}
                    left={dot(consumerConnected)}
                />
                <MiniArrow label="GNN inference" />
                <MiniNode
                    title="Inference + SSE + UI"
                    meta={freshResults ? `Fresh results${riskLevel ? ` (risk: ${riskLevel})` : ""}` : "Waiting for results"}
                    left={dot(freshResults)}
                />
            </div>

            {/* Desktop: connected architecture diagram */}
            <div className="hidden md:block">
                <div className="p-4 border rounded-xl border-slate-200 bg-slate-50">
                    <ArchitectureFlowSVG
                        attackers={attackers}
                        attackersOnline={attackersOnline}
                        victimOnline={victimOnline}
                        agentOnline={agentOnline}
                        capturing={capturing}
                        redisOnline={redisOnline}
                        redisLen={redisLen}
                        trafficActive={trafficActive}
                        consumerConnected={consumerConnected}
                        freshResults={freshResults}
                        riskLevel={riskLevel}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-2">{dot(true)} healthy</span>
                    <span className="inline-flex items-center gap-2">{dot(false)} inactive/degraded</span>
                    <span className="text-slate-400">Arrows show the live data path used to test the GNN model.</span>
                </div>
            </div>

            <details className="mt-6">
                <summary className="text-sm cursor-pointer text-slate-700">
                    What to expect when testing
                </summary>
                <div className="p-4 mt-3 text-sm border rounded-xl border-slate-200 bg-white text-slate-700">
                    <p className="text-xs text-slate-500">
                        Typical workflow:
                    </p>
                    <div className="grid grid-cols-1 gap-2 mt-2 sm:grid-cols-2">
                        <Step n="1" text="Scale attackers to simulate distributed sources." />
                        <Step n="2" text="Start CICDDoS2019-like benign traffic to establish baseline flows." />
                        <Step n="3" text="Start a CICDDoS2019-like DDoS mix and watch risk/probability change." />
                        <Step n="4" text="Use Debug to confirm ingest, latest flow sample, and consumer health." />
                    </div>
                </div>
            </details>
        </div>
    );
}

function MiniNode({ title, meta, left }) {
    return (
        <div className="flex items-start gap-3 p-4 bg-white border rounded-xl border-slate-200">
            <div className="mt-0.5">{left}</div>
            <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-xs text-slate-500">{meta}</p>
            </div>
        </div>
    );
}

function MiniArrow({ label }) {
    return (
        <div className="flex items-center gap-2 px-3">
            <div className="w-0.5 h-6 bg-slate-300 rounded" />
            <span className="text-[11px] font-semibold text-slate-500">{label}</span>
        </div>
    );
}

function Step({ n, text }) {
    return (
        <div className="flex items-start gap-3 p-3 border rounded-lg border-slate-200 bg-slate-50">
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-full tabular-nums">
                {n}
            </span>
            <p className="text-sm text-slate-700">{text}</p>
        </div>
    );
}

function ArchitectureFlowSVG({
    attackers,
    attackersOnline,
    victimOnline,
    agentOnline,
    capturing,
    redisOnline,
    redisLen,
    trafficActive,
    consumerConnected,
    freshResults,
    riskLevel,
}) {
    const ok = (v) => (v ? "#10b981" : "#cbd5e1"); // emerald-500 / slate-300
    const stroke = "#94a3b8"; // slate-400
    const boxFill = "#ffffff";
    const boxStroke = "#cbd5e1";
    const text = "#0f172a";
    const sub = "#475569";

    const Box = ({ x, y, w, h, title, subtitle, dotColor }) => (
        <g>
            <rect x={x} y={y} width={w} height={h} rx="14" fill={boxFill} stroke={boxStroke} strokeWidth="2" />
            <circle cx={x + 16} cy={y + 18} r="6" fill={dotColor} />
            <text x={x + 30} y={y + 22} fontSize="14" fontWeight="700" fill={text}>
                {title}
            </text>
            <text x={x + 16} y={y + 46} fontSize="12" fill={sub}>
                {subtitle}
            </text>
        </g>
    );

    const Arrow = ({ x1, y1, x2, y2, label }) => (
        <g>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth="2.5" markerEnd="url(#arrow)" />
            {label ? (
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} fontSize="11" fontWeight="700" fill={sub} textAnchor="middle">
                    {label}
                </text>
            ) : null}
        </g>
    );

    // Layout: left-to-right pipeline.
    const y = 40;
    const h = 84;
    const w1 = 210;
    const w2 = 220;
    const w3 = 210;
    const w4 = 220;

    const xA = 24;
    const xV = xA + w1 + 50;
    const xR = xV + w2 + 50;
    const xB = xR + w3 + 50;

    return (
        <svg viewBox="0 0 1000 200" className="w-full h-auto">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
                </marker>
            </defs>

            <Box
                x={xA}
                y={y}
                w={w1}
                h={h}
                title={`Attackers`}
                subtitle={`${attackersOnline}/${attackers} online`}
                dotColor={ok(attackersOnline === attackers && attackers > 0)}
            />
            <Arrow x1={xA + w1} y1={y + h / 2} x2={xV} y2={y + h / 2} label="lab-net traffic" />

            <Box
                x={xV}
                y={y}
                w={w2}
                h={h}
                title="Victim + Agent"
                subtitle={capturing ? "Capturing packets" : victimOnline && agentOnline ? "No recent packets" : "Offline/degraded"}
                dotColor={ok(victimOnline && agentOnline)}
            />
            <Arrow x1={xV + w2} y1={y + h / 2} x2={xR} y2={y + h / 2} label="flows (windows)" />

            <Box
                x={xR}
                y={y}
                w={w3}
                h={h}
                title="Redis Stream"
                subtitle={`${trafficActive ? "ingest active" : "ingest idle"} | backlog ${redisLen}`}
                dotColor={ok(redisOnline)}
            />
            <Arrow x1={xR + w3} y1={y + h / 2} x2={xB} y2={y + h / 2} label="consume + infer" />

            <Box
                x={xB}
                y={y}
                w={w4}
                h={h}
                title="Backend + GNN + SSE"
                subtitle={freshResults ? `fresh results${riskLevel ? ` (risk: ${riskLevel})` : ""}` : consumerConnected ? "connected, waiting" : "consumer disconnected"}
                dotColor={ok(freshResults)}
            />
        </svg>
    );
}
