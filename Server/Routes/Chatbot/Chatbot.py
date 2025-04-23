import io
from typing import Optional

import cv2
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
import numpy as np
from Factory.Creator import Creator
from Strategy.AestheticStrategy import AestheticStrategy
from Strategy.Context import Context
from Strategy.Strategy import Strategy
from Strategy.QualityStrategy import QualityStrategy
from Strategy.ObjectStrategy import ObjectStrategy
from Strategy.SceneStrategy import SceneStrategy
from Strategy.GenreStrategy import GenreStrategy
from Strategy.GeneralAdviceStrategy import GeneralAdviceStrategy
from PIL import Image
router = APIRouter()

def read_image(file: UploadFile) -> Image.Image:
    contents = file.file.read()
    return Image.open(io.BytesIO(contents)).convert("RGB")

@router.get("/")
async def analyze_image():
    options = [
        "aesthetic_score",
        "technical_quality",
        "object_advice",
        "scene_advice",
        "general_advice",
        "genre_advice"
    ]
    return {"options": options}

@router.post("/advice")
async def get_advice(
    choice: str = Form(...),
    sub_choice: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    image = read_image(file)

    if choice == "aesthetic_score":
        strategy = AestheticStrategy(sub_option=sub_choice or "general")
    elif choice == "technical_quality":
        strategy = QualityStrategy()
    elif choice == "object_advice":
        strategy = ObjectStrategy()
    elif choice == "scene_advice":
        strategy = SceneStrategy()
    elif choice == "general_advice":
        strategy = GeneralAdviceStrategy()
    elif choice == "genre_advice":
        strategy = GenreStrategy()
    else:
        raise HTTPException(status_code=400, detail="Invalid strategy choice.")

    advisor = Context(strategy)
    advice = advisor.execute(image)

    return {
        "advice_type": choice,
        "sub_advice_type": sub_choice,
        "result": advice
    }


@router.get("/sub_options")
async def get_sub_options(main_choice: str):
    sub_option_map = {
        "aesthetic_score": ["composition", "chromatic", "general"],
        # Add sub-options if other strategies support them
    }

    sub_options = sub_option_map.get(main_choice, [])
    return {"sub_options": sub_options}

