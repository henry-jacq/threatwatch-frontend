import { NavLink } from "react-router-dom";

const items = [
    { label: "Dashboard", path: "/" },
    { label: "Live Inference", path: "/inference" },
    { label: "PCAP Analysis", path: "/pcap" },
    { label: "Model Evaluation", path: "/evaluation" },
];

export default function Sidebar() {
    return (
        <aside
            className="
                fixed inset-y-0 left-0 w-64
                bg-white
                border-r border-slate-200
                pt-[85px]
                hidden lg:block
            "
        >
            <nav className="flex flex-col h-full">
                {/* Navigation */}
                <ul className="flex-1 px-3 space-y-1">
                    {items.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                end
                                className={({ isActive }) =>
                                    `
                                    block px-4 py-2.5 rounded-lg
                                    text-sm font-medium
                                    transition-all duration-150
                                    ${isActive
                                        ? "bg-slate-100 text-slate-900"
                                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    }
                                    `
                                }
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* Footer / User */}
                <div className="px-4 py-4 border-t border-slate-200">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold tracking-wide uppercase text-slate-700">
                            ThreatWatch
                        </p>

                        <p className="text-xs leading-snug text-slate-600">
                            Real-time AI system for detecting and analyzing
                            Distributed Denial-of-Service (DDoS) attacks from
                            live traffic and PCAP data.
                        </p>

                        <p className="text-[11px] text-slate-400 pt-1">
                            FTG-NET • Streaming Inference • Graph NN
                        </p>
                    </div>
                </div>
            </nav>
        </aside>
    );
}
