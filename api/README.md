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
curl -i http://localhost:8000/sparql \
-H "Content-Type: application/json" \
-d "$(jq -n --arg data "$(cat example-files/data.ttl)" --arg query "$(cat example-files/query.rq)" '{"data": $data, "query": $query}')"
 ```

A SHACL validation example is also provided in the `example-files` directory. You can use the following command to run the validation against the dataset:
```zsh
curl -i http://localhost:8000/shacl \
-H "Content-Type: application/json" \
-d "$(jq -n --arg data "$(cat example-files/data.ttl)" --arg shapes "$(cat example-files/shapes.ttl)" '{"data": $data, "shapes": $shapes}')" \
-H "Accept: text/turtle"
```

## Documentation

The openapi specification for the API can be found at <http://localhost:8000/docs>.
