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
async def test_health() -> None:
    """Should return 200 OK and json body."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/health")
    assert response.status_code == HTTPStatus.OK, response.json()
    assert response.headers["content-type"] == "application/json"
    assert response.json() == {"status": "OK"}
