# api

A simple API for running a SPARQL query on a dataset.

## Running the API:
To run the API locally, navigate to the `api` directory and install the dependencies:

```zsh
% uv sync
% uv run fastapi dev
```

Or in docker:

```zsh
% docker build -t hello-sparql-api .
% docker run --name hello-sparql-api -d -p 8080:8080 hello-sparql-api
```

## Usage:

Example usage with curl:

A SPARQL query and dataset are provided in the `example-files` directory. You can use the following command to run the query against the dataset:
```zsh
% curl -i http://localhost:8000/sparql \
--data-urlencode "data=`cat example-files/data.ttl`" \
--data-urlencode "query=`cat example-files/query.rq`"
```

A SHACL validation example is also provided in the `example-files` directory. You can use the following command to run the validation against the dataset:
```zsh
% curl -i http://localhost:8000/shacl \
--data-urlencode "data=`cat example-files/data.ttl`" \
--data-urlencode "shapes=`cat example-files/shapes.ttl`" \
--header "Accept: text/turtle"
```

## Documentation

The openapi specification for the API can be found at <http://localhost:8000/docs>.
