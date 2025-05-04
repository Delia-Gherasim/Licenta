import json
import os
from Strategy.Strategy import Strategy

class GeneralAdviceStrategy(Strategy):
    def __init__(self, sub_option="technical"):
        super().__init__("general_advice")
        self.sub_option = sub_option
        self.base_path = "C:/Facultation/licenta/PhotographyAdviceApp/Server/Strategy/content"

    def execute(self, image):
        file_map = {
            "technical": "technical.json",
            "aesthetic": "aesthetic.json",
            "style": "style.json"
        }

        file_name = file_map.get(self.sub_option)
        if not file_name:
            return {"error": "Invalid sub-option."}

        file_path = os.path.join(self.base_path, file_name)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        except FileNotFoundError:
            return {"error": f"File not found: {file_path}"}
        except json.JSONDecodeError:
            return {"error": f"Invalid JSON in file: {file_path}"}
