# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Web Application

Bun-native frontend using `Bun.serve()` with HTML imports.

## Commands

```bash
# Development
bun run dev              # Start web server with HMR (hot module reload)
bun run start            # Start web server (production)

# Build & Type Check
bun run build            # Build web application
bun run check:type       # Type check with tsgo

# Clean
bun run clean            # Remove dist and node_modules
```

## Architecture

Simple Bun-native frontend with HTML imports:

```
src/
├── index.ts            # Entry point - Bun.serve() configuration
└── ...                 # Additional source files
```

## Bun.serve() with HTML Imports

This project uses Bun's native HTML import feature instead of traditional bundlers like Vite or Webpack.

### Key Features

- **HTML imports** - Import `.html` files directly in TypeScript
- **Automatic bundling** - Bun bundles `.tsx`, `.jsx`, `.js` automatically
- **CSS support** - `<link>` tags work with Bun's CSS bundler
- **Hot Module Reload (HMR)** - Built-in with `bun --hot`
- **No separate bundler needed** - Bun handles everything

### Server Setup

```typescript
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // Optional WebSocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,      // Hot Module Reload
    console: true,  // Browser console support
  }
})
```

### HTML Files

HTML files can directly import TypeScript/JavaScript:

```html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

### Frontend Code

React and CSS imports work seamlessly:

```tsx
import React from "react";
import { createRoot } from "react-dom/client";

// Import CSS files directly
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

## Bun-Specific Guidelines

### Use Bun APIs Instead of Node.js

- `Bun.serve()` for HTTP servers (NOT Express)
- `Bun.file()` for file operations (NOT `node:fs`)
- `WebSocket` built-in (NOT `ws` package)
- `Bun.$` for shell commands (NOT `execa`)
- `bun:sqlite` for SQLite (NOT `better-sqlite3`)
- `Bun.redis` for Redis (NOT `ioredis`)
- `Bun.sql` for Postgres (NOT `pg` or `postgres.js`)

### No Need for Dotenv

Bun automatically loads `.env` files - no need for `dotenv` package.

### Commands

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file>` instead of `webpack` or `esbuild`
- Use `bun run <script>` instead of `npm run <script>`
- Use `bunx <package>` instead of `npx <package>`

## Testing

Use `bun:test` for testing:

```typescript
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Additional Resources

For more information about Bun APIs, see `node_modules/bun-types/docs/**.mdx`.
