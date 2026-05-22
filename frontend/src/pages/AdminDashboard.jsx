import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle, Edit, Eye, Search, XCircle } from "lucide-react";
import { auctionApi } from "../api/auctionApi";
import AuctionForm from "../components/AuctionForm";
import DataTable from "../components/DataTable";
import FormField, { inputClass } from "../components/FormField";
import Modal from "../components/Modal";
import SelectMenu from "../components/SelectMenu";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";
import useSocket from "../hooks/useSocket";
import {
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
  { id: "pending", label: "Pending approvals" },
  { id: "auctions", label: "All auctions" },
  { id: "requests", label: "Change requests" },
];

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "sold", label: "Sold" },
  { value: "expired", label: "Expired" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminDashboard() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [editState, setEditState] = useState(null);
  const [decisionState, setDecisionState] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const tab = tabs.some((item) => item.id === searchParams.get("tab")) ? searchParams.get("tab") : "pending";
  const query = searchParams.get("q") || "";
  const statusFilter = statusOptions.some((item) => item.value === searchParams.get("status")) ? searchParams.get("status") : "all";
  const focusAuction = searchParams.get("focusAuction");

  const load = useCallback(async () => {
    try {
      setError(null);
      const [allAuctions, changeRequests] = await Promise.all([
        auctionApi.listAuctions(),
        auctionApi.listAdminChangeRequests(),
      ]);
      setAuctions(allAuctions || []);
      setRequests(changeRequests || []);
    } catch (err) {
      setError(compactError(err, "Failed to load admin dashboard."));
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
  const pendingAuctions = useMemo(() => auctions.filter((auction) => getAuctionDisplayStatus(auction) === "pending" && matches(auction, normalizedQuery)), [auctions, normalizedQuery]);
  const filteredAuctions = useMemo(
    () => auctions.filter((auction) => matches(auction, normalizedQuery) && (statusFilter === "all" || getAuctionDisplayStatus(auction) === statusFilter)),
    [auctions, normalizedQuery, statusFilter]
  );
  const filteredRequests = useMemo(
    () => requests.filter((request) => `${request.item_name} ${request.vendor_name} ${request.status}`.toLowerCase().includes(normalizedQuery)),
    [requests, normalizedQuery]
  );

  const stats = useMemo(() => ({
    pending: auctions.filter((auction) => getAuctionDisplayStatus(auction) === "pending").length,
    live: auctions.filter((auction) => ["approved", "active"].includes(getAuctionDisplayStatus(auction))).length,
    sold: auctions.filter((auction) => getAuctionDisplayStatus(auction) === "sold").length,
    requests: requests.filter((request) => request.status === "pending").length,
  }), [auctions, requests]);

  useEffect(() => {
    if (loading || !focusAuction) return undefined;
    const timeoutId = window.setTimeout(() => {
      document.getElementById(`auction-row-${focusAuction}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 100);
    return () => window.clearTimeout(timeoutId);
  }, [loading, focusAuction, tab, pendingAuctions.length, filteredAuctions.length]);

  const setTab = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    next.delete("focusAuction");
    if (!query.trim()) next.delete("q");
    if (nextTab !== "auctions") next.delete("status");
    setSearchParams(next, { replace: true });
  };

  const setQuery = (nextQuery) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    next.delete("focusAuction");
    if (nextQuery.trim()) next.set("q", nextQuery);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const setStatusFilter = (nextStatus) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "auctions");
    next.delete("focusAuction");
    if (nextStatus === "all") next.delete("status");
    else next.set("status", nextStatus);
    setSearchParams(next, { replace: true });
  };

  const updateStatus = async (auction, newStatus) => {
    try {
      await auctionApi.updateAuctionStatus(auction.id, newStatus);
      setToast({ type: "success", message: `Auction ${newStatus}.` });
      await load();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to update auction status.") });
    }
  };

  const openEdit = async (auction) => {
    try {
      const bids = await auctionApi.getBids(auction.id);
      const hasBids = bids.length > 0 || auction.current_bid !== null;
      setEditState({
        auction,
        hasBids,
        values: valuesFromAuction(auction, hasBids),
      });
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to inspect auction.") });
    }
  };

  const updateAuction = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await auctionApi.updateAdminAuction(editState.auction.id, editState.values);
      setToast({ type: "success", message: "Auction updated." });
      setEditState(null);
      await load();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to update auction.") });
    } finally {
      setSubmitting(false);
    }
  };

  const decideRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await auctionApi.updateChangeRequestStatus(decisionState.request.id, {
        status: decisionState.status,
        adminNote: decisionState.adminNote,
      });
      setToast({ type: "success", message: `Change request ${decisionState.status}.` });
      setDecisionState(null);
      await load();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to update change request.") });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingColumns = [
    {
      key: "item_name",
      header: "Auction",
      width: "w-[32%]",
      render: (auction) => (
        <div className="min-w-0">
          <Link to={`/auction/${auction.id}`} state={auctionDetailState(location)} className="block truncate font-medium text-slate-950 hover:underline">{auction.item_name}</Link>
          <p className="truncate text-xs text-slate-500">Vendor ID: {auction.vendor_id}</p>
        </div>
      ),
    },
    { key: "min_bid", header: "Minimum", width: "w-32", render: (auction) => formatCurrency(auction.min_bid) },
    { key: "time", header: "Schedule", width: "w-64", render: (auction) => <span>{formatDateTime(auction.start_time)}<br /><span className="text-xs text-slate-500">Ends {formatDateTime(auction.end_time)}</span></span> },
    {
      key: "actions",
      header: "",
      width: "w-28",
      render: (auction) => (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => updateStatus(auction, "approved")} className="rounded-md border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50" title="Approve"><CheckCircle className="h-4 w-4" /></button>
          <button type="button" onClick={() => updateStatus(auction, "rejected")} className="rounded-md border border-rose-200 p-2 text-rose-700 hover:bg-rose-50" title="Reject"><XCircle className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  const auctionColumns = [
    { key: "item_name", header: "Auction", width: "w-[32%]", render: (auction) => <Link to={`/auction/${auction.id}`} state={auctionDetailState(location)} className="block truncate font-medium text-slate-950 hover:underline">{auction.item_name}</Link> },
    { key: "status", header: "Status", width: "w-32", render: (auction) => {
      const badge = displayStatusForAuction(auction);
      return <StatusBadge status={badge.status}>{badge.label}</StatusBadge>;
    } },
    { key: "price", header: "Price", width: "w-36", render: (auction) => formatCurrency(priceForAuction(auction)) },
    { key: "end_time", header: "End time", width: "w-56", render: (auction) => formatDateTime(auction.end_time) },
    {
      key: "actions",
      header: "",
      width: "w-28",
      render: (auction) => (
        <div className="flex justify-end gap-2">
          <Link to={`/auction/${auction.id}`} state={auctionDetailState(location)} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100" title="View"><Eye className="h-4 w-4" /></Link>
          {!["sold", "expired", "cancelled"].includes(getAuctionDisplayStatus(auction)) && <button type="button" onClick={() => openEdit(auction)} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100" title="Edit"><Edit className="h-4 w-4" /></button>}
        </div>
      ),
    },
  ];

  const requestColumns = [
    { key: "item_name", header: "Auction", width: "w-56", render: (request) => <div className="min-w-0"><p className="truncate font-medium text-slate-950">{request.item_name}</p><p className="truncate text-xs text-slate-500">Vendor: {request.vendor_name}</p></div> },
    { key: "requested_changes", header: "Requested changes", width: "w-[28%]", render: (request) => <RequestSummary changes={parseRequestedChanges(request.requested_changes)} /> },
    { key: "status", header: "Status", width: "w-32", render: (request) => <StatusBadge status={request.status} /> },
    { key: "reason", header: "Reason", truncate: true, render: (request) => request.reason || "No reason provided" },
    {
      key: "actions",
      header: "",
      width: "w-28",
      render: (request) => request.status === "pending" ? (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setDecisionState({ request, status: "approved", adminNote: "Approved" })} className="rounded-md border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50" title="Approve"><CheckCircle className="h-4 w-4" /></button>
          <button type="button" onClick={() => setDecisionState({ request, status: "rejected", adminNote: "" })} className="rounded-md border border-rose-200 p-2 text-rose-700 hover:bg-rose-50" title="Reject"><XCircle className="h-4 w-4" /></button>
        </div>
      ) : <span className="text-xs text-slate-500">Decided</span>,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Review pending listings, manage auction edits, and decide change requests.</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Pending auctions" value={stats.pending} />
        <Metric label="Live auctions" value={stats.live} />
        <Metric label="Sold auctions" value={stats.sold} />
        <Metric label="Pending requests" value={stats.requests} />
      </div>

      <Toolbar query={query} setQuery={setQuery} tab={tab} setTab={setTab} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

      {loading && <p className="py-10 text-center text-sm text-slate-500">Loading admin data...</p>}
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {!loading && !error && (
        <>
          {tab === "pending" && <DataTable columns={pendingColumns} rows={pendingAuctions} getRowKey={(auction) => auction.id} getRowId={(auction) => `auction-row-${auction.id}`} rowClassName={(auction) => String(auction.id) === focusAuction ? "bg-amber-50 ring-1 ring-inset ring-amber-200" : ""} emptyTitle="No auctions waiting for approval." emptyDescription="Pending vendor listings will appear here for review." />}
          {tab === "auctions" && <DataTable columns={auctionColumns} rows={filteredAuctions} getRowKey={(auction) => auction.id} getRowId={(auction) => `auction-row-${auction.id}`} rowClassName={(auction) => String(auction.id) === focusAuction ? "bg-amber-50 ring-1 ring-inset ring-amber-200" : ""} emptyTitle="No auctions match these filters." emptyDescription="Clear the search or change the status filter to see more auctions." />}
          {tab === "requests" && <DataTable columns={requestColumns} rows={filteredRequests} getRowKey={(request) => request.id} emptyTitle="No change requests to review." emptyDescription="Vendor requests will appear here when they need an admin decision." />}
        </>
      )}

      <Modal open={Boolean(editState)} title="Admin auction edit" description={editState?.hasBids ? "Bids exist, so only description and end time are editable and a reason is required." : "No bids exist, so admin can edit auction fields except vendor."} onClose={() => setEditState(null)}>
        {editState && (
          <AuctionForm
            values={editState.values}
            onChange={(values) => setEditState((prev) => ({ ...prev, values }))}
            onFileChange={(event) => setEditState((prev) => ({ ...prev, values: { ...prev.values, itemImage: event.target.files?.[0] || null } }))}
            onSubmit={updateAuction}
            submitting={submitting}
            allowIdentityFields={!editState.hasBids}
            showImage={!editState.hasBids}
            requireReason={editState.hasBids}
            mode="admin"
            submitLabel="Save admin edit"
          />
        )}
      </Modal>

      <Modal open={Boolean(decisionState)} title={`${decisionState?.status === "approved" ? "Approve" : "Reject"} change request`} onClose={() => setDecisionState(null)}>
        {decisionState && (
          <form onSubmit={decideRequest} className="space-y-4">
            <RequestSummary changes={parseRequestedChanges(decisionState.request.requested_changes)} />
            <FormField label="Admin note" id="admin-note">
              <textarea id="admin-note" rows="3" className={inputClass} value={decisionState.adminNote} onChange={(event) => setDecisionState((prev) => ({ ...prev, adminNote: event.target.value }))} />
            </FormField>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                Confirm {decisionState.status}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}

function valuesFromAuction(auction, hasBids) {
  return {
    id: auction.id,
    itemName: hasBids ? "" : auction.item_name || "",
    description: auction.description || "",
    minBid: hasBids ? "" : auction.min_bid || "",
    startTime: hasBids ? "" : toInputDateTime(auction.start_time),
    endTime: toInputDateTime(auction.end_time),
    itemImage: null,
    popcornEnabled: Boolean(auction.popcorn_enabled),
    popcornExtensionMinutes: auction.popcorn_extension_minutes || 5,
    popcornTriggerSeconds: auction.popcorn_trigger_seconds || 60,
    reason: "",
  };
}

function matches(auction, query) {
  return !query || `${auction.item_name} ${auction.description} ${getAuctionDisplayStatus(auction)}`.toLowerCase().includes(query);
}

function RequestSummary({ changes }) {
  return (
    <div className="space-y-1 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
      {changes.description !== undefined && <p><span className="font-semibold">Description:</span> {String(changes.description).slice(0, 140)}</p>}
      {changes.endTime !== undefined && <p><span className="font-semibold">End time:</span> {formatDateTime(changes.endTime)}</p>}
    </div>
  );
}

function Toolbar({ query, setQuery, tab, setTab, statusFilter, setStatusFilter }) {
  return (
    <div className="mb-6 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-96">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search auctions or requests" className="h-10 w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          </div>
          {tab === "auctions" && (
            <SelectMenu id="admin-status-filter" value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="lg:w-44" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`rounded-md px-3 py-2 text-sm font-medium ${tab === item.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
