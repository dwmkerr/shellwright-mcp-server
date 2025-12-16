# Architecture

## Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Server                              │
│  shell_start | shell_send | shell_read | shell_snapshot | ...   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Session                                │
│  ┌───────────┐    ┌─────────────┐    ┌───────────────────────┐  │
│  │  node-pty │───▶│   xterm     │───▶│   Recording (opt)     │  │
│  │           │    │  (headless) │    │   frames[] + interval │  │
│  └───────────┘    └──────┬──────┘    └───────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Render Pipeline                            │
│     xterm buffer ──▶ SVG ──▶ PNG ──▶ [ffmpeg] ──▶ GIF/MP4      │
│                   (buffer-   (resvg)                            │
│                    to-svg)                                      │
└─────────────────────────────────────────────────────────────────┘
```

## How It Works

1. **PTY** - `node-pty` spawns isolated shell processes
2. **Terminal** - `@xterm/headless` maintains screen buffer, processes ANSI sequences
3. **Snapshot** - Read xterm buffer as text grid
4. **Screenshot** - Render buffer to SVG (with colors), convert to PNG via `resvg`
5. **Recording** - Capture PNG frames at interval, encode to video via `ffmpeg`

## Data Flow

```
User input ──▶ pty.write() ──▶ shell process
                                    │
                                    ▼
              terminal.write() ◀── pty.onData()
                    │
                    ▼
              xterm buffer ──▶ snapshot (text)
                    │
                    └─────────▶ screenshot (SVG/PNG)
                                    │
                                    └─▶ recording (frame sequence ──▶ video)
```
