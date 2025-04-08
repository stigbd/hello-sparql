# ui

A very simple UI for the SHACL Validator API.

The user will be able to create a data graph and create a query. The user can then submit the data graph and query and get a result.

## Usage

Start the ui application:

```zsh
% uv sync
% uv run streamlit run app/sparql_query.py
```

Or run in docker:

```zsh
% docker build -t hello-sparql-ui .
% docker run --name hello-sparql-ui -d -p 8501:8501 hello-sparql-ui
```

Go to <http://localhost:8501> to see the UI.
