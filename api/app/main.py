"""API for running SPARQL queries on RDF data."""

from http import HTTPStatus

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from owlrl import DeductiveClosure, OWLRL_Semantics
from pydantic import BaseModel
from pyshacl import validate
from rdflib import Graph
from rdflib.exceptions import Error, ParserError
from rdflib.plugins.sparql import prepareQuery

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
]
# Configure CORS
app.add_middleware(
    CORSMiddleware,  # type: ignore[invalid-argument-type]
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SPARQLRequest(BaseModel):
    """Request model for running a SPARQL query on RDF data."""

    data: str
    query: str
    inference: bool = False


class SPARQLResponse(BaseModel):
    """Response model for the result of running a SPARQL query on RDF data."""

    length: int
    result_content_type: str | None = None
    result: str


class SHACLRequest(BaseModel):
    """Request model for running a SHACL validation on RDF data."""

    data: str
    shapes: str


@app.get("/health", include_in_schema=False)
async def health_check() -> dict[str, str]:
    """Return status ok."""
    return {"status": "OK"}


async def check_content_type(request: Request) -> None:
    """Check that the content type of the request is application/json."""
    content_type = request.headers.get("content-type", None)
    if not content_type or "application/json" not in content_type:
        raise HTTPException(
            status_code=HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type {content_type}",
        )


@app.post(
    "/sparql",
    dependencies=[Depends(check_content_type)],
    responses={
        200: {
            "description": "Result of running the SPARQL query",
            "content": {
                "text/plain": {},
                "application/json": {},
                "text/csv": {},
                "text/xml": {},
            },
        },
    },
)
async def run_sparql(request: Request, sparql_request: SPARQLRequest) -> SPARQLResponse:
    """Run the given SPARQL query on the provided RDF data."""
    # Determine the format of the response based on the Accept header:
    serialization_format, media_type = await get_format_and_media_type(request)
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

    if sparql_request.inference:
        try:
            DeductiveClosure(OWLRL_Semantics).expand(graph)
        except Exception as e:  # pragma: no cover
            msg = "Error running inference: " + str(e)
            raise HTTPException(status_code=400, detail=msg) from e
    # Parse the SPARQL query into a query object:
    try:
        parsed_query = prepareQuery(sparql_request.query)
    except Exception as e:
        msg = "Invalid SPARQL query: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Check that the query is a SELECT or ASK query:
    if parsed_query.algebra.name not in ("SelectQuery", "AskQuery"):
        msg = "Only SELECT and ASK queries are supported"
        raise HTTPException(status_code=501, detail=msg)

    # Run the query:
    try:
        qres = graph.query(parsed_query)
    except Exception as e:  # pragma: no cover
        msg = "Error running SPARQL query: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Serialize the result:
    try:
        length = len(qres)
        if parsed_query.algebra.name == "AskQuery":
            result = "true" if qres.askAnswer else "false"
        else:
            result = qres.serialize(format=serialization_format)
        return SPARQLResponse(
            length=length, result=result, result_content_type=media_type
        )
    except Exception as e:  # pragma: no cover
        msg = "Error serializing query results: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e


@app.post(
    "/shacl",
    dependencies=[Depends(check_content_type)],
    responses={
        200: {
            "description": "Result of running the SHACL validation",
            "content": {
                "text/plain": {},
                "application/json": {},
                "text/csv": {},
                "text/xml": {},
            },
        },
    },
)
async def run_shacl(request: Request, shacl_request: SHACLRequest) -> Response:
    """Run the given SHACL validation on the provided RDF data."""
    # Determine the format of the response based on the Accept header:
    serialization_format, media_type = await get_format_and_media_type(request)

    # Parse the RDF data into a graph:
    data_graph = Graph()
    try:
        data_graph.parse(data=shacl_request.data)
    except ParserError as e:
        msg = "Invalid RDF data: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Parse the SHACL shapes into a graph:
    shapes_graph = Graph()
    try:
        shapes_graph.parse(data=shacl_request.shapes)
    except ParserError as e:
        msg = "Invalid SHACL shapes: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Validate the
    _, results_graph, _ = validate(data_graph=data_graph, shacl_graph=shapes_graph)
    # Serialize the result:
    try:
        content = results_graph.serialize(format=serialization_format)
        return Response(
            content=content,
            media_type=media_type,
        )
    except Exception as e:  # pragma: no cover
        msg = "Error serializing query results: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e


async def get_format_and_media_type(request: Request) -> tuple[str, str]:
    """Determine the serialization format and media type.

    Based on the Accept header.
    """
    if request.headers.get("Accept") == "*/*":
        serialization_format = "txt"
        media_type = "text/plain"
    elif request.headers.get("Accept") == "application/json":
        serialization_format = "json"
        media_type = "application/json"
    elif request.headers.get("Accept") == "text/csv":
        serialization_format = "csv"
        media_type = "text/csv"
    elif request.headers.get("Accept") == "text/xml":
        serialization_format = "xml"
        media_type = "text/xml"
    elif request.headers.get("Accept") == "text/plain":
        serialization_format = "txt"
        media_type = "text/plain"
    elif request.headers.get("Accept") == "text/turtle":
        serialization_format = "turtle"
        media_type = "text/turtle"
    else:
        msg = (
            "Unsupported media type in accept header: %s",
            request.headers.get("Accept"),
        )
        raise HTTPException(status_code=406, detail=msg)

    return serialization_format, media_type
