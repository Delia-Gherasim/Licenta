from Factory.Creator import Creator
from Strategy.Strategy import Strategy


class SceneStrategy(Strategy):
    def __init__(self):
        super().__init__("scene_advice")

    def execute(self, image):
        model = Creator.get_model("scene")
        score = model.predict(image)
        return score
        