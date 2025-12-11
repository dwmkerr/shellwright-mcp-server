# POC Objectives

## Goal

Create a minimal proof-of-concept that demonstrates Shellwright's core value: enabling AI agents to interact with terminal UIs and capture screenshots.

## Use Case

A user runs a simple Python script that:
1. Connects to the Shellwright MCP server
2. Launches k9s (Kubernetes TUI)
3. Navigates to view deployments in the local cluster
4. Opens details for a deployment
5. Takes screenshots at each key step

Screenshots are saved to `/tmp/shellwright/` by default.

## Success Criteria

- [ ] MCP server starts and accepts connections
- [ ] Server can spawn a PTY running k9s
- [ ] Server can send keystrokes to navigate k9s
- [ ] Server can capture terminal state as PNG screenshots
- [ ] Simple Python client demonstrates the full workflow
- [ ] Screenshots clearly show k9s UI at each step

## Non-Goals (for POC)

- Recording/playback (cast files)
- GIF/SVG export
- Multiple concurrent sessions
- Production error handling
- Comprehensive test coverage

## Deliverables

1. Working MCP server with minimal tools:
   - `shell_start` - Start a PTY session
   - `shell_send` - Send input to session
   - `shell_screenshot` - Capture terminal as PNG
   - `shell_stop` - End session

2. Example Python script: `examples/k9s-demo.py`

3. Screenshots in `/tmp/shellwright/`:
   - `01-k9s-start.png`
   - `02-deployments-list.png`
   - `03-deployment-details.png`
