import torch
from torchvision import models, transforms
from PIL import Image
import os
import requests
import zipfile
from collections import OrderedDict

from Factory.products.BaseModel import BaseModel

class SceneClassifier(BaseModel):
    def __init__(self):
        super().__init__()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.model = models.resnet18(num_classes=365)
        model_file = 'resnet18_places365.pth.tar'

        if not os.path.exists(model_file):
            print("Downloading model weights...*")
            url = 'http://places2.csail.mit.edu/models_places365/resnet18_places365.pth.tar'
            r = requests.get(url, allow_redirects=True)
            with open(model_file, 'wb') as f:
                f.write(r.content)

        checkpoint = torch.load(model_file, map_location=self.device)
        new_state_dict = OrderedDict()
        for k, v in checkpoint['state_dict'].items():
            new_key = k.replace('module.', '')  
            new_state_dict[new_key] = v

        self.model.load_state_dict(new_state_dict)
        self.model.eval().to(self.device)

        self.classes = []
        categories_file = 'categories_places365.txt'
        if not os.path.exists(categories_file):
            print("Downloading categories...")
            url = 'https://raw.githubusercontent.com/csailvision/places365/master/categories_places365.txt'
            r = requests.get(url)
            with open(categories_file, 'w') as f:
                f.write(r.text)

        with open(categories_file) as class_file:
            self.classes = [line.strip().split(' ')[0][3:] for line in class_file]

        self.transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225]),
        ])

    def predict(self, image: Image.Image):
        img_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logit = self.model(img_tensor)
            h_x = torch.nn.functional.softmax(logit, 1).data.squeeze()
            probs, idx = h_x.sort(0, True)

        top5 = [{"scene": self.classes[idx[i]], "confidence": round(probs[i].item() * 100, 2)} for i in range(5)]
        return top5
