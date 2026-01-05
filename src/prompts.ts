import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "vim-edit",
    "Edit a file in vim with proper mode handling",
    { filename: z.string().describe("File to edit") },
    ({ filename }) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Edit ${filename} in vim. Follow this sequence:
1. shell_send: "vim ${filename}\\r" - include \\r to execute
2. Wait and check bufferAfter shows vim opened (~ lines, not $ prompt)
3. shell_send: "i" to enter INSERT mode - verify "-- INSERT --" in bufferAfter
4. Type your content
5. shell_send: "\\x1b" (Escape) to exit insert mode
6. shell_send: ":wq\\r" to save and quit
7. Verify bufferAfter shows shell prompt again`
        }
      }]
    })
  );

  server.prompt(
    "record-session",
    "Record a terminal session as GIF",
    { task: z.string().describe("What to demonstrate") },
    ({ task }) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Record a terminal session demonstrating: ${task}

Workflow:
1. shell_start with appropriate cols/rows
2. shell_record_start with fps (10-15 for demos)
3. Perform actions - remember \\r after commands!
4. shell_screenshot at key moments
5. shell_record_stop with descriptive name
6. shell_stop to cleanup`
        }
      }]
    })
  );

  server.prompt(
    "terminal-basics",
    "Best practices for shell automation",
    {},
    () => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Terminal automation best practices:

Commands:
- Always end commands with \\r to execute them
- Check bufferAfter to verify command executed as expected

Vim:
- Press "i" to enter INSERT mode before typing
- Look for "-- INSERT --" in bufferAfter to confirm
- Press Escape (\\x1b) then ":wq\\r" to save and quit

Common escapes:
- Enter: \\r
- Escape: \\x1b
- Ctrl+C: \\x03
- Arrow keys: \\x1b[A (up), \\x1b[B (down), \\x1b[C (right), \\x1b[D (left)

Recording:
- Start recording early, stop after task complete
- Take screenshots at key moments for documentation`
        }
      }]
    })
  );

  server.prompt(
    "theme-selection",
    "Guide for choosing and using terminal themes",
    {},
    () => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Terminal theme selection guide:

Available themes:
- one-dark: Dark theme with muted colors (default)
- one-light: Light background, good for presentations
- dracula: Dark purple theme, popular with developers
- solarized-dark: Dark blue-green theme, easy on eyes
- nord: Arctic-inspired dark theme, cool blue tones

Usage:
Set theme when starting a session:
  shell_start({ command: "bash", args: ["--login", "-i"], theme: "dracula" })

Theme applies to all screenshots and recordings for that session.
Different sessions can use different themes.

Tips:
- Use 'one-light' for light mode screenshots or presentations
- Use 'dracula' or 'nord' for a more vibrant dark look
- The default 'one-dark' works well for most cases`
        }
      }]
    })
  );
}
