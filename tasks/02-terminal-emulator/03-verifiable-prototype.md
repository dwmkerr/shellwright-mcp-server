# Terminal Emulator - Verifiable Prototype

## Checkpoint 1: 2025-12-08 - Test Harness

### Goal
Create a test harness that can verify terminal emulator output against expected screen state.

### Verification
```bash
npm run test:emulator
```

### Results
- Test runner reads `.cast` files (asciicast v2 format)
- Compares rendered output to `expected.txt` (80x24 grid)
- Naive renderer passes simple echo test

### Feedback
- Test format works: input.cast + expected.txt
- Naive renderer won't handle cursor movement, TUI apps
- Need real terminal emulator (avt WASM) for complex cases

### Next Steps
1. Add a test case that requires real terminal emulation (cursor movement)
2. Integrate avt WASM to replace naive renderer
3. Verify avt passes both simple and complex tests

---

## Checkpoint 2: 2025-12-09 - Terminal Emulator Integration

### Goal
Integrate terminal emulator to pass cursor movement test.

### Verification
```bash
npm run test:emulator
```

### Results
- Integrated `@xterm/headless` (from xterm.js project) instead of avt WASM
- Both tests pass: 01-echo and 02-cursor
- Added `shell_snapshot` tool returning rendered screen grid
- MCP server now properly emulates terminal state

### Feedback
- @xterm/headless works in Node.js (unlike regular xterm.js)
- Requires `allowProposedApi: true` for buffer access
- Write is async - need to await completion
- Much simpler than compiling Rust avt to WASM

### Next Steps
1. Test with real TUI application (k9s)
2. Verify shell_snapshot returns correct screen state via MCP
3. Consider image rendering (PNG export)
