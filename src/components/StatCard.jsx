export default function StatCard({ title, value, footer }) {
    return (
        <div
            className="px-5 py-4 transition-shadow duration-150 bg-white border shadow-sm border-slate-200 rounded-xl hover:shadow-md"
        >
            {/* Title */}
            <p className="text-xs font-medium tracking-wide uppercase text-slate-500">
                {title}
            </p>

            {/* Value */}
            <p className="mt-2 text-xl font-semibold text-slate-900">
                {value}
            </p>

            {/* Footer */}
            {footer && (
                <p className="mt-2 text-xs leading-snug text-slate-500">
                    {footer}
                </p>
            )}
        </div>
    );
}
