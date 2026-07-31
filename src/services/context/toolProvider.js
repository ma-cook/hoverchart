import useCodeStore from '../../stores/codeStore';
import useDiagramStore from '../../stores/diagramStore';
import useObjectsStore from '../../stores/objectsStore';
import { REGISTRY } from './skillManager';

class ToolDefinition {
  constructor({ name, description, parameters, availableWhen, required }) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this.required = required;
    this.availableWhen = availableWhen ?? (() => true);
  }

  toToolSpec() {
    const props = {};
    const requiredParams = [];
    for (const [key, def] of Object.entries(this.parameters)) {
      props[key] = { type: def.type, description: def.description };
      if (def.required !== false) requiredParams.push(key);
    }
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: props,
          ...(requiredParams.length > 0 ? { required: requiredParams } : {}),
        },
      },
    };
  }
}

function hasLspMetadata() {
  try {
    const lsp = useDiagramStore.getState().lspMetadata;
    return !!(lsp?.definitions?.length || lsp?.references?.length || lsp?.hover?.length || lsp?.callGraph?.length);
  } catch { return false; }
}

function hasCommunities() {
  try {
    const communities = useDiagramStore.getState().communities;
    return !!(communities && communities.length > 0);
  } catch { return false; }
}

function hasContentIndex() {
  try {
    const ci = useCodeStore.getState().contentIndex;
    return !!ci;
  } catch { return false; }
}

function hasImportGraph() {
  try {
    const ig = useCodeStore.getState().importGraph;
    return !!ig;
  } catch { return false; }
}

function filesReadCount() {
  try {
    const objects = useObjectsStore.getState().objects || [];
    return objects.length;
  } catch { return 0; }
}

export const NAVIGATION_TOOLS = [
  new ToolDefinition({
    name: 'quick_look',
    description: 'Quick preview of a file — shows the first N lines (and optionally last N lines). Faster than read_file for checking imports, exports, or overall structure without loading the entire file.',
    parameters: {
      path: { type: 'string', description: 'File path relative to repo root' },
      head: { type: 'number', description: 'Number of lines from the top (default 40)' },
      tail: { type: 'number', description: 'Number of lines from the bottom (default 20, 0 to disable)' },
    },
    required: ['path'],
  }),
  new ToolDefinition({
    name: 'file_outline',
    description: 'Get a structural outline of a file: function names, component names, exports, hooks, state variables, and their line numbers. Use this FIRST to understand file structure before reading full content.',
    parameters: {
      path: { type: 'string', description: 'File path relative to repo root' },
    },
    required: ['path'],
  }),
  new ToolDefinition({
    name: 'read_file',
    description: 'Read the contents of a file from the repository. Returns up to 8000 lines by default. Each line is prefixed with its line number. Use offset to read later sections of large files.',
    parameters: {
      path: { type: 'string', description: 'File path relative to repo root' },
      offset: { type: 'number', description: 'Line number to start reading from (default 1)' },
      limit: { type: 'number', description: 'Max lines to return (default 8000)' },
    },
    required: ['path'],
  }),
  new ToolDefinition({
    name: 'list_files',
    description: 'List files in a directory. Returns file names and subdirectories.',
    parameters: {
      path: { type: 'string', description: 'Directory path relative to repo root. Use "" for root.' },
    },
  }),
  new ToolDefinition({
    name: 'search_code',
    description: 'Search for files matching a pattern or containing specific text. Returns matching file paths and graph context.',
    parameters: {
      pattern: { type: 'string', description: 'Search term or glob pattern' },
    },
    required: ['pattern'],
  }),
];

export const GRAPH_TOOLS = [
  new ToolDefinition({
    name: 'get_node_info',
    description: 'Get full details about a component/function/store in the diagram: its type, file path, all connections, parent, and children.',
    parameters: {
      nodeId: { type: 'string', description: 'The node ID from the diagram' },
    },
    required: ['nodeId'],
  }),
  new ToolDefinition({
    name: 'get_dependencies',
    description: 'Find what depends on a node (upstream) or what the node depends on (downstream).',
    parameters: {
      nodeId: { type: 'string', description: 'The node ID to check dependencies for' },
      direction: { type: 'string', enum: ['upstream', 'downstream', 'both'], description: '"upstream", "downstream", or "both" (default)' },
    },
    required: ['nodeId'],
  }),
  new ToolDefinition({
    name: 'find_path',
    description: 'Find the shortest data-flow path between two components in the diagram.',
    parameters: {
      source: { type: 'string', description: 'Starting node ID' },
      target: { type: 'string', description: 'Ending node ID' },
    },
    required: ['source', 'target'],
  }),
  new ToolDefinition({
    name: 'search_nodes',
    description: 'Search for components, functions, stores, or hooks by name or type in the diagram.',
    parameters: {
      query: { type: 'string', description: 'Search term matching node names, types, and IDs' },
    },
    required: ['query'],
  }),
];

export const COMMUNITY_TOOLS = [
  new ToolDefinition({
    name: 'get_community_info',
    description: 'Get architectural overview of a community: its summary, node count, key components, internal and external connections.',
    parameters: {
      communityId: { type: 'number', description: 'The community ID (number, e.g. 0, 1, 2...)' },
    },
    required: ['communityId'],
    availableWhen: hasCommunities,
  }),
  new ToolDefinition({
    name: 'get_community_nodes',
    description: 'List all nodes in a community with their types and file paths.',
    parameters: {
      communityId: { type: 'number', description: 'The ID of the community to list nodes for' },
    },
    required: ['communityId'],
    availableWhen: hasCommunities,
  }),
  new ToolDefinition({
    name: 'search_communities',
    description: 'Search communities by keyword (name, node types, file paths). Returns matching communities with summaries.',
    parameters: {
      query: { type: 'string', description: 'Search term (e.g. "auth", "database", "dashboard")' },
    },
    required: ['query'],
    availableWhen: hasCommunities,
  }),
];

export const LSP_TOOLS = [
  new ToolDefinition({
    name: 'get_lsp_definition',
    description: 'Resolve where an import resolves to across the codebase using LSP type information.',
    parameters: {
      query: { type: 'string', description: 'Import name, file name, or symbol name' },
    },
    required: ['query'],
    availableWhen: hasLspMetadata,
  }),
  new ToolDefinition({
    name: 'get_lsp_references',
    description: 'Find all files that reference a given symbol using LSP.',
    parameters: {
      query: { type: 'string', description: 'Symbol name, file name, or export name' },
    },
    required: ['query'],
    availableWhen: hasLspMetadata,
  }),
  new ToolDefinition({
    name: 'get_lsp_type_info',
    description: 'Get type signatures and documentation for a symbol from LSP.',
    parameters: {
      query: { type: 'string', description: 'Symbol name' },
    },
    required: ['query'],
    availableWhen: hasLspMetadata,
  }),
  new ToolDefinition({
    name: 'get_lsp_call_graph',
    description: 'Show the call graph for a function — who calls it, and what it calls.',
    parameters: {
      query: { type: 'string', description: 'Function name or file name' },
    },
    required: ['query'],
    availableWhen: hasLspMetadata,
  }),
  new ToolDefinition({
    name: 'get_lsp_overview',
    description: 'Get a summary of available LSP metadata.',
    parameters: {},
    availableWhen: hasLspMetadata,
  }),
];

export const MODIFICATION_TOOLS = [
  new ToolDefinition({
    name: 'edit',
    description: 'Make a targeted edit to a file by replacing an exact string match. Use for modifications — more precise than regenerating the whole file. You MUST call read_file first to get the current content.',
    parameters: {
      filePath: { type: 'string', description: 'File path relative to repo root' },
      oldString: { type: 'string', description: 'The exact string to find and replace' },
      newString: { type: 'string', description: 'The replacement string' },
    },
    required: ['filePath', 'oldString', 'newString'],
    availableWhen: () => filesReadCount() > 0,
  }),
  new ToolDefinition({
    name: 'write',
    description: 'Create a new file or completely overwrite an existing file. Use for NEW files only. For modifying existing files, use edit instead.',
    parameters: {
      filePath: { type: 'string', description: 'File path relative to repo root' },
      content: { type: 'string', description: 'The complete file content' },
    },
    required: ['filePath', 'content'],
  }),
];

export const SUB_AGENT_TOOL = [
  new ToolDefinition({
    name: 'task',
    description: 'Spawn a sub-agent to research a question about the codebase. The sub-agent can read files, search code, and query the graph — but cannot modify anything.',
    parameters: {
      prompt: { type: 'string', description: 'Clear, specific research question for the sub-agent' },
    },
    required: ['prompt'],
  }),
];

export const SKILL_MANAGEMENT_TOOLS = [
  new ToolDefinition({
    name: 'list_skills',
    description: 'List all available skills and their descriptions. Use this to discover what context sources and tool sets are available.',
    parameters: {},
  }),
  new ToolDefinition({
    name: 'activate_skill',
    description: 'Activate a skill by name to load its instructions and make its tools available. Use list_skills first to see available skills.',
    parameters: {
      skill_name: { type: 'string', description: 'The name of the skill to activate' },
    },
    required: ['skill_name'],
  }),
  new ToolDefinition({
    name: 'deactivate_skill',
    description: 'Deactivate a skill by name to remove its instructions and tools from the current session.',
    parameters: {
      skill_name: { type: 'string', description: 'The name of the skill to deactivate' },
    },
    required: ['skill_name'],
  }),
];

const ALL_TOOL_GROUPS = [
  { group: 'always', tools: NAVIGATION_TOOLS },
  { group: 'conditional', tools: [...GRAPH_TOOLS, ...COMMUNITY_TOOLS, ...LSP_TOOLS, ...MODIFICATION_TOOLS, ...SUB_AGENT_TOOL] },
];

const EXPLORATION_TOOL_NAMES = new Set([
  'read_file', 'search_code', 'list_files', 'file_outline', 'quick_look',
  'glob', 'search_nodes', 'get_node_info', 'get_dependencies', 'find_path',
  'task',
]);

export function computeTools(opts = {}) {
  const { excludeExplorationTools = false } = opts;
  const always = [...SKILL_MANAGEMENT_TOOLS, ...NAVIGATION_TOOLS];
  const conditional = [...GRAPH_TOOLS, ...COMMUNITY_TOOLS, ...LSP_TOOLS, ...MODIFICATION_TOOLS, ...SUB_AGENT_TOOL];
  const available = [];

  for (const tool of always) {
    available.push(tool.toToolSpec());
  }

  const activeSkillNames = REGISTRY.getActiveSkillNames();
  const skillTools = getToolsForActiveSkills(activeSkillNames);
  const combined = [...conditional, ...skillTools];

  const seenNames = new Set(available.map(t => t.function.name));
  for (const tool of combined) {
    if (seenNames.has(tool.name)) continue;
    if (tool.availableWhen()) {
      available.push(tool.toToolSpec());
      seenNames.add(tool.name);
    }
  }

  if (excludeExplorationTools) {
    return available.filter(t => !EXPLORATION_TOOL_NAMES.has(t.function.name));
  }

  return available;
}

export function computeSubAgentTools() {
  const subTools = [...NAVIGATION_TOOLS, ...GRAPH_TOOLS, ...LSP_TOOLS, ...COMMUNITY_TOOLS];
  const available = [];
  const seenNames = new Set();
  for (const tool of subTools) {
    if (seenNames.has(tool.name)) continue;
    if (tool.availableWhen()) {
      available.push(tool.toToolSpec());
      seenNames.add(tool.name);
    }
  }
  return available;
}

export function getToolsForActiveSkills(activeSkills) {
  const tools = [];
  for (const skillName of activeSkills) {
    const skillTools = SKILL_TO_TOOLS.get(skillName);
    if (skillTools) {
      tools.push(...skillTools);
    }
  }
  return tools;
}

const SKILL_TO_TOOLS = new Map([
  ['component-graph', GRAPH_TOOLS],
  ['community-architecture', COMMUNITY_TOOLS],
  ['lsp-semantics', LSP_TOOLS],
  ['code-modification', MODIFICATION_TOOLS],
  ['deep-research', SUB_AGENT_TOOL],
]);

export function getToolByName(name) {
  const all = [...NAVIGATION_TOOLS, ...GRAPH_TOOLS, ...COMMUNITY_TOOLS, ...LSP_TOOLS, ...MODIFICATION_TOOLS, ...SUB_AGENT_TOOL, ...SKILL_MANAGEMENT_TOOLS];
  return all.find(t => t.name === name);
}
