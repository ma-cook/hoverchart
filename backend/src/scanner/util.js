/** Shared sleep helper for the Node scanner adapters. */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));