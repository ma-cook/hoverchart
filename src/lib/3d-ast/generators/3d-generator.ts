import { MermaidParser } from '../parser/mermaid-parser';
import { ASTBuilder } from '../parser/ast-builder';
import { Graph } from '../models/graph';
import { Config, DEFAULT_CONFIG } from '../types/config';
import { AST3DGraph } from '../types/ast';

/**
 * Main 3D AST Generator class
 */
export class AST3DGenerator {
  private parser: MermaidParser;
  private builder: ASTBuilder;
  private config: Config;

  constructor(config: Partial<Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.parser = new MermaidParser();
    this.builder = new ASTBuilder(this.config);
  }

  /**
   * Generate 3D AST Graph from Merfolk syntax
   */
  generate(input: string): Graph {
    // Parse the input
    const parsedGraph = this.parser.parse(input);

    // Build the 3D graph
    const graph = this.builder.build(parsedGraph);

    return graph;
  }

  /**
   * Generate and return serializable format
   */
  generateJSON(input: string): AST3DGraph {
    const graph = this.generate(input);
    return graph.toJSON();
  }

  /**
   * Parse input without building (useful for validation)
   */
  parseOnly(input: string) {
    return this.parser.parse(input);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<Config>): void {
    this.config = { ...this.config, ...newConfig };
    this.builder = new ASTBuilder(this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): Config {
    return { ...this.config };
  }

  /**
   * Validate input syntax
   */
  validate(input: string): { valid: boolean; errors: string[] } {
    try {
      const parsed = this.parser.parse(input);
      const errors: string[] = [];

      // Check for duplicate node IDs
      const nodeIds = new Set<string>();
      for (const node of parsed.nodes) {
        if (nodeIds.has(node.id)) {
          errors.push(`Duplicate node ID: ${node.id}`);
        }
        nodeIds.add(node.id);
      }

      // Check for invalid connections
      for (const connection of parsed.connections) {
        if (!nodeIds.has(connection.source.nodeId)) {
          errors.push(
            `Connection references unknown source node: ${connection.source.nodeId}`
          );
        }
        if (!nodeIds.has(connection.target.nodeId)) {
          errors.push(
            `Connection references unknown target node: ${connection.target.nodeId}`
          );
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          error instanceof Error ? error.message : 'Unknown parsing error',
        ],
      };
    }
  }

  /**
   * Get example syntax
   */
  static getExampleSyntax(): string {
    return `graph3d "Sample Application Architecture"

%% Node definitions
A[Function: processData]
B{Component: UserInterface}
C((Module: Database))
D<Datapath: eventStream>
E[[Class: UserModel]]

%% Connections
A --> B : "processed data"
B -.-> D : "user events"
C --> A : "raw data"
D --> C : "queries"
E --- C : "model mapping"

%% Face-specific connections
A@front --> B@back : "direct connection"
C@top --> E@bottom : "inheritance"

%% Flow path tags on individual connections
A --> B : "data" #userDataFlow
B --> D : "events" #userDataFlow #eventFlow

%% Flow path definitions (auto-creates tagged connections)
flowpath "requestLifecycle" : B --> A --> C --> E
flowpath "eventPipeline" (-.->): D --> A --> B : "end-to-end event flow"`;
  }
}
