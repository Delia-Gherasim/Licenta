import io
from typing import Optional
import requests
from fastapi import APIRouter, Form, HTTPException
from PIL import Image
from io import BytesIO

from Strategy.AestheticStrategy import AestheticStrategy
from Strategy.Context import Context
from Strategy.QualityStrategy import QualityStrategy
from Strategy.ObjectStrategy import ObjectStrategy
from Strategy.SceneStrategy import SceneStrategy
from Strategy.GenreStrategy import GenreStrategy
from Strategy.GeneralAdviceStrategy import GeneralAdviceStrategy

router = APIRouter()

def read_image_from_url(image_url: str) -> Image.Image:
    try:
        response = requests.get(image_url)
        response.raise_for_status() 
        image = Image.open(BytesIO(response.content)).convert("RGB")
        return image
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Error downloading image: {e}")

@router.get("/")
async def get_options():
    options = [
        "aesthetic_score",
        "technical_quality",
        "object_advice",
        "scene_advice",
        "genre_advice"
    ]
    return {"options": options}

@router.post("/advice")
async def get_advice(
    choice: str = Form(...),
    sub_choice: Optional[str] = Form(None),
    image_url: str = Form(...), 
):
    if choice == "general_advice":
        raise HTTPException(status_code=400, detail="Use the /general_advice endpoint for this option.")  
    image = read_image_from_url(image_url)

    if choice == "aesthetic_score":
        strategy = AestheticStrategy(sub_option=sub_choice or "general")
    elif choice == "technical_quality":
        strategy = QualityStrategy()
    elif choice == "object_advice":
        strategy = ObjectStrategy()
    elif choice == "scene_advice":
        strategy = SceneStrategy()
    elif choice == "general_advice":
        strategy = GeneralAdviceStrategy(sub_option=sub_choice or "technical")
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
        "aesthetic_score": ["composition", "chromatic", "general"]
    }

    sub_options = sub_option_map.get(main_choice, [])
    return {"sub_options": sub_options}

@router.post("/general_advice")
async def get_general_advice(
    sub_choice: Optional[str] = Form(None),
    sub_sub_option: Optional[str] = Form(None)
):
    strategy = GeneralAdviceStrategy(sub_option=sub_choice, sub_sub_option=sub_sub_option)
    advisor = Context(strategy)
    advice = advisor.execute(None) 
    return advice  