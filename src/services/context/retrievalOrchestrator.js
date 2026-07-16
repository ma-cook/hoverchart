import { sendToZen } from '../zenService';
import {
  detectRetrievalRequest,
  stripRetrievalMarkers,
  buildRetrievalInjection,
  MAX_RETRIEVAL_ROUNDS,
} from './retrievalProtocol';
import { getBase64Store } from './base64Store';

export async function sendWithRetrieval({
  messages,
  onChunk,
  signal,
  onRetrieval,
}) {
  const base64Store = getBase64Store();
  let currentMessages = [...messages];
  let finalText = '';
  let rounds = 0;

  while (rounds <= MAX_RETRIEVAL_ROUNDS) {
    let streamedText = '';

    const result = await sendToZen({
      messages: currentMessages,
      signal,
      onChunk: (delta, fullText) => {
        streamedText = fullText;
        const cleaned = stripRetrievalMarkers(fullText);
        onChunk?.(delta, cleaned);
      },
    });

    finalText = streamedText || result;

    const retrievalIds = detectRetrievalRequest(finalText);

    if (!retrievalIds || rounds >= MAX_RETRIEVAL_ROUNDS) {
      break;
    }

    onRetrieval?.({ chunkIds: retrievalIds, round: rounds + 1 });

    const chunks = base64Store.getChunks(retrievalIds);

    if (chunks.length === 0) {
      break;
    }

    const injection = buildRetrievalInjection(chunks);
    const cleanedAssistant = stripRetrievalMarkers(finalText);

    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: cleanedAssistant },
      injection,
    ];

    rounds++;
  }

  return stripRetrievalMarkers(finalText);
}
