import httpx
import streamlit as st
import pandas as pd


def run_query(query, data):
    # Run query on data and return result
    with httpx.Client() as client:
        response = client.post("http://localhost:8000/sparql", data={"query": query, "data": data})
        if response.status_code != 200:
            raise Exception(f"Error running query: {response.json()['detail']}")
        return response.text


initial_query = """
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org/>

SELECT ?s ?p ?o
WHERE {
    ?s ?p ?o .
}
"""
initial_data = """
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix ex: <http://example.org/>.

ex:John rdf:type ex:Person ;
        ex:name "John" ;
        ex:age 30 .

ex:Jane rdf:type ex:Person ;
        ex:name "Jane" ;
        ex:age 25 .
"""

def main():
    st.set_page_config(
        page_title="SPARQL Query Explorer",
        page_icon="sparql-40.png",
        layout="wide",
        initial_sidebar_state="collapsed",
    )
    st.title("SPARQL Query Explorer")

    right_col, left_col = st.columns(2)

    # Get query and data from user input:
    with right_col:
        query = st.text_area(label="Query", height=400, value=initial_query)
    with left_col:
        data = st.text_area(label="Data", height=400, value=initial_data)

    if st.button("Run Query on Data"):
        try:
            result = run_query(query, data).splitlines()
            table: list[list[str]] = [line.split("|") for line in result]
            df = pd.DataFrame(table)
            df.columns = table[0]
            # Remove header and row with just a line:
            df = df[2:]
            st.dataframe(data=df)
        except Exception as e:
            st.error(f"Error: {e}")


if __name__ == "__main__":
    main()
