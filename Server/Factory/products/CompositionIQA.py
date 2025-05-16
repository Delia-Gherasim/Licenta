import cv2
import numpy as np
from Factory.products.BaseModel import BaseModel
from PIL import Image
import torch

class CompositionIQA(BaseModel):
    def _preprocess(self, image):
        return np.array(image)[:, :, ::-1] 

    def _rule_of_thirds(self, image):
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

    def _leading_lines(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLines(edges, 1, np.pi / 180, 120)
        if lines is None:
            return 0
        angles = [line[0][1] for line in lines]
        verticals = [a for a in angles if np.pi / 4 < a < 3 * np.pi / 4]
        horizontals = [a for a in angles if a < np.pi / 8 or a > 7 * np.pi / 8]
        return 1 if len(verticals + horizontals) >= 5 else 0

    def _check_symmetry(self, image):
        h, w = image.shape[:2]
        if w % 2 != 0:
            w -= 1
            image = image[:, :-1]
        if h % 2 != 0:
            h -= 1
            image = image[:-1, :]

        left = image[:, :w // 2]
        right = cv2.flip(image[:, w // 2:], 1)

        top = image[:h // 2, :]
        bottom = cv2.flip(image[h // 2:, :], 0)

        diff_vertical = cv2.absdiff(left, right)
        diff_horizontal = cv2.absdiff(top, bottom)

        score_vertical = np.mean(diff_vertical)
        score_horizontal = np.mean(diff_horizontal)

        return {
            "vertical_symmetry_score": score_vertical,
            "horizontal_symmetry_score": score_horizontal
        }

    def predict(self, image_pil):
        image_cv2 = self._preprocess(image_pil)

        rule_thirds_score = self._rule_of_thirds(image_cv2)
        leading_lines_score = self._leading_lines(image_cv2)
        symmetry_score_dict = self._check_symmetry(image_cv2)

        symmetry_score = 0
        for val in symmetry_score_dict.values():
            symmetry_score += max(0, 1 - (val / 255.0))
        symmetry_score /= 2

        overall_score = round((rule_thirds_score + leading_lines_score + symmetry_score) / 3, 2)

        return {
            "rule_of_thirds": rule_thirds_score,
            "leading_lines": leading_lines_score,
            "symmetry": symmetry_score_dict,
            "overall_composition_score": overall_score,
        }
