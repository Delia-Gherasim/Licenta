import json
import os

from Factory.Creator import Creator
from Strategy.Strategy import Strategy


class ObjectStrategy(Strategy):
    def __init__(self):
        super().__init__("object_advice")
        
        category_map_path = "C:\\Facultation\\licenta\\PhotographyAdviceApp\\Server\\imageNet1kParentCategories.json"
        with open(category_map_path, "r") as f:
            self.category_map = json.load(f)
        self.category_advice = {
            "aquatic animals": "Try using a polarizing filter to reduce glare and enhance underwater contrast.",
            "pets": "Use natural light and get on your pet's eye level for a more intimate perspective.",
            "wild animals": "Use a telephoto lens to maintain distance and capture candid animal behavior.",
            "reptiles": "Focus on texture and patterns; use macro shots to highlight their skin details.",
            "insects": "Use a macro lens and a fast shutter speed to capture detail and motion.",
            "plants": "Shoot during golden hour to enhance colors and depth.",
            "furniture": "Use a wide-angle lens and pay attention to symmetry and background.",
            "clothing": "Use soft lighting and show texture and flow through movement.",
            "musical instruments": "Focus on the craftsmanship with close-up shots and moody lighting.",
            "vehicles": "Shoot from low angles for dramatic perspective and reflective detail.",
            "buildings": "Use leading lines and symmetry to highlight architectural structure.",
            "weapons": "Be mindful of context and lighting to emphasize texture without glamorizing.",
            "sports equipment": "Capture in action using fast shutter speeds and dynamic angles.",
            "toys": "Use bright lighting and get creative with playful compositions.",
            "medical supplies": "Highlight cleanliness and clarity; use a sterile background.",
            "beverages": "Use backlighting to accentuate transparency and condensation.",
            "optical instruments": "Play with reflections and angles to show precision and design.",
            "accessories": "Use soft light and showcase the item in use or in a styled layout.",
            "memorials": "Shoot during golden hour or dusk for a more respectful and somber tone.",
            "lighting": "Play with light placement and shadow to tell a mood-driven story.",
            "technology": "Use clean backgrounds and focus on design details and user context.",
            "media devices": "Highlight screens and functionality with clean, clear compositions.",
            "kitchen appliances": "Stage in a lifestyle setup with food or action shots for realism.",
            "outdoor": "Use natural framing (like branches or paths) to lead the viewer’s eye.",
            "nature": "Use rule of thirds and depth of field to add dimension.",
            "appliances": "Shoot in a real-life setting and avoid harsh shadows.",
            "seasonal items": "Emphasize mood with lighting and thematic props.",
            "electronics": "Highlight function and design with clean light and minimal background.",
            "medicine": "Use white backgrounds and even lighting for clarity.",
            "laboratory": "Capture context in a clean, organized setting for credibility.",
            "recreational": "Show interaction and enjoyment; use wide shots to include context.",
            "footwear": "Shoot from low angles and include context like pavement or trails.",
            "shopping": "Use flat lays or lifestyle shots with vibrant color and branding.",
            "natural structures": "Use a wide-angle lens and foreground for depth.",
            "personal care": "Soft, diffused light works best; highlight clean aesthetics.",
            "military": "Focus on realism and respectful tone; avoid stylizing conflict.",
            "home decor": "Use interior light and natural ambiance to show style.",
            "vending": "Use symmetry and branding focus to highlight utility and design.",
            "bathroom fixtures": "Shoot with clean angles and reflective control.",
            "animals": "Capture expressions and behavior in natural light whenever possible.",
            "food": "Use soft side lighting and style with fresh ingredients and color balance.",
            "vegetables": "Highlight freshness with natural light and shallow depth of field.",
            "fruits": "Use color contrast and macro focus to enhance texture and vibrance.",
            "people": "Use expressive poses and good light—try portraits at golden hour.",
            "fungi": "Use macro and side light to reveal textures and earthy tones.",
            "containers": "Compose with context, like kitchen or packaging setup.",
            "stationary": "Use flat lay shots with neat arrangement and color themes.",
            "tools": "Show in action or arranged neatly to convey utility.",
            "safety equipment": "Focus on clarity, color, and real-life usage scenarios.",
            "clocks": "Play with symmetry, background, and time-of-day context.",
            "cosmetics": "Use soft lighting and macro focus to emphasize elegance and branding.",
            "uncategorized": "Think about lighting, framing, and context to make your object stand out.",
        }

        self.age_tips = {
            "child": "Get down to their level, use fast shutter speeds to catch motion, and keep the scene playful.",
            "adult": "Use side lighting for dramatic effect or soft light for flattering portraits.",
            "elderly": "Use soft light and focus on character and expressions to convey depth and emotion."
        }

        self.emotion_tips = {
            "happy": "Use natural light to enhance warmth; candid moments often work best.",
            "sad": "Try black-and-white or moody lighting to emphasize emotion.",
            "angry": "Use strong contrast and sharp shadows to dramatize intensity.",
            "surprised": "Capture wide eyes and expressions using burst mode to freeze the moment.",
            "neutral": "Use clean compositions and soft light to maintain a calm tone.",
            "fear": "Experiment with low lighting and shallow depth to emphasize unease."
        }

    def execute(self, image):
        model = Creator.get_model("object")
        predictions = model.predict(image)

        if isinstance(predictions, dict) and predictions.get("human_detected"):
            age = predictions["age"]
            gender = predictions["gender"]
            emotion = predictions["emotion"]

            if age < 13:
                age_group = "child"
            elif age > 60:
                age_group = "elderly"
            else:
                age_group = "adult"

            age_tip = self.age_tips.get(age_group, "")
            emotion_tip = self.emotion_tips.get(emotion.lower(), "")

            return (
                f"A human was detected. Gender: {gender}, Age: {age}, Emotion: {emotion}.\n"
                f"Photography Tip for {age_group}s: {age_tip}\n"
                f"Based on the emotion '{emotion}', you could try: {emotion_tip}"
            )

        for result in predictions:
            label = result["label"]
            number = str(result["number"])
            confidence = result["confidence"]
            category = self.category_map.get(number, "uncategorized")
            tip = self.category_advice.get(category, self.category_advice["uncategorized"])

            sentence = f'I am {confidence} % certain you have a {label}. A good tip for "{category}" photography: {tip}'
            return sentence 

