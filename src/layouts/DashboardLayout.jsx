import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-100 text-gray-900">
            <Header />

            <div className="pt-[85px] flex">
                <Sidebar />

                <main className="flex-1 p-6 lg:ml-64 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
