import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  getServiceUnavailableState,
  SERVICE_RESTORED_EVENT,
  SERVICE_UNAVAILABLE_EVENT,
} from "../api/apiClient";
import Navbar from "./Navbar";

export default function AppShell({ children }) {
  const [serviceNotice, setServiceNotice] = useState(() => getServiceUnavailableState());

  useEffect(() => {
    function handleUnavailable(event) {
      setServiceNotice(event.detail);
    }

    function handleRestored() {
      setServiceNotice(null);
    }

    window.addEventListener(SERVICE_UNAVAILABLE_EVENT, handleUnavailable);
    window.addEventListener(SERVICE_RESTORED_EVENT, handleRestored);

    return () => {
      window.removeEventListener(SERVICE_UNAVAILABLE_EVENT, handleUnavailable);
      window.removeEventListener(SERVICE_RESTORED_EVENT, handleRestored);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      {serviceNotice && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <div className="mx-auto flex max-w-7xl items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Service temporarily unavailable</p>
              <p className="mt-0.5 text-sm text-amber-800">{serviceNotice.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setServiceNotice(null)}
              className="rounded-md p-1 text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Dismiss service notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <main>{children}</main>
    </div>
  );
}
