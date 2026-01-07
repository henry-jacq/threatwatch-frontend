const clients = [
    { id: "Client-001", cpu: "45%", ram: "2.1GB", attack: "UDP Flood" },
    { id: "Client-002", cpu: "38%", ram: "1.8GB", attack: "SYN Flood" },
    { id: "Client-003", cpu: "78%", ram: "3.2GB", attack: "HTTP Flood" },
];

export default function ClientStatus() {
    return (
        <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Client Status</h3>
            <div className="space-y-3">
                {clients.map((c) => (
                    <div key={c.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{c.id}</span>
                        <span className="text-sm text-gray-600">
                            CPU {c.cpu} · RAM {c.ram} · {c.attack}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
