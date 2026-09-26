STYLE_PRESETS = {
    'Photorealistic': {
        'positive_suffix': '8k architectural photograph, photorealistic render, award winning, architectural digest, professional lighting, sharp focus, high detail, unreal engine 5, octane render',
        'negative': 'blurry, deformed, low quality, warped walls, broken geometry, cartoon, anime, painting, sketch, watermark, ugly, distorted, bad proportions, text, logo'
    },
    'Brutalism': {
        'positive_suffix': 'brutalist architecture, exposed concrete, geometric forms, harsh shadows, monolithic, modernist, architectural photograph, 8k render',
        'negative': 'blurry, deformed, low quality, colorful, decorative, ornate, wood, warm colors, cartoon, sketch'
    },
    'Minimalist': {
        'positive_suffix': 'minimalist interior design, clean lines, white walls, natural light, Scandinavian design, simple geometry, architectural digest, 8k render',
        'negative': 'blurry, deformed, clutter, busy, decorative, ornate, cartoon, sketch, dark'
    },
    'Biophilic': {
        'positive_suffix': 'biophilic design, living walls, natural materials, plants, wood, stone, organic forms, natural light, sustainable architecture, 8k render',
        'negative': 'blurry, deformed, synthetic, industrial, concrete only, plastic, cartoon, sketch'
    },
    'Industrial': {
        'positive_suffix': 'industrial loft interior, exposed pipes, metal beams, brick walls, Edison bulbs, dark aesthetic, warehouse conversion, architectural photograph, 8k render',
        'negative': 'blurry, deformed, clean white, minimalist, cartoon, sketch, low quality'
    },
    'Art Deco': {
        'positive_suffix': 'art deco interior, geometric patterns, gold accents, luxury, symmetrical design, 1920s glamour, ornate, architectural digest, 8k render',
        'negative': 'blurry, deformed, minimalist, brutalist, cartoon, sketch, low quality'
    },
    'Futuristic': {
        'positive_suffix': 'futuristic architecture, parametric design, curved surfaces, smart glass, LED strips, sci-fi interior, Zaha Hadid inspired, 8k render, unreal engine 5',
        'negative': 'blurry, deformed, traditional, rustic, cartoon, sketch, low quality'
    }
}

SKETCH_MODE_STRUCTURAL_ENFORCER = 'architectural interior, precise geometry, clean structural lines, straight walls, defined floor plan, architectural accuracy'

def build_sketch_prompt(user_prompt: str, style_preset: str) -> tuple[str, str]:
    """Returns (full_positive_prompt, full_negative_prompt) for sketch mode"""
    preset = STYLE_PRESETS.get(style_preset, STYLE_PRESETS['Photorealistic'])
    
    pos = f"{user_prompt}, {SKETCH_MODE_STRUCTURAL_ENFORCER}, {preset['positive_suffix']}"
    neg = preset['negative']
    
    return pos.strip(", "), neg

def build_text_prompt(user_prompt: str, style_preset: str) -> tuple[str, str]:
    """Returns (full_positive_prompt, full_negative_prompt) for text mode"""
    preset = STYLE_PRESETS.get(style_preset, STYLE_PRESETS['Photorealistic'])
    
    pos = f"{user_prompt}, {preset['positive_suffix']}"
    neg = preset['negative']
    
    return pos.strip(", "), neg
