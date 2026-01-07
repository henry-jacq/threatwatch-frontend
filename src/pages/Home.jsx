import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import { inferenceAPI } from "../services/api";

export default function Home() {
    const [health, setHealth] = useState(null);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [healthRes, statsRes] = await Promise.all([
                    inferenceAPI.health(),
                    inferenceAPI.stats(),
                ]);

                if (!cancelled) {
                    setHealth(healthRes);
                    setStats(statsRes);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Failed to load dashboard data");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <DashboardLayout>
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="System Health"
                    value={health?.status ?? (loading ? "Loading…" : "—")}
                    footer="Inference Engine"
                />

                <StatCard
                    title="Total Predictions"
                    value={stats?.total_predictions ?? (loading ? "Loading…" : "—")}
                    footer="From inference stats"
                />

                <StatCard
                    title="Detected Attacks"
                    value={stats?.attack_count ?? (loading ? "Loading…" : "—")}
                    footer="All classes"
                />

                <StatCard
                    title="PCAP Statistics"
                    value="—"
                    footer="Upload or select a PCAP file"
                />
            </div>

            {/* INFERENCE BREAKDOWN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">
                        Attack Distribution
                    </h3>

                    <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto">
                        {JSON.stringify(stats?.attack_distribution ?? {}, null, 2)}
                    </pre>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">
                        Inference Stats (Raw)
                    </h3>

                    <pre className="text-sm bg-gray-900 text-green-400 p-4 rounded overflow-auto">
                        {stats ? JSON.stringify(stats, null, 2) : "—"}
                    </pre>
                </div>
            </div>
        </DashboardLayout>
    );
}
