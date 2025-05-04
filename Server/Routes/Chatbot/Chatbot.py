import io
from typing import Optional
import requests
from fastapi import APIRouter, Form, HTTPException
from PIL import Image
from io import BytesIO

# Importing strategy classes
from Strategy.AestheticStrategy import AestheticStrategy
from Strategy.Context import Context
from Strategy.QualityStrategy import QualityStrategy
from Strategy.ObjectStrategy import ObjectStrategy
from Strategy.SceneStrategy import SceneStrategy
from Strategy.GenreStrategy import GenreStrategy
from Strategy.GeneralAdviceStrategy import GeneralAdviceStrategy

router = APIRouter()

def read_image_from_url(image_url: str) -> Image.Image:
    """
    Downloads the image from the Cloudinary URL and returns it as a PIL Image object.
    """
    try:
        response = requests.get(image_url)
        response.raise_for_status()  # Will raise an HTTPError if the status code is 4xx/5xx
        image = Image.open(BytesIO(response.content)).convert("RGB")
        return image
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Error downloading image: {e}")

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
    image_url: str = Form(...),  # Field name is image_url, not imageUrl
):
    # Download and read the image from the Cloudinary URL
    image = read_image_from_url(image_url)

    # Select the strategy based on the user's choice
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

    # Execute the strategy to get the advice
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
        "general_advice": ["style", "technical", "aesthetic"]
    }

    sub_options = sub_option_map.get(main_choice, [])
    return {"sub_options": sub_options}
