# Verifiable Prototype

## Plan

- [x] Phase 1: PTY management (start, send, read, stop)
- [x] Phase 2: Screenshot capture (raw ANSI + basic text stripping)
- [x] Phase 3: k9s demo script

## Status

**POC Complete** - See `04-findings.md` for detailed findings and next steps.

---

## Checkpoints

## Checkpoint: 2024-12-08

### Goal
Get basic PTY management working and verify with MCP Inspector.

### Tools Implemented

| Tool | Description | Status |
|------|-------------|--------|
| `shell_start` | Start a new PTY session with a command | ✅ Working |
| `shell_send` | Send input to a PTY session | ✅ Working |
| `shell_read` | Read the current terminal buffer contents | ✅ Working |
| `shell_screenshot` | Capture terminal state to files | ⚠️ Partial |
| `shell_stop` | Stop a PTY session | ✅ Working |

### Verification

**Step 1: Start the server**
```bash
cd /Users/Dave_Kerr/repos/github/dwmkerr/shellwright-mcp-server
npm run dev
```

Expected output:
```
[shellwright] MCP server running at http://localhost:7498/mcp
```

**Step 2: Test with MCP Inspector**

Open MCP Inspector and connect to:
```
http://localhost:7498/mcp
```

Server logs will show requests:
```
[shellwright] POST /mcp new
[shellwright] New session initializing
[shellwright] Session initialized: <uuid>
```

Verify:
- [x] Connection succeeds
- [x] All 5 tools appear in tools list
- [x] Can call `shell_start` with `{"command": "bash"}`
- [x] Can call `shell_send` with session_id and input
- [x] Can call `shell_read` to see terminal output
- [x] Can call `shell_stop` to clean up

**Step 3: Run Python demo**
```bash
cd examples
pip install mcp openai python-dotenv httpx
source .env
python k9s-demo.py
```

### Results

**What Worked:**
- MCP server with official SDK and Streamable HTTP transport
- PTY management with node-pty
- Session persistence across tool calls
- Python client using official MCP SDK
- k9s launched, navigated, and terminated correctly

**What Didn't Work:**
- Terminal rendering for TUI apps - simple ANSI stripping produces garbage
- Screenshots are .ansi (raw) and .txt (stripped but unreadable for TUI apps)

### Key Finding

**Need a terminal renderer component** - raw PTY output ≠ rendered screen state. See `04-findings.md` for full analysis.

### Next Steps

1. Research terminal emulation libraries for Node.js
2. Prototype renderer with basic cursor/clear handling
3. Test with simpler apps (htop, vim) before k9s
4. Consider asciinema format for recording + later rendering
