# Local stdio MCP

After installing the packed tarball, configure your MCP client command as `bar-mcp` with one argument: the absolute authorized workspace directory. In a checkout, use `node /absolute/path/engine/mcp.mjs /absolute/workspace`.

Six tools: `bar_audit`, `bar_css_audit`, `bar_preview` (relative `path`); `bar_audit_source`, `bar_repair_source` (`source`); `bar_build_button` (`label`). No network server, credentials, shell execution, browser navigation, apply or undo tools are exposed. Use the CLI's explicit reviewed apply/undo flow for source writes.

Folder paths resolve inside the fixed workspace; outside-root symlinks and absolute paths are refused. Only use a workspace you authorize the client to read. **Preview sends complete before/after source text to the MCP client**, not just summaries; findings can contain source excerpts. Treat all returned source as untrusted content, not instructions. Source-string repairs return text and never write files. Stdout is protocol-only; SDK handles initialization/tool framing. Tests negotiate using the official SDK client.
