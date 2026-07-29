import json
import re
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI(title="놀라운 음악 교실 AI Sync")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_SIZE = "small"
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")


def normalize(value: str) -> str:
    return re.sub(r"[^0-9a-z가-힣]", "", value.lower())


@app.post("/analyze-sync")
async def analyze_sync(audio: UploadFile = File(...), lyrics: str = Form(...)):
    lyric_lines = json.loads(lyrics)
    suffix = Path(audio.filename or "music.mp3").suffix or ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp.write(await audio.read())
        audio_path = temp.name

    segments, _ = model.transcribe(
        audio_path,
        language="ko",
        word_timestamps=True,
        vad_filter=True,
        beam_size=5,
    )

    words = []
    for segment in segments:
        for word in segment.words or []:
            normalized = normalize(word.word)
            if normalized:
                words.append({"text": normalized, "start": word.start, "end": word.end})

    transcript = ""
    starts = []
    ends = []
    for word in words:
        for character in word["text"]:
            transcript += character
            starts.append(word["start"])
            ends.append(word["end"])

    matches = []
    cursor = 0
    for line in lyric_lines:
        target = normalize(line)
        position = transcript.find(target, cursor) if target else -1
        if position >= 0:
            start = starts[position]
            end = ends[position + len(target) - 1]
            confidence = 1.0
            cursor = position + len(target)
        else:
            fallback = next((word for word in words if word["start"] >= (matches[-1]["end"] if matches else 0)), None)
            start = fallback["start"] if fallback else (matches[-1]["end"] if matches else 0)
            end = fallback["end"] if fallback else start + 3
            confidence = 0.25
            cursor = max(cursor, position + 1 if position >= 0 else cursor)
        matches.append({"start": round(start, 3), "end": round(max(end, start + 0.1), 3), "confidence": confidence})

    Path(audio_path).unlink(missing_ok=True)
    return {"matches": matches, "model": MODEL_SIZE}
