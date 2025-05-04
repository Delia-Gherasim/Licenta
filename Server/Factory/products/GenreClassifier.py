from Factory.products.BaseModel import BaseModel
class GenreClassifier(BaseModel):
    def predict(self, image):
        return "portrait"  
