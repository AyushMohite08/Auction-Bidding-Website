import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function getTimeLeft(endTime) {
  const end = new Date(endTime);
  const difference = end.getTime() - Date.now();

  if (!endTime || Number.isNaN(end.getTime()) || difference <= 0) {
    return { label: "Expired", expired: true };
  }

  const days = Math.floor(difference / 86400000);
  const hours = Math.floor((difference % 86400000) / 3600000);
  const minutes = Math.floor((difference % 3600000) / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);

  if (days > 0) return { label: `${days}d ${hours}h`, expired: false };
  if (hours > 0) return { label: `${hours}h ${minutes}m`, expired: false };
  if (minutes > 0) return { label: `${minutes}m ${seconds}s`, expired: false };
  return { label: `${seconds}s`, expired: false };
}

export default function CountdownTimer({ endTime, onExpire }) {
  const [state, setState] = useState(() => getTimeLeft(endTime));

  useEffect(() => {
    let expiredNotified = false;
    const tick = () => {
      const next = getTimeLeft(endTime);
      setState(next);
      if (next.expired && onExpire && !expiredNotified) {
        expiredNotified = true;
        onExpire();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [endTime, onExpire]);

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${state.expired ? "text-rose-600" : "text-slate-700"}`}>
      <Clock className="h-4 w-4" />
      {state.label}
    </span>
  );
}
