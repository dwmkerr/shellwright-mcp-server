#!/usr/bin/env python3
"""
Vim Example - Interactive editor control

Opens vim, enters insert mode, types text, saves and exits.

Usage:
    npm run dev  # start server first
    python examples/vim/run.py
"""

import asyncio
import json
import os
import sys

SERVER_URL = os.environ.get("SHELLWRIGHT_URL", "http://localhost:7498")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")


async def call_tool(session, name: str, args: dict):
    result = await session.call_tool(name, args)
    text = ""
    if result.content:
        for content in result.content:
            if hasattr(content, "text"):
                text += content.text
    return text


async def run():
    try:
        from mcp import ClientSession
        from mcp.client.streamable_http import streamablehttp_client
    except ImportError:
        print("Error: pip install mcp", file=sys.stderr)
        sys.exit(1)

    print("Vim Example")
    print(f"Server: {SERVER_URL}")
    print(f"Output: {OUTPUT_DIR}\n")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    try:
        async with streamablehttp_client(f"{SERVER_URL}/mcp") as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()

                # Start vim with a temp file
                print("[1] Starting vim...")
                result = await call_tool(session, "shell_start", {
                    "command": "vim",
                    "args": ["/tmp/shellwright-vim-test.txt"],
                    "cols": 80,
                    "rows": 24,
                })
                session_id = json.loads(result)["session_id"]

                # Wait for vim to load
                await call_tool(session, "shell_send", {
                    "session_id": session_id,
                    "input": "",
                    "delay_ms": 1000,
                })

                # Screenshot: vim opened
                print("[2] Screenshot: vim opened...")
                await call_tool(session, "shell_screenshot", {
                    "session_id": session_id,
                    "output": f"{OUTPUT_DIR}/step-01-vim-opened",
                })

                # Enter insert mode and type text
                print("[3] Entering insert mode and typing...")
                await call_tool(session, "shell_send", {
                    "session_id": session_id,
                    "input": "iHello from Shellwright!\n\nThis text was typed by an AI agent.",
                    "delay_ms": 500,
                })

                # Screenshot: text entered
                print("[4] Screenshot: text entered...")
                await call_tool(session, "shell_screenshot", {
                    "session_id": session_id,
                    "output": f"{OUTPUT_DIR}/step-02-text-entered",
                })

                # Exit insert mode, save and quit
                print("[5] Saving and exiting...")
                await call_tool(session, "shell_send", {
                    "session_id": session_id,
                    "input": "\x1b:wq\r",  # Escape, then :wq Enter
                    "delay_ms": 500,
                })

                # Stop session
                await call_tool(session, "shell_stop", {"session_id": session_id})
                print(f"\nDone. Screenshots in: {OUTPUT_DIR}")

    except Exception as e:
        if "Connect" in str(type(e).__name__) or "connection" in str(e).lower():
            print("Error: Shellwright MCP server not running - try 'npm run dev'", file=sys.stderr)
        else:
            print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run())
