"""API for running SPARQL queries on RDF data."""

from typing import Annotated

import rdflib
from fastapi import FastAPI, Form, HTTPException, Request, Response
from pydantic import BaseModel
from rdflib.plugins.sparql import prepareQuery

app = FastAPI()


class FormData(BaseModel):
    """Form data for running a SPARQL query on RDF data."""

    query: str
    data: str


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
async def run_sparql(request: Request, data: Annotated[FormData, Form()]) -> Response:
    """Run the given SPARQL query on the provided RDF data."""
    # Determine the format of the response based on the Accept header:
    serialization_format, media_type = await get_format_and_media_type(request)

    # Parse the RDF data into a graph:
    g = rdflib.Graph()
    try:
        g.parse(data=data.data)
    except Exception as e:
        msg = "Invalid RDF data: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Parse the SPARQL query into a query object:
    try:
        q = prepareQuery(data.query)
    except Exception as e:
        msg = "Invalid SPARQL query: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Run the query:
    try:
        qres = g.query(q)
    except Exception as e:  # pragma: no cover
        msg = "Error running SPARQL query: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    try:
        return Response(
            content=qres.serialize(format=serialization_format),  # type: ignore[reportUnknownMemberType]
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
    else:
        msg = (
            "Unsupported media type in accept header: %s",
            request.headers.get("Accept"),
        )
        raise HTTPException(status_code=406, detail=msg)

    return serialization_format, media_type
