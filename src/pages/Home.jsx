import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import { inferenceAPI } from "../services/api";

export default function Home() {
    const [health, setHealth] = useState(null);
    const [status, setStatus] = useState(null);

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [h, s] = await Promise.all([
                    inferenceAPI.health(),
                    inferenceAPI.status(),
                ]);

                if (!cancelled) {
                    setHealth(h);
                    setStatus(s);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Failed to load inference status");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const ready = status?.ready === true;

    return (
        <DashboardLayout>
            {/* PAGE HEADER */}
            <div className="mb-6">
                <h2 className="mb-2 text-xl font-semibold text-slate-900">
                    Inference Dashboard
                </h2>
                <p className="text-sm text-slate-500">
                    Service health and active model status
                </p>
            </div>

            {error && (
                <div className="p-4 mb-6 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                    {error}
                </div>
            )}

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Service Alive"
                    value={
                        health?.alive
                            ? "Yes"
                            : loading
                                ? "Checking…"
                                : "No"
                    }
                    footer="Process liveness probe"
                />

                <StatCard
                    title="Inference Ready"
                    value={
                        ready
                            ? "Ready"
                            : loading
                                ? "Checking…"
                                : "Not Ready"
                    }
                    footer="Model loaded & usable"
                />

                <StatCard
                    title="Active Model"
                    value={
                        status?.model?.name ??
                        (loading ? "Loading…" : "—")
                    }
                    footer={`ID: ${status?.model?.model_id ?? "—"}`}
                />

                <StatCard
                    title="Execution Device"
                    value={
                        status?.device ??
                        (loading ? "Loading…" : "—")
                    }
                    footer={
                        status?.cuda_available
                            ? "CUDA Enabled"
                            : "CPU Only"
                    }
                />
            </div>

            {/* DETAILS */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* MODEL DETAILS */}
                <Panel title="Model Details">
                    <Item
                        label="Loaded"
                        value={status?.model?.loaded ? "Yes" : "No"}
                    />
                    <Item
                        label="Hidden Size"
                        value={status?.model?.hidden_size}
                    />
                    <Item
                        label="Feature Count"
                        value={status?.model?.feature_count}
                    />
                </Panel>

                {/* RUNTIME DETAILS */}
                <Panel title="Runtime">
                    <Item label="Device" value={status?.device} />
                    <Item
                        label="CUDA Available"
                        value={
                            status?.cuda_available ? "Yes" : "No"
                        }
                    />
                </Panel>
            </div>
        </DashboardLayout>
    );
}

/* ------------------------------------------------------------ */

function Panel({ title, children }) {
    return (
        <div className="bg-white border shadow-sm border-slate-200 rounded-xl">
            <div className="p-6">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">
                    {title}
                </h3>
                <dl className="space-y-3 text-sm">{children}</dl>
            </div>
        </div>
    );
}

function Item({ label, value }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-900">
                {value ?? "—"}
            </dd>
        </div>
    );
}
