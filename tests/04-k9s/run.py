#!/usr/bin/env python3
"""
K9s Integration Test

Opens k9s via MCP tools, takes screenshots, navigates to deployments.
Requires: pip install mcp

Usage:
    npm run dev  # start server first
    python tests/04-k9s/run.py
"""

import asyncio
import os
import sys

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

SERVER_URL = os.environ.get("SHELLWRIGHT_URL", "http://localhost:7498")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")


async def call_tool(session: ClientSession, name: str, args: dict):
    """Call an MCP tool and return the text result."""
    result = await session.call_tool(name, args)
    text = ""
    if result.content:
        for content in result.content:
            if hasattr(content, "text"):
                text += content.text
    return text


async def run():
    print(f"K9s Integration Test")
    print(f"Server: {SERVER_URL}")
    print(f"Output: {OUTPUT_DIR}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    async with streamablehttp_client(f"{SERVER_URL}/mcp") as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            print("MCP session initialized\n")

            # Start k9s
            print("[1] Starting k9s...")
            result = await call_tool(session, "shell_start", {
                "command": "k9s",
                "cols": 120,
                "rows": 40,
            })
            import json
            session_id = json.loads(result)["session_id"]
            print(f"    Session: {session_id}")

            # Wait for k9s to load
            await call_tool(session, "shell_send", {
                "session_id": session_id,
                "input": "",
                "delay_ms": 3000,
            })

            # Screenshot 1: Initial view
            print("[2] Taking screenshot: step-01-k9s...")
            await call_tool(session, "shell_screenshot", {
                "session_id": session_id,
                "output": f"{OUTPUT_DIR}/step-01-k9s",
            })

            # Navigate to deployments
            print("[3] Navigating to deployments...")
            await call_tool(session, "shell_send", {
                "session_id": session_id,
                "input": ":deploy\r",
                "delay_ms": 2000,
            })

            # Screenshot 2: Deployments view
            print("[4] Taking screenshot: step-02-deployments...")
            await call_tool(session, "shell_screenshot", {
                "session_id": session_id,
                "output": f"{OUTPUT_DIR}/step-02-deployments",
            })

            # Exit k9s
            print("[5] Exiting k9s...")
            await call_tool(session, "shell_send", {
                "session_id": session_id,
                "input": ":q\r",
                "delay_ms": 500,
            })

            # Stop session
            print("[6] Stopping session...")
            await call_tool(session, "shell_stop", {"session_id": session_id})

    print(f"\nDone. Output files in: {OUTPUT_DIR}")


if __name__ == "__main__":
    try:
        asyncio.run(run())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
