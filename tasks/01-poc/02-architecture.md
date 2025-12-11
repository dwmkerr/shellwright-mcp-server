# POC Architecture

## Overview

Minimal architecture to demonstrate PTY management and screenshot capture. Single session, synchronous operations.

## Component Diagram

```
┌─────────────────┐     stdio/JSON-RPC      ┌──────────────────────┐
│  Python Client  │ ◄─────────────────────► │  Shellwright MCP     │
│  (k9s-demo.py)  │                         │  Server              │
└─────────────────┘                         └──────────┬───────────┘
                                                       │
                                                       │ manages
                                                       ▼
                                            ┌──────────────────────┐
                                            │  PTY Session         │
                                            │  ┌────────────────┐  │
                                            │  │ k9s process    │  │
                                            │  │ (cols x rows)  │  │
                                            │  └────────────────┘  │
                                            │  Terminal Buffer     │
                                            └──────────┬───────────┘
                                                       │
                                                       │ renders to
                                                       ▼
                                            ┌──────────────────────┐
                                            │  PNG Screenshot      │
                                            │  /tmp/shellwright/   │
                                            └──────────────────────┘
```

## Data Model

```typescript
interface Session {
  id: string;
  pty: IPty;           // node-pty instance
  cols: number;
  rows: number;
  buffer: string[];    // terminal line buffer
}

interface ScreenshotOptions {
  output: string;      // file path
  // Future: format, font, colors
}
```

## MCP Tools

### shell_start
```json
{
  "command": "k9s",
  "args": [],
  "cols": 120,
  "rows": 40
}
```
Returns: `{ "session_id": "..." }`

### shell_send
```json
{
  "session_id": "...",
  "input": ":",           // or keys like "\x1b[B" for arrow down
  "delay_ms": 100
}
```
Returns: `{ "success": true }`

### shell_screenshot
```json
{
  "session_id": "...",
  "output": "/tmp/shellwright/01-start.png"
}
```
Returns: `{ "path": "/tmp/shellwright/01-start.png" }`

### shell_stop
```json
{
  "session_id": "..."
}
```
Returns: `{ "success": true }`

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP server framework |
| `node-pty` | PTY spawning and management |
| `canvas` or `sharp` | Render terminal buffer to PNG |

## One-Way Decisions

1. **Terminal rendering approach?**
   - Option A: Use `node-canvas` to render text directly
   - Option B: Use a terminal emulator library (xterm.js headless)
   - Option C: Shell out to external tool (svg-term, agg)

2. **Buffer management?**
   - Option A: Simple line array (lose scrollback)
   - Option B: Full terminal emulator state (xterm-headless)

## Implementation Phases

### Phase 1: PTY Management
- `shell_start` spawns PTY
- `shell_send` writes to PTY
- `shell_stop` kills process
- No screenshot yet, just verify PTY works

### Phase 2: Screenshot Capture
- Capture terminal buffer
- Render to PNG
- Save to disk

### Phase 3: Demo Script
- Python client using MCP SDK
- k9s navigation sequence
- Screenshot at each step
