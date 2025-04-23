from Factory.Creator import Creator
from Strategy.Strategy import Strategy


class GenreStrategy(Strategy):
    def __init__(self):
        super().__init__("genre_advice")

    def execute(self, image):
        model = Creator.get_model("genre")
        score = model.predict(image)
        return score
        