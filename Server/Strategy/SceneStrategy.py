import json
from Factory.Creator import Creator
from Strategy.Strategy import Strategy
from Factory.products.SceneClassifier import SceneClassifier
from PIL import Image


class SceneStrategy(Strategy):
    def __init__(self):
        super().__init__("scene_advice")
        self.classifier = SceneClassifier()
        with open("C:\\Facultation\\licenta\\PhotographyAdviceApp\\Server\\sceneAdvice.json") as f:
            self.scene_advice_data = json.load(f)
        with open("C:\\Facultation\\licenta\\PhotographyAdviceApp\\Server\\places365Categoryes.json") as f:
            self.category_data = json.load(f)

    def get_category_from_scene(self, scene_name):
        for category, scenes in self.category_data.items():
            if scene_name in scenes:
                return category
        return None 

    def execute(self, image):
        top5 = self.classifier.predict(image)
        best_scene = top5[0]["scene"]

        category = self.get_category_from_scene(best_scene)
        
        if category:
            advice = self.scene_advice_data['category_advice'].get(category, "No advice available for this category.")
        else:
            advice = "No category found for this scene."

        advice_text = (
            f"The predicted scene is '{best_scene}', which falls under the category '{category}'.\n"
            f"Here is some advice for photographing scenes in this category:\n"
            f"{advice}"
        )
        
        return advice_text
