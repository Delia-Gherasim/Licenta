import random
import numpy as np
import cv2
from PIL import Image
from collections import Counter
from PIL.ExifTags import TAGS

from Factory.products.BaseModel import BaseModel


class TechnicalQualityAssessment(BaseModel):
    def predict(self, image):
        img_np = np.array(image.convert("RGB"))
        wb_score = self._get_white_balance_score(img_np)
        dof_score = self._get_depth_of_field(img_np)
        brightness_score = self._get_brightness_score(img_np)
        noise_score = self._get_noise_score(img_np)
                
        return {
            "white_balance_score": float(wb_score),
            "depth_of_field_score": float(dof_score),
            "brightness_score": float(brightness_score), 
            "noise_level": float(noise_score),
        }


    def _get_white_balance_score(self, img_np):
        red = np.mean(img_np[:, :, 0])
        green = np.mean(img_np[:, :, 1])
        blue = np.mean(img_np[:, :, 2])
        
        balance_score = abs(red - green) + abs(green - blue) + abs(red - blue)
        return balance_score
    
    def _get_depth_of_field(self, img_np):
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness = laplacian.var()
        
        return sharpness
        
    def _get_brightness_score(self, img_np):
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        mean_brightness = np.mean(gray)
        
        return mean_brightness
    
    def _get_noise_score(self, img_np):
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = laplacian.var()
        
        return variance
    
