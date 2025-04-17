"""Test module for sparql_query.py."""

from streamlit.testing.v1 import AppTest


def test_setup_streamlit() -> None:
    """Should setup streamlit with a title and a button."""
    at = AppTest.from_file("app/sparql_query.py").run()

    assert at.title[0].value == "SPARQL Query Explorer"
