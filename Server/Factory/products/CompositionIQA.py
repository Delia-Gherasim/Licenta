import cv2
import numpy as np
from Factory.products.BaseModel import BaseModel
from PIL import Image
import random
import torch
from transformers import CLIPProcessor, CLIPModel

class CompositionIQA(BaseModel):
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(self.device)
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.prompts = [
            "a photo with excellent composition, following photography aesthetic principles", "photo with good composition, following photography aesthetic principles",
            "a photo with decent composition, maybe following photography aesthetic principles", "a photo with average composition, not following photography aesthetic principles",
            "a photo with bad composition, not following photography aesthetic principles",
        ]

    def preprocess(self, image):
        return np.array(image)[:, :, ::-1]  

    def rule_of_thirds(self, image):
        h, w = image.shape[:2]
        thirds_x = [w // 3, 2 * w // 3]
        thirds_y = [h // 3, 2 * h // 3]

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blur, 100, 200)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        score = 0
        for cnt in contours:
            M = cv2.moments(cnt)
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                if any(abs(cx - x) < w // 20 for x in thirds_x) and any(abs(cy - y) < h // 20 for y in thirds_y):
                    score += 1
        return 1 if score > 0 else 0

    def leading_lines(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLines(edges, 1, np.pi / 180, 120)
        if lines is None:
            return 0
        angles = [line[0][1] for line in lines]
        verticals = [a for a in angles if np.pi / 4 < a < 3 * np.pi / 4]
        horizontals = [a for a in angles if a < np.pi / 8 or a > 7 * np.pi / 8]
        return 1 if len(verticals + horizontals) >= 5 else 0

    def check_symmetry(self, image):
        h, w = image.shape[:2]
        if w % 2 != 0:
            w -= 1
            image = image[:, :-1]  

        left = image[:, :w // 2]
        right = cv2.flip(image[:, w // 2:], 1)

        if h % 2 != 0:
            h -= 1
            image = image[:-1, :] 

        top = image[:h // 2, :]
        bottom = cv2.flip(image[h // 2:, :], 0)

        diff_vertical = cv2.absdiff(left, right)
        score_vertical = np.mean(diff_vertical)
        
        diff_horizontal = cv2.absdiff(top, bottom)
        score_horizontal = np.mean(diff_horizontal)
        
        return {
            "vertical_symmetry_score": score_vertical,
            "horizontal_symmetry_score": score_horizontal
        }



    def clip_score(self, image_pil):
        inputs = self.processor(text=self.prompts, images=image_pil, return_tensors="pt", padding=True).to(self.device)
        outputs = self.clip_model(**inputs)
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)
        good_score = probs[0][0].item()
        return good_score  

    def predict(self, image_pil):
        image_cv2 = self.preprocess(image_pil)

        rule_thirds_score = self.rule_of_thirds(image_cv2)
        leading_lines_score = self.leading_lines(image_cv2)
        symmetry_score = self.check_symmetry(image_cv2)
        clip_composition_score = self.clip_score(image_pil)

        return {
            "rule_of_thirds": rule_thirds_score,
            "leading_lines": leading_lines_score,
            "symmetry": symmetry_score,
            "clip_composition_score": clip_composition_score
        }
