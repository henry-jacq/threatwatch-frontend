import { NavLink } from "react-router-dom";

const items = [
    { label: "Overview", path: "/" },
    { label: "Inference", path: "/inference" },
    { label: "PCAP Analysis", path: "/pcap" },
    { label: "Evaluation", path: "/evaluation" },
];

export default function Sidebar() {
    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r pt-[85px] hidden lg:block">
            <nav className="h-full flex flex-col">
                <ul className="flex-1 p-4 space-y-2">
                    {items.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                end
                                className={({ isActive }) =>
                                    `block px-4 py-2 rounded-md transition ${isActive
                                        ? "bg-indigo-100 text-indigo-700 font-medium"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* User / Footer */}
                <div className="p-4 border-t">
                    <div className="text-sm">
                        <p className="font-semibold">Admin User</p>
                        <p className="text-gray-500">admin@xyz.com</p>
                    </div>
                </div>
            </nav>
        </aside>
    );
}
