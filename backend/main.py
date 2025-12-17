from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
import models, database, crud, auth

app = FastAPI(title="CMIS Event Management")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to CMIS Event Manager API"}

from routers import auth_router, events, registrations, judge, ai, profile, admin, recruiter
import models, database

models.Base.metadata.create_all(bind=database.engine)

import scheduler
@app.on_event("startup")
def startup_event():
    scheduler.start_scheduler()

app.include_router(auth_router.router)
app.include_router(events.router)

app.include_router(registrations.router)
app.include_router(judge.router)
app.include_router(ai.router)
app.include_router(profile.router)
app.include_router(admin.router)
app.include_router(recruiter.router)

# --- SQLAdmin Configuration ---

class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        email = form.get("username")
        password = form.get("password")

        # Create a new session for DB access
        db = database.SessionLocal()
        try:
            user = crud.get_user_by_email(db, email)
            if user and crud.verify_password(password, user.hashed_password):
                if user.role != "admin":
                    return False
                request.session.update({"token": "admin-token"}) # Simplified session
                return True
        finally:
            db.close()
            
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        if not token:
            return False
        return True

authentication_backend = AdminAuth(secret_key="SECRET_KEY_HERE_FOR_MVP") 




admin_app = Admin(app, database.engine, authentication_backend=authentication_backend)

class UserAdmin(ModelView, model=models.User):
    column_list = [models.User.id, models.User.email, models.User.role, models.User.name, models.User.is_active]
    column_searchable_list = [models.User.email, models.User.name]
    column_sortable_list = [models.User.id, models.User.is_active, models.User.role]
    column_labels = {models.User.is_active: "Active", models.User.email: "Email"}
    icon = "fa-solid fa-user"

class EventAdmin(ModelView, model=models.Event):
    column_list = [models.Event.id, models.Event.title, models.Event.date_time, models.Event.mode, models.Event.created_by_id]
    column_searchable_list = [models.Event.title]
    icon = "fa-solid fa-calendar"

class SessionAdmin(ModelView, model=models.EventSession):
    column_list = [models.EventSession.id, models.EventSession.title, models.EventSession.event_id]
    icon = "fa-solid fa-clock"

class RegistrationAdmin(ModelView, model=models.Registration):
    column_list = [models.Registration.id, models.Registration.user_id, models.Registration.event_id, models.Registration.status]
    icon = "fa-solid fa-ticket"

admin_app.add_view(UserAdmin)
admin_app.add_view(EventAdmin)
admin_app.add_view(SessionAdmin)
admin_app.add_view(RegistrationAdmin)
