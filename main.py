from fastapi import FastAPI
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI
app = FastAPI()

# schemas 
# what API will receive (user's study stats)
class WeeklyInput(BaseModel):
    name: str
    total_time: int = Field(ge=0)
    total_rest: int = Field(ge=0)
    total_task: int = Field(ge=0)
    total_star: int = Field(ge=0)

# what API will send back (summary + motivational quote)
class WeeklyReport(BaseModel):
    summary: str
    quote: str


@app.post("/report", response_model=WeeklyReport)
async def weekly_report(body: WeeklyInput):
    summary_text = (f"Hi {body.name}!\nThis is your weekly study report. You have:\n"
                    f"Total Study Time: {body.total_time}\n"
                    f"Total Rest Time: {body.total_rest}\n"
                    f"Total Tasks: {body.total_task}\n"
                    f"Total Stars: {body.total_star}")
    return WeeklyReport(summary=summary_text, quote="You need to start somewhere! Keeping working!")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)