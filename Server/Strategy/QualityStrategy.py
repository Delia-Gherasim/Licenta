from Factory.Creator import Creator
from Strategy.Strategy import Strategy


class QualityStrategy(Strategy):
    def __init__(self):
        super().__init__("technical_quality")

    def execute(self, image):
        model = Creator.get_model("quality")
        scores = model.predict(image)

        wb = scores["white_balance_score"]
        dof = scores["depth_of_field_score"]
        brightness = scores["brightness_score"]
        noise = scores["noise_level"]

        advice = []

        if wb < 10:
            advice.append("White balance looks good. Colors should appear natural.")
        else:
            advice.append("White balance seems off. Consider adjusting it in post-processing or using custom white balance settings in-camera.")

        if dof > 1000:
            advice.append("The image has a high depth of field. This is ideal for landscapes or scenes where sharpness across the frame is needed.")
        elif dof > 100:
            advice.append("Moderate depth of field. Suitable for portraits or objects where some background blur is desired.")
        else:
            advice.append("Depth of field is very shallow. You might want to use a smaller aperture (higher f-number) if more of the scene needs to be in focus.")

        if brightness < 40:
            advice.append("Image appears too dark. Try a slower shutter speed, a wider aperture (smaller f-number), or a higher ISO.")
        elif brightness > 200:
            advice.append("Image appears overexposed. Try a faster shutter speed, smaller aperture, or lower ISO.")
        else:
            advice.append("Exposure level looks well balanced.")

        if noise > 200:
            advice.append("High image noise detected. Consider lowering the ISO setting or improving lighting conditions.")
        elif noise > 50:
            advice.append("Some visible noise. If shooting in low light, use a tripod to allow for a lower ISO setting.")
        else:
            advice.append("Low noise level. Image quality should be clean.")

        general_tip = (
            "Photography Tip: Balancing aperture (f-stop), shutter speed, and ISO is essential. "
            "For example, increasing aperture (f/2.8 → f/1.8) lets in more light, allowing faster shutter speed (e.g., 1/60s) or lower ISO (e.g., ISO 100) for cleaner images. "
            "Always match exposure settings with your subject—fast shutter for action, narrow aperture for landscapes, high ISO only if needed in low light."
        )
       
        feedback_str = "\n".join(advice)
        readable_output = (
            f"Image Quality Analysis:\n"
            f"- White Balance Score: {wb:.2f}\n"
            f"- Depth of Field Score: {dof:.2f}\n"
            f"- Brightness Score: {brightness:.2f}\n"
            f"- Noise Level: {noise:.2f}\n\n"
            f"{feedback_str}\n\n"
            f"{general_tip}"
        )

        return readable_output