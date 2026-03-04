"""SPARQL endpoint for running SPARQL queries on RDF data."""

import logging
from enum import StrEnum
from http import HTTPStatus

from fastapi import APIRouter, Depends, HTTPException, Request
from owlrl import DeductiveClosure, OWLRL_Semantics
from pydantic import BaseModel
from rdflib import Graph
from rdflib.exceptions import Error
from rdflib.plugins.sparql import prepareQuery

router = APIRouter(tags=["sparql"])
logger = logging.getLogger("uvicorn.error")


class SPARQLRequest(BaseModel):
    """Request model for running a SPARQL query on RDF data."""

    data: str
    query: str
    inference: bool = False


class SPARQLQueryType(StrEnum):
    """Enum for SPARQL query types."""

    SELECT = "SelectQuery"
    ASK = "AskQuery"
    DESCRIBE = "DescribeQuery"
    CONSTRUCT = "ConstructQuery"


class SPARQLResponse(BaseModel):
    """Response model for the result of running a SPARQL query on RDF data."""

    length: int
    result_content_type: str | None = None
    result: str


async def check_content_type(request: Request) -> None:
    """Check that the content type of the request is application/json."""
    content_type = request.headers.get("content-type", None)
    if not content_type or "application/json" not in content_type:
        raise HTTPException(
            status_code=HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type {content_type}",
        )


@router.post(
    "/sparql",
    dependencies=[Depends(check_content_type)],
    responses={
        200: {
            "description": "Result of running the SPARQL query",
        },
    },
)
async def run_sparql(request: Request, sparql_request: SPARQLRequest) -> SPARQLResponse:  # noqa: C901
    """Run the given SPARQL query on the provided RDF data."""
    # Parse the RDF data into a graph:
    graph = Graph()
    try:
        graph.parse(data=sparql_request.data)
    except Error as e:
        msg = f"Error: {type(e)} : " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e
    except Exception as e:  # pragma: no cover
        msg = "Invalid RDF data: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Parse the SPARQL query into a query object:
    try:
        parsed_query = prepareQuery(sparql_request.query)
    except Exception as e:
        msg = "Invalid SPARQL query: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Check that the query type is supported:
    try:
        query_type = SPARQLQueryType(parsed_query.algebra.name)
    except ValueError:  # pragma: no cover
        msg = "Unsupported SPARQL query type: " + parsed_query.algebra.name
        raise HTTPException(status_code=501, detail=msg) from None

    # Run inference if requested:
    if sparql_request.inference:
        try:
            DeductiveClosure(OWLRL_Semantics).expand(graph)
        except Exception as e:  # pragma: no cover
            msg = "Error running inference: " + str(e)
            raise HTTPException(status_code=400, detail=msg) from e

    # Run the query:
    try:
        qres = graph.query(parsed_query)
    except Exception as e:  # pragma: no cover
        msg = "Error running SPARQL query: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Determine the format of the response based on the Accept header:
    serialization_format, media_type = await get_format_and_media_type(
        query_type, request
    )
    # Serialize the result:
    try:
        length = len(qres)
        if parsed_query.algebra.name == "AskQuery":
            result = "true" if qres.askAnswer else "false"
        elif serialization_format == "json-ld":
            context = await get_context_from_prefixes_in_data(sparql_request.data)
            result = qres.serialize(format=serialization_format, context=context)
        else:
            result = qres.serialize(format=serialization_format)
        return SPARQLResponse(
            length=length, result=result, result_content_type=media_type
        )
    except Exception as e:  # pragma: no cover
        msg = "Error serializing query results: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e


async def get_format_and_media_type(
    query_type: str,
    request: Request,
) -> tuple[str, str]:
    """Determine the serialization format and media type.

    Based on the query type and the Accept header in the request.
    For SELECT and ASK queries, the default format is text/plain.
    For DESCRIBE and CONSTRUCT queries, the default format is turtle.
    """
    if query_type in [SPARQLQueryType.SELECT, SPARQLQueryType.ASK]:
        return await get_format_and_media_type_for_select_ask(request)
    return await get_format_and_media_type_for_describe_construct(request)


async def get_format_and_media_type_for_select_ask(
    request: Request,
) -> tuple[str, str]:
    """Determine the serialization format and media type for SELECT and ASK queries.

    Based on the Accept header in the request.
    The default format is applicaiton/sparql-results+json.
    """
    accept = request.headers.get("accept", "")
    if not accept or "*/*" in accept:
        return "json", "application/sparql-results+json"
    if "text/csv" in accept:
        return "csv", "text/csv"
    if "application/xml" in accept or "application/sparql-results+xml" in accept:
        return "xml", "application/sparql-results+xml"
    if "application/json" in accept or "application/sparql-results+json" in accept:
        return "json", "application/sparql-results+json"
    raise HTTPException(
        status_code=HTTPStatus.NOT_ACCEPTABLE,
        detail=f"Unsupported Accept header: {accept}",
    )


async def get_format_and_media_type_for_describe_construct(
    request: Request,
) -> tuple[str, str]:
    """Determine the serialization format and media type for DESCRIBE and CONSTRUCT queries."""  # noqa: E501
    accept = request.headers.get("accept", "")
    if not accept or "*/*" in accept:
        return "turtle", "text/turtle"
    if "text/turtle" in accept:
        return "turtle", "text/turtle"
    if "application/json" in accept or "application/ld+json" in accept:
        return "json-ld", "application/ld+json"
    if "application/xml" in accept or "application/rdf+xml" in accept:
        return "xml", "application/rdf+xml"
    raise HTTPException(
        status_code=HTTPStatus.NOT_ACCEPTABLE,
        detail=f"Unsupported Accept header: {accept}",
    )


async def get_context_from_prefixes_in_data(data: str) -> dict[str, str]:
    """Get a JSON-LD context from the prefixes used in the data."""
    # Add all prefixes used in the data and their corresponding URIs:
    context = {}
    for line in data.splitlines():
        if line.strip().startswith("@prefix"):
            parts = line.split()
            if len(parts) >= 3:  # noqa: PLR2004 # pragma: no cover
                prefix = parts[1].rstrip(":")
                uri = parts[2].rstrip(".").strip("<>")
                context[prefix] = uri
    return context
