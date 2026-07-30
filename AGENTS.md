# Agent Configuration Notes

## Fixes Applied (from harness failure analysis)

### 1. Code-Gen Trigger
- `codeGen.triggerOnClassification: true` - Forces transition to generation when task classified as code-gen
- `codeGen.fallbackToEdit: true` - Falls back to edit mode if generation fails

### 2. Sub-Agent Spawn Loop Prevention
- `subAgent.maxSpawnsPerTask: 1` - Hard limit on sub-agent spawns
- `subAgent.deduplicatePrompts: true` - Prevents duplicate sub-agent prompts

### 3. Token Budget Increase
- `agent.subAgentTokenBudget: 50000` - Handles 2169-line files (81KB)
- `subAgent.tokenBudget: 50000` - Sub-agent can hold full context

### 4. Exploration Phase Gates
- `agent.maxExplorationRounds: 8` - Hard stop before forced generation
- `agent.requireEditByRound: 10` - Must produce edit by round 10
- `agent.phaseGate.exploreToSummarize: 5` - Switch to summarize phase at round 5
- `agent.phaseGate.summarizeToGenerate: 7` - Switch to generate phase at round 7

### 5. Context Pollution Control
- `context.compressionThreshold: 50000` - Compress earlier
- `context.summarizeOnCompress: true` - Provide synthesized summary to model
- `context.maxToolResults: 20` - Limit retained tool results