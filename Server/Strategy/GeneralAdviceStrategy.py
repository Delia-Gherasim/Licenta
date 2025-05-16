import json
import os
import random
from Strategy.Strategy import Strategy

class GeneralAdviceStrategy(Strategy):
    def __init__(self, sub_option=None, sub_sub_option=None): 
        super().__init__("general_advice")
        self.sub_option = sub_option
        self.sub_sub_option = sub_sub_option
        self.base_path = "C:/Facultation/licenta/PhotographyAdviceApp/Server/Strategy/content"

    def execute(self, image):
        file_map = {
            "technical": "technical.json",
            "aesthetic": "aesthetic.json",
            "style": "genreAdvice.json"
        }

        if not self.sub_option:
            self.sub_option = random.choice(list(file_map.keys()))

        file_name = file_map.get(self.sub_option)
        if not file_name:
            return {"error": "Invalid sub-option."}

        file_path = os.path.join(self.base_path, file_name)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            if not self.sub_sub_option:
                if self.sub_option == "style":
                    self.sub_sub_option = random.choice(list(data.keys()))
                else:
                    available_options = []
                    for section in data.values():
                        if "concepts" in section:
                            available_options.extend(section["concepts"].keys())
                        if "challenges_and_solutions" in section:
                            available_options.extend(section["challenges_and_solutions"].keys())
                    if not available_options:
                        return {"error": "No valid sub-sub-options available in the content."}
                    self.sub_sub_option = random.choice(available_options)

            if self.sub_option == "style":
                concept = data.get(self.sub_sub_option)
                if not concept:
                    return {"error": f"Sub-sub-option '{self.sub_sub_option}' not found in style content."}

                description = concept.get("description")
                if isinstance(description, str):
                    description = [description]
                elif description is None:
                    description = []

                return {
                    "title": self.sub_sub_option,
                    "description": description,
                    "details": concept.get("tips", []),
                    "image_link": concept.get("image_link", "")
                }

            for section_key, section in data.items():
                if "concepts" in section and self.sub_sub_option in section["concepts"]:
                    concept = section["concepts"][self.sub_sub_option]
                    return {
                        "title": self.sub_sub_option,
                        "description": concept.get("description", []),
                        "details": concept.get("details", []),
                        "image_link": concept.get("image_link", "")
                    }
                elif "challenges_and_solutions" in section and self.sub_sub_option in section["challenges_and_solutions"]:
                    concept = section["challenges_and_solutions"][self.sub_sub_option]
                    return {
                        "title": self.sub_sub_option,
                        "description": concept.get("challenge", ""),
                        "details": concept.get("solution", ""),
                        "image_link": concept.get("image_link", "")
                    }

            return {"error": f"Sub-sub-option '{self.sub_sub_option}' not found in content."}

        except FileNotFoundError:
            return {"error": f"File not found: {file_path}"}
        except json.JSONDecodeError:
            return {"error": f"Invalid JSON in file: {file_path}"}
