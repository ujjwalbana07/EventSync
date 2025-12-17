from fastapi_mail import ConnectionConfig
import inspect

print("Fields in ConnectionConfig:")
print(ConnectionConfig.__annotations__.keys())
