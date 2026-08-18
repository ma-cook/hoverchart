import useCodeStore from '../../stores/codeStore';
import useDiagramStore from '../../stores/diagramStore';
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

export const CONTROL_TOOLS = [
  new ToolDefinition({
    name: 'set_mode',
    description: 'Tell the harness which tool set to make available next round. "research" = all search/read/graph tools. "edit" = only edit, write, read_file, LSP verification tools, and set_mode. Call set_mode("edit") once you have located the exact text for every change you intend to make. If an edit needs more information or verification fails, call set_mode("research") to search again, then set_mode("edit") to resume editing.',
    parameters: {
      mode: { type: 'string', description: '"research" (all search/read tools) or "edit" (only edit/write/read_file + LSP verification)' },
    },
    required: ['mode'],
  }),
];

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
  }),
  new ToolDefinition({
    name: 'write',
    description: 'Create a NEW file that does not already exist in the repository. The tool REJECTS paths that already exist — do not attempt it on existing files. For modifying existing files, use edit instead.',
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

export const PLAN_TOOLS = [
  new ToolDefinition({
    name: 'create_plan',
    description: 'Create a new task plan. Use this when the user\'s request has multiple actions or steps. Call this first, then add_task for each step.',
    parameters: {
      title: { type: 'string', description: 'Short title for the plan (e.g. "Refactor auth module")' },
    },
    required: ['title'],
  }),
  new ToolDefinition({
    name: 'add_task',
    description: 'Add a task to the active plan. Call create_plan first if no plan exists.',
    parameters: {
      text: { type: 'string', description: 'Description of the task to add' },
    },
    required: ['text'],
  }),
  new ToolDefinition({
    name: 'complete_task',
    description: 'Mark a task as completed. You can pass the task text (partial match) or the task ID.',
    parameters: {
      task: { type: 'string', description: 'Task text (partial match) or task ID to complete' },
    },
    required: ['task'],
  }),
  new ToolDefinition({
    name: 'get_plan',
    description: 'View the current active plan and its tasks. Use this to check what tasks exist and which are done.',
    parameters: {},
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
  { group: 'always', tools: [...CONTROL_TOOLS, ...NAVIGATION_TOOLS, ...PLAN_TOOLS] },
  { group: 'conditional', tools: [...GRAPH_TOOLS, ...COMMUNITY_TOOLS, ...LSP_TOOLS, ...MODIFICATION_TOOLS, ...SUB_AGENT_TOOL] },
];

// Whitelist for EDIT mode: the model can only modify files, read for exact
// oldString / verification, verify symbols via LSP, and switch modes. All
// search/list/graph/skill tools drop off until set_mode("research").
// Plan tools are always available in every mode.
const EDIT_MODE_TOOL_NAMES = new Set([
  'edit', 'write', 'read_file', 'set_mode',
  'get_lsp_definition', 'get_lsp_references', 'get_lsp_type_info', 'get_lsp_call_graph', 'get_lsp_overview',
  'create_plan', 'add_task', 'complete_task', 'get_plan',
]);

// read_file is intentionally NOT in this list — in force-generation mode the
// LLM still needs read_file to get exact oldString for the edit tool and to
// verify its edits. Only broad search/list/graph tools are stripped.
const EXPLORATION_TOOL_NAMES = new Set([
  'search_code', 'list_files', 'file_outline', 'quick_look',
  'glob', 'search_nodes', 'get_node_info', 'get_dependencies', 'find_path',
  'task',
]);

export function computeTools(opts = {}) {
  const { excludeExplorationTools = false, excludeReadTool = false, mode = 'research' } = opts;
  const always = [...SKILL_MANAGEMENT_TOOLS, ...CONTROL_TOOLS, ...NAVIGATION_TOOLS, ...PLAN_TOOLS];
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

  let result = available;

  if (excludeExplorationTools) {
    result = result.filter(t => !EXPLORATION_TOOL_NAMES.has(t.function.name));
  }

  if (excludeReadTool) {
    result = result.filter(t => t.function.name !== 'read_file');
  }

  if (mode === 'edit') {
    result = result.filter(t => EDIT_MODE_TOOL_NAMES.has(t.function.name));
  }

  return result;
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
  const all = [...CONTROL_TOOLS, ...NAVIGATION_TOOLS, ...GRAPH_TOOLS, ...COMMUNITY_TOOLS, ...LSP_TOOLS, ...MODIFICATION_TOOLS, ...SUB_AGENT_TOOL, ...PLAN_TOOLS, ...SKILL_MANAGEMENT_TOOLS];
  return all.find(t => t.name === name);
}
