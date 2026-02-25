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
async def test_shacl_with_valid_data_and_shapes() -> None:
    """Should return 200 OK and text body."""
    data = r"""
    @prefix ex: <http://example.org/> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    ex:Alice
	a ex:Person ;
	ex:ssn "987-65-432A" .
	"""

    shapes = r"""
    @prefix rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix rdfs:	<http://www.w3.org/2000/01/rdf-schema#> .
    @prefix sh:	<http://www.w3.org/ns/shacl#> .
    @prefix xsd:	<http://www.w3.org/2001/XMLSchema#> .
    @prefix ex: <http://example.org/> .

    ex:PersonShape
	a sh:NodeShape ;
	sh:targetClass ex:Person ;    # Applies to all persons
	sh:property [                 # _:b1
		sh:path ex:ssn ;           # constrains the values of ex:ssn
		sh:maxCount 1 ;
		sh:datatype xsd:string ;
		sh:pattern "^\\d{3}-\\d{2}-\\d{4}$" ;
	] ;
    sh:property [                 # _:b2
        sh:path ex:worksFor ;
		sh:class ex:Company ;
		sh:nodeKind sh:IRI ;
	] ;
	sh:closed true ;
	sh:ignoredProperties ( rdf:type ) .
	"""

    headers = {"Accept": "text/turtle"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/shacl", headers=headers, data={"shapes": shapes, "data": data}
        )
    assert response.status_code == HTTPStatus.OK, response.json()
    assert headers["Accept"] in response.headers["content-type"]


@pytest.mark.anyio
async def test_shacl_with_invalid_data_and_valid_shapes() -> None:
    """Should return 400 Bad Request and text body."""
    invalid_data = r"""
    @prefix ex: <http://example.org/> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    invalid_data
	"""

    shapes = r"""
    @prefix rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix rdfs:	<http://www.w3.org/2000/01/rdf-schema#> .
    @prefix sh:	<http://www.w3.org/ns/shacl#> .
    @prefix xsd:	<http://www.w3.org/2001/XMLSchema#> .
    @prefix ex: <http://example.org/> .

    ex:PersonShape
	a sh:NodeShape ;
	sh:targetClass ex:Person ;    # Applies to all persons
	sh:property [                 # _:b1
		sh:path ex:ssn ;           # constrains the values of ex:ssn
		sh:maxCount 1 ;
		sh:datatype xsd:string ;
		sh:pattern "^\\d{3}-\\d{2}-\\d{4}$" ;
	] ;
    sh:property [                 # _:b2
        sh:path ex:worksFor ;
		sh:class ex:Company ;
		sh:nodeKind sh:IRI ;
	] ;
	sh:closed true ;
	sh:ignoredProperties ( rdf:type ) .
	"""

    headers = {"Accept": "text/turtle"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/shacl", headers=headers, data={"shapes": shapes, "data": invalid_data}
        )
    assert response.status_code == HTTPStatus.BAD_REQUEST, response.json()


@pytest.mark.anyio
async def test_shacl_with_valid_data_and_invalid_shapes() -> None:
    """Should return 200 OK and text body."""
    data = r"""
    @prefix ex: <http://example.org/> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

    ex:Alice
	a ex:Person ;
	ex:ssn "987-65-432A" .
	"""

    shapes = r"""
    @prefix rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix rdfs:	<http://www.w3.org/2000/01/rdf-schema#> .
    @prefix sh:	<http://www.w3.org/ns/shacl#> .
    @prefix xsd:	<http://www.w3.org/2001/XMLSchema#> .
    @prefix ex: <http://example.org/> .

    invalid_shapes
	"""
    headers = {"Accept": "text/turtle"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/shacl", headers=headers, data={"shapes": shapes, "data": data}
        )
    assert response.status_code == HTTPStatus.BAD_REQUEST, response.json()
