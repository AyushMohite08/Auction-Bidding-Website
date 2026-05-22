import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, CheckCircle, Clock3, Gavel, ImageOff, Lock, X, XCircle, ZoomIn, ZoomOut } from "lucide-react";
import { auctionApi } from "../api/auctionApi";
import CountdownTimer from "../components/CountdownTimer";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import useSocket from "../hooks/useSocket";
import {
  compactError,
  displayStatusForAuction,
  formatCurrency,
  formatDateTime,
  hasAuctionEnded,
  hasAuctionStarted,
  imageUrl,
  isActiveAuction,
  priceForAuction,
} from "../utils/formatters";
import { adminAuctionFocusPath } from "../utils/navigation";

export default function AuctionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

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
  const latestBids = bids.slice(0, 4);
  const badge = displayStatusForAuction(auction);
  const sidebarBadge = displayStatusForAuction(auction, { liveLabel: true });

  const fallbackPath = user?.role === "vendor" ? "/vendor" : user?.role === "customer" || user?.role === "admin" ? "/auctions" : "/";

  const goBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackPath);
  };

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

  const updateStatus = async (newStatus) => {
    setSubmitting(true);
    try {
      await auctionApi.updateAuctionStatus(id, newStatus);
      setToast({ type: "success", message: `Auction ${newStatus}.` });
      await loadDetails();
    } catch (err) {
      setToast({ type: "error", message: compactError(err, "Failed to update auction status.") });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="py-12 text-center text-sm text-slate-500">Loading auction...</p>;
  if (error) return <div className="mx-auto mt-8 max-w-3xl rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>;
  if (!auction) return <EmptyState title="Auction not found" />;

  return (
    <section className="bg-slate-50">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="mx-auto max-w-7xl px-4 py-7">
        <button type="button" onClick={goBack} className="mb-5 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <main className="space-y-6">
            <Gallery image={img} title={auction.item_name} onOpen={() => setImageOpen(true)} />

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <StatusBadge status={badge.status}>{badge.label}</StatusBadge>
                {auction.locked_price && <StatusBadge status="sold">locked</StatusBadge>}
                {auction.popcorn_enabled ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">popcorn enabled</span> : null}
              </div>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{auction.item_name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{auction.description}</p>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard title="Auction details" icon={CalendarDays}>
                <InfoRow label="Status" value={<StatusBadge status={badge.status}>{badge.label}</StatusBadge>} />
                <InfoRow label="Starts" value={formatDateTime(auction.start_time)} />
                <InfoRow label="Ends" value={formatDateTime(auction.end_time)} />
                {auction.winner_name && <InfoRow label="Winner" value={auction.winner_name} />}
              </InfoCard>

              <InfoCard title="Bidding terms" icon={Gavel}>
                <InfoRow label="Minimum bid" value={formatCurrency(auction.min_bid)} />
                <InfoRow label="Current bid" value={formatCurrency(auction.current_bid || auction.min_bid)} />
                <InfoRow label="Popcorn bidding" value={auction.popcorn_enabled ? "Enabled" : "Off"} />
                {auction.popcorn_enabled ? <InfoRow label="Extension" value={`${auction.popcorn_extension_minutes || 5} min`} /> : null}
              </InfoCard>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Detailed description</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{auction.description}</p>
            </section>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-t-4 border-emerald-500 p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {active ? "Live auction" : sidebarBadge.label}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{bids.length} bids</span>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time remaining</p>
                    <div className="mt-2 text-2xl font-semibold text-slate-950">
                      {active ? <CountdownTimer endTime={auction.end_time} onExpire={loadDetails} /> : hasAuctionEnded(auction) ? "Ended" : "Not open"}
                    </div>
                  </div>

                  <div className="rounded-md bg-slate-50 p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{auction.current_bid ? "Current highest bid" : "Opening bid"}</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-600">{formatCurrency(priceForAuction(auction))}</p>
                  </div>

                  <ActionPanel
                    user={user}
                    auction={auction}
                    canBid={canBid}
                    canLock={canLock}
                    started={started}
                    active={active}
                    minBid={minBid}
                    bidAmount={bidAmount}
                    setBidAmount={setBidAmount}
                    placeBid={placeBid}
                    lockAuction={lockAuction}
                    updateStatus={updateStatus}
                    submitting={submitting}
                    adminDashboardPath={adminAuctionFocusPath(auction)}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-950">Bid history</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{bids.length} bids</span>
              </div>
              {latestBids.length ? (
                <div className="space-y-3">
                  {latestBids.map((bid, index) => (
                    <div key={`${bid.bidder_name}-${bid.created_at}-${bid.bid_amount}`} className={`flex items-center justify-between rounded-md px-3 py-2 ${index === 0 ? "bg-emerald-50 ring-1 ring-emerald-100" : "bg-slate-50"}`}>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{bid.bidder_name}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(bid.created_at)}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-950">{formatCurrency(bid.bid_amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No bids have been placed yet.</p>
              )}
            </section>
          </aside>
        </div>
      </div>

      <ImageLightbox
        open={imageOpen}
        image={img}
        title={auction.item_name}
        zoom={zoom}
        setZoom={setZoom}
        onClose={() => {
          setImageOpen(false);
          setZoom(1);
        }}
      />
    </section>
  );
}

function Gallery({ image, title, onOpen }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="aspect-[16/9] overflow-hidden rounded-md bg-slate-100 p-4">
        {image ? (
          <button type="button" onClick={onOpen} className="flex h-full w-full items-center justify-center" aria-label="Open image preview">
            <img src={image} alt={title} className="max-h-full max-w-full object-contain" />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400"><ImageOff className="h-12 w-12" /></div>
        )}
      </div>
    </section>
  );
}

function InfoCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-950">
        <Icon className="h-4 w-4 text-slate-500" />
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ImageLightbox({ open, image, title, zoom, setZoom, onClose }) {
  if (!open || !image) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 p-4">
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <div className="mb-3 flex items-center justify-between gap-3 text-white">
          <p className="truncate text-sm font-semibold">{title}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setZoom((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))))} className="rounded-md bg-white/10 p-2 hover:bg-white/20" aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setZoom(1)} className="rounded-md bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20">
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={() => setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))} className="rounded-md bg-white/10 p-2 hover:bg-white/20" aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="rounded-md bg-white/10 p-2 hover:bg-white/20" aria-label="Close image preview">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-slate-900 p-4">
          <div className="flex min-h-full min-w-full items-center justify-center">
            <img src={image} alt={title} style={{ transform: `scale(${zoom})` }} className="max-h-full max-w-full origin-center object-contain transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function ActionPanel({ user, auction, canBid, canLock, started, active, minBid, bidAmount, setBidAmount, placeBid, lockAuction, updateStatus, submitting, adminDashboardPath }) {
  if (canBid) {
    return (
      <form onSubmit={placeBid} className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700" htmlFor="bidAmount">Your bid</label>
        <input id="bidAmount" type="number" min={minBid.toFixed(2)} step="0.01" value={bidAmount} onChange={(event) => setBidAmount(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-3 text-sm font-semibold outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" required />
        <p className="text-right text-xs text-slate-500">Minimum: {formatCurrency(minBid)}</p>
        <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
          <Gavel className="h-4 w-4" />
          Place bid
        </button>
      </form>
    );
  }

  if (canLock) {
    return (
      <button type="button" onClick={lockAuction} disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
        <Lock className="h-4 w-4" />
        Lock auction
      </button>
    );
  }

  if (user?.role === "admin") {
    return (
      <div className="space-y-3">
        {auction.status === "pending" ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => updateStatus("approved")} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
            <button type="button" onClick={() => updateStatus("rejected")} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>
        ) : null}
        <Link to={adminDashboardPath} className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100">
          Find in admin dashboard
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3 text-sm text-slate-600">
        <p>Sign in as a customer to place a bid.</p>
        <Link to="/login" className="inline-flex w-full justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm text-slate-600">
      {user.role !== "customer" && <p>Your current role can inspect this auction but cannot bid.</p>}
      {user.role === "customer" && !started && <p>Bidding opens when the auction reaches its start time.</p>}
      {user.role === "customer" && started && !active && <p>This auction is not open for bidding.</p>}
      <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-500">
        <Clock3 className="h-4 w-4" />
        Inspection only
      </div>
    </div>
  );
}
