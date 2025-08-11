from __future__ import annotations

import os
import sqlite3
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "app.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                due TEXT,
                completed INTEGER NOT NULL DEFAULT 0,
                priority TEXT
            )
            """
        )
        conn.commit()


class TaskCreate(BaseModel):
    text: str = Field(min_length=1)
    due: Optional[str] = None  # ISO date string YYYY-MM-DD
    priority: Optional[str] = None  # e.g., urgent/high/medium/low


class TaskUpdate(BaseModel):
    text: Optional[str] = None
    due: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None


class Task(BaseModel):
    id: int
    text: str
    due: Optional[str]
    completed: bool
    priority: Optional[str]


app = FastAPI(title="GrowMode API")


@app.on_event("startup")
async def on_startup() -> None:
    initialize_database()


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/api/tasks", response_model=List[Task])
async def list_tasks() -> List[Task]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, text, due, completed, priority FROM tasks ORDER BY CASE WHEN due IS NULL OR due = '' THEN 0 ELSE 1 END DESC, due ASC, id ASC"
        ).fetchall()
        return [
            Task(
                id=row["id"],
                text=row["text"],
                due=row["due"],
                completed=bool(row["completed"]),
                priority=row["priority"],
            )
            for row in rows
        ]


@app.post("/api/tasks", response_model=Task, status_code=201)
async def create_task(payload: TaskCreate) -> Task:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO tasks (text, due, completed, priority) VALUES (?, ?, ?, ?)",
            (payload.text.strip(), payload.due or None, 0, payload.priority),
        )
        task_id = cur.lastrowid
        conn.commit()
        row = conn.execute(
            "SELECT id, text, due, completed, priority FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()
        return Task(
            id=row["id"],
            text=row["text"],
            due=row["due"],
            completed=bool(row["completed"]),
            priority=row["priority"],
        )


@app.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(task_id: int, payload: TaskUpdate) -> Task:
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id, text, due, completed, priority FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Task not found")

        new_text = payload.text.strip() if payload.text is not None else existing["text"]
        new_due = payload.due if payload.due is not None else existing["due"]
        new_completed = int(payload.completed) if payload.completed is not None else existing["completed"]
        new_priority = payload.priority if payload.priority is not None else existing["priority"]

        conn.execute(
            "UPDATE tasks SET text = ?, due = ?, completed = ?, priority = ? WHERE id = ?",
            (new_text, new_due, new_completed, new_priority, task_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, text, due, completed, priority FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()
        return Task(
            id=row["id"],
            text=row["text"],
            due=row["due"],
            completed=bool(row["completed"]),
            priority=row["priority"],
        )


@app.delete("/api/tasks/{task_id}", status_code=204)
async def delete_task(task_id: int) -> None:
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found")


# Serve static frontend (index.html, css, js, etc.)
FRONTEND_DIR = "/workspace"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")