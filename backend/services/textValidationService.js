const EMOJI_PATTERN = /[\p{Extended_Pictographic}\uFE0F]/u;

export function getEmojiValidationError(label, value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return EMOJI_PATTERN.test(String(value)) ? `Emoji are not allowed in ${label}.` : null;
}

export function getTextFieldsValidationError(fields) {
  for (const field of fields) {
    const error = getEmojiValidationError(field.label, field.value);
    if (error) return error;
  }

  return null;
}
