from Strategy.Strategy import Strategy
from Factory.Creator import Creator

class CompositionStrategy(Strategy):
    def __init__(self):
        super().__init__("composition")

    def execute(self, image):
        model = Creator.get_model("composition")
        result = model.predict(image)

        rule_thirds = result["rule_of_thirds"]
        leading_lines = result["leading_lines"]
        symmetry = result["symmetry"]
        clip_score = result["clip_composition_score"]

        feedback = []

        if rule_thirds:
            feedback.append("The image effectively applies the rule of thirds, placing key elements in visually engaging areas.")
        else:
            feedback.append("The image does not seem to follow the rule of thirds. Consider placing subjects along the 1/3 gridlines to enhance balance and focus.")

        if leading_lines:
            feedback.append("There are noticeable leading lines that guide the viewer’s eye through the image.")
        else:
            feedback.append("No strong leading lines were detected. Try using natural or architectural lines to direct attention and add depth.")

        v_sym = symmetry["vertical_symmetry_score"]
        h_sym = symmetry["horizontal_symmetry_score"]

        if v_sym < 20 and h_sym < 20:
            feedback.append("The image shows good symmetry, contributing to a stable and harmonious composition.")
        elif v_sym > 50 or h_sym > 50:
            feedback.append("The image lacks symmetry. If aiming for balance, ensure elements on one side are visually counterbalanced by others.")
        else:
            feedback.append("Moderate symmetry detected. Consider refining alignment or balancing elements to strengthen composition.")

        if clip_score >= 0.6:
            quality = "excellent"
        elif clip_score >= 0.45:
            quality = "good"
        elif clip_score >= 0.3:
            quality = "decent"
        elif clip_score >= 0.15:
            quality = "average"
        else:
            quality = "poor"

        feedback.append(f"Overall, the composition is assessed as **{quality}** based on visual aesthetics.")

        tips = [
            " Pay attention to visual weight distribution to achieve **left-right and top-bottom balance**.",
            " Experiment with **diagonal framing** to inject energy and movement.",
            " Use **foreground and background layering** to add depth and guide focus.",
            " Consider **closed vs. open compositions** to either focus the viewer’s attention or encourage exploration.",
            " Play with **pyramid or spiral structures** to control visual flow and hierarchy.",
            " Ensure your chosen **perspective (eye-level, high-angle, or low-angle)** serves the subject's narrative purpose."
        ]

        return "Composition Analysis:\n\n" + "\n".join(feedback) + "\n\n Tips for Improvement:\n" + "\n".join(tips)


class ChromaticStrategy(Strategy):
    def __init__(self):
        super().__init__("chromatic")

    def execute(self, image):
        model = Creator.get_model("chromatic")
        result = model.predict(image)

        contrast = result["contrast"]
        harmony = result["color_harmony"]
        percentages = result["color_percentages"]
        interpretation = []
        if contrast < 0.2:
            interpretation.append(
                f"- Contrast is low ({contrast:.2f}), which may make the image appear flat. "
                f"Consider increasing the use of opposing light/dark tones or adding pure primary colors for stronger visual impact."
            )
        elif contrast > 0.6:
            interpretation.append(
                f"- High contrast ({contrast:.2f}) gives your image a strong visual punch. This is effective for dramatic compositions, "
                f"but use with care to avoid harshness."
            )
        else:
            interpretation.append(
                f"- Medium contrast ({contrast:.2f}) provides a balanced look, maintaining visual interest without overwhelming the viewer."
            )

        harmony_map = {
            "complementary": "This creates dynamic tension and vibrancy by using colors that are opposite on the color wheel (e.g., red-green, blue-orange).",
            "analogous": "This results in a soothing, harmonious palette by using colors next to each other on the wheel (e.g., blue-green-cyan).",
            "balanced": "A balanced mix of warm and cool tones suggests thoughtful composition and aesthetic neutrality."
        }
        interpretation.append(f"- Color harmony: **{harmony.capitalize()}**. {harmony_map[harmony]}")

        warm_colors = ["red", "orange", "yellow"]
        cool_colors = ["green", "blue", "indigo", "violet"]

        warm_total = sum(percentages.get(c, 0) for c in warm_colors)
        cool_total = sum(percentages.get(c, 0) for c in cool_colors)

        if warm_total > cool_total + 15:
            interpretation.append(
                f"- Warm colors dominate ({warm_total:.2f}% warm vs {cool_total:.2f}% cool). "
                f"This adds energy and intensity, but consider adding some cool tones to balance the mood."
            )
        elif cool_total > warm_total + 15:
            interpretation.append(
                f"- Cool colors dominate ({cool_total:.2f}% cool vs {warm_total:.2f}% warm). "
                f"This creates a calm, serene feeling, but could benefit from warm highlights for contrast."
            )
        else:
            interpretation.append(
                f"- The image shows a good balance of warm ({warm_total:.2f}%) and cool ({cool_total:.2f}%) colors, which contributes to visual equilibrium."
            )

        major_color = max(percentages.items(), key=lambda x: x[1])
        if major_color[1] > 50:
            interpretation.append(
                f"- Dominant color: {major_color[0].capitalize()} at {major_color[1]:.2f}%. "
                f"Try using its complementary color for visual interest and to enhance simultaneous contrast."
            )

        return "Color Analysis\n" + "\n".join(interpretation)

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
            result = "I give it "+str(score)+" out of 10"
            if score >= 8.5:
                return "Stunning and artistically impressive. This image likely evokes a strong emotional or visual response. " + result
            elif score >= 7:
                return "Aesthetically pleasing. Good composition and visual appeal. " + result
            elif score >= 5:
                return "Decent quality. Has potential but may lack strong artistic elements. " + result
            else:
                return "Below average aesthetic value. Likely unbalanced or uninteresting composition. " + result

        else:
            return strategy.execute(image)
