export class WorkflowContext {
  constructor(initial = {}) {
    this.data = { ...initial };
    this.results = [];
    this.errors = [];
    this.startedAt = Date.now();
  }

  get(key) { return this.data[key]; }
  set(key, value) { this.data[key] = value; return this; }
  addResult(value) { this.results.push(value); return this; }
  addError(error) { this.errors.push(error); return this; }

  get elapsed() {
    return Date.now() - this.startedAt;
  }
}

class WorkflowStep {
  constructor({ name, execute }) {
    this.name = name;
    this._execute = execute;
  }

  async run(context) {
    try {
      const result = await this._execute(context);
      context.addResult({ step: this.name, output: result });
      return result;
    } catch (error) {
      context.addError({ step: this.name, error });
      throw error;
    }
  }
}

export class SequentialWorkflow {
  constructor({ name, steps }) {
    this.name = name || 'sequential';
    this._steps = steps.map((s, i) =>
      s instanceof WorkflowStep ? s : new WorkflowStep({ name: s.name || `step-${i}`, execute: s.execute })
    );
  }

  async run(context) {
    const results = [];
    for (const step of this._steps) {
      const output = await step.run(context);
      results.push(output);
    }
    return results;
  }
}

export class ParallelWorkflow {
  constructor({ name, steps, maxConcurrency }) {
    this.name = name || 'parallel';
    this._steps = steps.map((s, i) =>
      s instanceof WorkflowStep ? s : new WorkflowStep({ name: s.name || `step-${i}`, execute: s.execute })
    );
    this._maxConcurrency = maxConcurrency || Infinity;
  }

  async run(context) {
    if (this._steps.length === 0) return [];

    if (this._maxConcurrency === Infinity) {
      return Promise.all(this._steps.map(s => s.run(context).catch(e => { context.addError(e); return null; })));
    }

    const results = [];
    const chunks = [];
    for (let i = 0; i < this._steps.length; i += this._maxConcurrency) {
      chunks.push(this._steps.slice(i, i + this._maxConcurrency));
    }
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(s => s.run(context).catch(e => { context.addError(e); return null; }))
      );
      results.push(...chunkResults);
    }
    return results;
  }
}

export class MapReduceWorkflow {
  constructor({ name, mapFn, reduceFn }) {
    this.name = name || 'map-reduce';
    this._mapFn = mapFn;
    this._reduceFn = reduceFn;
  }

  async run(context) {
    const items = context.get('items') || [];
    if (items.length === 0) return [];

    const mapped = await Promise.all(
      items.map((item, i) => {
        const subCtx = new WorkflowContext({ ...context.data, item, index: i });
        return this._mapFn(subCtx).catch(e => { context.addError(e); return null; });
      })
    );

    const filtered = mapped.filter(r => r != null);

    if (this._reduceFn) {
      const reduceCtx = new WorkflowContext({ ...context.data, mapped: filtered });
      return this._reduceFn(reduceCtx);
    }

    return filtered;
  }
}

export class LoopWorkflow {
  constructor({ name, loopFn, maxIterations, stopWhen }) {
    this.name = name || 'loop';
    this._loopFn = loopFn;
    this._maxIterations = maxIterations || 10;
    this._stopWhen = stopWhen;
  }

  async run(context) {
    let iteration = 0;
    const outputs = [];

    while (iteration < this._maxIterations) {
      const iterCtx = new WorkflowContext({ ...context.data, iteration, previousOutputs: outputs });
      const output = await this._loopFn(iterCtx).catch(e => { context.addError(e); return null; });
      outputs.push(output);

      if (output === null) break;

      if (this._stopWhen) {
        const shouldStop = await this._stopWhen(output, iteration, context);
        if (shouldStop) break;
      }

      iteration++;
    }

    return outputs;
  }
}

export class ConditionalWorkflow {
  constructor({ name, condition, ifTrue, ifFalse }) {
    this.name = name || 'conditional';
    this._condition = condition;
    this._ifTrue = ifTrue;
    this._ifFalse = ifFalse;
  }

  async run(context) {
    const result = await this._condition(context);
    if (result) {
      return this._ifTrue ? this._ifTrue.run(context) : null;
    }
    return this._ifFalse ? this._ifFalse.run(context) : null;
  }
}

export function createWorkflowStep(name, execute) {
  return new WorkflowStep({ name, execute });
}

export async function runWorkflow(workflow, initialData) {
  const context = new WorkflowContext(initialData);
  const results = await workflow.run(context);
  return { results, context };
}
