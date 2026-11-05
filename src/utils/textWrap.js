const BREAK_AFTER = /[\s/\\.,\-_]/;
const UPPERCASE = /[A-Z]/;
const LOWERCASE_OR_DIGIT = /[a-z0-9]/;
const LOWERCASE = /[a-z]/;

function tokenize(text) {
  const chars = Array.from(text);
  const tokens = [];
  let token = '';

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const prev = chars[i - 1];
    const next = chars[i + 1];

    const camelBoundary =
      i > 0 &&
      UPPERCASE.test(char) &&
      (LOWERCASE_OR_DIGIT.test(prev) ||
        (UPPERCASE.test(prev) && next != null && LOWERCASE.test(next)));

    if (camelBoundary && token) {
      tokens.push(token);
      token = '';
    }

    token += char;

    if (BREAK_AFTER.test(char)) {
      tokens.push(token);
      token = '';
    }
  }

  if (token) tokens.push(token);
  return tokens;
}

function splitToken(token, maxWidth, measure) {
  const chars = Array.from(token);
  if (chars.length <= 1) return [token];

  const totalWidth = measure(token);
  if (totalWidth <= maxWidth) return [token];

  const chunkCount = Math.max(1, Math.ceil(totalWidth / maxWidth));
  const targetWidth = totalWidth / chunkCount;
  const chunks = [];
  let chunk = '';

  for (const char of chars) {
    const candidate = chunk + char;

    if (
      chunk &&
      (measure(candidate) > maxWidth ||
        (measure(candidate) > targetWidth && chunks.length < chunkCount - 1))
    ) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk = candidate;
    }
  }

  if (chunk) chunks.push(chunk);
  return chunks;
}

function wrapParagraph(ctx, paragraph, maxWidth) {
  const measure = (value) => ctx.measureText(value).width;

  if (measure(paragraph) <= maxWidth) return [paragraph];

  const tokens = tokenize(paragraph);
  const lines = [];
  let current = '';

  for (const token of tokens) {
    const candidate = current + token;

    if (measure(candidate.trimEnd()) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current.trim()) lines.push(current.trimEnd());

    const trimmed = token.trimStart();
    if (!trimmed) {
      current = '';
      continue;
    }

    if (measure(trimmed) <= maxWidth) {
      current = trimmed;
      continue;
    }

    const chunks = splitToken(trimmed, maxWidth, measure);
    for (let i = 0; i < chunks.length - 1; i++) {
      lines.push(chunks[i]);
    }
    current = chunks[chunks.length - 1];
  }

  if (current.trim()) lines.push(current.trimEnd());
  return lines.length > 0 ? lines : [paragraph];
}

export function wrapTextToWidth(ctx, text, maxWidth) {
  const value = text == null ? '' : String(text);
  if (!value) return [''];
  if (!ctx || !Number.isFinite(maxWidth) || maxWidth <= 0) {
    return value.split(/\r?\n/);
  }

  const paragraphs = value.split(/\r?\n/);
  const lines = [];

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('');
      continue;
    }
    lines.push(...wrapParagraph(ctx, paragraph, maxWidth));
  }

  return lines.length > 0 ? lines : [''];
}
