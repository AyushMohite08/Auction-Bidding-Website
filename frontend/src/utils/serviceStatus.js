export const SERVICE_UNAVAILABLE_EVENT = "auctionhub:service-unavailable";
export const SERVICE_RESTORED_EVENT = "auctionhub:service-restored";
export const DEFAULT_SERVICE_UNAVAILABLE_MESSAGE =
  "Service temporarily unavailable. Please try again later.";

let serviceUnavailable = null;

function emitBrowserEvent(name, detail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

export function markServiceUnavailable(message) {
  serviceUnavailable = {
    message: message || DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
  };
  emitBrowserEvent(SERVICE_UNAVAILABLE_EVENT, serviceUnavailable);
}

export function markServiceRestored() {
  if (!serviceUnavailable) return;
  serviceUnavailable = null;
  emitBrowserEvent(SERVICE_RESTORED_EVENT);
}

export function getServiceUnavailableState() {
  return serviceUnavailable;
}
