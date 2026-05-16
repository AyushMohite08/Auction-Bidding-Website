import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Gavel, ImageOff, Lock } from "lucide-react";
import { auctionApi } from "../api/auctionApi";
import CountdownTimer from "../components/CountdownTimer";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../contexts/AuthContext";
import useSocket from "../hooks/useSocket";
import {
  compactError,
  formatCurrency,
  formatDateTime,
  hasAuctionEnded,
  hasAuctionStarted,
  imageUrl,
  isActiveAuction,
  priceForAuction,
} from "../utils/formatters";

export default function AuctionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadDetails = useCallback(async () => {
    try {
      setError(null);
      const [auctionData, bidData] = await Promise.all([auctionApi.getAuction(id), auctionApi.getBids(id)]);
      setAuction(auctionData);
      setBids(bidData || []);
      const nextBid = Number(auctionData.current_bid || auctionData.min_bid || 0) + 1;
      setBidAmount(nextBid.toFixed(2));
    } catch (err) {
      setError(compactError(err, "Failed to load auction."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useSocket(
    "new_notification",
    useCallback(
      (payload) => {
        if (!payload?.auctionId || Number(payload.auctionId) === Number(id)) {
          setToast({ type: "info", message: payload?.message || "Auction updated." });
          loadDetails();
        }
      },
      [id, loadDetails]
    )
  );

  const img = imageUrl(auction?.image_url);
  const active = isActiveAuction(auction);
  const started = hasAuctionStarted(auction);
  const canBid = user?.role === "customer" && active && started;
  const isVendorOwner = user?.role === "vendor" && user.id === auction?.vendor_id;
  const canLock = isVendorOwner && active && bids.length > 0;
  const minBid = useMemo(() => Number(auction?.current_bid || auction?.min_bid || 0) + 0.01, [auction]);

  const placeBid = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await auctionApi.placeBid({ auctionId: id, newBidAmount: bidAmount });
      setToast({
        type: "success",
        message: result.popcornExtended ? "Bid placed. Popcorn extension applied." : "Bid placed successfully.",
      });
      await loadDetails();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to place bid.") });
    } finally {
      setSubmitting(false);
    }
  };

  const lockAuction = async () => {
    if (!window.confirm("Lock this auction and sell to the current highest bidder?")) return;
    setSubmitting(true);
    try {
      await auctionApi.lockVendorAuction(id);
      setToast({ type: "success", message: "Auction locked successfully." });
      await loadDetails();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to lock auction.") });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="py-12 text-center text-sm text-slate-500">Loading auction...</p>;
  if (error) return <div className="mx-auto mt-8 max-w-3xl rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>;
  if (!auction) return <EmptyState title="Auction not found" />;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="aspect-[16/9] bg-slate-100">
              {img ? <img src={img} alt={auction.item_name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><ImageOff className="h-12 w-12" /></div>}
            </div>
            <div className="p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={auction.status} />
                {auction.locked_price && <StatusBadge status="sold">locked</StatusBadge>}
                {auction.popcorn_enabled ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">popcorn</span> : null}
              </div>
              <h1 className="text-2xl font-semibold text-slate-950">{auction.item_name}</h1>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{auction.description}</p>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-950">Bid history</h2>
            {bids.length ? (
              <div className="space-y-2">
                {bids.map((bid, index) => (
                  <div key={`${bid.bidder_name}-${bid.created_at}-${bid.bid_amount}`} className={`flex items-center justify-between rounded-md border px-3 py-2 ${index === 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                    <div>
                      <p className="text-sm font-medium text-slate-950">{bid.bidder_name}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(bid.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-950">{formatCurrency(bid.bid_amount)}</p>
                      {index === 0 && <p className="text-xs font-medium text-emerald-700">Highest bid</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No bids yet" description="The first valid bid must be higher than the minimum bid." />
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{auction.current_bid ? "Current bid" : "Minimum bid"}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950">{formatCurrency(priceForAuction(auction))}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <Row label="Start" value={formatDateTime(auction.start_time)} />
              <Row label="End" value={formatDateTime(auction.end_time)} />
              <Row label="State" value={active ? <CountdownTimer endTime={auction.end_time} onExpire={loadDetails} /> : hasAuctionEnded(auction) ? "Ended" : auction.status} />
              {auction.winner_name && <Row label="Winner" value={auction.winner_name} />}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            {canBid ? (
              <form onSubmit={placeBid} className="space-y-3">
                <label className="block text-sm font-medium text-slate-700" htmlFor="bidAmount">New bid amount</label>
                <input id="bidAmount" type="number" min={minBid.toFixed(2)} step="0.01" value={bidAmount} onChange={(event) => setBidAmount(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" required />
                <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                  <Gavel className="h-4 w-4" />
                  Place bid
                </button>
              </form>
            ) : canLock ? (
              <button type="button" onClick={lockAuction} disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                <Lock className="h-4 w-4" />
                Lock auction
              </button>
            ) : (
              <div className="space-y-3 text-sm text-slate-600">
                {!user && <p>Sign in as a customer to place a bid.</p>}
                {user?.role && user.role !== "customer" && !canLock && <p>Your current role can inspect this auction but cannot bid.</p>}
                {user?.role === "customer" && !started && <p>Bidding opens when the auction reaches its start time.</p>}
                {user?.role === "customer" && started && !active && <p>This auction is not open for bidding.</p>}
                {!user && <Link to="/login" className="inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Sign in</Link>}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
