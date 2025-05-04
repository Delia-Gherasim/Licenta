import numpy as np
import cv2
from PIL import Image
from collections import Counter

from Factory.products.BaseModel import BaseModel

class ChromaticIQA(BaseModel):
    def predict(self, image: Image.Image):
        img_np = np.array(image.convert("RGB"))
        color_data = self._analyze_colors(img_np)

        return {
            "contrast": float(color_data["contrast"]),
            "color_harmony": color_data["harmony"],
            "color_percentages": {
                k: float(v) for k, v in color_data["percentages"].items()
            },
        }

    def _analyze_colors(self, img_np):
        lab = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)
        l_channel = lab[:, :, 0]
        contrast = l_channel.max() - l_channel.min()

        hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
        hues = hsv[:, :, 0].flatten()

        bins = {
            "red": (0, 10), "orange": (11, 25), "yellow": (26, 35),
            "green": (36, 85), "blue": (86, 125),
            "indigo": (126, 140), "violet": (141, 160)
        }

        percentages = {}
        total_pixels = len(hues)
        dominant_hues = []
        for color, (low, high) in bins.items():
            mask = (hues >= low) & (hues <= high)
            count = np.sum(mask)
            percentages[color] = round((count / total_pixels) * 100, 2)
            if count > 0:
                mean_hue = np.mean(hues[mask])
                dominant_hues.append(mean_hue)

        hue_diffs = []
        for i in range(len(dominant_hues)):
            for j in range(i + 1, len(dominant_hues)):
                diff = abs(dominant_hues[i] - dominant_hues[j])
                diff = min(diff, 180 - abs(180 - diff)) 
                hue_diffs.append(diff)

        avg_diff = np.mean(hue_diffs) if hue_diffs else 0

        harmony = (
            "complementary" if avg_diff > 90
            else "analogous" if avg_diff < 30
            else "balanced"
        )

        return {
            "contrast": round(contrast / 255, 2),
            "percentages": percentages,
            "harmony": harmony
        }
