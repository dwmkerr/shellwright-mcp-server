# POC Findings

## Summary

The POC successfully demonstrated AI-driven terminal automation via MCP, but revealed a critical gap: **terminal rendering**. Simple ANSI stripping is insufficient for TUI applications like k9s.

## What Worked

### MCP Server
- Official `@modelcontextprotocol/sdk` with Streamable HTTP transport
- Standard `/mcp` endpoint works with MCP Inspector
- Session management for persistent connections
- Express-based server with proper POST/GET/DELETE handling

### PTY Management
- `node-pty` successfully spawns isolated shell processes
- Commands can be sent, output captured
- Sessions persist across multiple tool calls
- Clean environment isolation (stripped terminal-specific env vars)

### Tool Calling Flow
- Python MCP SDK (`mcp` package) connects to server
- Tools fetched and converted to OpenAI format
- LLM successfully orchestrates: start → send → read → screenshot → stop
- k9s launched, navigated, and terminated correctly

## What Didn't Work

### Terminal Rendering
The core problem: **raw PTY output ≠ rendered screen**

For full-screen TUI apps like k9s:
- Output is a stream of ANSI escape sequences
- Includes cursor positioning, screen clearing, color codes
- Simple regex stripping produces garbage
- Need actual terminal emulation to render final screen state

Attempted solutions:
| Approach | Result |
|----------|--------|
| Regex ANSI stripping | Incomplete - misses cursor positioning, screen modes |
| `strip-ansi` package | Same issue - doesn't handle TUI complexity |
| `xterm-headless` | Browser-only, doesn't work in Node.js ESM |

### Screenshots
- `.ansi` files contain raw escape sequences (usable for replay)
- `.txt` files are unreadable due to failed ANSI stripping
- No PNG rendering attempted

## Key Learning

**We need a terminal renderer component** - something that:

1. Accepts PTY output stream
2. Maintains virtual screen buffer (rows × cols)
3. Processes all terminal control sequences (cursor, colors, screen modes)
4. Renders current screen state to clean text
5. Optionally renders to PNG/SVG

This is essentially a headless terminal emulator.

## Potential Solutions

| Option | Pros | Cons |
|--------|------|------|
| **node-terminal** / **blessed** | Pure JS, Node-native | May not handle all escape sequences |
| **Subprocess with script/ttyrec** | Battle-tested | External dependency, complexity |
| **Custom renderer** | Full control | Significant effort |
| **asciinema-player headless** | Proven format | Designed for browser |

## Architecture Recommendation

```
┌─────────────────────────────────────────────────────┐
│                  MCP Server                          │
├─────────────────────────────────────────────────────┤
│  shell_start  │  shell_send  │  shell_read  │ ...  │
├───────────────┴──────────────┴──────────────┴──────┤
│                 Session Manager                      │
├─────────────────────────────────────────────────────┤
│  PTY Process  │  Terminal Renderer  │  Screen Buffer│
│  (node-pty)   │  (TODO: implement)  │  (rows × cols)│
└─────────────────────────────────────────────────────┘
```

The Terminal Renderer is the missing piece.

## Checkpoint Status

| Phase | Status | Notes |
|-------|--------|-------|
| PTY management | ✅ Done | Works well |
| Screenshot capture | ⚠️ Partial | Raw ANSI only, no clean render |
| k9s demo | ⚠️ Partial | Runs but screenshots unreadable |

## Next Steps

1. **Research terminal emulation libraries** for Node.js
2. **Prototype renderer** - start with basic cursor/clear handling
3. **Test with simpler apps** - `htop`, `vim` before k9s
4. **Consider asciinema format** - `.cast` files for recording + later rendering

## Files Created

```
src/index.ts          # MCP server with PTY tools
examples/k9s-demo.py  # Python demo using MCP SDK + OpenAI
examples/.env.sample  # Environment template
```

## Prior Art to Explore

Tools that solve related problems:

- [asciinema](https://asciinema.org/) - Terminal recording to `.cast` format
- [agg](https://github.com/asciinema/agg) - Convert `.cast` to GIF
- [VHS](https://github.com/charmbracelet/vhs) - Scripted terminal recordings with `.tape` files
- [terminalizer](https://github.com/faressoft/terminalizer) - Terminal to GIF
- [svg-term-cli](https://github.com/marionebl/svg-term-cli) - asciinema to SVG
- [Playwright MCP](https://github.com/anthropics/mcp-server-playwright) - Browser automation (architectural reference)

## Implementation Options

### Option A: Wrap asciinema
Use asciinema for recording and agg for conversion.
```
asciinema rec → .cast file → agg → .gif
```

### Option B: Wrap VHS
Use VHS for scripted recordings with timing control.

### Option C: Custom PTY + Renderer
Current approach - spawn PTY, capture output, render with terminal emulator library.
