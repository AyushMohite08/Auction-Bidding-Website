import { useEffect } from "react";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";

const config = {
  success: { icon: CheckCircle, className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  error: { icon: XCircle, className: "border-rose-200 bg-rose-50 text-rose-800" },
  warning: { icon: AlertTriangle, className: "border-amber-200 bg-amber-50 text-amber-800" },
  info: { icon: Info, className: "border-blue-200 bg-blue-50 text-blue-800" },
};

export default function Toast({ message, type = "info", onClose, duration = 3500 }) {
  const settings = config[type] || config.info;
  const Icon = settings.icon;

  useEffect(() => {
    if (!duration || !onClose) return undefined;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div className={`fixed right-4 top-4 z-[60] flex max-w-md items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${settings.className}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="min-w-0 flex-1">{message}</p>
      {onClose && (
        <button type="button" onClick={onClose} className="rounded p-0.5 hover:bg-white/60" aria-label="Dismiss notification">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
