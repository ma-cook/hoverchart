import { buildFileTreeSection, buildComponentIndex, buildContentIndexSection, buildImportGraphSection, buildCommunitySection, buildLspOverviewSection, buildGraphSummary } from '../zenService';
import useDiagramStore from '../../stores/diagramStore';
import useObjectsStore from '../../stores/objectsStore';
import { getContentStore } from './contentStore';
import { joinChunks } from './chunkIndex';

class Skill {
  constructor({ name, description, instructions, tools, buildInstructions }) {
    this.name = name;
    this.description = description;
    this._instructions = instructions;
    this._buildInstructions = buildInstructions;
    this.tools = tools ?? [];
  }

  getInstructions() {
    if (this._instructions) return this._instructions;
    if (this._buildInstructions) return this._buildInstructions();
    return '';
  }

  toDescriptor() {
    return { name: this.name, description: this.description };
  }
}

class SkillRegistry {
  constructor() {
    this._skills = new Map();
    this._activeSkills = new Set();
  }

  register(skill) {
    if (!(skill instanceof Skill)) {
      throw new Error('SkillRegistry.register() requires a Skill instance');
    }
    this._skills.set(skill.name, skill);
  }

  registerAll(skills) {
    for (const skill of skills) {
      this.register(skill);
    }
  }

  getSkill(name) {
    return this._skills.get(name) ?? null;
  }

  activate(name) {
    const skill = this._skills.get(name);
    if (!skill) return null;
    this._activeSkills.add(name);
    return skill;
  }

  deactivate(name) {
    this._activeSkills.delete(name);
  }

  isActive(name) {
    return this._activeSkills.has(name);
  }

  getActiveSkills() {
    return [...this._activeSkills].map(name => this._skills.get(name)).filter(Boolean);
  }

  getActiveSkillNames() {
    return [...this._activeSkills];
  }

  getActiveToolSets() {
    const tools = [];
    for (const name of this._activeSkills) {
      const skill = this._skills.get(name);
      if (skill) tools.push(...skill.tools);
    }
    return tools;
  }

  getAvailableDescriptors() {
    return [...this._skills.values()].map(s => s.toDescriptor());
  }

  formatAvailableSkills() {
    const descriptors = this.getAvailableDescriptors();
    if (descriptors.length === 0) return '(no skills available)';
    return descriptors.map(d => `• ${d.name}: ${d.description}`).join('\n');
  }

  formatActiveSkills() {
    if (this._activeSkills.size === 0) return '(no skills active)';
    return [...this._activeSkills].join(', ');
  }
}

function buildSceneContext() {
  try {
    const objects = useObjectsStore.getState().objects || [];
    const lines = [];
    let charCount = 0;
    const BUDGET = 2000;
    for (const obj of objects) {
      if (!obj.merfolkData?.nodeId) continue;
      const nodeId = obj.merfolkData.nodeId;
      const nodeType = obj.merfolkData.nodeType || obj.type || 'unknown';
      const name = obj.headerText || nodeId;
      const filePath = obj.merfolkData?.codeFilePath || obj.metadata?.codeFilePath || '';
      const line = filePath ? `[${nodeId}] ${nodeType} — "${name}" → ${filePath}` : `[${nodeId}] ${nodeType} — "${name}"`;
      if (charCount + line.length + 1 > BUDGET) continue;
      lines.push(line);
      charCount += line.length + 1;
    }
    return lines.length > 0 ? lines.join('\n') : '(no scene components)';
  } catch {
    return '(no scene components)';
  }
}

function buildGraphSummarySection() {
  try {
    const diagramStore = useDiagramStore.getState();
    return buildGraphSummary({ graphs: diagramStore.graphs, hierarchy: diagramStore.hierarchy });
  } catch {
    return '';
  }
}

export const REGISTRY = new SkillRegistry();

export function initializeDefaultSkills(repoContext) {
  const fileTree = repoContext?.fileTree;
  const fileSizes = repoContext?.fileSizes;
  const sceneObjects = repoContext?.sceneObjects ?? [];

  REGISTRY.registerAll([
    new Skill({
      name: 'file-tree',
      description: 'Browse the repository file structure with file sizes',
      buildInstructions: () => {
        const section = buildFileTreeSection(fileTree, fileSizes);
        return `REPOSITORY FILE TREE:\n${section}`;
      },
    }),
    new Skill({
      name: 'component-graph',
      description: 'Query the component dependency graph: node info, dependencies, data flow paths, and node search',
      buildInstructions: () => {
        const parts = [];
        const compIdx = buildComponentIndex(sceneObjects);
        parts.push(`COMPONENT INDEX (component → file):\n${compIdx}`);
        const graphSummary = buildGraphSummarySection();
        if (graphSummary) parts.push(graphSummary);
        return parts.join('\n\n');
      },
    }),
    new Skill({
      name: 'architecture-map',
      description: 'Get the full architecture map of the scanned repository: component → file index, dependency graph summary, the raw Merfolk diagram, and detected architectural communities',
      buildInstructions: () => {
        const parts = [];
        const compIdx = buildComponentIndex(useObjectsStore.getState().objects);
        parts.push(`COMPONENT INDEX (component → file):\n${compIdx}`);
        const graphSummary = buildGraphSummarySection();
        if (graphSummary) parts.push(graphSummary);
        const communities = buildCommunitySection();
        parts.push(`ARCHITECTURAL COMMUNITIES:\n${communities}`);
        try {
          const entry = getContentStore().getEntry('merfolk:diagram');
          if (entry) {
            const fullText = joinChunks(entry.chunks);
            const excerpt = fullText.length > 3000 ? fullText.slice(0, 3000) + '\n... (diagram truncated)' : fullText;
            parts.push(`MERFOLK DIAGRAM (excerpt):\n${excerpt}`);
          }
        } catch {
          /* ignore */
        }
        return parts.join('\n\n');
      },
    }),
    new Skill({
      name: 'import-analysis',
      description: 'Examine the import graph and content index to understand file exports, dependencies, and symbol usage',
      buildInstructions: () => {
        const parts = [];
        const ci = buildContentIndexSection();
        parts.push(`CONTENT INDEX (HTML elements, CSS classes, JSX refs → file):\n${ci}`);
        const ig = buildImportGraphSection();
        parts.push(`IMPORT GRAPH (file → files it imports):\n${ig}`);
        return parts.join('\n\n');
      },
    }),
    new Skill({
      name: 'community-architecture',
      description: 'Explore architectural subsystems (communities) detected via graph clustering — shows module groupings and their summaries',
      buildInstructions: () => {
        const communities = buildCommunitySection();
        return `ARCHITECTURAL COMMUNITIES:\n${communities}`;
      },
    }),
    new Skill({
      name: 'lsp-semantics',
      description: 'Use LSP (Language Server Protocol) data to resolve definitions, find references, inspect type signatures, and explore call graphs',
      buildInstructions: () => {
        const lsp = buildLspOverviewSection();
        return `LSP SEMANTIC ANALYSIS:\n${lsp}`;
      },
    }),
    new Skill({
      name: 'code-modification',
      description: 'Read, edit, and write files in the repository. Includes read_file, edit, write, file_outline, quick_look tools',
      buildInstructions: () => {
        return `CODE MODIFICATION: You have access to read, edit, and write tools.\nRULES:\n1. Call read_file before editing any file\n2. Use edit for modifications, write only for new files\n3. oldString must be exact text from read_file output including whitespace`;
      },
    }),
    new Skill({
      name: 'deep-research',
      description: 'Spawn a sub-agent to conduct research about the codebase. The sub-agent can read files and search the graph but cannot modify anything',
      buildInstructions: () => {
        return 'DEEP RESEARCH: Use the task tool to spawn a sub-agent for complex exploration tasks';
      },
    }),
  ]);
}

export const SKILL_MANAGEMENT_TOOL_DEFS = [
  {
    name: 'list_skills',
    description: 'List all available skills. Each skill bundles context data and tools that can be loaded on demand. Activate a skill to access its instructions and tool set.',
    execute: async (args) => {
      const descriptors = REGISTRY.getAvailableDescriptors();
      if (descriptors.length === 0) {
        return { success: true, content: 'No skills are currently available.' };
      }
      const lines = ['Available skills (use activate_skill to load):'];
      for (const d of descriptors) {
        const active = REGISTRY.isActive(d.name) ? ' [ACTIVE]' : '';
        lines.push(`  • ${d.name}: ${d.description}${active}`);
      }
      lines.push('', 'Usage: activate_skill("skill_name") to load instructions and tools, deactivate_skill("skill_name") to remove them.');
      return { success: true, content: lines.join('\n') };
    },
  },
  {
    name: 'activate_skill',
    description: 'Activate a skill by name. This loads the skill\'s context instructions and makes its specialized tools available for use.',
    execute: async (args) => {
      const skillName = args.skill_name;
      if (!skillName) return { success: false, content: 'activate_skill requires a "skill_name" parameter. Use list_skills to see available skills.' };
      const skill = REGISTRY.getSkill(skillName);
      if (!skill) {
        const available = REGISTRY.getAvailableDescriptors().map(d => d.name).join(', ');
        return { success: false, content: `Unknown skill: "${skillName}". Available skills: ${available}` };
      }
      if (REGISTRY.isActive(skillName)) {
        return { success: true, content: `Skill "${skillName}" is already active.` };
      }
      REGISTRY.activate(skillName);
      const instructions = skill.getInstructions();
      return { success: true, content: `Activated skill: "${skillName}".\n\n${instructions}` };
    },
  },
  {
    name: 'deactivate_skill',
    description: 'Deactivate a previously activated skill. This removes its specialized tools from the available tool set.',
    execute: async (args) => {
      const skillName = args.skill_name;
      if (!skillName) return { success: false, content: 'deactivate_skill requires a "skill_name" parameter.' };
      if (!REGISTRY.isActive(skillName)) {
        return { success: true, content: `Skill "${skillName}" is not currently active.` };
      }
      REGISTRY.deactivate(skillName);
      return { success: true, content: `Deactivated skill: "${skillName}". Its tools have been removed from the available tool set.` };
    },
  },
];
