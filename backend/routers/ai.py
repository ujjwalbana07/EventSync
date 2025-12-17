from fastapi import APIRouter, Depends
from pydantic import BaseModel
import auth

router = APIRouter(prefix="/ai", tags=["ai"])

class AIRequest(BaseModel):
    prompt_context: dict 
    # e.g. {"name": "John", "event": "Hackathon"}

@router.post("/admin/invites")
def generate_invite(data: AIRequest, current_user = Depends(auth.get_current_active_admin)):
    # Template based "AI"
    ctx = data.prompt_context
    name = ctx.get('name', 'Student')
    event = ctx.get('event_title', 'the event')
    skills = ctx.get('top_skills', [])
    headline = ctx.get('headline', '')
    
    skill_text = f" Given your expertise in {', '.join(skills)}," if skills else ""
    headline_text = f" As a {headline}," if headline else ""
    
    return {
        "text": f"Dear {name},\n\n{headline_text}{skill_text} we believe you'd be a great fit for {event}. We'd love to see you there!\n\nBest,\nCMIS Team"
    }

@router.post("/admin/feedback_summary")
def summarize_feedback(data: AIRequest, current_user = Depends(auth.get_current_active_admin)):
    # Mock summary
    feedbacks = data.prompt_context.get("feedbacks", [])
    count = len(feedbacks)
    return {
        "text": f"Received {count} feedback items. General sentiment appears positive. Top keywords: 'organized', 'fun', 'learning'."
    }

@router.post("/judge/talking_points")
def generate_talking_points(data: AIRequest, current_user = Depends(auth.get_current_judge)):
    ctx = data.prompt_context
    return {
        "text": f"Ask about their approach to {ctx.get('topic', 'the problem')}. Focus on {ctx.get('focus_area', 'implementation')}."
    }

@router.post("/judge/thank_you")
def generate_thank_you(data: AIRequest, current_user = Depends(auth.get_current_judge)):
    ctx = data.prompt_context
    return {
        "text": f"Dear {ctx.get('student_name', 'Student')}, thank you for your participation. I was impressed by your work on {ctx.get('project', 'the case')}."
    }
