# Yao Agent Testing Reference

## Overview

The Yao Agent Test Framework provides comprehensive testing capabilities for agents and their scripts, including standard testing, dynamic (simulator-driven) testing, agent-driven assertions, agent-driven input generation, and CI integration.

## Quick Start

### Agent Tests

```bash
# Test with direct message (auto-detect agent from current directory)
cd assistants/keyword
yao agent test -i "Extract keywords from: AI and machine learning"

# Test with JSONL file
yao agent test -i tests/inputs.jsonl

# Generate HTML report
yao agent test -i tests/inputs.jsonl -o report.html
```

### Agent-Driven Input

```bash
# Generate test cases using a generator agent
yao agent test -i "agents:tests.generator-agent?count=10" -n assistants.expense

# Preview generated tests without running (dry-run)
yao agent test -i "agents:tests.generator-agent?count=5" -n assistants.expense --dry-run
```

### Dynamic Mode (Simulator)

```bash
# Run dynamic tests with simulator
yao agent test -i tests/dynamic.jsonl --simulator tests.simulator-agent

# See detailed turn-by-turn output
yao agent test -i tests/dynamic.jsonl -v
```

### Script Tests

```bash
# Test agent handler scripts (hooks, tools, setup functions)
yao agent test -i scripts.expense.setup -v

# Run specific tests with regex filter
yao agent test -i scripts.expense.setup --run "TestSystemReady" -v

# Run with custom context
yao agent test -i scripts.expense.setup --ctx tests/context.json -v
```

## Input Modes

| Mode         | Description               | Example                                      |
| ------------ | ------------------------- | -------------------------------------------- |
| File         | Load from JSONL file      | `-i tests/inputs.jsonl`                      |
| Message      | Direct message string     | `-i "Hello world"`                           |
| Script       | Test handler scripts      | `-i scripts.expense.setup`                   |
| Agent-Driven | Generate tests via agent  | `-i "agents:tests.generator-agent?count=10"` |
| Script-Gen   | Generate tests via script | `-i "scripts:tests.gen.Generate"`            |

**Format rules**:

- `scripts.xxx` (dot) - Run script tests (`*_test.ts` functions)
- `scripts:xxx` (colon) - Generate test cases from a script
- `agents:xxx` (colon) - Generate test cases from an agent

## Writing Script Tests

Test scripts should be placed alongside source files with `_test.ts` suffix:

```
assistants/expense/src/
├── setup.ts           # Source file
├── setup_test.ts      # Test file
├── tools.ts
└── tools_test.ts
```

### Test Function Signature

```typescript
// Test function must start with "Test" and accept (t: testing.T, ctx: agent.Context)
export function TestSystemReady(t: testing.T, ctx: agent.Context) {
  const result = SystemReady(ctx);

  // Use t.assert for assertions
  t.assert.True(result.success, 'SystemReady should succeed');
  t.assert.Equal(result.status, 'ready', 'Status should be ready');
  t.assert.NotNil(result.data, 'Data should not be nil');
}

// Agent-driven assertion example
export function TestWithAgentAssertion(t: testing.T, ctx: agent.Context) {
  const response = Process('agents.expense.Stream', ctx, messages);

  // Static assertion
  t.assert.Contains(response.content, 'confirm');

  // Agent-driven assertion (uses LLM to validate semantics)
  t.assert.Agent(response.content, 'tests.validator-agent', {
    criteria: 'Response should ask for confirmation'
  });
}
```

### Available Assertions

| Method                           | Description                    |
| -------------------------------- | ------------------------------ |
| `t.assert.True(value, msg)`      | Assert value is true           |
| `t.assert.False(value, msg)`     | Assert value is false          |
| `t.assert.Equal(a, b, msg)`      | Assert a equals b              |
| `t.assert.NotEqual(a, b, msg)`   | Assert a not equals b          |
| `t.assert.Nil(value, msg)`       | Assert value is null/undefined |
| `t.assert.NotNil(value, msg)`    | Assert value is not nil        |
| `t.assert.Contains(s, sub, msg)` | Assert string contains substr  |
| `t.assert.Len(arr, n, msg)`      | Assert array/string length     |
| `t.assert.Agent(resp, id, opts)` | Agent-driven assertion         |

### Test Control Methods

| Method         | Description                  |
| -------------- | ---------------------------- |
| `t.Log(msg)`   | Log a message                |
| `t.Error(msg)` | Mark test as failed with msg |
| `t.Fatal(msg)` | Mark failed and stop test    |
| `t.Skip(msg)`  | Skip this test               |

## Input Format (JSONL)

Each line is a JSON object. Examples by scenario:

### Simple Input

```jsonl
{"id": "T001", "input": "Simple text"}
{"id": "T002", "input": {"role": "user", "content": "Message with role"}}
```

### Conversation History

```jsonl
{
  "id": "T003",
  "input": [
    {
      "role": "user",
      "content": "Hi"
    },
    {
      "role": "assistant",
      "content": "Hello"
    },
    {
      "role": "user",
      "content": "Follow-up"
    }
  ]
}
```

### Multimodal Input (Images, Audio, Files)

For local files, use `type: "image"` (or `"audio"`, `"file"`) with `source: "file://path"`:

```jsonl
// ✅ CORRECT: Load local image file
{"id": "T003", "input": {"role": "user", "content": [{"type": "text", "text": "Analyze this image"}, {"type": "image", "source": "file://test.png"}]}}

// ✅ CORRECT: Load local audio file
{"id": "T004", "input": {"role": "user", "content": [{"type": "text", "text": "Transcribe this"}, {"type": "audio", "source": "file://audio.mp3"}]}}

// ❌ WRONG: image_url does NOT support file:// protocol
{"id": "T005", "input": {"role": "user", "content": [{"type": "image_url", "image_url": {"url": "file://test.png"}}]}}
```

**Important**: The `file://` path is relative to the `tests/` directory where `inputs.jsonl` is located.

| Type        | Use Case                     | Format                                                       |
| ----------- | ---------------------------- | ------------------------------------------------------------ |
| `image`     | Load local image file        | `{"type": "image", "source": "file://..."}`                  |
| `audio`     | Load local audio file        | `{"type": "audio", "source": "file://..."}`                  |
| `file`      | Load local file (PDF, etc.)  | `{"type": "file", "source": "file://..."}`                   |
| `image_url` | Remote URL only (no file://) | `{"type": "image_url", "image_url": {"url": "https://..."}}` |

### With Assertions

```jsonl
{"id": "T004", "input": "Test", "assert": {"type": "json_path", "path": "field", "value": true}}
{"id": "T005", "input": "Hello", "assert": [{"type": "contains", "value": "Hi"}, {"type": "not_contains", "value": "error"}]}
```

### Tool Assertions

Check if specific tools were called and their results:

```jsonl
// Check tool was called (supports suffix matching)
{"id": "T006", "input": "Set up system", "assert": {"type": "tool_called", "value": "setup"}}

// Check tool called with specific arguments
{"id": "T007", "input": "Update config", "assert": {"type": "tool_called", "value": {"name": "setup", "arguments": {"action": "update"}}}}

// Check tool result
{"id": "T008", "input": "Initialize", "assert": {"type": "tool_result", "value": {"tool": "setup", "result": {"success": true}}}}

// Combine tool assertions
{"id": "T009", "input": "Complete setup", "assert": [{"type": "tool_called", "value": "setup"}, {"type": "tool_result", "value": {"tool": "setup", "result": {"success": true}}}]}
```

### Agent-Driven Assertion

```jsonl
{
  "id": "T006",
  "input": "How do I reset my password?",
  "assert": {
    "type": "agent",
    "use": "agents:tests.validator-agent",
    "value": "Response should provide clear instructions"
  }
}
```

### With Options

```jsonl
{
  "id": "T007",
  "input": "Query",
  "options": {
    "connector": "deepseek.v3",
    "skip": {
      "history": true,
      "trace": true
    }
  }
}
```

### With Before/After Hooks

```jsonl
{
  "id": "T008",
  "input": "Test",
  "before": "env_test.Before",
  "after": "env_test.After"
}
```

### Dynamic Mode (Simulator)

```jsonl
{
  "id": "T009",
  "input": "I want coffee",
  "simulator": {
    "use": "tests.simulator-agent",
    "options": {
      "metadata": {
        "persona": "Customer",
        "goal": "Order a latte"
      }
    }
  },
  "checkpoints": [
    {
      "id": "greeting",
      "assert": {
        "type": "regex",
        "value": "(?i)hello"
      }
    },
    {
      "id": "confirm",
      "after": [
        "greeting"
      ],
      "assert": {
        "type": "regex",
        "value": "(?i)confirm"
      }
    }
  ],
  "max_turns": 10
}
```

### Dynamic Mode Output Structure

Each turn in the output includes:

```typescript
interface TurnResult {
  turn: number; // Turn number (1-based)
  input: string; // User message
  output: any; // Agent response summary (for display)
  response: {
    // Full agent response (for detailed analysis)
    content: string; // LLM text content
    tool_calls: [
      {
        // Tool calls made
        tool: string; // Tool name
        arguments: any; // Call arguments
        result: any; // Execution result
      }
    ];
    next: any; // Next hook data
  };
  checkpoints_reached: string[]; // Checkpoint IDs reached
  duration_ms: number; // Execution time
}
```

### Checkpoint Result Structure

Each checkpoint in the output includes:

```typescript
interface CheckpointResult {
  id: string; // Checkpoint identifier
  reached: boolean; // Whether checkpoint was reached
  reached_at_turn?: number; // Turn number when reached (if reached)
  required: boolean; // Whether checkpoint is required
  passed: boolean; // Whether assertion passed
  message?: string; // Assertion result message
  agent_validation?: {
    // Agent assertion details (for type: "agent")
    passed: boolean; // Validator's determination
    reason: string; // Explanation from validator
    criteria: string; // Validation criteria checked
    input: any; // Content sent to validator
    response: {
      // Raw validator response
      passed: boolean;
      reason: string;
    };
  };
}
```

**Note**: For agent-based assertions (`type: "agent"`), the `agent_validation` field provides full transparency into the validation process:

- `input`: The content that was validated (agent response + tool result messages)
- `response`: The raw JSON response from the validator agent
- `criteria`: The validation criteria from the test case

## Test Case Fields

### Standard Mode Fields

| Field      | Type                           | Required | Description                           |
| ---------- | ------------------------------ | -------- | ------------------------------------- |
| `id`       | string                         | Yes      | Test case ID                          |
| `input`    | string \| Message \| []Message | Yes      | Test input                            |
| `assert`   | Assertion \| []Assertion       | No       | Assertion rules                       |
| `expected` | any                            | No       | Expected output (exact match)         |
| `user`     | string                         | No       | Override user ID                      |
| `team`     | string                         | No       | Override team ID                      |
| `metadata` | map                            | No       | Additional metadata for hooks         |
| `options`  | Options                        | No       | Context options                       |
| `timeout`  | string                         | No       | Override timeout (e.g., "30s")        |
| `skip`     | bool                           | No       | Skip this test                        |
| `before`   | string                         | No       | Before hook (e.g., `env_test.Before`) |
| `after`    | string                         | No       | After hook (e.g., `env_test.After`)   |

### Dynamic Mode Fields

| Field                         | Type   | Required | Description                            |
| ----------------------------- | ------ | -------- | -------------------------------------- |
| `id`                          | string | Yes      | Test case ID                           |
| `input`                       | string | Yes      | Initial user message                   |
| `simulator`                   | object | Yes      | Simulator configuration                |
| `simulator.use`               | string | Yes      | Simulator agent ID (no prefix)         |
| `simulator.options`           | object | No       | Simulator options                      |
| `simulator.options.metadata`  | map    | No       | Metadata (persona, goal, etc.)         |
| `simulator.options.connector` | string | No       | Override simulator connector           |
| `checkpoints`                 | array  | Yes      | Checkpoints to verify                  |
| `checkpoints[].id`            | string | Yes      | Checkpoint identifier                  |
| `checkpoints[].description`   | string | No       | Human-readable description             |
| `checkpoints[].assert`        | object | Yes      | Assertion to validate                  |
| `checkpoints[].after`         | array  | No       | Checkpoint IDs that must occur first   |
| `checkpoints[].required`      | bool   | No       | Is checkpoint required (default: true) |
| `max_turns`                   | int    | No       | Maximum turns (default: 20)            |
| `timeout`                     | string | No       | Override timeout (e.g., "2m")          |

### Options

```jsonl
{
  "id": "T001",
  "input": "Query users",
  "options": {
    "connector": "deepseek.v3",
    "metadata": {
      "scenario": "filter"
    },
    "skip": {
      "history": true,
      "trace": true,
      "output": true
    }
  }
}
```

| Field                    | Type   | Description                  |
| ------------------------ | ------ | ---------------------------- |
| `connector`              | string | Override connector           |
| `mode`                   | string | Agent mode (default: "chat") |
| `search`                 | bool   | Enable/disable search mode   |
| `disable_global_prompts` | bool   | Disable global prompts       |
| `metadata`               | map    | Custom data passed to hooks  |
| `skip.history`           | bool   | Skip history loading         |
| `skip.trace`             | bool   | Skip trace logging           |
| `skip.output`            | bool   | Skip output to client        |
| `skip.keyword`           | bool   | Skip keyword extraction      |
| `skip.search`            | bool   | Skip auto search             |

## Assertion Types

| Type           | Description                   | Example                                                                         |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| `equals`       | Exact match                   | `{"type": "equals", "value": {"key": "val"}}`                                   |
| `contains`     | Output contains value         | `{"type": "contains", "value": "keyword"}`                                      |
| `not_contains` | Output does not contain       | `{"type": "not_contains", "value": "error"}`                                    |
| `json_path`    | Extract JSON path and compare | `{"type": "json_path", "path": "$.field", "value": true}`                       |
| `regex`        | Match regex pattern           | `{"type": "regex", "value": "(?i)hello"}`                                       |
| `type`         | Check output type             | `{"type": "type", "value": "object"}`                                           |
| `script`       | Run custom assertion script   | `{"type": "script", "script": "scripts.test.Check"}`                            |
| `agent`        | Agent-driven validation       | `{"type": "agent", "use": "agents:tests.validator-agent", "value": "criteria"}` |

### Assertion Fields

| Field     | Type   | Description                                              |
| --------- | ------ | -------------------------------------------------------- |
| `type`    | string | Assertion type (required)                                |
| `value`   | any    | Expected value or pattern                                |
| `path`    | string | JSON path for `json_path` type                           |
| `script`  | string | Script name for `script` type                            |
| `use`     | string | Agent/script ID for `agent` type (with `agents:` prefix) |
| `options` | object | Options for agent assertions                             |
| `message` | string | Custom failure message                                   |
| `negate`  | bool   | Invert the assertion result                              |

### JSON Path Examples

```jsonl
{"assert": {"type": "json_path", "path": "wheres[0].like", "value": "%test%"}}
{"assert": {"type": "json_path", "path": "joins[0].from", "value": "users"}}
{"assert": {"type": "json_path", "path": "error", "value": ["missing_schema", "missing_query"]}}
```

### Agent Assertion Details

Agent assertions use an LLM-based validator to semantically evaluate responses. This is useful when exact pattern matching is insufficient.

**How it works:**

1. The framework sends the agent's response (including tool results) to the validator agent
2. The validator evaluates against the specified criteria
3. The validator returns `{"passed": true/false, "reason": "explanation"}`

**Example with checkpoint:**

```jsonl
{
  "id": "setup-test",
  "input": "Configure my system",
  "checkpoints": [
    {
      "id": "confirm_setup",
      "assert": {
        "type": "agent",
        "use": "agents:workers.tests.checkpoint-validator",
        "value": "The response should confirm the configuration is complete"
      }
    }
  ]
}
```

**Output in report:**

```json
{
  "confirm_setup": {
    "id": "confirm_setup",
    "reached": true,
    "passed": true,
    "agent_validation": {
      "passed": true,
      "reason": "Response explicitly states 'Setup complete'",
      "criteria": "The response should confirm the configuration is complete",
      "input": "Setup complete! Your settings have been saved.",
      "response": {
        "passed": true,
        "reason": "Response explicitly states 'Setup complete'"
      }
    }
  }
}
```

**Note**: In dynamic mode, the validator checks the combined output which includes both the agent's text response AND any `message` fields from tool results. This ensures tool-based completions are properly validated.

## Before/After Hooks

Hooks allow you to run setup and teardown code before and after tests. Hook scripts must be placed in the agent's `src/` directory with `_test.ts` suffix.

### Hook Types

| Hook        | Scope    | When Called           | Use Case                        |
| ----------- | -------- | --------------------- | ------------------------------- |
| `Before`    | Per-test | Before each test case | Create test data, setup context |
| `After`     | Per-test | After each test case  | Cleanup test data, log results  |
| `BeforeAll` | Global   | Once before all tests | Database migration, init        |
| `AfterAll`  | Global   | Once after all tests  | Global cleanup, report          |

### Execution Order

```
BeforeAll (global)
  ├─ Before (test 1)
  │    └─ Test 1 execution
  │    └─ After (test 1)
  ├─ Before (test 2)
  │    └─ Test 2 execution
  │    └─ After (test 2)
  └─ ...
AfterAll (global)
```

### Per-Test Hooks

Defined in JSONL, scripts located in agent's `src/` directory:

```jsonl
{
  "id": "T001",
  "input": "Test",
  "before": "env_test.Before",
  "after": "env_test.After"
}
```

### Global Hooks

Via CLI flags:

```bash
yao agent test -i tests/inputs.jsonl --before env_test.BeforeAll --after env_test.AfterAll
```

### Hook Function Signatures

```typescript
// assistants/expense/src/env_test.ts

/**
 * Before - Called before each test case
 * @param ctx - Agent context with user/team info
 * @param testCase - The test case about to run
 * @returns any - Data passed to After hook (optional)
 */
export function Before(ctx: Context, testCase: TestCase): any {
  const userId = Process('models.user.Create', { name: 'Test User' });
  return { userId }; // This data is passed to After
}

/**
 * After - Called after each test case (pass or fail)
 * @param ctx - Agent context
 * @param testCase - The test case that ran
 * @param result - Test result with status, output, duration
 * @param beforeData - Data returned from Before hook
 */
export function After(
  ctx: Context,
  testCase: TestCase,
  result: TestResult,
  beforeData: any
) {
  if (beforeData?.userId) {
    Process('models.user.Delete', beforeData.userId);
  }
}

/**
 * BeforeAll - Called once before all tests
 * @param ctx - Agent context
 * @param testCases - Array of all test cases
 * @returns any - Data passed to AfterAll hook (optional)
 */
export function BeforeAll(ctx: Context, testCases: TestCase[]): any {
  Process('models.migrate');
  return { initialized: true };
}

/**
 * AfterAll - Called once after all tests complete
 * @param ctx - Agent context
 * @param results - Array of all test results
 * @param beforeData - Data returned from BeforeAll hook
 */
export function AfterAll(ctx: Context, results: TestResult[], beforeData: any) {
  Process('models.cleanup');
}
```

### Hook Parameters

**Context**:

```typescript
interface Context {
  locale: string; // Locale (e.g., "en-us")
  authorized: {
    user_id: string; // Test user ID
    team_id: string; // Test team ID
    constraints?: object; // Access constraints
  };
  metadata: object; // Custom metadata from test case
}
```

**TestCase**:

```typescript
interface TestCase {
  id: string; // Test case ID
  input: any; // Test input (string, Message, or Message[])
  assert?: object; // Assertion rules
  expected?: any; // Expected output
  user?: string; // Override user ID
  team?: string; // Override team ID
  metadata?: object; // Custom metadata
  options?: object; // Context options
  timeout?: string; // Timeout (e.g., "30s")
  skip?: boolean; // Skip flag
  before?: string; // Before hook reference
  after?: string; // After hook reference
}
```

**TestResult**:

```typescript
interface TestResult {
  id: string; // Test case ID
  status: string; // "passed" | "failed" | "error" | "skipped" | "timeout"
  input: any; // Actual input sent
  output: any; // Agent response
  expected?: any; // Expected output (if defined)
  error?: string; // Error message (if failed)
  duration_ms: number; // Execution time in milliseconds
  assertions?: object[]; // Assertion results
}
```

### Common Use Cases

**Database Setup/Teardown**:

```typescript
export function Before(ctx: Context, testCase: TestCase): any {
  const user = Process('models.user.Create', { name: 'Test' });
  return { user };
}

export function After(
  ctx: Context,
  testCase: TestCase,
  result: TestResult,
  data: any
) {
  if (data?.user) Process('models.user.Delete', data.user.id);
}
```

**Conditional Setup**:

```typescript
export function Before(ctx: Context, testCase: TestCase): any {
  const scenario = testCase.metadata?.scenario || 'default';
  if (scenario === 'empty_db') {
    Process('models.expense.DeleteAll');
  }
  return { scenario };
}
```

## Command Line Options

| Flag          | Description                                              | Default                    |
| ------------- | -------------------------------------------------------- | -------------------------- |
| `-i`          | Input: JSONL file, message, `agents:xxx`, or `scripts:x` | (required)                 |
| `-o`          | Output file path                                         | `output-{timestamp}.jsonl` |
| `-n`          | Agent ID (optional, auto-detected)                       | auto-detect                |
| `-a`          | Application directory                                    | auto-detect                |
| `-e`          | Environment file                                         | -                          |
| `-c`          | Override connector                                       | agent default              |
| `-u`          | Test user ID                                             | `test-user`                |
| `-t`          | Test team ID                                             | `test-team`                |
| `-r`          | Reporter agent ID for custom report                      | built-in                   |
| `-v`          | Verbose output                                           | false                      |
| `--ctx`       | Path to context JSON file for custom authorization       | -                          |
| `--simulator` | Default simulator agent ID for dynamic mode              | -                          |
| `--before`    | Global BeforeAll hook (e.g., `env_test.BeforeAll`)       | -                          |
| `--after`     | Global AfterAll hook (e.g., `env_test.AfterAll`)         | -                          |
| `--runs`      | Runs per test (stability analysis)                       | 1                          |
| `--run`       | Regex pattern to filter which tests to run               | -                          |
| `--timeout`   | Timeout per test                                         | 2m                         |
| `--parallel`  | Parallel test cases                                      | 1                          |
| `--fail-fast` | Stop on first failure                                    | false                      |
| `--dry-run`   | Generate test cases without running them                 | false                      |

## Custom Context File

Create a JSON file for custom authorization:

```json
{
  "chat_id": "test-chat-001",
  "authorized": {
    "user_id": "test-user-123",
    "team_id": "test-team-456",
    "constraints": {
      "owner_only": true,
      "extra": { "department": "engineering" }
    }
  },
  "metadata": {
    "mode": "test"
  }
}
```

Use with `--ctx`:

```bash
yao agent test -i scripts.expense.setup --ctx tests/context.json -v
```

## Built-in Test Agents

### Generator Agent (`tests.generator-agent`)

Generates test cases based on target agent description.

**package.yao**:

```json
{
  "name": "Test Case Generator",
  "connector": "gpt-4o",
  "description": "Generates test cases for agent testing",
  "options": { "temperature": 0.7 },
  "automated": true
}
```

**prompts.yml**:

```yaml
- role: system
  content: |
    You are a test case generator. Generate test cases based on the target agent.

    ## Input Format
    - `target_agent`: Agent info (id, description, tools)
    - `count`: Number of test cases (default: 5)
    - `focus`: Focus area (e.g., "edge-cases", "happy-path")

    ## Output Format
    JSON array of test cases:
    [
      {
        "id": "test-id",
        "input": "User message",
        "assert": [{"type": "contains", "value": "expected"}]
      }
    ]
```

**Usage**:

```bash
yao agent test -i "agents:tests.generator-agent?count=10" -n assistants.expense
```

### Validator Agent (`tests.validator-agent`)

Validates agent responses for agent-driven assertions.

**package.yao**:

```json
{
  "name": "Response Validator",
  "connector": "gpt-4o",
  "description": "Validates responses against criteria",
  "options": { "temperature": 0 },
  "automated": true
}
```

**prompts.yml**:

```yaml
- role: system
  content: |
    You are a response validator. Evaluate whether the response meets the criteria.

    ## Input Format
    - `output`: The response to validate
    - `criteria`: The validation rules
    - `input`: Original input (optional)

    ## Output Format
    JSON object (no markdown):
    {"passed": true/false, "reason": "explanation"}

    ## Examples
    Input: {"output": "Paris is the capital", "criteria": "factually accurate"}
    Output: {"passed": true, "reason": "Statement is correct"}
```

**Usage in JSONL**:

```jsonl
{
  "id": "T001",
  "input": "Hello",
  "assert": {
    "type": "agent",
    "use": "agents:tests.validator-agent",
    "value": "Response should be friendly"
  }
}
```

**Usage in script tests**:

```typescript
t.assert.Agent(response, 'tests.validator-agent', {
  criteria: 'Response should be helpful'
});
```

### Simulator Agent (`tests.simulator-agent`)

Simulates user behavior for dynamic mode testing.

**package.yao**:

```json
{
  "name": "User Simulator",
  "connector": "gpt-4o",
  "description": "Simulates user behavior for dynamic testing",
  "options": { "temperature": 0.7 },
  "automated": true
}
```

**prompts.yml**:

```yaml
- role: system
  content: |
    You are a user simulator. Generate realistic user messages based on persona and goal.

    ## Input Format
    - `persona`: User description (e.g., "New employee")
    - `goal`: What user wants to achieve
    - `conversation`: Previous messages
    - `turn_number`: Current turn
    - `max_turns`: Maximum turns

    ## Output Format
    JSON object:
    {
      "message": "User response",
      "goal_achieved": false,
      "reasoning": "Strategy explanation"
    }

    ## Guidelines
    1. Stay in character
    2. Work toward the goal
    3. Be realistic (include natural variations)
    4. Set goal_achieved: true when done
```

**Usage in JSONL**:

```jsonl
{
  "id": "dynamic-test",
  "input": "I need help",
  "simulator": {
    "use": "tests.simulator-agent",
    "options": {
      "metadata": {
        "persona": "New employee",
        "goal": "Submit expense report"
      }
    }
  },
  "checkpoints": [
    {
      "id": "greeting",
      "assert": {
        "type": "regex",
        "value": "(?i)hello"
      }
    }
  ],
  "max_turns": 10
}
```

**Usage via CLI**:

```bash
yao agent test -i tests/dynamic.jsonl --simulator tests.simulator-agent
```

## Format Rules Reference

| Context                | Format                   | Example                                   |
| ---------------------- | ------------------------ | ----------------------------------------- |
| `-i agents:xxx` (CLI)  | Colon prefix             | `agents:tests.generator`                  |
| `-i scripts:xxx` (CLI) | Colon prefix             | `scripts:tests.gen.Generate`              |
| `-i scripts.xxx` (CLI) | Dot prefix (test mode)   | `scripts.expense.setup`                   |
| JSONL assertion `use`  | Prefix required          | `"use": "agents:tests.validator"`         |
| JSONL `simulator.use`  | No prefix (agent only)   | `"use": "tests.simulator-agent"`          |
| `--simulator` flag     | No prefix (agent only)   | `--simulator tests.simulator-agent`       |
| `t.assert.Agent()`     | No prefix (method-bound) | `t.assert.Agent(resp, "tests.validator")` |
| JSONL `before/after`   | No prefix (in src/)      | `"before": "env_test.Before"`             |
| `--before/--after`     | No prefix (in src/)      | `--before env_test.BeforeAll`             |

## Stability Analysis

```bash
yao agent test -i tests/inputs.jsonl --runs 5 -o stability.json
```

| Pass Rate | Classification  |
| --------- | --------------- |
| 100%      | Stable          |
| 80-99%    | Mostly Stable   |
| 50-79%    | Unstable        |
| < 50%     | Highly Unstable |

## CI Integration

```yaml
- name: Run Agent Tests
  run: |
    yao agent test -i assistants/keyword/tests/inputs.jsonl \
      -u ci-user -t ci-team \
      --runs 3 \
      -o report.json

- name: Run Dynamic Tests
  run: |
    yao agent test -i assistants/expense/tests/dynamic.jsonl \
      --simulator tests.simulator-agent \
      -v

- name: Run Script Tests
  run: |
    yao agent test -i scripts.expense.setup -v --fail-fast
```

## Exit Codes

| Code | Description                                         |
| ---- | --------------------------------------------------- |
| 0    | All tests passed                                    |
| 1    | Tests failed, configuration error, or runtime error |

## Debugging Tips

### Debugging Agent Call Chain

When tests fail unexpectedly (e.g., wrong agent being called), add debug logging to trace the call chain:

```typescript
// In your agent's index.ts
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  console.log('[DEBUG Create] Agent:', ctx.assistant_id);
  console.log('[DEBUG Create] Messages:', JSON.stringify(messages));
  // ... rest of hook
}

function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  console.log('[DEBUG Next] Tools:', payload.tools?.length || 0);
  console.log('[DEBUG Next] Tool results:', JSON.stringify(payload.tools));
  // ... rest of hook
}
```

### Common Issues

| Symptom                             | Likely Cause                                     | Solution                                            |
| ----------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| Wrong agent called                  | Next hook delegates to main agent                | Return `data` or `null` instead of `delegate`       |
| "System not initialized" error      | Main agent's Create hook redirects to setup      | Check session state or ensure proper initialization |
| Tool not called by LLM              | MCP tools not registered or prompt unclear       | Check `package.yao` mcp.servers and prompts.yml     |
| Image test fails with multi-modal   | Using `image_url` type with `file://`            | Use `type: "image"` with `source: "file://..."`     |
| Infinite retry loop                 | No retry counter or max attempts check           | Implement retry counter pattern                     |
| LLM ignores error and doesn't retry | Returning `data` instead of `messages` for retry | Return `{ messages: [...] }` to add to conversation |

### Verbose Output

Use `-v` flag to see detailed test execution:

```bash
yao agent test -n expense.submission -i tests/inputs.jsonl -v
```

This shows:

- Agent resolution info
- Tool calls and results
- LLM responses
- Hook execution

## See Also

- [Hooks Reference](./hooks-reference.md)
- [Assistant Structure](./assistant-structure.md)
- [Agent Context API](./agent-context-api.md)
