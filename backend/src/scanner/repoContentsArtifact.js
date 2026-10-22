import { gzip, gunzip } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

const ARTIFACT_VERSION = 1;

export function buildRepoContentsArtifact({
  repoOwner,
  repoName,
  branch,
  commitSha,
  fileContents,
}) {
  const contents = fileContents && typeof fileContents === 'object' ? fileContents : {};
  return {
    version: ARTIFACT_VERSION,
    repoOwner: repoOwner || null,
    repoName: repoName || null,
    branch: branch || null,
    commitSha: commitSha || null,
    fileTree: Object.keys(contents),
    fileContents: contents,
  };
}

export function mergeRepoFileContents(previous, changed, deletedFiles = []) {
  const merged = { ...(previous || {}) };
  for (const filePath of deletedFiles) {
    if (filePath) delete merged[filePath];
  }
  for (const [filePath, content] of Object.entries(changed || {})) {
    if (typeof content === 'string') merged[filePath] = content;
  }
  return merged;
}

export async function serializeRepoContentsArtifact(artifact) {
  return gzipAsync(Buffer.from(JSON.stringify(artifact)));
}

export async function parseRepoContentsArtifact(buffer) {
  const json = await gunzipAsync(buffer);
  const parsed = JSON.parse(json.toString('utf8'));
  if (
    !parsed ||
    parsed.version !== ARTIFACT_VERSION ||
    !parsed.fileContents ||
    typeof parsed.fileContents !== 'object'
  ) {
    throw new Error('Invalid repo contents artifact');
  }
  return parsed;
}
