import { Platform } from "react-native";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/df2iifqrf/image/upload";
const UPLOAD_PRESET = "ml_default";

export const uploadToCloudinary = async (imageUri) => {
  const data = new FormData();

  if (Platform.OS === "web") {
    data.append("file", imageUri);
  } else {
    const fileType = imageUri.split(".").pop();
    data.append("file", {
      uri: imageUri,
      type: `image/${fileType}`,
      name: `image.${fileType}`,
    });
  }

  data.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: data,
    });

    const result = await res.json();
    console.log("Cloudinary response:", result);

    if (result.secure_url) return result.secure_url;

    throw new Error(result.error?.message || "Failed to upload image to Cloudinary");
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    throw err;
  }
};
