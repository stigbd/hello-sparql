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
        {},
        {"Accept": "application/sparql-results+json"},
        {"Accept": "text/csv"},
        {"Accept": "application/sparql-results+xml"},
    ],
)
@pytest.mark.parametrize("inference", [True, False])
@pytest.mark.anyio
async def test_select_query(
    headers: dict[str, str],
    *,
    inference: bool,
) -> None:
    """Should return 200 OK and json body with correct content type."""
    query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }"
    data = """
    @prefix ex: <http://example.org#> .
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
            json={"query": query, "data": data, "inference": inference},
        )
    assert response.status_code == HTTPStatus.OK, response.json()
    assert response.headers["content-type"] == "application/json"
    data = response.json()
    assert "length" in data
    assert isinstance(data["length"], int)
    assert data["length"] > 0
    assert "result" in data
    assert len(data["result"]) > 0
    assert "result_content_type" in data
    if not headers or "Accept" not in headers:
        assert data["result_content_type"] == "application/sparql-results+json"
    else:
        assert data["result_content_type"] == headers["Accept"]


@pytest.mark.anyio
async def test_select_query_with_valid_data_and_query_as_form() -> None:
    """Should fail with 415 Unsupported media type."""
    query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }"
    data = """
    @prefix ex: <http://example.org#> .
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
async def test_select_query_with_invalid_data_and_valid_query() -> None:
    """Should return 400 OK and json body."""
    query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }"
    invalid_data = """
    @prefix ex: <http://example.org#> .
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
async def test_select_query_with_valid_data_and_invalid_query() -> None:
    """Should return 400 OK and json body."""
    invalid_query = "SELECT ?s ?p ?o WHERE "
    data = """
    @prefix ex: <http://example.org#> .
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
async def test_select_query_with_unsupported_data_format() -> None:
    """Should return 406 NOT ACCEPTABLE and json body."""
    headers = {"Accept": "unsupported"}

    query = "SELECT ?s ?p ?o WHERE { ?s ?p ?o }"
    invalid_data = """
    @prefix ex: <http://example.org#> .
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
        {},
        {"Accept": "text/turtle"},
        {"Accept": "application/ld+json"},
        {"Accept": "application/rdf+xml"},
    ],
)
@pytest.mark.parametrize("inference", [True, False])
async def test_construct_query(
    headers: dict[str, str],
    *,
    inference: bool,
) -> None:
    """Should return 200 OK and the serialized RDF data."""
    query = "CONSTRUCT {?s ?p ?o .} WHERE {?s ?p ?o .}"
    data = """
    @prefix ex: <http://example.org#> .
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
            json={"query": query, "data": data, "inference": inference},
        )
    assert response.status_code == HTTPStatus.OK
    assert response.headers["content-type"] == "application/json"
    data = response.json()
    assert "length" in data
    assert isinstance(data["length"], int)
    assert data["length"] > 0
    assert "result" in data
    assert len(data["result"]) > 0
    assert "result_content_type" in data
    if not headers or "Accept" not in headers:
        assert data["result_content_type"] == "text/turtle"
    else:
        assert data["result_content_type"] == headers["Accept"]


@pytest.mark.anyio
async def test_ask_query_truthy() -> None:
    """Should return 200 OK and the string true."""
    data = """
    @prefix ex: <http://example.org#> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    ex:Alice
	a ex:Person ;
	ex:ssn "987-65-432A" .
	"""

    query = """
    PREFIX ex: <http://example.org#>

    ASK WHERE { ex:Alice a ex:Person . }
    """
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/sparql",
            json={"query": query, "data": data},
        )
    assert response.status_code == HTTPStatus.OK, response.json()
    assert response.headers["content-type"] == "application/json"
    data = response.json()
    assert "length" in data
    assert isinstance(data["length"], int)
    assert data["length"] == 1
    assert "result" in data
    assert data["result"] == "true"


@pytest.mark.anyio
async def test_ask_query_falsy() -> None:
    """Should return 200 OK and the string false."""
    data = """
    @prefix ex: <http://example.org#> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    ex:Alice
	a ex:Person ;
	ex:ssn "987-65-432A" .
	"""

    query = """
    PREFIX ex: <http://example.org#>

    ASK WHERE { ex:Alice a ex:Animal . }
    """

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/sparql",
            json={"query": query, "data": data},
        )
    assert response.status_code == HTTPStatus.OK, response.json()
    assert response.headers["content-type"] == "application/json"
    data = response.json()
    assert "length" in data
    assert isinstance(data["length"], int)
    assert data["length"] == 1
    assert "result" in data
    assert data["result"] == "false"


@pytest.mark.anyio
async def test_construct_query_unsupported_data_format() -> None:
    """Should return 200 OK and the serialized RDF data."""
    headers = {"Accept": "unsupported"}
    query = "CONSTRUCT {?s ?p ?o .} WHERE {?s ?p ?o .}"
    data = """
    @prefix ex: <http://example.org#> .
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
            json={"query": query, "data": data},
        )
    assert response.status_code == HTTPStatus.NOT_ACCEPTABLE


@pytest.mark.anyio
async def test_json_ld_without_prefixes() -> None:
    """Should return 200 OK and empty context."""
    query = "CONSTRUCT {?s ?p ?o .} WHERE {?s ?p ?o .}"
    data = """
    <http://example.org#ex:Alice>
        <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org#ex:Person>.
	"""

    headers = {"Accept": "application/ld+json"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/sparql",
            headers=headers,
            json={"query": query, "data": data, "inference": False},
        )
    assert response.status_code == HTTPStatus.OK, response.json()
    assert response.headers["content-type"] == "application/json"
    data = response.json()
    assert "length" in data
    assert isinstance(data["length"], int)
    assert data["length"] > 0
    assert "result" in data
    assert len(data["result"]) > 0
    assert "result_content_type" in data
    if not headers or "Accept" not in headers:
        assert data["result_content_type"] == "text/turtle"
    else:
        assert data["result_content_type"] == headers["Accept"]
