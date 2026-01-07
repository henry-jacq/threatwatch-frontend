export default function StatCard({ title, value, footer }) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            {footer && <p className="mt-2 text-sm text-gray-500">{footer}</p>}
        </div>
    );
}
