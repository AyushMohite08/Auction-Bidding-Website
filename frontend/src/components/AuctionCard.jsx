import { Link } from "react-router-dom";
import { Gavel, ImageOff } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import StatusBadge from "./StatusBadge";
import { formatCurrency, formatDateTime, imageUrl, isActiveAuction, priceForAuction } from "../utils/formatters";

export default function AuctionCard({ auction, compact = false }) {
  const active = isActiveAuction(auction);
  const img = imageUrl(auction.image_url);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <Link to={`/auction/${auction.id}`} className="block">
        <div className="relative aspect-[4/3] bg-slate-100">
          {img ? (
            <img src={img} alt={auction.item_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <ImageOff className="h-9 w-9" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={auction.status} />
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/auction/${auction.id}`} className="font-semibold text-slate-950 hover:text-slate-700">
              <span className="line-clamp-1">{auction.item_name}</span>
            </Link>
            {!compact && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{auction.description}</p>}
          </div>
          <Gavel className="h-5 w-5 shrink-0 text-slate-400" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{auction.current_bid ? "Current bid" : "Minimum bid"}</p>
            <p className="font-semibold text-slate-950">{formatCurrency(priceForAuction(auction))}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{active ? "Ends" : "End time"}</p>
            {active ? <CountdownTimer endTime={auction.end_time} /> : <p className="font-medium text-slate-700">{formatDateTime(auction.end_time)}</p>}
          </div>
        </div>

        {auction.popcorn_enabled ? (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Popcorn bidding enabled
          </p>
        ) : null}
      </div>
    </article>
  );
}
