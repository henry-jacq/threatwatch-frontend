const logs = [
    "Client-001: Starting UDP flood attack",
    "Client-002: SYN flood initialized",
    "Client-003: HTTP flood commenced",
];

export default function LogsPanel() {
    return (
        <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Live Logs</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {logs.map((log, i) => (
                    <div key={i}>[{new Date().toLocaleTimeString()}] {log}</div>
                ))}
            </div>
        </div>
    );
}
