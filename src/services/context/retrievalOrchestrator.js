import { sendToZen } from '../zenService';
import {
  detectRetrievalRequest,
  stripRetrievalMarkers,
  buildRetrievalInjection,
  MAX_RETRIEVAL_ROUNDS,
  isGithubFileRequest,
  extractGithubPath,
} from './retrievalProtocol';
import { getBase64Store } from './base64Store';
import { getContentStore, ContentCategory } from './contentStore';
import { fetchFileContent } from '../githubRepoService';

async function fetchGithubFiles(ids, githubContext) {
  const { owner, repo, token } = githubContext;
  const contentStore = getContentStore();
  const base64Store = getBase64Store();
  const results = [];

  for (const id of ids) {
    const filePath = extractGithubPath(id);
    const storeId = `github:${filePath}`;
    const repoStoreId = `repo:${filePath}`;

    const existing = contentStore.getEntry(storeId) || contentStore.getEntry(repoStoreId);
    if (existing) {
      const chunks = base64Store.getChunks(existing.chunks.map(c => c.id));
      if (chunks.length > 0) {
        results.push(...chunks);
        continue;
      }
    }

    const content = await fetchFileContent(owner, repo, filePath, token);
    if (!content) {
      console.warn(`[Retrieval] GitHub file not found: ${filePath}`);
      continue;
    }

    contentStore.upsert(storeId, ContentCategory.REPO_FILE, content, {
      sourcePath: filePath,
      tags: ['github', 'repo', 'code'],
    });

    const entry = contentStore.getEntry(storeId);
    if (entry) {
      for (const chunk of entry.chunks) {
        const b64 = btoa(unescape(encodeURIComponent(chunk.text)));
        base64Store.encodedChunks.set(chunk.id, {
          b64,
          meta: {
            entryId: storeId,
            sourcePath: filePath,
            category: ContentCategory.REPO_FILE,
            keywords: chunk.keywords,
            charCount: chunk.charCount,
            byteSize: b64.length,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
          },
        });
      }
      results.push(...base64Store.getChunks(entry.chunks.map(c => c.id)));
    }
  }

  return results;
}

export async function sendWithRetrieval({
  messages,
  onChunk,
  signal,
  onRetrieval,
  githubContext,
}) {
  const base64Store = getBase64Store();
  let currentMessages = [...messages];
  let finalText = '';
  let rounds = 0;

  while (rounds <= MAX_RETRIEVAL_ROUNDS) {
    let streamedText = '';
    console.log(`[Retrieval] Round ${rounds}/${MAX_RETRIEVAL_ROUNDS} - sending ${currentMessages.length} messages`);

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
    console.log(`[Retrieval] Round ${rounds} complete. Response length: ${finalText.length} chars`);

    const retrievalIds = detectRetrievalRequest(finalText);

    if (!retrievalIds || rounds >= MAX_RETRIEVAL_ROUNDS) {
      break;
    }

    onRetrieval?.({ chunkIds: retrievalIds, round: rounds + 1 });

    const regularIds = retrievalIds.filter(id => !isGithubFileRequest(id));
    const githubIds = retrievalIds.filter(id => isGithubFileRequest(id));

    let chunks = base64Store.getChunks(regularIds);

    if (githubIds.length > 0 && githubContext) {
      const githubChunks = await fetchGithubFiles(githubIds, githubContext);
      chunks = [...chunks, ...githubChunks];
    }

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
