# ---------------------------------------------------------
# Stage 1: Build the React Frontend
# ---------------------------------------------------------
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend dependencies and install
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source
COPY frontend/ ./

# Build the frontend assets using Vite
# Ensure the VITE variables are exposed during build if needed
RUN npm run build

# ---------------------------------------------------------
# Stage 2: Build the FastAPI Backend & Serve
# ---------------------------------------------------------
FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy the built frontend from Stage 1 into the location expected by backend/main.py
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose the port
EXPOSE 8080

# Run Uvicorn from the backend directory using the PORT env variable
WORKDIR /app/backend
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"
