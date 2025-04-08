# hello-sparql

A small project to study [SPARQL](https://www.w3.org/TR/sparql11-query/).

Consists of a simple api that runs the SPARQL queries and a very simple ui that allows you to enter a SPARQL query and see the results.

## Usage

The simplest way to run the api and the ui is to use docker-compose:

```zsh
% docker compose up --build
```

The ui is available at [http://localhost:8501](http://localhost:8501).

The api is available at [http://localhost:8000](http://localhost:8000) and it's documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).
