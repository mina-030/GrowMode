import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv

# verify key loads
load_dotenv()
if not os.getenv("OPENAI_API_KEY"):
    raise RuntimeError("OPENAI_API_KEY not found.")


# Initialize FastAPI and OpenAI
app = FastAPI()
client = OpenAI()


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

# prompt for building the report
def build_prompt_from_week(body: "WeeklyInput") -> str:
    return (
        "You are a concise study coach. Write a positive weekly report.\n"
        f"Name: {body.name}\n"
        f"Total Study Minutes: {body.total_time} Total Study Hours: {body.total_time // 60} \n"
        f"Total Rest Minutes: {body.total_rest}\n"
        f"Total Tasks: {body.total_task}\n"
        f"Total Stars: {body.total_star}\n\n"
        "Return JSON with keys: title (string), summary (string), quote(string; a short motivational sentence)."
    )

# OpenAI call + rebust JSON parse
def call_openai(prompt: str) -> dict:
    """Send the prompt and return a dict with keys: title, summary, next_steps."""
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.5,
            messages=[
                {"role":"system", 
                "content": "You are a concise, encouraging study coach. Return ONLY a JSOM object with keys: title, summary, quote."
                },
                {"role": "user", 
                "content": prompt}
            ],
        )

        text = resp.choices[0].message.content or ""
        return json.loads(text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream AI error: {e}")



# Route
@app.post("/report", response_model=WeeklyReport)
async def weekly_report(body: WeeklyInput):
    result = call_openai(build_prompt_from_week(body))

    title = result.get("title", "Weekly Summary")
    summary = result.get("summary", "Great progress this week!")
    quote_text = result.get("quote", "Nice job keep going!")

    # map the structured result into the weekly report
    totals_line = (
        f"Total Study: {body.total_time} min, ({body.total_time // 60} h),"
        f"Rest: {body.total_rest} min, Tasks: {body.total_task},"
        f"Stars: {body.total_star}"
    )

    summary_text = (
        f"{title}\n\n{summary}\n\n{totals_line}\n\n"
    )

    return WeeklyReport(
        summary=summary_text,
        quote=quote_text
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)