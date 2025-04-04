# api

A simple API for running a SPARQL query on a dataset.

## Running the API:
To run the API locally, navigate to the `api` directory and install the dependencies:

```
% uv sync
% uv run fastapi dev
```

## Usage:

Example usage with curl:

```zsh
% curl -i http://localhost:8000/sparql \
--data-urlencode "data=`cat data.ttl`" \
--data-urlencode "query=`cat query.txt`"
```

## Documentation

The openapi specification for the API can be found at <http://localhost:8000/docs>.
