import torch
from torchvision import models, transforms
from PIL import Image
import json
import requests
from io import BytesIO
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

    def predict(self, image):
        img_tensor = self.transform(image).unsqueeze(0)  
        with torch.no_grad():
            outputs = self.model(img_tensor)

        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        top5_prob, top5_catid = torch.topk(probabilities, 5)

        results = []
        for i in range(top5_prob.size(0)):
            label = self.labels[str(top5_catid[i].item())][1]
            confidence = top5_prob[i].item() * 100 
            results.append({"label": label, "confidence": round(confidence, 2)})

        return results
