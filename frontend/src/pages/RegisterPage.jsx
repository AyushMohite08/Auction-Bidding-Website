import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import FormField, { inputClass } from "../components/FormField";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "customer" });
  const [submitting, setSubmitting] = useState(false);
  const { register, error, setError, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setError(null);
  }, [setError]);

  useEffect(() => {
    if (user) navigate(user.role === "customer" ? "/auctions" : `/${user.role}`, { replace: true });
  }, [user, navigate]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-[calc(100vh-66px)] max-w-7xl place-items-center px-4 py-10">
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-950">Create account</h1>
          <p className="mt-1 text-sm text-slate-500">Public registration is available for customers and vendors.</p>
        </div>

        {error && (
          <div className="mb-4 flex gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1">
            {["customer", "vendor"].map((role) => (
              <button key={role} type="button" onClick={() => update("role", role)} className={`rounded px-3 py-2 text-sm font-medium capitalize ${form.role === role ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>
                {role}
              </button>
            ))}
          </div>
          <FormField label="Full name" id="register-name">
            <input id="register-name" className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </FormField>
          <FormField label="Email" id="register-email">
            <input id="register-email" type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Password" id="register-password" hint="Use 8+ chars with upper, lower, digit, and symbol.">
              <input id="register-password" type="password" className={inputClass} value={form.password} onChange={(e) => update("password", e.target.value)} required />
            </FormField>
            <FormField label="Confirm password" id="register-confirm">
              <input id="register-confirm" type="password" className={inputClass} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required />
            </FormField>
          </div>
          <button type="submit" disabled={submitting} className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-medium text-slate-950 hover:underline">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
