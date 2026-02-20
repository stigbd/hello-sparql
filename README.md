# hello-sparql

A small project to study [SPARQL](https://www.w3.org/TR/sparql11-query/).

Consists of a simple FastAPI backend that runs SPARQL queries and a modern React + TypeScript UI that allows you to enter a SPARQL query and RDF data to see the results.

## Usage

The simplest way to run the api and the ui is to use docker compose:

```zsh
% docker compose up --build
```

The UI is available at [http://localhost:3000](http://localhost:3000).

The API is available at [http://localhost:8000](http://localhost:8000) and its documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

## Architecture

### API
- FastAPI backend with Python
- Executes SPARQL queries on RDF data
- Supports multiple output formats (text, JSON, CSV, XML)

### UI
- React 18 + TypeScript
- Vite for fast development and building
- Biome for fast linting and formatting
- pnpm workspaces for monorepo structure
- Organized into apps and packages for modularity

For detailed UI setup and development instructions, see [ui/README.md](ui/README.md).
