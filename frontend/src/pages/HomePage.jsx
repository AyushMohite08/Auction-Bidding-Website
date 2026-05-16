import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Search } from "lucide-react";
import { auctionApi } from "../api/auctionApi";
import AuctionCard from "../components/AuctionCard";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";
import useSocket from "../hooks/useSocket";
import { ACTIVE_STATUSES, CLOSED_STATUSES, compactError, formatCurrency, isActiveAuction } from "../utils/formatters";

const tabs = [
  { id: "active", label: "Active" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "all", label: "All public" },
];

export default function HomePage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("active");
  const [toast, setToast] = useState(null);

  const loadAuctions = useCallback(async () => {
    try {
      setError(null);
      const data = await auctionApi.listAuctions();
      setAuctions(data);
    } catch (err) {
      setError(compactError(err, "Failed to load auctions."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  useSocket(
    "new_notification",
    useCallback(
      (payload) => {
        setToast({ type: "info", message: payload?.message || "Auction activity updated." });
        loadAuctions();
      },
      [loadAuctions]
    )
  );

  const counts = useMemo(() => {
    const active = auctions.filter(isActiveAuction).length;
    const pending = auctions.filter((auction) => auction.status === "pending").length;
    const sold = auctions.filter((auction) => auction.status === "sold").length;
    const volume = auctions.reduce((sum, auction) => sum + Number(auction.locked_price || auction.current_bid || 0), 0);
    return { active, pending, sold, volume };
  }, [auctions]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return auctions
      .filter((auction) => {
        if (normalizedQuery && !`${auction.item_name} ${auction.description}`.toLowerCase().includes(normalizedQuery)) {
          return false;
        }
        if (tab === "active") return isActiveAuction(auction);
        if (tab === "upcoming") return ACTIVE_STATUSES.includes(auction.status) && new Date(auction.start_time) > new Date();
        if (tab === "past") return CLOSED_STATUSES.includes(auction.status) || new Date(auction.end_time) <= new Date();
        return auction.status !== "pending";
      })
      .filter((auction) => auction.status !== "pending" || tab === "all");
  }, [auctions, query, tab]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <Filter className="h-3.5 w-3.5" />
            Operational auction browser
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Auctions</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Browse approved listings, inspect bid history, and continue into your role dashboard when you are ready to act.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:w-[560px]">
          <Metric label="Active" value={counts.active} />
          <Metric label="Pending review" value={counts.pending} />
          <Metric label="Sold" value={counts.sold} />
          <Metric label="Bid volume" value={formatCurrency(counts.volume)} />
        </div>
      </div>

      <div className="mb-6 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-96">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search item names or descriptions"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${tab === item.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <p className="py-10 text-center text-sm text-slate-500">Loading auctions...</p>}
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {!loading && !error && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-500">{filtered.length} auctions shown</p>
            <div className="hidden items-center gap-2 sm:flex">
              <StatusBadge status="approved">approved</StatusBadge>
              <StatusBadge status="sold">sold</StatusBadge>
              <StatusBadge status="expired">expired</StatusBadge>
            </div>
          </div>
          {filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((auction) => <AuctionCard key={auction.id} auction={auction} />)}
            </div>
          ) : (
            <EmptyState
              title="No auctions match this view"
              description="Try another status tab or clear the search filter."
              action={<Link to="/register" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Create an account</Link>}
            />
          )}
        </>
      )}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
