#!/usr/bin/env python3
"""
Shellwright k9s Demo

Uses official MCP Python SDK with OpenAI for LLM.

Prerequisites:
- Shellwright server running: npm run dev
- k9s installed: brew install k9s
- Kubernetes cluster accessible
- Copy .env.sample to .env and configure

Usage:
    cd examples
    pip install mcp openai python-dotenv
    python k9s-demo.py
"""

import asyncio
import glob
import json
import os
import shutil

from dotenv import load_dotenv
from mcp import ClientSession, types
from mcp.client.streamable_http import streamablehttp_client
from openai import OpenAI

load_dotenv()

SERVER_URL = os.environ.get("SHELLWRIGHT_URL", "http://localhost:7498")
SCREENSHOT_DIR = os.environ.get("SHELLWRIGHT_SCREENSHOTS", "/tmp/shellwright")
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")


async def run():
    print("Shellwright k9s Demo")
    print(f"Server: {SERVER_URL}")
    print(f"Screenshots: {SCREENSHOT_DIR}")

    async with streamablehttp_client(f"{SERVER_URL}/mcp") as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            print("\nInitializing MCP session...")
            await session.initialize()

            print("Fetching tools from MCP server...")
            tools_result = await session.list_tools()
            print(f"Available tools: {[t.name for t in tools_result.tools]}")

            if not tools_result.tools:
                print("ERROR: No tools found. Is the server running?")
                return

            # Convert MCP tools to OpenAI format
            openai_tools = []
            for tool in tools_result.tools:
                openai_tools.append({
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description or "",
                        "parameters": tool.inputSchema,
                    },
                })

            # Run the LLM conversation
            client = OpenAI()
            messages = [
                {
                    "role": "system",
                    "content": f"""You are an assistant that can interact with terminal applications using Shellwright tools.

For k9s navigation:
- ':' opens command mode, then type a resource like 'deploy' or 'pods' and press enter (\\r)
- Arrow keys: \\x1b[A (up), \\x1b[B (down)
- 'd' to describe/view details
- 'q' to go back

Save screenshots to {SCREENSHOT_DIR}/ with descriptive names.
Take a screenshot after each significant step.""",
                },
                {
                    "role": "user",
                    "content": """Start k9s, look at the deployments in the current kubernetes cluster,
                    pick one and show me its details. Take a screenshot at each step.
                    When done, stop the session."""
                },
            ]

            print("\nStarting conversation...\n")

            while True:
                response = client.chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    tools=openai_tools,
                    tool_choice="auto",
                )

                message = response.choices[0].message

                if message.tool_calls:
                    messages.append(message)

                    for tool_call in message.tool_calls:
                        name = tool_call.function.name
                        args = json.loads(tool_call.function.arguments)

                        print(f"[Tool] {name}({json.dumps(args)})")

                        # Call the MCP tool
                        result = await session.call_tool(name, args)

                        # Extract text from result
                        result_text = ""
                        if result.content:
                            for content in result.content:
                                if isinstance(content, types.TextContent):
                                    result_text += content.text

                        print(f"[Result] {result_text}\n")

                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": result_text,
                        })
                else:
                    print(f"Assistant: {message.content}")
                    break

    # Copy screenshots to local ./screenshots directory
    local_screenshots = "./screenshots"
    os.makedirs(local_screenshots, exist_ok=True)
    png_files = glob.glob(f"{SCREENSHOT_DIR}/*.png")
    if png_files:
        print(f"\nCopying {len(png_files)} screenshots to {local_screenshots}/")
        for f in png_files:
            shutil.copy(f, local_screenshots)
            print(f"  {os.path.basename(f)}")


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()
