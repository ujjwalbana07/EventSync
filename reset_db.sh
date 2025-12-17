docker-compose down -v
docker-compose up -d db
# Wait for DB?
timeout 5
# In a real scenario we might run alembic here, but our main.py handles auto-migration on start
docker-compose up --build
