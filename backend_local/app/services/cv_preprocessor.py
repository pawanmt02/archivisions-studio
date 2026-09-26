import cv2
import numpy as np
import base64
from PIL import Image
import io

def base64_to_numpy(b64_string: str) -> np.ndarray:
    """Decode base64 PNG/JPEG to numpy BGR array"""
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    
    image_data = base64.b64decode(b64_string)
    image = Image.open(io.BytesIO(image_data))
    
    if image.mode == 'RGBA':
        # Create a white background
        background = Image.new('RGB', image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')
        
    np_img = np.array(image)
    return cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)

def numpy_to_base64(img: np.ndarray, format='PNG') -> str:
    """Encode numpy BGR array to base64 PNG string"""
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb_img)
    buffered = io.BytesIO()
    pil_img.save(buffered, format=format)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"

def preprocess_sketch(b64_sketch: str) -> tuple[np.ndarray, str]:
    """
    Full CV preprocessing pipeline:
    1. Decode base64 to numpy BGR
    2. Resize to exactly 512x512
    3. Convert to grayscale
    4. Apply Gaussian blur (3,3) to reduce noise
    5. Apply Otsu binarization threshold
    6. Apply morphological dilation with 3x3 kernel (iterations=2) to close broken lines
    7. Invert to white-lines-on-black (ControlNet scribble format)
    8. Convert back to BGR 3-channel for compatibility
    Returns: (processed_numpy_array_BGR, base64_string_of_processed_image)
    """
    img = base64_to_numpy(b64_sketch)
    
    # 2. Resize to 512x512
    img_resized = cv2.resize(img, (512, 512), interpolation=cv2.INTER_AREA)
    
    # 3. Convert to grayscale
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    
    # 4. Gaussian blur
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    
    # 5. Otsu binarization
    _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # 6. Morphological dilation (actually erosion of white text, or dilation of black lines)
    # Assuming black lines on white background currently:
    # First invert to make lines white on black
    inverted = cv2.bitwise_not(binary)
    
    # Now dilate the white lines
    kernel = np.ones((3, 3), np.uint8)
    dilated = cv2.dilate(inverted, kernel, iterations=2)
    
    # 7. Invert to white-lines-on-black (it's already white lines on black from previous step)
    # If the user drew white lines on black canvas, inverted might be black lines on white. 
    # To be safe, we check the background color (edges usually have more background).
    # Since ControlNet needs white lines on black, we ensure mostly black background.
    if np.mean(dilated) > 127:
        dilated = cv2.bitwise_not(dilated)
        
    # 8. Convert back to BGR 3-channel
    final_bgr = cv2.cvtColor(dilated, cv2.COLOR_GRAY2BGR)
    
    b64_out = numpy_to_base64(final_bgr)
    return final_bgr, b64_out
