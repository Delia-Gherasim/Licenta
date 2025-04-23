from Factory.Creator import Creator
from Strategy.Strategy import Strategy


class ObjectStrategy(Strategy):
    def __init__(self):
        super().__init__("object_advice")

    def execute(self, image):
        model = Creator.get_model("object")
        score = model.predict(image)
        return score
        