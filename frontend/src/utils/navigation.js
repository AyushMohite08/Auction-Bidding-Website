export function currentReturnPath(location) {
  return `${location.pathname}${location.search}${location.hash || ""}`;
}

export function auctionDetailState(location, extra = {}) {
  return {
    from: currentReturnPath(location),
    ...extra,
  };
}

export function adminAuctionFocusPath(auction) {
  const tab = auction?.status === "pending" ? "pending" : "auctions";
  const params = new URLSearchParams({ tab, focusAuction: String(auction?.id || "") });
  if (tab === "auctions") params.set("status", "all");
  return `/admin?${params.toString()}`;
}
