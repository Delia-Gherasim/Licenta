from PIL import Image
from aesthetic_predictor import predict_aesthetic
from Factory.products.BaseModel import BaseModel

class AestheticIQA(BaseModel):
    def predict(self, image: Image.Image):
        try:
            img = image.convert("RGB")
            score = predict_aesthetic(img)  
            return round(score.item(), 2)
        except Exception as e:
            return {
                "error": str(e)
            }
