"""Streamlit ui module."""

import logging
import os
from datetime import UTC, datetime
from http import HTTPStatus

import httpx
import pandas as pd
import streamlit as st
from code_editor import code_editor

SPARQL_ENDPOINT = os.getenv("SPARQL_ENDPOINT", "http://localhost:8000/sparql")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class SPARQLQueryError(Exception):
    """SPARQL Query Exception."""


def run_query(query: str, data: str) -> str:
    """Run query on data."""
    # Run query on data and return result
    with httpx.Client() as client:
        response = client.post(
            SPARQL_ENDPOINT, data={"query": query, "data": data}, timeout=60.0
        )
        if response.status_code != HTTPStatus.OK:
            msg = f"Error running query: {response.json()['detail']}"
            raise SPARQLQueryError(msg)
        return response.text


basic_select_query = """PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org/>

SELECT ?s ?p ?o
WHERE {
    ?s ?p ?o .
}"""

basic_construct_query = """PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org/>

CONSTRUCT {
    ?s ?p ?o .
} WHERE {
    ?s ?p ?o .
}"""

count_query = """PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org/>

SELECT (COUNT(*) AS ?count)
WHERE {
    ?s ?p ?o .
}"""

initial_data = """@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix ex: <http://example.org/>.

ex:John rdf:type ex:Person ;
        ex:name "John" ;
        ex:age 30 .

ex:Jane rdf:type ex:Person ;
        ex:name "Jane" ;
        ex:age 25 .

ex:Kitty rdf:type ex:Cat ;
        ex:name "Kitty" ;
        ex:age 7 ."""


def result_to_dataframe(result: list[str]) -> pd.DataFrame:
    """Convert result to dataframe."""
    table: list[list[str]] = [line.split("|") for line in result]
    df = pd.DataFrame(table)
    df.columns = table[0]
    # Remove header and row with just a line:
    return df.drop([0, 1])


def main() -> None:
    """Set up and start streamlit."""
    query = basic_select_query
    data = initial_data

    st.set_page_config(
        page_title="SPARQL Query Explorer",
        page_icon="sparql-40.png",
        layout="wide",
        initial_sidebar_state="collapsed",
    )
    st.title("SPARQL Query Explorer")

    with st.sidebar:
        query_type = st.radio(
            "Choose a sparql query type", ("Basic select", "Count", "Basic construct")
        )
        if query_type == "Basic":
            query = basic_select_query
        elif query_type == "Count":
            query = count_query
        elif query_type == "Basic construct":
            query = basic_construct_query

    left_col, right_col = st.columns(2)

    # Get query and data from user input:
    with left_col:
        response_dict_query = code_editor(
            query,
            lang="turtle",
            info={"info": [{"name": "Enter your SPARQL query here"}]},
            options={"showLineNumbers": True},
        )
        query = response_dict_query["text"] or query

    with right_col:
        response_dict_data = code_editor(
            data,
            lang="turtle",
            info={"info": [{"name": "Enter your data here, followed by <CTRL+ENTER>"}]},
            options={"showLineNumbers": True},
        )
        logger.info("Got data from code editor.")
        data = response_dict_data["text"] or data

    if query or data:
        try:
            start_time = datetime.now(tz=UTC)
            logger.info("Running query...")
            result: list[str] = run_query(query, data).splitlines()
            end_time = datetime.now(tz=UTC)
            duration = (end_time - start_time).total_seconds()
            logger.info("Query ran in %f seconds.", duration)
            st.header("Result")
            st.dataframe(data=result_to_dataframe(result))
        except SPARQLQueryError as e:
            st.error(f"Error: {e}")


if __name__ == "__main__":
    main()
