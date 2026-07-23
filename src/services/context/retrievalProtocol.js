export function stripRetrievalMarkers(text) {
  return text.replace(/\[RETRIEVE:[^\]]+\]/g, '').trim();
}
