import { AST3DGenerator } from '../generators/3d-generator';
import { Graph } from '../models/graph';
import { Config } from '../types/config';

/**
 * Extracted Merfolk block from markdown
 */
export interface AST3DBlock {
  content: string;
  title?: string;
  index: number;
  lineStart: number;
  lineEnd: number;
}

/**
 * Processed diagram result
 */
export interface ProcessedDiagram {
  graph: Graph;
  block: AST3DBlock;
  json: any;
  errors: string[];
}

/**
 * Utility for processing Merfolk syntax in markdown files
 */
export class MarkdownProcessor {
  private generator: AST3DGenerator;

  constructor(config?: Partial<Config>) {
    this.generator = new AST3DGenerator(config);
  }

  /**
   * Extract all Merfolk code blocks from markdown content
   */
  extractAST3DBlocks(markdownContent: string): AST3DBlock[] {
    const lines = markdownContent.split('\n');
    const blocks: AST3DBlock[] = [];
    let currentBlock: Partial<AST3DBlock> | null = null;
    let blockContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Start of Merfolk block
      if (line.trim().startsWith('```merfolk')) {
        currentBlock = {
          index: blocks.length,
          lineStart: i + 1,
        };
        blockContent = [];

        // Extract title if present
        const titleMatch = line.match(/```merfolk\s+"([^"]+)"/);
        if (titleMatch) {
          currentBlock.title = titleMatch[1];
        }
        continue;
      }

      // End of 3D AST block
      if (line.trim() === '```' && currentBlock) {
        blocks.push({
          content: blockContent.join('\n'),
          title: currentBlock.title,
          index: currentBlock.index!,
          lineStart: currentBlock.lineStart!,
          lineEnd: i,
        });
        currentBlock = null;
        blockContent = [];
        continue;
      }

      // Content inside block
      if (currentBlock) {
        blockContent.push(line);
      }
    }

    return blocks;
  }

  /**
   * Process all Merfolk blocks in markdown content
   */
  processMarkdown(markdownContent: string): ProcessedDiagram[] {
    const blocks = this.extractAST3DBlocks(markdownContent);
    const results: ProcessedDiagram[] = [];

    for (const block of blocks) {
      try {
        // Validate syntax first
        const validation = this.generator.validate(block.content);

        if (validation.valid) {
          // Generate graph
          const graph = this.generator.generate(block.content);
          const json = this.generator.generateJSON(block.content);

          results.push({
            graph,
            block,
            json,
            errors: [],
          });
        } else {
          results.push({
            graph: new Graph(`error_${block.index}`, 'Error Graph'),
            block,
            json: null,
            errors: validation.errors,
          });
        }
      } catch (error) {
        results.push({
          graph: new Graph(`error_${block.index}`, 'Error Graph'),
          block,
          json: null,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    return results;
  }

  /**
   * Process a single 3D AST block
   */
  processBlock(block: AST3DBlock): ProcessedDiagram {
    try {
      const validation = this.generator.validate(block.content);

      if (validation.valid) {
        const graph = this.generator.generate(block.content);
        const json = this.generator.generateJSON(block.content);

        return {
          graph,
          block,
          json,
          errors: [],
        };
      } else {
        return {
          graph: new Graph(`error_${block.index}`, 'Error Graph'),
          block,
          json: null,
          errors: validation.errors,
        };
      }
    } catch (error) {
      return {
        graph: new Graph(`error_${block.index}`, 'Error Graph'),
        block,
        json: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Generate documentation report from markdown
   */
  generateReport(markdownContent: string): {
    totalBlocks: number;
    validBlocks: number;
    errorBlocks: number;
    diagrams: ProcessedDiagram[];
    summary: {
      totalNodes: number;
      totalConnections: number;
      nodeTypes: Record<string, number>;
      connectionTypes: Record<string, number>;
    };
  } {
    const diagrams = this.processMarkdown(markdownContent);

    const report = {
      totalBlocks: diagrams.length,
      validBlocks: diagrams.filter((d) => d.errors.length === 0).length,
      errorBlocks: diagrams.filter((d) => d.errors.length > 0).length,
      diagrams,
      summary: {
        totalNodes: 0,
        totalConnections: 0,
        nodeTypes: {} as Record<string, number>,
        connectionTypes: {} as Record<string, number>,
      },
    };

    // Calculate summary statistics
    for (const diagram of diagrams) {
      if (diagram.errors.length === 0) {
        report.summary.totalNodes += diagram.graph.nodes.size;
        report.summary.totalConnections += diagram.graph.connections.size;

        // Count node types
        for (const node of diagram.graph.nodes.values()) {
          const type = node.type;
          report.summary.nodeTypes[type] =
            (report.summary.nodeTypes[type] || 0) + 1;
        }

        // Count connection types
        for (const connection of diagram.graph.connections.values()) {
          const type = connection.type;
          report.summary.connectionTypes[type] =
            (report.summary.connectionTypes[type] || 0) + 1;
        }
      }
    }

    return report;
  }

  /**
   * Update generator configuration
   */
  updateConfig(config: Partial<Config>): void {
    this.generator.updateConfig(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): Config {
    return this.generator.getConfig();
  }

  /**
   * Export diagrams to JSON for 3D applications
   */
  exportToJSON(markdownContent: string): {
    metadata: {
      generatedAt: string;
      totalDiagrams: number;
      version: string;
    };
    diagrams: Array<{
      title?: string;
      index: number;
      graph: any;
      errors: string[];
    }>;
  } {
    const diagrams = this.processMarkdown(markdownContent);

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalDiagrams: diagrams.length,
        version: '1.0.0',
      },
      diagrams: diagrams.map((diagram) => ({
        title: diagram.block.title,
        index: diagram.block.index,
        graph: diagram.json,
        errors: diagram.errors,
      })),
    };
  }

  /**
   * Generate HTML documentation
   */
  generateHTMLDocs(markdownContent: string): string {
    const report = this.generateReport(markdownContent);

    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>3D AST Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .diagram { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .error { background: #ffebee; border-color: #f44336; }
        .success { background: #e8f5e8; border-color: #4caf50; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: #e3f2fd; padding: 15px; border-radius: 6px; flex: 1; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .error-list { color: #d32f2f; }
    </style>
</head>
<body>
    <div class="header">
        <h1>3D AST Documentation Report</h1>
        <p>Generated on ${new Date().toISOString()}</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <h3>Total Diagrams</h3>
            <p>${report.totalBlocks}</p>
        </div>
        <div class="stat">
            <h3>Valid Diagrams</h3>
            <p>${report.validBlocks}</p>
        </div>
        <div class="stat">
            <h3>Total Nodes</h3>
            <p>${report.summary.totalNodes}</p>
        </div>
        <div class="stat">
            <h3>Total Connections</h3>
            <p>${report.summary.totalConnections}</p>
        </div>
    </div>
`;

    // Add each diagram
    for (const diagram of report.diagrams) {
      const isError = diagram.errors.length > 0;
      html += `
    <div class="diagram ${isError ? 'error' : 'success'}">
        <h2>Diagram ${diagram.block.index + 1}${
        diagram.block.title ? `: ${diagram.block.title}` : ''
      }</h2>
        <p>Lines ${diagram.block.lineStart}-${diagram.block.lineEnd}</p>
        
        ${
          isError
            ? `
        <div class="error-list">
            <h4>Errors:</h4>
            <ul>${diagram.errors
              .map((error) => `<li>${error}</li>`)
              .join('')}</ul>
        </div>
        `
            : `
        <p>✅ Successfully parsed ${diagram.graph.nodes.size} nodes and ${diagram.graph.connections.size} connections</p>
        `
        }
        
        <h4>Source:</h4>
        <pre><code>${diagram.block.content}</code></pre>
    </div>
`;
    }

    html += `
</body>
</html>`;

    return html;
  }
}
