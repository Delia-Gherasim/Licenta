import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForZeroShotImageClassification

class GenreClassifier:
    def __init__(self, model_name="openai/clip-vit-base-patch32"):
        self.processor = AutoProcessor.from_pretrained(model_name)
        self.model = AutoModelForZeroShotImageClassification.from_pretrained(model_name)
        self.candidate_labels = [
            "nature photography",
            "landscape photography",
            "astrophotography",
            "storm photography",
            "pet photography",
            "wild animals photography",
            "aquatic animals photography",
            "macro photography",
            "flower photography",
            "architecture photography",
            "real estate photography",
            "aerial photography",
            "portrait photography",
            "headshot photography",
            "fashion photography",
            "sports photography",
            "documentary photography",
            "street photography",
            "wedding photography",
            "event photography",
            "food photography",
            "product photography",
            "still life photography",
            "black and white photography",
            "fine art photography",
            "abstract photography"
        ]

    def predict(self, image: Image.Image):
        if image.mode != "RGB":
            image = image.convert("RGB")
        inputs = self.processor(images=image, text=self.candidate_labels, return_tensors="pt", padding=True)
        outputs = self.model(**inputs)
        logits_per_image = outputs.logits_per_image
        probs = torch.softmax(logits_per_image[0], dim=0).tolist()
        results = [{"style": label, "confidence": round(prob * 100, 2)} for label, prob in zip(self.candidate_labels, probs)]
        results.sort(key=lambda x: x["confidence"], reverse=True)
        return results
