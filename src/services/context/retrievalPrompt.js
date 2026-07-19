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

You can also request any file from the connected GitHub repository by its path:

  [RETRIEVE:github:src/components/Button.jsx]
  [RETRIEVE:github:src/hooks/useAuth.ts]
  [RETRIEVE:github:lib/utils.js]

This fetches the full file content directly from the repository. Use this when
you need to see an existing file's code before modifying it, especially for
files not shown in "Existing Key Files" above.

Example:
  User: "Add a loading state to the Button component"
  You: "Let me first look at the current Button component.
        [RETRIEVE:github:src/components/Button.jsx]"
  (System injects the full file content)
  You: "I can see the current implementation. Here's the modified version
        with a loading state added..."

═══════════════════════════════════════════════════════════════
`;

export const RETRIEVAL_PROTOCOL_PROMPT_CONDENSED = `
CONTEXT RETRIEVAL: Content index above. To load files, emit [RETRIEVE:chunk-id]. Max 5 chunks, 3 rounds.
`;
