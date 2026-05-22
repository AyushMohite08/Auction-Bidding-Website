export function parsePositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function parsePositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export const POPCORN_EXTENSION_MINUTES_MIN = 1;
export const POPCORN_EXTENSION_MINUTES_MAX = 5;
export const POPCORN_TRIGGER_SECONDS_MIN = 10;
export const POPCORN_TRIGGER_SECONDS_MAX = 300;

function parseBoolean(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}

export function formatDateForDb(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function parseJsonMaybe(value) {
  if (!value) return {};
  if (Buffer.isBuffer(value)) value = value.toString("utf8");
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}

export function getPopcornSettings(body) {
  const extensionMinutes =
    body.popcornExtensionMinutes !== undefined ? parsePositiveInteger(body.popcornExtensionMinutes) : 5;
  const triggerSeconds = body.popcornTriggerSeconds !== undefined ? parsePositiveInteger(body.popcornTriggerSeconds) : 60;

  const limitError = validatePopcornLimits({
    popcorn_extension_minutes: extensionMinutes,
    popcorn_trigger_seconds: triggerSeconds,
  });
  if (limitError) return { error: limitError };

  return {
    popcorn_enabled: parseBoolean(body.popcornEnabled) ? 1 : 0,
    popcorn_extension_minutes: extensionMinutes,
    popcorn_trigger_seconds: triggerSeconds,
  };
}

export function normalizeAuctionChanges(body, file, allowedFields) {
  const updates = {};

  if (allowedFields.includes("item_name") && body.itemName !== undefined) {
    updates.item_name = String(body.itemName).trim();
  }
  if (allowedFields.includes("description") && body.description !== undefined) {
    updates.description = String(body.description).trim();
  }
  if (allowedFields.includes("min_bid") && body.minBid !== undefined) {
    updates.min_bid = parsePositiveNumber(body.minBid);
  }
  if (allowedFields.includes("start_time") && body.startTime !== undefined) {
    updates.start_time = formatDateForDb(body.startTime);
  }
  if (allowedFields.includes("end_time") && body.endTime !== undefined) {
    updates.end_time = formatDateForDb(body.endTime);
  }
  if (allowedFields.includes("image_url") && file) {
    updates.image_url = `/uploads/${file.filename}`;
  }
  if (allowedFields.includes("popcorn_enabled") && body.popcornEnabled !== undefined) {
    updates.popcorn_enabled = parseBoolean(body.popcornEnabled) ? 1 : 0;
  }
  if (allowedFields.includes("popcorn_extension_minutes") && body.popcornExtensionMinutes !== undefined) {
    updates.popcorn_extension_minutes = parsePositiveInteger(body.popcornExtensionMinutes);
  }
  if (allowedFields.includes("popcorn_trigger_seconds") && body.popcornTriggerSeconds !== undefined) {
    updates.popcorn_trigger_seconds = parsePositiveInteger(body.popcornTriggerSeconds);
  }

  return updates;
}

export function validateAuctionDates(startTimeValue, endTimeValue, requireFutureEndTime = false) {
  const startTime = new Date(startTimeValue);
  const endTime = new Date(endTimeValue);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return "Start time and end time must be valid dates.";
  }
  if (endTime <= startTime) {
    return "End time must be after start time.";
  }
  if (requireFutureEndTime && endTime <= new Date()) {
    return "End time must be in the future.";
  }

  return null;
}

export function validateAuctionUpdateDates(existingAuction, updates) {
  return validateAuctionDates(
    updates.start_time || existingAuction.start_time,
    updates.end_time || existingAuction.end_time,
    updates.end_time !== undefined
  );
}

export function getVendorEditableFields(auction, bidCount) {
  const hasStarted = new Date(auction.start_time) <= new Date();

  if (auction.status === "pending") {
    return [
      "item_name",
      "description",
      "min_bid",
      "image_url",
      "start_time",
      "end_time",
      "popcorn_enabled",
      "popcorn_extension_minutes",
      "popcorn_trigger_seconds",
    ];
  }

  if ((auction.status === "approved" || auction.status === "active") && bidCount === 0 && !hasStarted) {
    return ["description", "end_time", "popcorn_enabled", "popcorn_extension_minutes", "popcorn_trigger_seconds"];
  }

  return null;
}

export function getAdminEditableFields(hasBids) {
  if (hasBids) {
    return ["description", "end_time"];
  }

  return [
    "item_name",
    "description",
    "min_bid",
    "image_url",
    "start_time",
    "end_time",
    "popcorn_enabled",
    "popcorn_extension_minutes",
    "popcorn_trigger_seconds",
  ];
}

export function validateAuctionUpdates(updates) {
  if (Object.keys(updates).length === 0) {
    return "No valid auction fields provided.";
  }
  if (updates.min_bid === null) {
    return "Minimum bid must be a positive number.";
  }
  const popcornLimitError = validatePopcornLimits(updates);
  if (popcornLimitError) return popcornLimitError;

  return null;
}

function validatePopcornLimits(values) {
  if (values.popcorn_extension_minutes !== undefined) {
    const minutes = values.popcorn_extension_minutes;
    if (
      minutes === null ||
      minutes < POPCORN_EXTENSION_MINUTES_MIN ||
      minutes > POPCORN_EXTENSION_MINUTES_MAX
    ) {
      return `Popcorn extension minutes must be between ${POPCORN_EXTENSION_MINUTES_MIN} and ${POPCORN_EXTENSION_MINUTES_MAX}.`;
    }
  }

  if (values.popcorn_trigger_seconds !== undefined) {
    const seconds = values.popcorn_trigger_seconds;
    if (
      seconds === null ||
      seconds < POPCORN_TRIGGER_SECONDS_MIN ||
      seconds > POPCORN_TRIGGER_SECONDS_MAX
    ) {
      return `Popcorn trigger seconds must be between ${POPCORN_TRIGGER_SECONDS_MIN} and ${POPCORN_TRIGGER_SECONDS_MAX}.`;
    }
  }

  return null;
}
