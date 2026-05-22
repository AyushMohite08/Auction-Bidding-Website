import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle, Edit, Eye, Lock, Plus, Search, Send, Trash2 } from "lucide-react";
import { auctionApi } from "../api/auctionApi";
import AuctionForm, { emptyAuctionForm } from "../components/AuctionForm";
import DataTable from "../components/DataTable";
import FormField, { inputClass } from "../components/FormField";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";
import useSocket from "../hooks/useSocket";
import {
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
  compactError,
  displayStatusForAuction,
  formatCurrency,
  formatDateTime,
  getAuctionDisplayStatus,
  parseRequestedChanges,
  priceForAuction,
  toInputDateTime,
} from "../utils/formatters";
import { auctionDetailState } from "../utils/navigation";

const tabs = [
  { id: "pending", label: "Pending" },
  { id: "live", label: "Live" },
  { id: "closed", label: "Closed" },
  { id: "requests", label: "Change requests" },
];

export default function VendorDashboard() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editState, setEditState] = useState(null);
  const [requestState, setRequestState] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const tab = tabs.some((item) => item.id === searchParams.get("tab")) ? searchParams.get("tab") : "pending";
  const query = searchParams.get("q") || "";

  const load = useCallback(async () => {
    try {
      setError(null);
      const [vendorAuctions, vendorRequests] = await Promise.all([
        auctionApi.listVendorAuctions(),
        auctionApi.listVendorChangeRequests(),
      ]);
      setAuctions(vendorAuctions || []);
      setRequests(vendorRequests || []);
    } catch (err) {
      setError(compactError(err, "Failed to load vendor dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useSocket(
    "new_notification",
    useCallback(
      (payload) => {
        setToast({ type: "info", message: payload?.message || "Auction activity updated." });
        load();
      },
      [load]
    )
  );

  const normalizedQuery = query.trim().toLowerCase();
  const visibleAuctions = auctions.filter((auction) => {
    if (normalizedQuery && !`${auction.item_name} ${auction.description}`.toLowerCase().includes(normalizedQuery)) return false;
    const displayStatus = getAuctionDisplayStatus(auction);
    if (tab === "pending") return displayStatus === "pending";
    if (tab === "live") return ACTIVE_STATUSES.includes(displayStatus);
    if (tab === "closed") return CLOSED_STATUSES.includes(displayStatus);
    return true;
  });
  const visibleRequests = requests.filter((request) => !normalizedQuery || `${request.item_name} ${request.status} ${request.reason} ${request.admin_note}`.toLowerCase().includes(normalizedQuery));

  const stats = useMemo(() => ({
    total: auctions.length,
    pending: auctions.filter((a) => getAuctionDisplayStatus(a) === "pending").length,
    live: auctions.filter((a) => ACTIVE_STATUSES.includes(getAuctionDisplayStatus(a))).length,
    sold: auctions.filter((a) => getAuctionDisplayStatus(a) === "sold").length,
    revenue: auctions.filter((a) => getAuctionDisplayStatus(a) === "sold").reduce((sum, a) => sum + Number(a.locked_price || a.current_bid || 0), 0),
  }), [auctions]);

  const setTab = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    if (!query.trim()) next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const setQuery = (nextQuery) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    if (nextQuery.trim()) next.set("q", nextQuery);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const createAuction = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await auctionApi.createVendorAuction(createOpen);
      setToast({ type: "success", message: "Auction submitted for admin review." });
      setCreateOpen(false);
      await load();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to create auction.") });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = async (auction) => {
    try {
      const bids = await auctionApi.getBids(auction.id);
      const hasStarted = new Date(auction.start_time) <= new Date();
      const hasBids = bids.length > 0 || auction.current_bid !== null;
      const canDirectEdit =
        auction.status === "pending" ||
        (ACTIVE_STATUSES.includes(auction.status) && !hasBids && !hasStarted && !auction.locked_price);

      if (canDirectEdit) {
        setEditState({
          auction,
          hasBids,
          allowIdentityFields: auction.status === "pending",
          values: valuesFromAuction(auction),
        });
      } else {
        setRequestState({
          auction,
          values: {
            description: auction.description || "",
            endTime: toInputDateTime(auction.end_time),
            reason: "",
          },
        });
      }
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to inspect auction edit rules.") });
    }
  };

  const updateAuction = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await auctionApi.updateVendorAuction(editState.auction.id, editState.values);
      setToast({ type: "success", message: "Auction updated." });
      setEditState(null);
      await load();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to update auction.") });
    } finally {
      setSubmitting(false);
    }
  };

  const createChangeRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await auctionApi.createChangeRequest(requestState.auction.id, {
        description: requestState.values.description,
        endTime: requestState.values.endTime ? new Date(requestState.values.endTime).toISOString() : undefined,
        reason: requestState.values.reason,
      });
      setToast({ type: "success", message: "Change request submitted." });
      setRequestState(null);
      await load();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to submit change request.") });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAuction = async (auction) => {
    if (!window.confirm(`Cancel "${auction.item_name}"?`)) return;
    try {
      await auctionApi.cancelVendorAuction(auction.id);
      setToast({ type: "success", message: "Auction cancelled." });
      await load();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to cancel auction.") });
    }
  };

  const lockAuction = async (auction) => {
    if (!window.confirm(`Lock "${auction.item_name}" and sell to the highest bidder?`)) return;
    try {
      await auctionApi.lockVendorAuction(auction.id);
      setToast({ type: "success", message: "Auction locked." });
      await load();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to lock auction.") });
    }
  };

  const auctionColumns = [
    {
      key: "item_name",
      header: "Auction",
      width: "w-[34%]",
      render: (auction) => (
        <div className="min-w-0">
          <Link to={`/auction/${auction.id}`} state={auctionDetailState(location)} className="block truncate font-medium text-slate-950 hover:underline">{auction.item_name}</Link>
          <p className="truncate text-xs text-slate-500">{formatDateTime(auction.start_time)} to {formatDateTime(auction.end_time)}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", width: "w-32", render: (auction) => {
      const badge = displayStatusForAuction(auction);
      return <StatusBadge status={badge.status}>{badge.label}</StatusBadge>;
    } },
    { key: "price", header: "Price", width: "w-32", render: (auction) => formatCurrency(priceForAuction(auction)) },
    { key: "popcorn", header: "Popcorn", width: "w-28", render: (auction) => auction.popcorn_enabled ? "Enabled" : "Off" },
    {
      key: "actions",
      header: "",
      width: "w-44",
      render: (auction) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Link to={`/auction/${auction.id}`} state={auctionDetailState(location)} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100" title="View auction"><Eye className="h-4 w-4" /></Link>
          {!["sold", "expired", "cancelled"].includes(getAuctionDisplayStatus(auction)) && <button type="button" onClick={() => openEdit(auction)} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100" title="Edit or request change"><Edit className="h-4 w-4" /></button>}
          {getAuctionDisplayStatus(auction) === "active" && <button type="button" onClick={() => lockAuction(auction)} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100" title="Lock"><Lock className="h-4 w-4" /></button>}
          {["pending", "rejected"].includes(auction.status) && <button type="button" onClick={() => cancelAuction(auction)} className="rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title="Cancel"><Trash2 className="h-4 w-4" /></button>}
        </div>
      ),
    },
  ];

  const requestColumns = [
    { key: "item_name", header: "Auction", width: "w-56", truncate: true, render: (request) => <span className="font-medium text-slate-950">{request.item_name}</span> },
    { key: "requested_changes", header: "Requested changes", width: "w-[28%]", render: (request) => <RequestSummary changes={parseRequestedChanges(request.requested_changes)} /> },
    { key: "status", header: "Status", width: "w-32", render: (request) => <StatusBadge status={request.status} /> },
    { key: "reason", header: "Reason", truncate: true, render: (request) => request.reason || "No reason provided" },
    { key: "admin_note", header: "Admin note", truncate: true, render: (request) => request.admin_note || "Pending" },
  ];
  const emptyCopy = getVendorEmptyCopy(tab, Boolean(query.trim()));

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Vendor dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Create listings, track review status, and request controlled edits.</p>
        </div>
        <button type="button" onClick={() => setCreateOpen({ ...emptyAuctionForm })} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" />
          New auction
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Total" value={stats.total} />
        <Metric label="Pending" value={stats.pending} />
        <Metric label="Live" value={stats.live} />
        <Metric label="Sold" value={stats.sold} />
        <Metric label="Revenue" value={formatCurrency(stats.revenue)} />
      </div>

      <Toolbar query={query} setQuery={setQuery} tab={tab} setTab={setTab} />

      {loading && <p className="py-10 text-center text-sm text-slate-500">Loading vendor data...</p>}
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {!loading && !error && (
        tab === "requests" ? (
          <DataTable columns={requestColumns} rows={visibleRequests} getRowKey={(request) => request.id} emptyTitle={emptyCopy.title} emptyDescription={emptyCopy.description} />
        ) : (
          <DataTable columns={auctionColumns} rows={visibleAuctions} getRowKey={(auction) => auction.id} emptyTitle={emptyCopy.title} emptyDescription={emptyCopy.description} />
        )
      )}

      <Modal open={Boolean(createOpen)} title="Create auction" description="New listings enter pending admin review." onClose={() => setCreateOpen(false)}>
        {createOpen && (
          <AuctionForm
            values={createOpen}
            onChange={setCreateOpen}
            onFileChange={(event) => setCreateOpen((prev) => ({ ...prev, itemImage: event.target.files?.[0] || null }))}
            onSubmit={createAuction}
            submitting={submitting}
            submitLabel="Submit for review"
          />
        )}
      </Modal>

      <Modal open={Boolean(editState)} title="Edit auction" description="Available fields follow the backend edit rules for this auction." onClose={() => setEditState(null)}>
        {editState && (
          <AuctionForm
            values={editState.values}
            onChange={(values) => setEditState((prev) => ({ ...prev, values }))}
            onFileChange={(event) => setEditState((prev) => ({ ...prev, values: { ...prev.values, itemImage: event.target.files?.[0] || null } }))}
            onSubmit={updateAuction}
            submitting={submitting}
            allowIdentityFields={editState.allowIdentityFields}
            showImage={editState.allowIdentityFields}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      <Modal open={Boolean(requestState)} title="Request auction change" description="After bidding starts, vendors can request only description and end time updates." onClose={() => setRequestState(null)}>
        {requestState && (
          <form onSubmit={createChangeRequest} className="space-y-4">
            <FormField label="Description" id="request-description">
              <textarea id="request-description" rows="4" className={inputClass} value={requestState.values.description} onChange={(event) => setRequestState((prev) => ({ ...prev, values: { ...prev.values, description: event.target.value } }))} required />
            </FormField>
            <FormField label="End time" id="request-end">
              <input id="request-end" type="datetime-local" className={inputClass} value={requestState.values.endTime} onChange={(event) => setRequestState((prev) => ({ ...prev, values: { ...prev.values, endTime: event.target.value } }))} required />
            </FormField>
            <FormField label="Reason" id="request-reason">
              <textarea id="request-reason" rows="3" className={inputClass} value={requestState.values.reason} onChange={(event) => setRequestState((prev) => ({ ...prev, values: { ...prev.values, reason: event.target.value } }))} />
            </FormField>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                <Send className="h-4 w-4" />
                Submit request
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}

function getVendorEmptyCopy(tab, hasSearch) {
  if (hasSearch) {
    return {
      title: "No vendor records match this search.",
      description: "Clear the search or try another auction name.",
    };
  }

  if (tab === "pending") {
    return {
      title: "No auctions waiting for review.",
      description: "New listings you submit will appear here until an admin approves or rejects them.",
    };
  }

  if (tab === "live") {
    return {
      title: "No live auctions right now.",
      description: "Approved auctions appear here before and during bidding.",
    };
  }

  if (tab === "closed") {
    return {
      title: "No closed auctions yet.",
      description: "Sold, expired, rejected, and cancelled auctions will be grouped here.",
    };
  }

  return {
    title: "No change requests submitted.",
    description: "When you request an edit after bidding starts, the request and admin decision will appear here.",
  };
}

function valuesFromAuction(auction) {
  return {
    id: auction.id,
    itemName: auction.item_name || "",
    description: auction.description || "",
    minBid: auction.min_bid || "",
    startTime: toInputDateTime(auction.start_time),
    endTime: toInputDateTime(auction.end_time),
    itemImage: null,
    popcornEnabled: Boolean(auction.popcorn_enabled),
    popcornExtensionMinutes: auction.popcorn_extension_minutes || 5,
    popcornTriggerSeconds: auction.popcorn_trigger_seconds || 60,
  };
}

function RequestSummary({ changes }) {
  return (
    <div className="space-y-1 text-xs">
      {changes.description !== undefined && <p><span className="font-semibold">Description:</span> {String(changes.description).slice(0, 80)}</p>}
      {changes.endTime !== undefined && <p><span className="font-semibold">End:</span> {formatDateTime(changes.endTime)}</p>}
    </div>
  );
}

function Toolbar({ query, setQuery, tab, setTab }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="relative lg:w-96">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your auctions" className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${tab === item.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            {item.id === "pending" && <CheckCircle className="h-4 w-4" />}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
