import { useModel } from "../context/ModelContext";

export default function Header() {
    const { model, setModel } = useModel();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-[18.5px] bg-[#012951] border-b">
            <h1 className="text-lg font-medium text-white ps-4">
                ThreatWatch – DDoS Detection
            </h1>

            <div className="flex items-center gap-4 pe-4">
                {/* Model selector */}
                <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="px-3 py-1.5 rounded text-sm bg-white text-gray-800"
                >
                    <option value="ftg-net-v1">FTG-NET v1</option>
                    <option value="ftg-net-v2">FTG-NET v2</option>
                    <option value="baseline-cnn">Baseline CNN</option>
                </select>

                <button className="px-4 py-2 bg-white text-[#012951] rounded-lg text-sm font-medium hover:bg-gray-200">
                    Logout
                </button>
            </div>
        </header>
    );
}
