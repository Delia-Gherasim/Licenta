import torch
from torchvision import models, transforms
from PIL import Image
import json
import requests
from io import BytesIO
from deepface import DeepFace  
from Factory.products.BaseModel import BaseModel

class ObjectRecognition(BaseModel):
    def __init__(self):
        self.model = models.resnet50(pretrained=True)
        self.model.eval()

        self.labels_url = "https://storage.googleapis.com/download.tensorflow.org/data/imagenet_class_index.json"
        response = requests.get(self.labels_url)
        self.labels = json.loads(response.text)

        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def _detect_human(self, image):
        try:
            analysis = DeepFace.analyze(image, actions=['age', 'gender', 'emotion'], enforce_detection=True)
            return analysis 
        except Exception as e:
            return None 

    def predict(self, image):
        face_info = self._detect_human(image)
        if face_info:
            age = face_info[0]['age']
            gender = face_info[0]['gender']
            emotion = face_info[0]['dominant_emotion']
            return {
                "human_detected": True,
                "age": age,
                "gender": gender,
                "emotion": emotion
            }

        img_tensor = self.transform(image).unsqueeze(0)
        with torch.no_grad():
            outputs = self.model(img_tensor)

        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        top_prob, top_catid = torch.topk(probabilities, 1)

        label = self.labels[str(top_catid.item())][1]
        number = top_catid.item()
        confidence = top_prob.item() * 100

        return [{
            "human_detected": False,
            "label": label,
            "number": number,
            "confidence": round(confidence, 2)
        }]
