export const RETRIEVAL_PROTOCOL_PROMPT = `
═══════════════════════════════════════════════════════════════
CONTEXT RETRIEVAL PROTOCOL
═══════════════════════════════════════════════════════════════

The system maintains an indexed store of repository files and previous context.
A CONTENT INDEX is provided above listing all available content with chunk IDs.

When you need to see specific file contents or detailed context that isn't
included in the current message, emit a retrieval request:

  [RETRIEVE:chunk-id-1,chunk-id-2]

Rules:
1. You may request up to 5 chunks per retrieval call
2. The system will inject the retrieved content and you can continue
3. Maximum 3 retrieval rounds per response
4. If the index doesn't contain what you need, say so -- don't guess
5. The retrieval markers [RETRIEVE:...] will be stripped from your output
6. After retrieval, continue your response naturally with the new context

Example:
  User: "Explain how the authentication flow works"
  You: "Let me look at the auth-related files.
        [RETRIEVE:chunk-12,chunk-15,chunk-23]"
  (System injects the auth files)
  You: "Based on the authentication service code, here's how the flow works..."

═══════════════════════════════════════════════════════════════
`;

export const RETRIEVAL_PROTOCOL_PROMPT_CONDENSED = `
CONTEXT RETRIEVAL: Content index above. To load files, emit [RETRIEVE:chunk-id]. Max 5 chunks, 3 rounds.
`;
