import { NodeType, ConnectionType } from '../types/ast';
import { GeometryType } from '../types/geometry';

/**
 * Parsed node definition from Merfolk syntax
 */
export interface ParsedNode {
  id: string;
  type: NodeType;
  name: string;
  geometry: GeometryType;
  description?: string;
  properties?: Record<string, any>;
}

/**
 * Parsed connection definition from Merfolk syntax
 */
export interface ParsedConnection {
  id: string;
  type: ConnectionType;
  source: {
    nodeId: string;
    faceId?: string;
  };
  target: {
    nodeId: string;
    faceId?: string;
  };
  label?: string;
  properties?: Record<string, any>;
  flowPaths?: string[]; // IDs of flow paths this connection belongs to
}

/**
 * Parsed flow path definition
 */
export interface ParsedFlowPath {
  id: string;
  name: string;
  nodeSequence: string[];
  connectionIds: string[];
  metadata?: Record<string, any>;
}

/**
 * Parsed graph structure
 */
export interface ParsedGraph {
  title?: string;
  description?: string;
  nodes: ParsedNode[];
  connections: ParsedConnection[];
  flowPaths: ParsedFlowPath[];
  metadata?: Record<string, any>;
}

/**
 * Parser for Merfolk 3D AST syntax
 */
export class MermaidParser {
  private lines: string[] = [];
  private currentLine = 0;
  private nodes: ParsedNode[] = [];
  private connections: ParsedConnection[] = [];
  private flowPaths: ParsedFlowPath[] = [];
  private nodeIdCounter = 0;
  private connectionIdCounter = 0;
  private flowPathIdCounter = 0;

  /**
   * Parse Merfolk syntax into graph structure
   */
  parse(input: string): ParsedGraph {
    this.reset();
    this.lines = input
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let title: string | undefined;
    let description: string | undefined;
    const metadata: Record<string, any> = {};

    for (
      this.currentLine = 0;
      this.currentLine < this.lines.length;
      this.currentLine++
    ) {
      const line = this.lines[this.currentLine];

      // Skip comments
      if (line.startsWith('%%') || line.startsWith('//')) {
        continue;
      }

      // Parse graph declaration
      if (line.startsWith('graph3d') || line.startsWith('ast3d')) {
        const match = line.match(/^(graph3d|ast3d)\s+(.+)/);
        if (match) {
          title = match[2].replace(/['"]/g, '');
        }
        continue;
      }

      // Parse title
      if (line.startsWith('title:')) {
        title = line.substring(6).trim().replace(/['"]/g, '');
        continue;
      }

      // Parse description
      if (line.startsWith('description:')) {
        description = line.substring(12).trim().replace(/['"]/g, '');
        continue;
      }

      // Parse flow path definitions
      if (line.startsWith('flowpath ')) {
        const flowPath = this.parseFlowPathDefinition(line);
        if (flowPath) {
          this.flowPaths.push(flowPath);
        }
        continue;
      }

      // Parse node definition
      if (this.isNodeDefinition(line)) {
        const node = this.parseNodeDefinition(line);
        if (node) {
          this.nodes.push(node);
        }
        continue;
      }

      // Parse connection
      if (this.isConnectionDefinition(line)) {
        const connection = this.parseConnectionDefinition(line);
        if (connection) {
          this.connections.push(connection);
        }
        continue;
      }

      // Parse metadata
      if (
        line.includes(':') &&
        !line.includes('-->') &&
        !line.includes('---')
      ) {
        const [key, value] = line.split(':', 2);
        metadata[key.trim()] = value.trim().replace(/['"]/g, '');
      }
    }

    return {
      title,
      description,
      nodes: this.nodes,
      connections: this.connections,
      flowPaths: this.flowPaths,
      metadata,
    };
  }

  /**
   * Reset parser state
   */
  private reset(): void {
    this.lines = [];
    this.currentLine = 0;
    this.nodes = [];
    this.connections = [];
    this.flowPaths = [];
    this.nodeIdCounter = 0;
    this.connectionIdCounter = 0;
    this.flowPathIdCounter = 0;
  }
  /**
   * Check if line is a node definition
   */
  private isNodeDefinition(line: string): boolean {
    // Examples:
    // A[Function: processData]
    // B{Component: UserInterface}
    // C((Module: Database))
    // D<Datapath: eventStream>
    // E[[Class: UserModel]]
    return /^[A-Za-z0-9_]+[\[\{\(<]/.test(line);
  }

  /**
   * Check if line is a connection definition
   */
  private isConnectionDefinition(line: string): boolean {
    return (
      line.includes('-->') ||
      line.includes('---') ||
      line.includes('-.->') ||
      line.includes('==') ||
      line.includes('*-->') ||
      line.includes('..>')
    );
  }

  /**
   * Parse node definition
   */
  private parseNodeDefinition(line: string): ParsedNode | null {
    // Match patterns like:
    // A[Function: processData]
    // B{Component: UserInterface}
    // C((Module: Database))
    // D<Datapath: eventStream>
    // E[[Class: UserModel]]

    // IMPORTANT: Order matters! Check double brackets BEFORE single brackets
    const patterns = [
      /^([A-Za-z0-9_]+)\[\[([^:]+):\s*([^\]]+)\]\]/, // Double square brackets (must be first!)
      /^([A-Za-z0-9_]+)\(\(([^:]+):\s*([^\)]+)\)\)/, // Double parentheses (must be before single)
      /^([A-Za-z0-9_]+)\[([^:]+):\s*([^\]]+)\]/, // Square brackets
      /^([A-Za-z0-9_]+)\{([^:]+):\s*([^\}]+)\}/, // Curly brackets
      /^([A-Za-z0-9_]+)<([^:]+):\s*([^>]+)>/, // Angle brackets
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const [, id, typeStr, name] = match;

        const type = this.parseNodeType(typeStr);
        const geometry = this.parseGeometry(line);

        // Check if there's a property block starting on this line or the next
        let properties: Record<string, any> = {};

        // Check if current line has inline properties
        const inlinePropsMatch = line.match(/\s*\{(.+)\}\s*$/);
        if (inlinePropsMatch) {
          properties = this.parseProperties(inlinePropsMatch[1]);
        } else {
          // Check if next line starts a property block
          properties = this.parseMultiLineProperties();
        }

        return {
          id: id || `node_${this.nodeIdCounter++}`,
          type,
          name: name.trim(),
          geometry,
          description: properties.description,
          properties,
        };
      }
    }

    return null;
  }

  /**
   * Parse connection definition
   */
  private parseConnectionDefinition(line: string): ParsedConnection | null {
    // Match patterns like:
    // A --> B
    // A -.-> B : "data flow"
    // A --- B
    // A --> B@front
    // A@back --> B@top
    // A -->|"label"| B (Mermaid-style labeled connections)
    // A --> B : "data flow" #myFlowPath (tagged with flow path)
    // A --> B #flow1 #flow2 (multiple flow path tags)

    // Extract flow path tags (e.g. #myFlow #anotherFlow) from end of line
    const flowPathTags: string[] = [];
    let cleanLine = line;
    const tagMatches = line.match(/#([A-Za-z0-9_-]+)/g);
    if (tagMatches) {
      for (const tag of tagMatches) {
        flowPathTags.push(tag.substring(1)); // Remove the # prefix
      }
      // Remove flow path tags from the line for normal parsing
      cleanLine = line.replace(/\s*#[A-Za-z0-9_-]+/g, '').trim();
    }

    const patterns = [
      // Pattern for -->|"label"| syntax (Mermaid-style)
      /^([A-Za-z0-9_]+)(?:@([A-Za-z0-9_]+))?\s*(\*-->|-->|---|-.->|==|\.\.>)\s*\|\s*['""]([^'"]+)['"]\s*\|\s*([A-Za-z0-9_]+)(?:@([A-Za-z0-9_]+))?/,
      // Pattern for : "label" syntax (original)
      /^([A-Za-z0-9_]+)(?:@([A-Za-z0-9_]+))?\s*(\*-->|-->|---|-.->|==|\.\.>)\s*([A-Za-z0-9_]+)(?:@([A-Za-z0-9_]+))?\s*(?::\s*['""]([^'"]+)['""])?/,
    ];

    for (const pattern of patterns) {
      const match = cleanLine.match(pattern);
      if (match) {
        let sourceId, sourceFace, arrow, targetId, targetFace, label;

        if (pattern === patterns[0]) {
          // -->|"label"| syntax
          [, sourceId, sourceFace, arrow, label, targetId, targetFace] = match;
        } else {
          // : "label" syntax
          [, sourceId, sourceFace, arrow, targetId, targetFace, label] = match;
        }

        const type = this.parseConnectionType(arrow);

        return {
          id: `conn_${this.connectionIdCounter++}`,
          type,
          source: {
            nodeId: sourceId,
            faceId: sourceFace,
          },
          target: {
            nodeId: targetId,
            faceId: targetFace,
          },
          label,
          properties: {},
          flowPaths: flowPathTags.length > 0 ? flowPathTags : undefined,
        };
      }
    }

    return null;
  }

  /**
   * Parse node type from string
   */
  private parseNodeType(typeStr: string): NodeType {
    const type = typeStr.toLowerCase().trim();

    switch (type) {
      case 'function':
      case 'func':
        return NodeType.FUNCTION;
      case 'component':
      case 'comp':
        return NodeType.COMPONENT;
      case 'store':
        return NodeType.STORE;
      case 'service':
      case 'svc':
        return NodeType.SERVICE;
      case 'library':
      case 'lib':
        return NodeType.LIBRARY;
      case 'hook':
        return NodeType.HOOK;
      case 'datapath':
      case 'data':
        return NodeType.DATAPATH;
      case 'module':
      case 'mod':
        return NodeType.MODULE;
      case 'class':
        return NodeType.CLASS;
      case 'interface':
      case 'iface':
        return NodeType.INTERFACE;
      case 'variable':
      case 'var':
        return NodeType.VARIABLE;
      case 'constant':
      case 'const':
        return NodeType.CONSTANT;
      default:
        return NodeType.COMPONENT; // Default fallback
    }
  }
  /**
   * Parse geometry from line (based on bracket type)
   */
  private parseGeometry(line: string): GeometryType {
    // IMPORTANT: Check double brackets BEFORE single brackets!
    
    // [[Store: name]] -> CUBE (must check BEFORE single brackets)
    if (line.includes('[[') && line.includes(']]')) {
      return GeometryType.CUBE;
    }
    // ((Service: name)) -> TETRAHEDRON (must check BEFORE single parens)
    else if (line.includes('((') && line.includes('))')) {
      return GeometryType.TETRAHEDRON;
    }
    // [Function: name] or [Hook: name] -> CUBE
    else if (line.includes('[') && line.includes(']')) {
      return GeometryType.CUBE;
    }
    // {Component: name} -> DODECAHEDRON
    else if (line.includes('{') && line.includes('}')) {
      return GeometryType.DODECAHEDRON;
    }
    // <Library: name> -> CUBE
    else if (line.includes('<') && line.includes('>')) {
      return GeometryType.CUBE;
    }

    return GeometryType.CUBE; // Default
  }

  /**
   * Parse connection type from arrow
   */
  private parseConnectionType(arrow: string): ConnectionType {
    switch (arrow) {
      case '-->':
        return ConnectionType.DATA_FLOW;
      case '-.->':
        return ConnectionType.CONTROL_FLOW;
      case '---':
        return ConnectionType.ASSOCIATION;
      case '==':
        return ConnectionType.INHERITANCE;
      case '*-->':
        return ConnectionType.COMPOSITION;
      case '..>':
        return ConnectionType.DEPENDENCY;
      default:
        return ConnectionType.ASSOCIATION;
    }
  }

  /**
   * Parse properties from string
   */
  private parseProperties(propertiesStr: string): Record<string, any> {
    const properties: Record<string, any> = {};

    // Simple key:value parsing
    const pairs = propertiesStr.split(',').map((pair) => pair.trim());

    for (const pair of pairs) {
      const [key, value] = pair.split(':').map((s) => s.trim());
      if (key && value) {
        properties[key] = value.replace(/['"]/g, '');
      }
    }

    return properties;
  }

  /**
   * Parse multi-line property block
   */
  private parseMultiLineProperties(): Record<string, any> {
    const properties: Record<string, any> = {};

    // Check if the next line starts with '{'
    if (
      this.currentLine + 1 < this.lines.length &&
      this.lines[this.currentLine + 1].trim() === '{'
    ) {
      this.currentLine++; // Skip the opening '{'
      this.currentLine++; // Move to first property line

      // Parse properties until we hit the closing '}'
      while (this.currentLine < this.lines.length) {
        const line = this.lines[this.currentLine].trim();

        // End of property block
        if (line === '}') {
          break;
        }

        // Parse property line
        if (line.includes(':')) {
          const [key, ...valueParts] = line.split(':');
          const value = valueParts.join(':').trim();

          if (key && value) {
            // Handle different value types
            let parsedValue: any = value.replace(/['"]/g, '');

            // Try to parse as number
            if (!isNaN(Number(parsedValue))) {
              parsedValue = Number(parsedValue);
            }

            // Try to parse as array (simple format like [0, 0, 0])
            if (parsedValue.startsWith('[') && parsedValue.endsWith(']')) {
              try {
                parsedValue = JSON.parse(parsedValue);
              } catch (e) {
                // Keep as string if JSON parsing fails
              }
            }

            properties[key.trim()] = parsedValue;
          }
        }

        this.currentLine++;
      }
    }

    return properties;
  }

  /**
   * Parse a flow path definition line.
   *
   * Syntax:
   *   flowpath "name" : A --> B --> C --> D
   *   flowpath "name" : A --> B --> C --> D : "description"
   *   flowpath "name" (-->|-.->|---|==) : A --> B --> C
   *
   * This creates individual connections between each adjacent pair of nodes,
   * all tagged with the same flow path ID, enabling full data-path tracing.
   */
  private parseFlowPathDefinition(line: string): ParsedFlowPath | null {
    // Match: flowpath "name" : A --> B --> C --> D
    // Optional arrow type override: flowpath "name" (-->) : A --> B --> C
    // Optional trailing description: ... : "description"
    const flowPathMatch = line.match(
      /^flowpath\s+['""]([^'"]+)['""](?:\s*\(([^)]+)\))?\s*:\s*(.+?)(?:\s*:\s*['""]([^'"]+)['""])?$/
    );
    if (!flowPathMatch) return null;

    const [, name, arrowOverride, pathPart, description] = flowPathMatch;

    // Parse the node chain: A --> B --> C --> D
    // We split on arrow patterns to extract the node IDs
    const nodeIds = pathPart
      .split(/\s*(?:-->|-.->|---|==)\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (nodeIds.length < 2) return null;

    const flowPathId = `flowpath_${this.flowPathIdCounter++}`;
    const connectionType = arrowOverride
      ? this.parseConnectionType(arrowOverride.trim())
      : ConnectionType.DATA_FLOW;

    // Create connections for each adjacent pair, all tagged with this flow path
    const connectionIds: string[] = [];
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const connId = `conn_${this.connectionIdCounter++}`;
      connectionIds.push(connId);

      // Check if there's already a connection between these two nodes
      const existingConn = this.connections.find(
        (c) =>
          c.source.nodeId === nodeIds[i] && c.target.nodeId === nodeIds[i + 1]
      );

      if (existingConn) {
        // Tag the existing connection with this flow path
        if (!existingConn.flowPaths) {
          existingConn.flowPaths = [];
        }
        existingConn.flowPaths.push(name);
        connectionIds[connectionIds.length - 1] = existingConn.id;
      } else {
        // Create a new connection
        this.connections.push({
          id: connId,
          type: connectionType,
          source: { nodeId: nodeIds[i] },
          target: { nodeId: nodeIds[i + 1] },
          label: undefined,
          properties: {},
          flowPaths: [name],
        });
      }
    }

    return {
      id: flowPathId,
      name,
      nodeSequence: nodeIds,
      connectionIds,
      metadata: description ? { description } : undefined,
    };
  }
}
