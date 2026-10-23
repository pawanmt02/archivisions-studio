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


def validate_architectural_intent(b64_sketch: str) -> dict:
    """
    Multi-Constraint Architectural Input Validator (MCAIV)
    
    A 4-stage geometric invariant validator that discriminates authentic
    architectural intent (rooms, facades, elevations) from all known
    edge cases: stick figures, text glyphs, stars, crosses, and small doodles.
    
    Safeguard 1: Spatial Bounding Footprint Check
    Safeguard 2: Dual-Axis Orthogonal Line Verification
    Safeguard 3: Enclosed Spatial Enclosure (Cyclic Graph Test)
    Safeguard 4: Corner Orthogonality Distribution
    
    Returns: dict with is_valid, failed_safeguard (if any), and message
    """
    img = base64_to_numpy(b64_sketch)
    img_resized = cv2.resize(img, (512, 512), interpolation=cv2.INTER_AREA)

    # ── Preprocessing: Create cleaned binary stroke mask ──
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)
    kernel = np.ones((2, 2), np.uint8)
    dilated = cv2.dilate(binary, kernel, iterations=1)

    # ════════════════════════════════════════════════════════════════
    # SAFEGUARD 1: Spatial Bounding Footprint Check
    # Eliminates: L4 (small center doodles), isolated figures
    # Architectural drawings span the canvas to establish spatial context.
    # ════════════════════════════════════════════════════════════════
    stroke_points = cv2.findNonZero(dilated)
    if stroke_points is None:
        return {
            "is_valid": False,
            "failed_safeguard": 1,
            "message": "Blank canvas detected. Please draw an architectural sketch with walls, floors, and structural elements.",
        }

    x, y, w, h = cv2.boundingRect(stroke_points)
    footprint_area = w * h

    if w < 160 or h < 160 or footprint_area < 35000:
        return {
            "is_valid": False,
            "failed_safeguard": 1,
            "bounding_width": w,
            "bounding_height": h,
            "footprint_area": footprint_area,
            "message": (
                f"Spatial Footprint Too Small: Your drawing occupies only {w}\u00d7{h} px "
                f"({footprint_area:,} px\u00b2 area). Architectural sketches must span at least "
                f"160\u00d7160 px with a minimum footprint of 35,000 px\u00b2. "
                f"Please draw a larger, more complete architectural layout."
            ),
        }

    # ════════════════════════════════════════════════════════════════
    # SAFEGUARD 2: Dual-Axis Orthogonal Line Verification
    # Eliminates: L1 (stick figures), L3 (stars, zigzags)
    # Gravity requires horizontal baselines and vertical load-bearing walls.
    # ════════════════════════════════════════════════════════════════
    lines = cv2.HoughLinesP(
        dilated, rho=1, theta=np.pi / 180,
        threshold=25, minLineLength=80, maxLineGap=10,
    )

    lines_detected = len(lines) if lines is not None else 0

    if lines_detected < 3:
        return {
            "is_valid": False,
            "failed_safeguard": 2,
            "lines_detected": lines_detected,
            "message": (
                f"Insufficient geometric structure: Only {lines_detected} straight line(s) detected "
                f"(minimum 3 required). Please draw distinct straight lines such as walls, floors, or a roof."
            ),
        }

    h_count = 0  # horizontal lines
    v_count = 0  # vertical lines

    for line in lines:
        coords = line[0] if line.ndim > 1 else line
        x1, y1, x2, y2 = coords
        angle_deg = abs(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
        # Horizontal bucket: θ ∈ [0°, 20°] ∪ [160°, 180°]
        if angle_deg <= 20 or angle_deg >= 160:
            h_count += 1
        # Vertical bucket: θ ∈ [70°, 110°]
        elif 70 <= angle_deg <= 110:
            v_count += 1

    if h_count < 2 or v_count < 2:
        return {
            "is_valid": False,
            "failed_safeguard": 2,
            "horizontal_lines": h_count,
            "vertical_lines": v_count,
            "lines_detected": lines_detected,
            "message": (
                f"Non-Architectural Geometry: Architecture requires both horizontal foundations "
                f"and vertical load-bearing elements. Detected {h_count} horizontal and {v_count} vertical "
                f"line(s) (minimum 2 each required). Diagonal-only shapes like stars, stick figures, "
                f"or zigzags are not valid architectural sketches."
            ),
        }

    # ════════════════════════════════════════════════════════════════
    # SAFEGUARD 3: Enclosed Spatial Enclosure (Cyclic Graph Test)
    # Eliminates: L1 (stick figures), L2 (text glyphs), L5 (crosses)
    # Architecture = enclosed habitable volumes. Open trees/branches fail.
    #
    # Uses RETR_CCOMP hierarchy to find inner enclosed regions (rooms).
    # Checks both absolute area and ratio to bounding footprint to reject
    # small inter-stroke gaps (e.g., letter "H" crossbar gap, hash grid cells).
    # ════════════════════════════════════════════════════════════════
    contours, hierarchy = cv2.findContours(dilated, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)

    MIN_ENCLOSED_AREA = 4000
    MIN_ENCLOSURE_RATIO = 0.08  # enclosed area must be >= 8% of bounding footprint
    MIN_SOLIDITY = 0.5  # reject irregular cross/grid outlines

    max_contour_area = 0
    largest_contour = None
    if contours:
        for c in contours:
            area = cv2.contourArea(c)
            if area > max_contour_area:
                max_contour_area = area
                largest_contour = c

    enclosure_ratio = max_contour_area / footprint_area if footprint_area > 0 else 0

    # Solidity: contour area / convex hull area
    # Architectural rooms are convex or near-convex (solidity ~1.0).
    # Grid/cross patterns produce irregular outlines (solidity ~0.2).
    solidity = 0
    if largest_contour is not None:
        hull = cv2.convexHull(largest_contour)
        hull_area = cv2.contourArea(hull)
        solidity = max_contour_area / hull_area if hull_area > 0 else 0

    if max_contour_area < MIN_ENCLOSED_AREA or enclosure_ratio < MIN_ENCLOSURE_RATIO or solidity < MIN_SOLIDITY:
        return {
            "is_valid": False,
            "failed_safeguard": 3,
            "max_enclosed_area": max_contour_area,
            "enclosure_ratio": round(enclosure_ratio * 100, 1),
            "solidity": round(solidity, 3),
            "message": (
                f"No Enclosed Space Detected: The largest closed region in your sketch is "
                f"{max_contour_area:.0f} px\u00b2 ({enclosure_ratio * 100:.1f}% of footprint, "
                f"solidity {solidity:.2f}). "
                f"Architecture requires enclosed habitable volumes (rooms, corridors) of at least "
                f"4,000 px\u00b2 covering \u22658% of the drawing footprint with solid boundaries. "
                f"Open-ended shapes like stick figures, crosses, grid patterns, or text characters "
                f"cannot define interior spaces."
            ),
        }

    # ════════════════════════════════════════════════════════════════
    # SAFEGUARD 4: Corner Orthogonality Distribution
    # Eliminates: L3 (stars with 36° angles, zigzags, triangles)
    # Architectural rooms meet at ~90°. Acute shapes deviate toward 36°–60°.
    # ════════════════════════════════════════════════════════════════
    if largest_contour is not None and len(largest_contour) >= 3:
        epsilon = 0.03 * cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)

        if len(approx) >= 3:
            orthogonal_corners = 0
            total_corners = len(approx)

            for i in range(total_corners):
                p_curr = approx[i][0].astype(float)
                p_next = approx[(i + 1) % total_corners][0].astype(float)
                p_prev = approx[(i - 1) % total_corners][0].astype(float)

                v1 = p_next - p_curr
                v2 = p_prev - p_curr

                norm1 = np.linalg.norm(v1)
                norm2 = np.linalg.norm(v2)

                if norm1 > 0 and norm2 > 0:
                    cos_angle = np.dot(v1, v2) / (norm1 * norm2)
                    cos_angle = np.clip(cos_angle, -1.0, 1.0)
                    angle = np.degrees(np.arccos(cos_angle))

                    if 70 <= angle <= 110:
                        orthogonal_corners += 1

            orthogonal_pct = (orthogonal_corners / total_corners * 100) if total_corners > 0 else 0

            if orthogonal_pct < 50:
                return {
                    "is_valid": False,
                    "failed_safeguard": 4,
                    "orthogonal_corners": orthogonal_corners,
                    "total_corners": total_corners,
                    "orthogonal_pct": round(orthogonal_pct, 1),
                    "message": (
                        f"Non-Orthogonal Geometry: Only {orthogonal_pct:.0f}% of corners are near 90\u00b0 "
                        f"({orthogonal_corners}/{total_corners} corners within 70\u00b0\u2013110\u00b0). "
                        f"Architectural structures require at least 50% right-angle intersections. "
                        f"Acute shapes like stars, triangles, or zigzags are not valid architectural forms."
                    ),
                }

    # ══ ALL 4 SAFEGUARDS PASSED ══
    return {
        "is_valid": True,
        "lines_detected": lines_detected,
        "horizontal_lines": h_count,
        "vertical_lines": v_count,
        "max_enclosed_area": max_contour_area,
        "message": "Sketch accepted \u2014 all architectural intent safeguards passed.",
    }

