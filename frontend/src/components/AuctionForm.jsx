import FormField, { inputClass } from "./FormField";

export const emptyAuctionForm = {
  itemName: "",
  description: "",
  minBid: "",
  startTime: "",
  endTime: "",
  itemImage: null,
  popcornEnabled: false,
  popcornExtensionMinutes: 5,
  popcornTriggerSeconds: 60,
  reason: "",
};

export default function AuctionForm({
  values,
  onChange,
  onFileChange,
  onSubmit,
  submitting,
  mode = "vendor",
  allowIdentityFields = true,
  requireReason = false,
  submitLabel = "Save auction",
  showImage = true,
}) {
  const setValue = (name, value) => onChange({ ...values, [name]: value });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {allowIdentityFields && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Item name" id={`${mode}-itemName`}>
            <input id={`${mode}-itemName`} className={inputClass} value={values.itemName || ""} onChange={(e) => setValue("itemName", e.target.value)} required />
          </FormField>
          <FormField label="Minimum bid" id={`${mode}-minBid`}>
            <input id={`${mode}-minBid`} type="number" min="0.01" step="0.01" className={inputClass} value={values.minBid || ""} onChange={(e) => setValue("minBid", e.target.value)} required />
          </FormField>
        </div>
      )}

      <FormField label="Description" id={`${mode}-description`}>
        <textarea id={`${mode}-description`} rows="4" className={inputClass} value={values.description || ""} onChange={(e) => setValue("description", e.target.value)} required />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        {allowIdentityFields && (
          <FormField label="Start time" id={`${mode}-startTime`}>
            <input id={`${mode}-startTime`} type="datetime-local" className={inputClass} value={values.startTime || ""} onChange={(e) => setValue("startTime", e.target.value)} required />
          </FormField>
        )}
        <FormField label="End time" id={`${mode}-endTime`}>
          <input id={`${mode}-endTime`} type="datetime-local" className={inputClass} value={values.endTime || ""} onChange={(e) => setValue("endTime", e.target.value)} required />
        </FormField>
      </div>

      {showImage && allowIdentityFields && (
        <FormField label="Item image" id={`${mode}-itemImage`} hint="Upload a clear item photo.">
          <input id={`${mode}-itemImage`} type="file" accept="image/*" className={inputClass} onChange={onFileChange} required={!values.id} />
        </FormField>
      )}

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={Boolean(values.popcornEnabled)} onChange={(e) => setValue("popcornEnabled", e.target.checked)} />
          Enable popcorn bidding
        </label>
        {values.popcornEnabled && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Extension minutes" id={`${mode}-popcornExtensionMinutes`}>
              <input id={`${mode}-popcornExtensionMinutes`} type="number" min="1" className={inputClass} value={values.popcornExtensionMinutes || 5} onChange={(e) => setValue("popcornExtensionMinutes", e.target.value)} />
            </FormField>
            <FormField label="Trigger seconds" id={`${mode}-popcornTriggerSeconds`}>
              <input id={`${mode}-popcornTriggerSeconds`} type="number" min="1" className={inputClass} value={values.popcornTriggerSeconds || 60} onChange={(e) => setValue("popcornTriggerSeconds", e.target.value)} />
            </FormField>
          </div>
        )}
      </div>

      {requireReason && (
        <FormField label="Admin reason" id={`${mode}-reason`}>
          <textarea id={`${mode}-reason`} rows="3" className={inputClass} value={values.reason || ""} onChange={(e) => setValue("reason", e.target.value)} required />
        </FormField>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
