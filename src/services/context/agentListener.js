// Base class for agent/tool lifecycle listeners. Every hook is a deliberate
// no-op so subclasses can override only what they care about — the parameters
// are part of the hook signature even when unused, hence the `_` prefix.
export class AgentListener {
  beforeAgentInvocation(_request) {}
  afterAgentInvocation(_response) {}
  onAgentError(_errorContext) {}
  beforeToolExecution(_request) {}
  afterToolExecution(_response) {}
  onToolError(_errorContext) {}
  onAgenticScopeCreated(_scope) {}
  onAgenticScopeDestroyed(_scope) {}
}