"""API for running SPARQL queries on RDF data."""

from typing import Annotated

import rdflib
from fastapi import FastAPI, Form, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pyshacl import validate
from rdflib.exceptions import ParserError
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


class SPARQLFormData(BaseModel):
    """Form data for running a SPARQL query on RDF data."""

    data: str
    query: str


class SHACLFormData(BaseModel):
    """Form data for running a SHACL validation on RDF data."""

    data: str
    shapes: str


@app.get("/health", include_in_schema=False)
async def health_check() -> dict[str, str]:
    """Return status ok."""
    return {"status": "OK"}


@app.post(
    "/sparql",
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
async def run_sparql(
    request: Request, form_data: Annotated[SPARQLFormData, Form()]
) -> Response:
    """Run the given SPARQL query on the provided RDF data."""
    # Determine the format of the response based on the Accept header:
    serialization_format, media_type = await get_format_and_media_type(request)

    # Parse the RDF data into a graph:
    g = rdflib.Graph()
    try:
        g.parse(data=form_data.data)
    except ParserError as e:
        msg = "Invalid RDF data: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Parse the SPARQL query into a query object:
    try:
        q = prepareQuery(form_data.query)
    except Exception as e:
        msg = "Invalid SPARQL query: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Run the query:
    try:
        qres = g.query(q)
    except Exception as e:  # pragma: no cover
        msg = "Error running SPARQL query: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    if qres.type == "CONSTRUCT":  # pragma: no cover
        msg = "Construct queries are not supported"
        raise HTTPException(status_code=501, detail=msg)

    # Serialize the result:
    try:
        content = qres.serialize(format=serialization_format)
        return Response(
            content=content,
            media_type=media_type,
        )
    except Exception as e:  # pragma: no cover
        msg = "Error serializing query results: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e


@app.post(
    "/shacl",
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
async def run_shacl(
    request: Request, form_data: Annotated[SHACLFormData, Form()]
) -> Response:
    """Run the given SHACL validation on the provided RDF data."""
    # Determine the format of the response based on the Accept header:
    serialization_format, media_type = await get_format_and_media_type(request)

    # Parse the RDF data into a graph:
    data_graph = rdflib.Graph()
    try:
        data_graph.parse(data=form_data.data)
    except ParserError as e:
        msg = "Invalid RDF data: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Parse the SHACL shapes into a graph:
    shapes_graph = rdflib.Graph()
    try:
        shapes_graph.parse(data=form_data.shapes)
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
