from Strategy.Strategy import Strategy
from Factory.Creator import Creator

class CompositionStrategy(Strategy):
    def __init__(self):
        super().__init__("composition")

    def execute(self, image):
        model = Creator.get_model("composition")
        result = model.predict(image)
        return f"Composition analysis: {result}"

class ChromaticStrategy(Strategy):
    def __init__(self):
        super().__init__("chromatic")

    def execute(self, image):
        model = Creator.get_model("chromatic")
        result = model.predict(image)
        return f"Color analysis: {result}"

class AestheticStrategy(Strategy):
    def __init__(self, sub_option: str = "general"):
        super().__init__("aesthetic_score")
        self.sub_option = sub_option
        self.sub_strategies = {
            "composition": CompositionStrategy(),
            "chromatic": ChromaticStrategy(),
            "general": self 
        }

    def execute(self, image):
        strategy = self.sub_strategies.get(self.sub_option, self)
        
        if strategy == self:
            model = Creator.get_model("aesthetic")
            score = model.predict(image)
            if score >= 8.5:
                return "Stunning and artistically impressive. This image likely evokes a strong emotional or visual response."
            elif score >= 7:
                return "Aesthetically pleasing. Good composition and visual appeal."
            elif score >= 5:
                return "Decent quality. Has potential but may lack strong artistic elements."
            else:
                return "Below average aesthetic value. Likely unbalanced or uninteresting composition."

        else:
            return strategy.execute(image)
