"""Test module for sparql_query.py."""
from streamlit.testing.v1 import AppTest


def test_setup_streamlit() -> None:
    """Should setup streamlit."""
    at = AppTest.from_file("app/sparql_query.py").run()

    assert at.title[0].value == "SPARQL Query Explorer"
    assert len(at.text_area) == 2 # noqa: PLR2004
    assert not at.button[0].value
    at.button[0].click().run()
    assert at.button[0].value
