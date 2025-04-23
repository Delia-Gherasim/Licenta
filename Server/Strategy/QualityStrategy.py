from Factory.Creator import Creator
from Strategy.Strategy import Strategy


class QualityStrategy(Strategy):
    def __init__(self):
        super().__init__("technical_quality")

    def execute(self, image):
        model = Creator.get_model("quality")
        score = model.predict(image)
        return score
        