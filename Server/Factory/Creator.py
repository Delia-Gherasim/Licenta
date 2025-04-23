from Factory.products.BaseModel import BaseModel
from Factory.products.AestheticIQA import AestheticIQA
from Factory.products.TechnicalQualityAssessment import TechnicalQualityAssessment
from Factory.products.ObjectRecognition import ObjectRecognition
from Factory.products.SceneClassifier import SceneClassifier
from Factory.products.GenreClassifier import GenreClassifier
from Factory.products.CompositionIQA import CompositionIQA
from Factory.products.ChromaticIQA import ChromaticIQA

class Creator:
    @staticmethod
    def get_model(model_type: str) -> BaseModel:
        model_map = {
            "aesthetic": AestheticIQA(),
            "composition": CompositionIQA(),
            "chromatic": ChromaticIQA(),  # Assuming chromatic uses the same model as composition
            "quality": TechnicalQualityAssessment(),
            "object": ObjectRecognition(),
            "scene": SceneClassifier(),
            "genre": GenreClassifier(),
        }
        model = model_map.get(model_type)
        if not model:
            raise ValueError(f"No model found for type: {model_type}")
        return model
