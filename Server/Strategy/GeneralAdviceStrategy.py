from Factory.Creator import Creator
from Strategy.Strategy import Strategy


class GeneralAdviceStrategy(Strategy):
    def __init__(self):
        super().__init__("general_advice")

    def execute(self, image):
        result = {"general": "General advice for photography."}
        model = Creator.get_model("aesthetic")
        score = model.predict(image)
        if score >= 8.5:
            result["aesthetic"] = "Stunning and artistically impressive. This image likely evokes a strong emotional or visual response."
        elif score >= 7:
            result["aesthetic"] = "Aesthetically pleasing. Good composition and visual appeal."
        elif score >= 5:
            result["aesthetic"] = "Decent quality. Has potential but may lack strong artistic elements."
        else:
            result["aesthetic"] = "Below average aesthetic value. Likely unbalanced or uninteresting composition."
        
        model = Creator.get_model("object")
        score = model.predict(image)
        result["object"] = f"Object analysis: {score}"

        model = Creator.get_model("quality")
        score = model.predict(image)
        result["quality"] = f"Quality analysis: {score}"

        model = Creator.get_model("scene")
        score = model.predict(image)
        result["scene"] = f"Scene analysis: {score}"

        return result