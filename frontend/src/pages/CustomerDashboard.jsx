import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Eye, History, Search, Trophy } from "lucide-react";
import { auctionApi } from "../api/auctionApi";
import AuctionCard from "../components/AuctionCard";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../contexts/AuthContext";
import { CLOSED_STATUSES, compactError, formatCurrency, formatDateTime, getAuctionDisplayStatus, imageUrl, isActiveAuction } from "../utils/formatters";
import { auctionDetailState } from "../utils/navigation";

const tabs = [
  { id: "live", label: "Live auctions" },
  { id: "past", label: "Past auctions" },
  { id: "bids", label: "My bids" },
  { id: "wins", label: "My wins" },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [bidHistory, setBidHistory] = useState([]);
  const [wins, setWins] = useState([]);
  const [stats, setStats] = useState({ total_auctions_participated: 0, total_bids_placed: 0, total_wins: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const tab = tabs.some((item) => item.id === searchParams.get("tab")) ? searchParams.get("tab") : "live";
  const query = searchParams.get("q") || "";

  const load = useCallback(async () => {
    try {
      setError(null);
      const [allAuctions, history, myWins, myStats] = await Promise.all([
        auctionApi.listAuctions(),
        auctionApi.getCustomerBidHistory(user.id),
        auctionApi.getCustomerWins(user.id),
        auctionApi.getCustomerStats(user.id),
      ]);
      setAuctions(allAuctions);
      setBidHistory(history || []);
      setWins(myWins || []);
      setStats(myStats || {});
    } catch (err) {
      setError(compactError(err, "Failed to load customer dashboard."));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

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
  const liveAuctions = useMemo(
    () => auctions.filter((auction) => isActiveAuction(auction) && matchesAuction(auction, normalizedQuery)),
    [auctions, normalizedQuery]
  );
  const pastAuctions = useMemo(
    () => auctions.filter((auction) => CLOSED_STATUSES.includes(getAuctionDisplayStatus(auction)) && matchesAuction(auction, normalizedQuery)),
    [auctions, normalizedQuery]
  );
  const filteredBids = useMemo(
    () => bidHistory.filter((bid) => `${bid.item_name} ${bid.vendor_name}`.toLowerCase().includes(normalizedQuery)),
    [bidHistory, normalizedQuery]
  );
  const filteredWins = useMemo(
    () => wins.filter((win) => `${win.item_name} ${win.vendor_name}`.toLowerCase().includes(normalizedQuery)),
    [wins, normalizedQuery]
  );

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

  const bidColumns = [
    {
      key: "item",
      header: "Item",
      render: (bid) => (
        <div className="flex items-center gap-3">
          <img src={imageUrl(bid.image_url)} alt="" className="h-12 w-12 rounded-md bg-slate-100 object-cover" />
          <div>
            <p className="font-medium text-slate-950">{bid.item_name}</p>
            <p className="text-xs text-slate-500">Vendor: {bid.vendor_name}</p>
          </div>
        </div>
      ),
    },
    { key: "bid_amount", header: "Your bid", render: (bid) => formatCurrency(bid.bid_amount) },
    { key: "highest_bid", header: "Highest", render: (bid) => formatCurrency(bid.highest_bid) },
    { key: "status", header: "Status", render: (bid) => <StatusBadge status={bid.status} /> },
    { key: "bid_time", header: "Bid time", render: (bid) => formatDateTime(bid.bid_time) },
    { key: "action", header: "", width: "w-24", render: (bid) => <Link to={`/auction/${bid.auction_id}`} state={auctionDetailState(location)} className="inline-flex items-center gap-1 text-sm font-medium text-slate-950 hover:underline"><Eye className="h-4 w-4" /> View</Link> },
  ];

  const winColumns = [
    { key: "item_name", header: "Item", render: (win) => <span className="font-medium text-slate-950">{win.item_name}</span> },
    { key: "vendor_name", header: "Vendor", render: (win) => <span>{win.vendor_name}<br /><span className="text-xs text-slate-500">{win.vendor_email}</span></span> },
    { key: "price", header: "Winning price", render: (win) => formatCurrency(win.locked_price || win.current_bid || win.my_winning_bid) },
    { key: "end_time", header: "Won on", render: (win) => formatDateTime(win.end_time) },
    { key: "action", header: "", width: "w-24", render: (win) => <Link to={`/auction/${win.auction_id}`} state={auctionDetailState(location)} className="inline-flex items-center gap-1 text-sm font-medium text-slate-950 hover:underline"><Eye className="h-4 w-4" /> View</Link> },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Customer dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Browse live auctions and track your bidding record.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm lg:w-[520px]">
          <Metric label="Joined" value={stats.total_auctions_participated || 0} />
          <Metric label="Bids" value={stats.total_bids_placed || 0} />
          <Metric label="Wins" value={stats.total_wins || 0} />
        </div>
      </div>

      <Toolbar query={query} setQuery={setQuery} tab={tab} setTab={setTab} />

      {loading && <p className="py-10 text-center text-sm text-slate-500">Loading customer data...</p>}
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {!loading && !error && (
        <>
          {tab === "live" && (liveAuctions.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{liveAuctions.map((auction) => <AuctionCard key={auction.id} auction={auction} />)}</div> : <EmptyState title="No live auctions found" />)}
          {tab === "past" && (pastAuctions.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{pastAuctions.map((auction) => <AuctionCard key={auction.id} auction={auction} />)}</div> : <EmptyState title="No past auctions found" />)}
          {tab === "bids" && <DataTable columns={bidColumns} rows={filteredBids} getRowKey={(bid) => bid.bid_id} emptyTitle="No bids yet" emptyDescription="Your bid history appears after your first bid." />}
          {tab === "wins" && <DataTable columns={winColumns} rows={filteredWins} getRowKey={(win) => win.auction_id} emptyTitle="No wins yet" emptyDescription="Sold auctions that you win will appear here." />}
        </>
      )}
    </section>
  );
}

function matchesAuction(auction, query) {
  return !query || `${auction.item_name} ${auction.description}`.toLowerCase().includes(query);
}

function Toolbar({ query, setQuery, tab, setTab }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="relative lg:w-96">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items or vendors" className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${tab === item.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            {item.id === "bids" && <History className="h-4 w-4" />}
            {item.id === "wins" && <Trophy className="h-4 w-4" />}
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
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
