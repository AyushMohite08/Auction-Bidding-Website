import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { auctionApi } from "../api/auctionApi";
import AuctionCard from "../components/AuctionCard";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../contexts/AuthContext";
import { CLOSED_STATUSES, compactError, getAuctionDisplayStatus, isActiveAuction } from "../utils/formatters";

const tabs = [
  { id: "active", label: "Active" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "all", label: "All public" },
];

export default function AuctionsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const tab = tabs.some((item) => item.id === searchParams.get("tab")) ? searchParams.get("tab") : "active";
  const query = searchParams.get("q") || "";

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

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return auctions
      .filter((auction) => {
        if (normalizedQuery && !`${auction.item_name} ${auction.description}`.toLowerCase().includes(normalizedQuery)) {
          return false;
        }
        const displayStatus = getAuctionDisplayStatus(auction);
        if (tab === "active") return isActiveAuction(auction);
        if (tab === "upcoming") return displayStatus === "approved";
        if (tab === "past") return CLOSED_STATUSES.includes(displayStatus);
        return displayStatus !== "pending";
      })
      .filter((auction) => getAuctionDisplayStatus(auction) !== "pending");
  }, [auctions, query, tab]);

  const setTab = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    if (!query) next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const setQuery = (nextQuery) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    if (nextQuery.trim()) next.set("q", nextQuery);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const emptyCopy = getEmptyCopy(tab, Boolean(query.trim()));

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="mb-7 rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Auction floor
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Browse auctions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {user?.role === "admin"
                ? "Inspect listed auctions from the buyer-facing view. Admin actions remain in your dashboard."
                : "Explore approved listings, review bid history, and open an auction when you are ready to bid."}
            </p>
          </div>
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
          <div className="mb-3">
            <p className="text-sm text-slate-500">{filtered.length} auctions shown</p>
          </div>
          {filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((auction) => <AuctionCard key={auction.id} auction={auction} />)}
            </div>
          ) : (
            <EmptyState
              title={emptyCopy.title}
              description={emptyCopy.description}
              action={!user ? <Link to="/register" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Create an account</Link> : null}
            />
          )}
        </>
      )}
    </section>
  );
}

function getEmptyCopy(tab, hasSearch) {
  if (hasSearch) {
    return {
      title: "No auctions found for this search.",
      description: "Try a different item name or clear the search box to see more listings.",
    };
  }

  if (tab === "active") {
    return {
      title: "No active auctions right now.",
      description: "There are no live auctions open for bidding at the moment. Check upcoming or past auctions for more listings.",
    };
  }

  if (tab === "upcoming") {
    return {
      title: "No upcoming auctions scheduled.",
      description: "New approved auctions will appear here before their start time.",
    };
  }

  if (tab === "past") {
    return {
      title: "No past auctions found.",
      description: "Sold and expired auctions will appear here after bidding closes.",
    };
  }

  return {
    title: "No auctions available yet.",
    description: "Approved listings will appear here once vendors submit auctions and admins review them.",
  };
}
