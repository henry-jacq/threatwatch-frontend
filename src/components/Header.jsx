import { useState } from "react";
import { useModel } from "../context/ModelContext";

export default function Header() {
    const { models, activeModel, switchModel, isLocked } = useModel();
    const [open, setOpen] = useState(false);

    const entries = Object.entries(models);
    const active = models?.[activeModel];

    return (
        <header className="
            fixed top-0 left-0 right-0 z-50
            bg-[#0F172A]/90 backdrop-blur
            border-b border-white/10
        ">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Title */}
                <div>
                    <h1 className="text-sm font-semibold tracking-tight text-slate-100">
                        ThreatWatch
                    </h1>
                    {active && (
                        <p className="text-xs text-slate-400">
                            AI-Powered DDoS Detection · {active.name}
                        </p>
                    )}
                </div>

                {/* Model Selector */}
                <div className="relative">
                    <button
                        onClick={() => !isLocked && setOpen(!open)}
                        disabled={isLocked}
                        className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg
                            bg-white text-slate-800
                            shadow-sm border border-slate-200
                            text-sm font-medium
                            transition-all duration-200 hover:cursor-pointer
                            ${isLocked
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:shadow-md hover:bg-slate-50"}
                        `}
                    >
                        {/* Status Dot */}
                        <span
                            className={`w-2 h-2 rounded-full ${active?.active
                                    ? "bg-emerald-500"
                                    : "bg-amber-400"
                                }`}
                        />

                        <span>
                            {active?.name || "Loading…"}
                        </span>

                        <svg
                            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""
                                }`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown */}
                    {open && (
                        <div className="
                            absolute right-0 mt-3 w-[320px]
                            rounded-xl bg-white
                            shadow-xl border border-slate-200
                            overflow-hidden animate-fade-in
                        ">
                            {entries.map(([id, m]) => (
                                <button
                                    key={id}
                                    onClick={() => {
                                        switchModel(id);
                                        setOpen(false);
                                    }}
                                    className={`
                                        w-full px-4 py-3 text-left transition hover:cursor-pointer
                                        ${m.active
                                            ? "bg-slate-50"
                                            : "hover:bg-slate-100"}
                                    `}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {m.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {m.description}
                                            </p>
                                        </div>

                                        <span
                                            className={`
                                                text-xs px-2 py-0.5 rounded-full
                                                ${m.active
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-slate-100 text-slate-600"
                                                }
                                            `}
                                        >
                                            {m.active ? "Active" : "Available"}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
