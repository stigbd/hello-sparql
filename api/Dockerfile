FROM python:3.14-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
# Install uv.
COPY --from=ghcr.io/astral-sh/uv:0.10.7 /uv /uvx /bin/

# Copy the application into the container.
ADD . /app

# Check that the python version corresponds to the one specified in .python-version.
RUN EXPECTED_VERSION=$(cat /app/.python-version | tr -d '[:space:]') && \
    ACTUAL_VERSION=$(python --version | awk '{print $2}') && \
    if [ "$ACTUAL_VERSION" != "$EXPECTED_VERSION" ]; then \
        echo "Error: Python version mismatch. Expected $EXPECTED_VERSION but got $ACTUAL_VERSION" 2>&1 && \
        exit 1; \
    fi


# Install the application dependencies.
WORKDIR /app
RUN uv sync --frozen

# Expose the application port.
EXPOSE 8000

# Run the application.
CMD ["/app/.venv/bin/uvicorn", "app:app",  "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--log-config=logging.yaml"]
