FROM python:3.10-slim

WORKDIR /app

COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ /app/backend/
COPY frontend/ /app/frontend/
COPY model/ /app/model/

WORKDIR /app/backend
EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
