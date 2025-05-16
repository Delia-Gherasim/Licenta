import json
import os
from Strategy.Strategy import Strategy
from Factory.products.GenreClassifier import GenreClassifier

class GenreStrategy(Strategy):
    def __init__(self):
        super().__init__("genre_advice")
        self.classifier = GenreClassifier()
        advice_path = os.path.join(os.path.dirname(__file__), "content", "genreAdvice.json")
        with open(advice_path, "r", encoding="utf-8") as f:
            self.advice_data = json.load(f)

    def execute(self, image):
        results = self.classifier.predict(image)
        if not results:
            return "No genre prediction available."

        top_result = results[0]
        predicted_genre = top_result["style"]
        confidence = top_result["confidence"]
        genre_key = next((key for key in self.advice_data if key.lower() == predicted_genre.lower()), None)

        if not genre_key:
            return (
                f"The predicted genre is '{predicted_genre}' with a confidence of {confidence:.2f}.\n"
                f"No advice available for this genre."
            )

        genre_advice = self.advice_data[genre_key]
        description = genre_advice.get("description", [])
        tips = genre_advice.get("tips", [])
        image_link = genre_advice.get("image_link", "")

        advice_text = (
            f"The predicted genre is '{predicted_genre}' with a confidence of {confidence:.2f}."
            f"**Description:**"
            f"{' '.join(description)}"
            f"**Tips:**"
            f"{'- ' + '- '.join(tips) if tips else 'No specific tips available.'}"
        )

        return advice_text
