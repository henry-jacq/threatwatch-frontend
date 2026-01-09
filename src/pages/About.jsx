import DashboardLayout from "../layouts/DashboardLayout";

export default function About() {
    return (
        <DashboardLayout>
            {/* HEADER */}
            <div className="mb-6">
                <h2 className="mb-3 text-xl font-semibold text-slate-900">
                    About ThreatWatch
                </h2>
                <p className="text-sm text-slate-600">
                    ThreatWatch is an end-to-end network traffic analysis and DDoS
                    detection platform built for research, evaluation and real-world
                    deployment.
                </p>
            </div>

            {/* OVERVIEW */}
            <Section title="What is ThreatWatch?">
                <p>
                    ThreatWatch is designed to bridge the gap between academic network
                    security research and production-ready inference systems. It combines
                    graph-based deep learning, scalable preprocessing pipelines and a
                    modern API-driven architecture to analyze large volumes of network
                    traffic with high accuracy and transparency.
                </p>

                <p>
                    The system supports CSV-based datasets, raw PCAP files and live
                    streaming inference, making it suitable for offline evaluation as well
                    as near-real-time monitoring scenarios.
                </p>
            </Section>

            {/* ARCHITECTURE */}
            <Section title="Core Architecture">
                <ul className="space-y-2 list-disc list-inside">
                    <li>
                        <strong>FTG-NET (Flow–Traffic Graph Network)</strong> — a hierarchical
                        GNN architecture that models both individual flows and their
                        interactions within time-based traffic windows.
                    </li>
                    <li>
                        <strong>Flow-level Graphs</strong> capture packet-level and statistical
                        behavior within each network flow.
                    </li>
                    <li>
                        <strong>Traffic-level Graphs</strong> model relationships between
                        concurrent flows to detect coordinated attack patterns.
                    </li>
                    <li>
                        <strong>Slot-based Temporal Aggregation</strong> enables scalable
                        processing of high-volume traffic streams.
                    </li>
                </ul>
            </Section>

            {/* PIPELINE */}
            <Section title="Inference Pipeline">
                <ol className="space-y-2 list-decimal list-inside">
                    <li>Input ingestion (CSV or PCAP)</li>
                    <li>Feature normalization using trained scalers</li>
                    <li>Time-slot segmentation and graph construction</li>
                    <li>Batch or streaming inference using FTG-NET</li>
                    <li>Slot-level aggregation and confidence estimation</li>
                </ol>

                <p className="mt-3">
                    For large datasets, ThreatWatch supports streaming inference with live
                    progress updates and cancellation, ensuring predictable behavior even
                    under heavy workloads.
                </p>
            </Section>

            {/* FEATURES */}
            <Section title="Key Features">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Feature title="PCAP → Prediction">
                        Direct inference on raw PCAP files without intermediate storage or
                        manual conversion.
                    </Feature>

                    <Feature title="Streaming Inference">
                        Server-sent events (SSE) provide real-time progress updates for long
                        running jobs.
                    </Feature>

                    <Feature title="Model Evaluation">
                        Built-in evaluation pipeline with accuracy, precision, recall, F1
                        score and confusion matrix.
                    </Feature>

                    <Feature title="Model Management">
                        Hot-switching between registered models with runtime introspection.
                    </Feature>
                </div>
            </Section>

            {/* DESIGN PHILOSOPHY */}
            <Section title="Design Philosophy">
                <p>
                    ThreatWatch is intentionally built with a strong separation between
                    preprocessing, model logic and inference orchestration. This allows:
                </p>

                <ul className="mt-2 space-y-2 list-disc list-inside">
                    <li>Clear reasoning about model behavior</li>
                    <li>Reproducible experimentation</li>
                    <li>Safe deployment of evolving models</li>
                    <li>Smooth transition from offline research to live systems</li>
                </ul>
            </Section>

            {/* FUTURE */}
            <Section title="Future Direction">
                <p>
                    The platform is designed to evolve toward live packet capture with
                    rolling inference, adaptive windowing and continuous threat scoring.
                    Planned extensions include:
                </p>

                <ul className="mt-2 space-y-2 list-disc list-inside">
                    <li>Live interface capture and rolling time windows</li>
                    <li>Model ensembles and confidence calibration</li>
                    <li>Historical inference tracking and comparison</li>
                    <li>Visualization of traffic-level attack graphs</li>
                </ul>
            </Section>

            {/* FOOTER */}
            <div className="mt-8 text-sm text-slate-500">
                Built as a research-driven, production-ready system for modern network
                security analysis.
            </div>
        </DashboardLayout>
    );
}

/* -------------------------------------------------- */
/* Components                                         */
/* -------------------------------------------------- */

function Section({ title, children }) {
    return (
        <div className="p-6 mb-6 bg-white border shadow-sm border-slate-200 rounded-xl">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
                {title}
            </h3>
            <div className="space-y-3 text-sm text-slate-700">
                {children}
            </div>
        </div>
    );
}

function Feature({ title, children }) {
    return (
        <div className="p-4 border rounded-lg border-slate-200 bg-slate-50">
            <p className="mb-1 text-sm font-medium text-slate-900">
                {title}
            </p>
            <p className="text-sm text-slate-600">
                {children}
            </p>
        </div>
    );
}
