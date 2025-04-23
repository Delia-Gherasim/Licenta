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

    def preprocess(self, image):
        return np.array(image)[:, :, ::-1] 

    def predict(self, image):
        image = self.preprocess(image)
        return {
            "rule_of_thirds": self.rule_of_thirds(image),
            "leading_lines": self.leading_lines(image),
            "symmetry": self.check_symmetry(image)
        }

    
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

        return score > 0  

    def leading_lines(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLines(edges, 1, np.pi / 180, 120)
        if lines is None:
            return False

        angles = [line[0][1] for line in lines]
        verticals = [a for a in angles if np.pi / 4 < a < 3 * np.pi / 4]
        horizontals = [a for a in angles if a < np.pi / 8 or a > 7 * np.pi / 8]

        return len(verticals + horizontals) >= 5

    def check_symmetry(self, image):
        h, w = image.shape[:2]
        left = image[:, :w // 2]
        right = cv2.flip(image[:, w // 2:], 1)

        diff = cv2.absdiff(left, right)
        score = np.mean(diff)

        return "horizontal" if score < 25 else "none"

    def train(self, data_loader, epochs=1):
        print(f"[Mock Training] Would train for {epochs} epochs on {len(data_loader)} images.")

    def evaluate(self, val_loader):
        print(f"[Mock Evaluation] Evaluating on {len(val_loader)} validation images.")
        return {"composition_accuracy": round(random.uniform(0.7, 0.95), 2)}
