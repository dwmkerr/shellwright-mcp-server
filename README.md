# Shellwright MCP Server

Playwright for the shell. An MCP server that lets AI agents record, capture, and automate terminal sessions.

- Create terminal recordings for documentation
- Capture terminal screenshots as PNG, SVG or plain ANSII
- Automate TUI applications like `k9s`, `htop` or `vim`
- Generate step-by-step terminal demos
- Attach lovely terminal screenshots to PRs or whatever you want

As the scary 'AI is taking over the world' demo, have your AI agent show you how to close `vim`:

> Open Vim. Write some text or show me something cool. Show me how to close Vim. Make sure you create a video recording and take some screenshots.

See the output here:

TODO

Check the [Examples](#Examples) for more.

## Getting Started

```bash
npm install
npm run dev
```

The server runs at `http://localhost:7498/mcp`.

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

Connect to `http://localhost:7498/mcp` and explore the available tools.

### Run MCP Examples

These examples directly call the Shellwright MCP server tools to run commands and generate screenshots. This shows how the tools work and how they can be used to create output for specific examples.

```bash
# In the first terminal, run the mcp server.
npm run dev

# In a second terminal, run a sample.
cd examples
cp .env.sample .env
# Edit .env with your OpenAI API key

# Run a specific example.
python ./k9s/run.py
```

### Agent Demo

Run the demo agent - it has the MCP tools available and will take screenshots based on the input you provide. This does require OpenAI credentials to be set in `./examples/.env`:

```bash
# In the first terminal, run the mcp server.
npm run dev

# In a second terminal, run the demo.
cd examples
cp .env.sample .env
# Edit .env with your OpenAI API key

# Run the demo. The user will be asked to provide a message.
python ./demo.py
# eg:
# Enter Message: run 'top' and give me a screenshot tell me where the file is

# ...or provide a message directly.
python ./demo.py -- "Run a shell command to show me the names \
of the folders in this directory and take a screenshot and give me its path"
```


## TODO

- Set screen size tool
- Note that only local commands are available
- screenshot
- themes

## License

MIT
