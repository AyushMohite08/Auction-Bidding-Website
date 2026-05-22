import { Link, useLocation } from "react-router-dom";
import { ImageOff } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import StatusBadge from "./StatusBadge";
import { displayStatusForAuction, formatCurrency, formatDateTime, imageUrl, isActiveAuction, priceForAuction } from "../utils/formatters";
import { auctionDetailState } from "../utils/navigation";

export default function AuctionCard({ auction, compact = false }) {
  const location = useLocation();
  const active = isActiveAuction(auction);
  const img = imageUrl(auction.image_url);
  const badge = displayStatusForAuction(auction, { liveLabel: true });
  const returnState = auctionDetailState(location);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link to={`/auction/${auction.id}`} state={returnState} className="block">
        <div className="relative aspect-[4/3] bg-slate-100 p-3">
          {img ? (
            <img src={img} alt={auction.item_name} className="h-full w-full rounded-md object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <ImageOff className="h-9 w-9" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={badge.status}>{badge.label}</StatusBadge>
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lot #{auction.id}</p>
          <Link to={`/auction/${auction.id}`} state={returnState} className="text-base font-semibold leading-snug text-slate-950 hover:text-slate-700">
            <span className="line-clamp-2">{auction.item_name}</span>
          </Link>
          {!compact && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{auction.description}</p>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{auction.current_bid ? "Current bid" : "Minimum bid"}</p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(priceForAuction(auction))}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{active ? "Ends" : "End time"}</p>
            <div className="mt-1">{active ? <CountdownTimer endTime={auction.end_time} /> : <p className="font-medium text-slate-700">{formatDateTime(auction.end_time)}</p>}</div>
          </div>
        </div>

        {auction.popcorn_enabled ? (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Popcorn bidding enabled
          </p>
        ) : null}
      </div>
    </article>
  );
}
