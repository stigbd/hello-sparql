# UI - SPARQL Query Explorer

A modern React + TypeScript UI for the SPARQL Query Explorer. This project uses a monorepo structure with workspaces to organize shared packages and applications.

## Project Structure

```
ui/
├── apps/
│   └── web/                    # Main React application
│       ├── src/
│       │   ├── components/     # App-specific components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── constants/      # Query templates and constants
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
├── packages/
│   ├── ui/                     # Shared UI components
│   │   └── src/
│   │       └── components/
│   ├── api-client/             # SPARQL API client
│   │   └── src/
│   └── types/                  # Shared TypeScript types
│       └── src/
├── package.json                # Root workspace configuration
├── pnpm-workspace.yaml
├── biome.json                  # Biome configuration
└── tsconfig.json               # Base TypeScript config
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query (React Query)** - API state management
- **Biome** - Fast formatter and linter
- **pnpm** - Package manager with workspace support

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

Install pnpm if you don't have it:
```bash
npm install -g pnpm
```

## Development

### Install Dependencies

From the `ui` directory:

```bash
pnpm install
```

This will install dependencies for all packages and apps in the workspace.

### Run Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

The API should be running at [http://localhost:8000](http://localhost:8000).

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

### Type Checking

```bash
pnpm type-check
```

### Linting and Formatting

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Check and fix everything (lint + format)
pnpm check:fix
```
## Testing

```bash
pnpm test
```

## Docker

Build and run with Docker:

```bash
docker build -t hello-sparql-ui .
docker run --name hello-sparql-ui -d -p 3000:3000 hello-sparql-ui
```

Or use with docker-compose from the root directory:

```bash
cd ..
docker compose up --build
```

The UI will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file in `apps/web/` for local development:

```env
VITE_SPARQL_ENDPOINT=http://localhost:8000
VITE_API_URL=http://localhost:8000
```

## Features

- **Query Templates** - Pre-built SPARQL query examples (Select, Count, Construct)
- **Code Editors** - Syntax-aware editors for SPARQL queries and RDF data (Turtle format)
- **Multiple Output Formats** - View results as text tables, JSON, CSV, or XML
- **Real-time Execution** - Execute queries with loading states and error handling
- **Responsive Design** - Works on desktop and mobile devices
- **Query Duration** - See how long each query takes to execute

## Workspace Packages

### @hello-sparql/web

The main web application. Contains the UI, routing, and application-specific logic.

### @hello-sparql/ui

Shared UI components that can be reused across applications:
- `CodeEditor` - Code editor component with syntax highlighting
- `ResultsTable` - Table component for displaying query results
- `LoadingSpinner` - Loading indicator component

### @hello-sparql/api-client

API client for communicating with the SPARQL backend:
- `SPARQLClient` - Main client class
- `createSPARQLClient` - Factory function
- Error handling and request/response types

### @hello-sparql/types

Shared TypeScript types and interfaces used across all packages:
- `SPARQLQueryRequest` - Query request structure
- `SPARQLResult` - Result types
- `QueryTemplate` - Query template definitions
- `SerializationFormat` - Output format types

## Adding New Packages

To add a new package to the workspace:

1. Create the package directory under `packages/`
2. Add a `package.json` with the name `@hello-sparql/<package-name>`
3. Add it to the TypeScript references in dependent packages
4. Run `pnpm install` to link the workspace packages

## Migration from Streamlit

This UI replaces the previous Streamlit implementation. The Streamlit code has been moved to `app-streamlit-backup/` for reference.

Key improvements:
- Better performance with Vite and React
- Type safety with TypeScript
- Modern component architecture
- Better code organization with monorepo structure
- More flexible styling and customization
- Better developer experience
- Fast formatting and linting with Biome

## Troubleshooting

### pnpm install fails

Make sure you're using pnpm >= 8.0.0:
```bash
pnpm --version
```

### Types not resolving across packages

Run type check to see which references are missing:
```bash
pnpm type-check
```

### Code formatting issues

Format all code with Biome:
```bash
pnpm format
```

### Port already in use

Change the port in `apps/web/vite.config.ts`:
```typescript
server: {
  port: 3001, // Change this
}
```

### API connection issues

Make sure the SPARQL API is running on port 8000 and the environment variables are set correctly.

## Editor Integration

### Zed

Biome is configured in `.zed/settings.json` with format-on-save enabled.

### Other Editors

Install the Biome extension for your editor:
- **VS Code**: Install "Biome" extension
- **IntelliJ/WebStorm**: Use built-in Biome support
- **Neovim**: Use `nvim-lspconfig` with Biome LSP

## Contributing

When adding new features:

1. Add shared types to `packages/types`
2. Add reusable components to `packages/ui`
3. Add API methods to `packages/api-client`
4. Add app-specific code to `apps/web`

This keeps the codebase modular and maintainable.

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Biome](https://biomejs.dev/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)
