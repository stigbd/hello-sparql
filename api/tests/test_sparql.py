"""Test module for api."""

from http import HTTPStatus

import pytest
from httpx import ASGITransport, AsyncClient

from app import app


@pytest.fixture
def anyio_backend() -> str:
    """Use the asyncio backend for the anyio fixture."""
    return "asyncio"


@pytest.mark.anyio
@pytest.mark.parametrize(
    "headers",
    [
        {"Accept": "text/plain"},
        {"Accept": "application/json"},
        {"Accept": "text/csv"},
        {"Accept": "text/xml"},
    ],
)
@pytest.mark.anyio
async def test_sparql_with_valid_data_and_query_as_json(
    headers: dict[str, str],
) -> None:
    """Should return 200 OK and text body."""
    query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }"
    data = """
    @prefix ex: <http://example.org/> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    ex:Alice
	a ex:Person ;
	ex:ssn "987-65-432A" .
	"""

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/sparql",
            headers=headers,
            json={"query": query, "data": data, "inference": True},
        )
    assert response.status_code == HTTPStatus.OK, response.json()
    assert headers["Accept"] in response.headers["content-type"]


@pytest.mark.anyio
async def test_sparql_with_valid_data_and_query_as_form() -> None:
    """Should fail with etc."""
    query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }"
    data = """
    @prefix ex: <http://example.org/> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    ex:Alice
	a ex:Person ;
	ex:ssn "987-65-432A" .
	"""

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/sparql", data={"query": query, "data": data})
    assert response.status_code == HTTPStatus.UNSUPPORTED_MEDIA_TYPE


@pytest.mark.anyio
async def test_sparql_with_invalid_data_and_valid_query() -> None:
    """Should return 400 OK and json body."""
    query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }"
    invalid_data = """
    @prefix ex: <http://example.org/> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    ex:Alice
	a ex:Person ;
	ex:ssn "987-65-432A"
	"""

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/sparql", json={"query": query, "data": invalid_data})
    assert response.status_code == HTTPStatus.BAD_REQUEST, response.json()
    assert response.headers["content-type"] == "application/json"


@pytest.mark.anyio
async def test_sparql_with_valid_data_and_invalid_query() -> None:
    """Should return 400 OK and json body."""
    invalid_query = "SELECT ?s ?p ?o WHERE "
    data = """
    @prefix ex: <http://example.org/> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    ex:Alice
	a ex:Person ;
	ex:ssn "987-65-432A" .
	"""

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/sparql", json={"query": invalid_query, "data": data})
    assert response.status_code == HTTPStatus.BAD_REQUEST, response.json()
    assert response.headers["content-type"] == "application/json"


@pytest.mark.anyio
async def test_sparql_with_unsupported_data_format() -> None:
    """Should return 406 NOT ACCEPTABLE and json body."""
    headers = {"Accept": "unsupported"}

    query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }"
    invalid_data = """
    @prefix ex: <http://example.org/> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    ex:Alice
	a ex:Person ;
	ex:ssn "987-65-432A" .
	"""

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/sparql", headers=headers, json={"query": query, "data": invalid_data}
        )
    assert response.status_code == HTTPStatus.NOT_ACCEPTABLE, response.json()
    assert response.headers["content-type"] == "application/json"


@pytest.mark.anyio
@pytest.mark.parametrize(
    "headers",
    [
        {"Accept": "text/plain"},
        {"Accept": "application/json"},
        {"Accept": "text/csv"},
        {"Accept": "text/xml"},
    ],
)
async def test_sparql_with_valid_data_and_construct_query_as_json(
    headers: dict[str, str],
) -> None:
    """Should return 501 Not Implemented."""
    query = "CONSTRUCT {?s ?p ?o .} WHERE {?s ?p ?o .}"
    data = """
    @prefix ex: <http://example.org/> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    ex:Alice
	a ex:Person ;
	ex:ssn "987-65-432A" .
	"""

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/sparql", headers=headers, json={"query": query, "data": data}
        )
    assert response.status_code == HTTPStatus.NOT_IMPLEMENTED, response.json()
