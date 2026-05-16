import { Inbox } from "lucide-react";

export default function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <Inbox className="mb-3 h-8 w-8 text-slate-400" />
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
