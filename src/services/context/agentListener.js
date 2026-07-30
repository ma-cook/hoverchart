export class AgentListener {
  beforeAgentInvocation(request) {}
  afterAgentInvocation(response) {}
  onAgentError(errorContext) {}
  beforeToolExecution(request) {}
  afterToolExecution(response) {}
  onToolError(errorContext) {}
  onAgenticScopeCreated(scope) {}
  onAgenticScopeDestroyed(scope) {}
}
