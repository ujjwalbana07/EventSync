from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import crud, schemas, database, auth, email_utils

router = APIRouter(prefix="/events", tags=["events"])

# --- Public / Student Read ---

@router.get("/", response_model=List[schemas.Event])
def read_events(
    skip: int = 0, 
    limit: int = 100, 
    visibility: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    return crud.get_events(db, skip=skip, limit=limit, visibility=visibility)

@router.get("/{event_id}", response_model=schemas.Event)
def read_event(event_id: int, db: Session = Depends(database.get_db)):
    db_event = crud.get_event(db, event_id=event_id)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@router.put("/{event_id}", response_model=schemas.Event)
def update_event(
    event_id: int,
    event_update: schemas.EventUpdate,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_faculty) # Admins/Faculty can edit
):
    db_event = crud.update_event(db, event_id=event_id, event_update=event_update)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Audit Log
    crud.create_audit_log(db, current_user.id, "EVENT_UPDATED", {"event_id": db_event.id, "title": db_event.title})
    
    return db_event

@router.put("/reorder", status_code=200)
def reorder_events_endpoint(
    event_ids: List[int],
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_faculty)
):
    crud.reorder_events(db, event_ids)
    return {"status": "success"}

# --- Faculty / Admin Management ---

@router.post("/", response_model=schemas.Event)
def create_event(
    event: schemas.EventCreate, 
    db: Session = Depends(database.get_db), 
    current_user = Depends(auth.get_current_faculty) # Admin is also Faculty
):
    db_event = crud.create_event(db=db, event=event, user_id=current_user.id)
    crud.create_audit_log(db, current_user.id, "EVENT_CREATED", {"event_id": db_event.id, "title": db_event.title})
    return db_event

@router.post("/{event_id}/sessions", response_model=schemas.EventSession)
def create_session(
    event_id: int,
    session: schemas.EventSessionCreate,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_faculty)
):
    # Verify ownership? omitted for MVP
    # Verify ownership? omitted for MVP
    return crud.create_event_session(db, session, event_id)

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_faculty) # Admin is Faculty
):
    # Verify Admin or Creator (For MVP assuming Faculty/Admin specific check or just role)
    if current_user.role not in ["admin", "faculty"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    crud.delete_event(db, event_id)
    crud.create_audit_log(db, current_user.id, "EVENT_DELETED", {"event_id": event_id, "title": event.title})
    return {"status": "success"}

# --- Registration ---

@router.post("/{event_id}/register", response_model=schemas.Registration)
def register_for_event(
    event_id: int, 
    background_tasks: BackgroundTasks,
    reg_data: schemas.RegistrationCreate = None, # Optional session choice
    db: Session = Depends(database.get_db), 
    current_user = Depends(auth.get_current_user)
):
    session_ids = reg_data.session_ids if reg_data else None
    
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot register for events")

    reg = crud.register_user_for_event(db, user_id=current_user.id, event_id=event_id, session_ids=session_ids)
    if not reg:
        raise HTTPException(status_code=400, detail="Registration failed (Event not found?)")
    
    # Send confirmation email
    event = crud.get_event(db, event_id=event_id)
    if event:
        background_tasks.add_task(
            email_utils.send_event_registration_email, 
            email=current_user.email, 
            event_title=event.title, 
            student_name=current_user.name
        )

    return reg

@router.delete("/{event_id}/register", status_code=204)
def unregister_from_event(
    event_id: int,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    crud.delete_registration(db, user_id=current_user.id, event_id=event_id)
    return

# --- Registrations View (Admin/Faculty) ---

@router.get("/{event_id}/registrations", response_model=List[schemas.RegistrationDetail])
def get_registrations(
    event_id: int, 
    db: Session = Depends(database.get_db), 
    current_user = Depends(auth.get_current_faculty)
):
    return crud.get_event_registrations(db, event_id)

@router.post("/{event_id}/feedback-request", status_code=200)
async def send_feedback_request(
    event_id: int,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_faculty)
):
    event = crud.get_event(db, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    registrations = crud.get_event_registrations(db, event_id)
    count = 0
    for reg in registrations:
        if reg.status == "confirmed" and reg.student and reg.student.email:
            await email_utils.send_feedback_request_email(
                email=reg.student.email, 
                event_title=event.title, 
                registration_id=reg.id
            )
            count += 1
            
    event.feedback_email_sent = True
    db.commit()
    
    return {"message": f"Feedback request sent to {count} attendees"}

@router.post("/{event_id}/invite", status_code=200)
async def invite_guests(
    event_id: int,
    invite_request: schemas.GuestInviteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_faculty)
):
    event = crud.get_event(db, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    for email in invite_request.emails:
        background_tasks.add_task(
            email_utils.send_guest_invitation_email,
            email=email,
            event_title=event.title
        )
        
    return {"message": f"Invitations sent to {len(invite_request.emails)} guests"}
