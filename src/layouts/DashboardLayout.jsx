import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen text-gray-900 bg-gray-100">
            <Header />

            <div className="pt-[85px] flex">
                <Sidebar />

                <main className="flex-1 px-6 py-4 overflow-y-auto lg:ml-64">
                    {children}
                </main>
            </div>
        </div>
    );
}
