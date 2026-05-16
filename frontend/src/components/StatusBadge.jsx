
const styles = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  sold: "bg-blue-50 text-blue-700 ring-blue-200",
  expired: "bg-slate-100 text-slate-700 ring-slate-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  cancelled: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export default function StatusBadge({ status, children }) {
  const label = children || status || "unknown";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${styles[status] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {label}
    </span>
  );
}
