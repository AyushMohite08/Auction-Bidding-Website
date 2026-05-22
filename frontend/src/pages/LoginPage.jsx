import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import FormField, { inputClass } from "../components/FormField";

const roles = ["customer", "vendor", "admin"];
const roleHome = {
  customer: "/auctions",
  vendor: "/vendor",
  admin: "/admin",
};

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "", role: "customer" });
  const [submitting, setSubmitting] = useState(false);
  const { login, error, setError, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setError(null);
  }, [setError]);

  useEffect(() => {
    if (user) navigate(location.state?.from || roleHome[user.role] || "/", { replace: true });
  }, [user, navigate, location.state]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-[calc(100vh-66px)] max-w-7xl place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-950">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Choose the role you want to use for this session.</p>
        </div>

        {error && (
          <div className="mb-4 flex gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 rounded-md border border-slate-200 bg-slate-50 p-1">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role }))}
                className={`rounded px-3 py-2 text-sm font-medium capitalize ${form.role === role ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
              >
                {role}
              </button>
            ))}
          </div>

          <FormField label="Email" id="login-email">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input id="login-email" type="email" className={`${inputClass} pl-9`} value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
            </div>
          </FormField>

          <FormField label="Password" id="login-password">
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input id="login-password" type="password" className={`${inputClass} pl-9`} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required />
            </div>
          </FormField>

          <button type="submit" disabled={submitting} className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {submitting ? "Signing in..." : `Sign in as ${form.role}`}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Need an account? <Link to="/register" className="font-medium text-slate-950 hover:underline">Register as customer or vendor</Link>
        </p>
      </div>
    </section>
  );
}
