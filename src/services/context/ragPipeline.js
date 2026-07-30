class RagStage {
  constructor({ name, execute }) {
    this.name = name;
    this._execute = execute;
  }

  async run(context) {
    const start = performance.now();
    try {
      const result = await this._execute(context);
      return { ...context, ...result, _lastStage: this.name, _stageTime: performance.now() - start };
    } catch (error) {
      return { ...context, _lastStage: this.name, _error: error, _stageTime: performance.now() - start };
    }
  }
}

export class RagPipeline {
  constructor() {
    this._stages = [];
  }

  use(stage) {
    if (typeof stage === 'function') {
      this._stages.push(new RagStage({ name: `anonymous-${this._stages.length}`, execute: stage }));
    } else if (stage instanceof RagStage) {
      this._stages.push(stage);
    } else if (stage.name && stage.execute) {
      this._stages.push(new RagStage(stage));
    }
    return this;
  }

  async run(initialContext) {
    let context = { ...initialContext, _stages: [] };
    for (const stage of this._stages) {
      if (context._stop) break;
      context._stages.push(stage.name);
      context = await stage.run(context);
      if (context._error) {
        console.warn(`[RagPipeline] Stage "${stage.name}" failed:`, context._error.message);
        break;
      }
    }
    return context;
  }

  static createRouterStage(routeFn) {
    return new RagStage({
      name: 'router',
      execute: async (ctx) => {
        const route = await routeFn(ctx);
        return { route };
      },
    });
  }

  static createRetrieveStage(retrieveFn) {
    return new RagStage({
      name: 'retrieve',
      execute: async (ctx) => {
        const documents = await retrieveFn(ctx);
        return { documents };
      },
    });
  }

  static createCompressStage(compressFn) {
    return new RagStage({
      name: 'compress',
      execute: async (ctx) => {
        const compressed = await compressFn(ctx);
        return { compressed };
      },
    });
  }

  static createGenerateStage(generateFn) {
    return new RagStage({
      name: 'generate',
      execute: async (ctx) => {
        const output = await generateFn(ctx);
        return { output };
      },
    });
  }

  static createFilterStage(filterFn) {
    return new RagStage({
      name: 'filter',
      execute: async (ctx) => {
        const filtered = await filterFn(ctx);
        return { filtered };
      },
    });
  }

  static createRerankStage(rerankFn) {
    return new RagStage({
      name: 'rerank',
      execute: async (ctx) => {
        const reranked = await rerankFn(ctx);
        return { reranked };
      },
    });
  }

  static createStopIf(conditionFn) {
    return new RagStage({
      name: 'stop-if',
      execute: async (ctx) => {
        const shouldStop = await conditionFn(ctx);
        return { _stop: shouldStop };
      },
    });
  }
}
