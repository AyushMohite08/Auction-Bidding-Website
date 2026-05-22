import { useState } from "react";
import Toast from "../components/Toast";
import FormField, { inputClass } from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";
import { compactError } from "../utils/formatters";

export default function AccountPage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", contact_info: user?.contact_info || "" });
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await updateProfile(form);
      setToast({ type: "success", message: "Profile updated." });
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to update profile.") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">Account</h1>
        <p className="mt-1 text-sm text-slate-500">Basic profile details for your current cookie session.</p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 grid gap-4 rounded-md bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Email</p>
            <p className="font-medium text-slate-950">{user.email}</p>
          </div>
          <div>
            <p className="text-slate-500">Role</p>
            <p className="font-medium capitalize text-slate-950">{user.role}</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <FormField label="Name" id="account-name">
            <input id="account-name" className={inputClass} value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </FormField>
          <FormField label="Contact info" id="account-contact" hint="Optional phone number or contact note for fulfilled wins.">
            <input id="account-contact" className={inputClass} value={form.contact_info || ""} onChange={(e) => setForm((prev) => ({ ...prev, contact_info: e.target.value }))} />
          </FormField>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {submitting ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
