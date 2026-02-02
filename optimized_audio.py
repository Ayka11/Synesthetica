# Advanced Optimized Color Processing for Audio Synthesis
import numpy as np
from scipy.spatial import cKDTree
from scipy import signal
from PIL import Image
import colorsys
from functools import lru_cache
import logging
from typing import Dict, List, Tuple, Optional
import time

# Configure logging
logger = logging.getLogger(__name__)

class AdvancedColorProcessor:
    """High-performance color-to-frequency conversion with advanced features"""
    
    def __init__(self, cache_size: int = 2000, enable_interpolation: bool = True):
        self.cache_size = cache_size
        self.enable_interpolation = enable_interpolation
        self.setup_color_tree()
        self.setup_advanced_features()
        
    def setup_color_tree(self):
        """Build comprehensive KD-Tree for fast nearest color lookup"""
        # Complete musical scale mapping (A0 to C8)
        self.color_map = {
            # Octave 0
            (139, 0, 0): 27.50,      # A0
            (255, 69, 0): 29.14,     # A#0/Bb0
            (204, 204, 0): 30.87,    # B0
            # Octave 1
            (255, 140, 0): 32.70,    # C1
            (255, 165, 0): 34.65,    # C#1/Db1
            (255, 185, 0): 36.71,    # D1
            (255, 215, 0): 38.89,    # D#1/Eb1
            (255, 255, 0): 41.20,    # E1
            (194, 255, 0): 43.65,    # F1
            (154, 255, 0): 46.25,    # F#1/Gb1
            (0, 255, 0): 49.00,      # G1
            (0, 255, 127): 51.91,    # G#1/Ab1
            (0, 255, 255): 55.00,    # A1
            (127, 0, 255): 58.27,    # A#1/Bb1
            (255, 0, 255): 61.74,    # B1
            # Octave 2
            (255, 0, 191): 65.41,    # C2
            (255, 0, 128): 69.30,    # C#2/Db2
            (255, 0, 64): 73.42,     # D2
            (255, 0, 0): 77.78,      # D#2/Eb2
            (255, 64, 0): 82.41,     # E2
            (255, 128, 0): 87.31,    # F2
            (255, 192, 0): 92.50,    # F#2/Gb2
            (255, 255, 64): 98.00,   # G2
            (192, 255, 64): 103.83,  # G#2/Ab2
            (128, 255, 64): 110.00,  # A2
            (64, 255, 64): 116.54,   # A#2/Bb2
            (0, 255, 128): 123.47,   # B2
            # Octave 3
            (0, 255, 192): 130.81,   # C3
            (0, 255, 255): 138.59,   # C#3/Db3
            (0, 192, 255): 146.83,   # D3
            (0, 128, 255): 155.56,   # D#3/Eb3
            (0, 64, 255): 164.81,    # E3
            (64, 0, 255): 174.61,    # F3
            (128, 0, 255): 185.00,   # F#3/Gb3
            (192, 0, 255): 196.00,   # G3
            (255, 0, 255): 207.65,   # G#3/Ab3
            (255, 0, 192): 220.00,   # A3
            (255, 0, 128): 233.08,   # A#3/Bb3
            (255, 0, 64): 246.94,    # B3
            # Octave 4
            (255, 64, 64): 261.63,   # C4 (Middle C)
            (255, 128, 128): 277.18, # C#4/Db4
            (255, 192, 192): 293.66, # D4
            (255, 255, 192): 311.13, # D#4/Eb4
            (255, 255, 128): 329.63, # E4
            (192, 255, 128): 349.23, # F4
            (128, 255, 128): 369.99, # F#4/Gb4
            (64, 255, 64): 392.00,   # G4
            (64, 255, 128): 415.30,  # G#4/Ab4
            (64, 255, 192): 440.00,  # A4
            (64, 255, 255): 466.16,  # A#4/Bb4
            (64, 192, 255): 493.88,  # B4
            # Octave 5
            (64, 128, 255): 523.25,  # C5
            (64, 64, 255): 554.37,   # C#5/Db5
            (128, 64, 255): 587.33,  # D5
            (192, 64, 255): 622.25,  # D#5/Eb5
            (255, 64, 255): 659.25,  # E5
            (255, 64, 192): 698.46,  # F5
            (255, 64, 128): 739.99,  # F#5/Gb5
            (255, 64, 64): 783.99,   # G5
            (255, 128, 64): 830.61,  # G#5/Ab5
            (255, 192, 64): 880.00,  # A5
            (255, 255, 64): 932.33,  # A#5/Bb5
            (255, 255, 128): 987.77, # B5
            # Octave 6
            (192, 255, 128): 1046.50, # C6
            (128, 255, 128): 1108.73, # C#6/Db6
            (64, 255, 128): 1174.66, # D6
            (0, 255, 128): 1244.51,  # D#6/Eb6
            (0, 255, 192): 1318.51,  # E6
            (0, 255, 255): 1396.91,  # F6
            (0, 192, 255): 1479.98,  # F#6/Gb6
            (0, 128, 255): 1567.98,  # G6
            (0, 64, 255): 1661.22,  # G#6/Ab6
            (64, 0, 255): 1760.00,   # A6
            (128, 0, 255): 1864.66,  # A#6/Bb6
            (192, 0, 255): 1975.53,  # B6
            # Octave 7
            (255, 0, 255): 2093.00,  # C7
            (255, 0, 192): 2217.46,  # C#7/Db7
            (255, 0, 128): 2349.32,  # D7
            (255, 0, 64): 2489.02,   # D#7/Eb7
            (255, 0, 0): 2637.02,   # E7
            (255, 64, 0): 2793.83,   # F7
            (255, 128, 0): 2959.96,  # F#7/Gb7
            (255, 192, 0): 3135.96,  # G7
            (255, 255, 0): 3322.44,  # G#7/Ab7
            (255, 255, 64): 3520.00, # A7
            (255, 255, 128): 3729.31, # A#7/Bb7
            (255, 255, 192): 3951.07, # B7
            # Octave 8
            (255, 255, 255): 4186.01, # C8
        }
        
        # Build KD-Tree for fast nearest neighbor search
        self.colors = np.array(list(self.color_map.keys()))
        self.color_tree = cKDTree(self.colors)
        self.frequencies = np.array(list(self.color_map.values()))
        
        # Pre-compute color statistics for better interpolation
        self.color_hsv = np.array([colorsys.rgb_to_hsv(*(c/255 for c in color)) for color in self.colors])
        
        logger.info(f"Color tree initialized with {len(self.color_map)} colors")
    
    def setup_advanced_features(self):
        """Setup advanced processing features"""
        # Musical temperament settings
        self.temperament = 'equal'  # 'equal', 'just', 'pythagorean'
        self.harmonic_weights = [1.0, 0.5, 0.25, 0.125]  # Harmonic series weights
        
        # Color sensitivity settings
        self.color_sensitivity = {
            'hue': 1.0,
            'saturation': 0.8,
            'brightness': 0.6
        }
        
        # Performance metrics
        self.processing_stats = {
            'cache_hits': 0,
            'cache_misses': 0,
            'total_lookups': 0
        }
    
    @lru_cache(maxsize=2000)
    def get_frequency_fast(self, r: int, g: int, b: int) -> float:
        """O(log n) color lookup using KD-Tree with caching"""
        self.processing_stats['total_lookups'] += 1
        
        color_array = np.array([r, g, b])
        distance, index = self.color_tree.query(color_array)
        
        # Use exact match if very close
        if distance < 15:  # Threshold for "exact" match
            self.processing_stats['cache_hits'] += 1
            return float(self.frequencies[index])
        
        # Interpolate for smoother transitions
        self.processing_stats['cache_misses'] += 1
        return self.interpolate_frequency_advanced(color_array, index, distance)
    
    def interpolate_frequency_advanced(self, color: np.ndarray, nearest_index: int, distance: float) -> float:
        """Advanced frequency interpolation with multiple factors"""
        if not self.enable_interpolation:
            return float(self.frequencies[nearest_index])
        
        base_freq = self.frequencies[nearest_index]
        nearest_color = self.colors[nearest_index]
        
        # Calculate color differences in HSV space
        input_hsv = colorsys.rgb_to_hsv(*(color/255))
        nearest_hsv = self.color_hsv[nearest_index]
        
        # Weighted interpolation based on color sensitivity
        hue_diff = abs(input_hsv[0] - nearest_hsv[0])
        sat_diff = abs(input_hsv[1] - nearest_hsv[1])
        val_diff = abs(input_hsv[2] - nearest_hsv[2])
        
        # Apply sensitivity weights
        weighted_diff = (
            hue_diff * self.color_sensitivity['hue'] +
            sat_diff * self.color_sensitivity['saturation'] +
            val_diff * self.color_sensitivity['brightness']
        ) / 3
        
        # Frequency adjustment based on color difference
        freq_multiplier = 1 + (weighted_diff - 0.5) * 0.2  # ±10% variation
        
        # Apply temperament-based adjustment
        if self.temperament == 'just':
            freq_multiplier *= self.get_just_intonation_ratio(base_freq)
        elif self.temperament == 'pythagorean':
            freq_multiplier *= self.get_pythagorean_ratio(base_freq)
        
        return float(base_freq * freq_multiplier)
    
    def get_just_intonation_ratio(self, freq: float) -> float:
        """Get just intonation ratio for frequency"""
        # Simplified just intonation ratios
        ratios = {
            261.63: 1.0,    # C4
            293.66: 9/8,    # D4
            329.63: 5/4,    # E4
            349.23: 4/3,    # F4
            392.00: 3/2,    # G4
            440.00: 5/3,    # A4
            493.88: 15/8    # B4
        }
        
        # Find closest frequency and apply ratio
        closest_freq = min(ratios.keys(), key=lambda x: abs(x - freq))
        return ratios.get(closest_freq, 1.0)
    
    def get_pythagorean_ratio(self, freq: float) -> float:
        """Get Pythagorean tuning ratio for frequency"""
        # Simplified Pythagorean ratios based on perfect fifths
        ratios = {
            261.63: 1.0,    # C4
            293.66: 256/243, # D4
            329.63: 64/81,   # E4
            349.23: 4/3,    # F4
            392.00: 3/2,    # G4
            440.00: 128/81, # A4
            493.88: 16/9    # B4
        }
        
        closest_freq = min(ratios.keys(), key=lambda x: abs(x - freq))
        return ratios.get(closest_freq, 1.0)
    
    def process_image_optimized(self, image_data) -> Dict[int, List[float]]:
        """High-performance image processing with vectorized operations"""
        start_time = time.time()
        
        # Load and convert image
        img = Image.open(image_data).convert('RGBA')
        img_array = np.array(img)
        width, height = img.size
        
        # Vectorized pixel filtering
        pixels = img_array.reshape(-1, 4)
        
        # Create mask for valid pixels (not transparent and not black)
        valid_mask = (
            (pixels[:, 3] > 200) &  # Alpha > 200
            ~((pixels[:, :3] == 0).all(axis=1))  # Not pure black
        )
        
        valid_pixels = pixels[valid_mask]
        
        if len(valid_pixels) == 0:
            logger.warning("No valid pixels found in image")
            return {}
        
        # Batch process colors with vectorized operations
        rgb_pixels = valid_pixels[:, :3]
        frequencies = np.array([
            self.get_frequency_fast(int(r), int(g), int(b))
            for r, g, b in rgb_pixels
        ])
        
        # Filter out zero frequencies
        non_zero_mask = frequencies > 0
        valid_frequencies = frequencies[non_zero_mask]
        valid_indices = np.where(valid_mask)[0][non_zero_mask]
        
        if len(valid_frequencies) == 0:
            logger.warning("No valid frequencies generated")
            return {}
        
        # Create timeline based on x-coordinates
        timeline = {}
        
        for i, pixel_index in enumerate(valid_indices):
            x_coord = pixel_index % width
            if x_coord not in timeline:
                timeline[x_coord] = []
            
            freq = valid_frequencies[i]
            if freq > 0:
                timeline[x_coord].append(freq)
        
        # Remove duplicates and sort frequencies for each column
        for x in timeline:
            # Use numpy for efficient unique and sort
            unique_freqs = np.unique(timeline[x])
            timeline[x] = unique_freqs.tolist()
        
        processing_time = time.time() - start_time
        logger.info(f"Processed {len(valid_pixels)} pixels in {processing_time:.3f}s")
        logger.info(f"Generated timeline with {len(timeline)} columns")
        
        return timeline
    
    def process_image_advanced(self, image_data, brush_type: str = 'round') -> Dict[int, List[float]]:
        """Advanced image processing with brush-specific optimizations"""
        timeline = self.process_image_optimized(image_data)
        
        # Apply brush-specific frequency modifications
        if brush_type in ['star', 'spray', 'cross']:
            timeline = self.add_harmonics_to_timeline(timeline, brush_type)
        
        return timeline
    
    def add_harmonics_to_timeline(self, timeline: Dict[int, List[float]], brush_type: str) -> Dict[int, List[float]]:
        """Add harmonics based on brush type"""
        enhanced_timeline = {}
        
        for x, frequencies in timeline.items():
            enhanced_freqs = frequencies.copy()
            
            for freq in frequencies:
                if brush_type == 'star':
                    # Add harmonic series
                    for i, weight in enumerate(self.harmonic_weights[1:], 1):
                        harmonic_freq = freq * (i + 1)
                        if harmonic_freq < 20000:  # Audio range limit
                            enhanced_freqs.append(harmonic_freq * weight)
                
                elif brush_type == 'spray':
                    # Add noise-like frequencies
                    noise_freq = freq * (1 + np.random.uniform(-0.1, 0.1))
                    enhanced_freqs.append(noise_freq)
                
                elif brush_type == 'cross':
                    # Add frequency modulation
                    mod_freq = freq * 1.5
                    enhanced_freqs.append(mod_freq)
            
            enhanced_timeline[x] = np.unique(enhanced_freqs).tolist()
        
        return enhanced_timeline
    
    def get_processing_stats(self) -> Dict[str, any]:
        """Get performance statistics"""
        total = self.processing_stats['total_lookups']
        if total > 0:
            cache_hit_rate = (self.processing_stats['cache_hits'] / total) * 100
        else:
            cache_hit_rate = 0
        
        return {
            **self.processing_stats,
            'cache_hit_rate': f"{cache_hit_rate:.2f}%",
            'colors_in_tree': len(self.color_map),
            'temperament': self.temperament
        }
    
    def reset_stats(self):
        """Reset performance statistics"""
        self.processing_stats = {
            'cache_hits': 0,
            'cache_misses': 0,
            'total_lookups': 0
        }
        self.get_frequency_fast.cache_clear()
        logger.info("Performance statistics reset")
    
    def set_temperament(self, temperament: str):
        """Set musical temperament"""
        if temperament in ['equal', 'just', 'pythagorean']:
            self.temperament = temperament
            logger.info(f"Temperament set to {temperament}")
        else:
            logger.warning(f"Unknown temperament: {temperament}")
    
    def set_color_sensitivity(self, hue: float = 1.0, saturation: float = 0.8, brightness: float = 0.6):
        """Set color sensitivity weights"""
        self.color_sensitivity = {
            'hue': hue,
            'saturation': saturation,
            'brightness': brightness
        }
        logger.info(f"Color sensitivity updated: {self.color_sensitivity}")

# Global instance for easy access
advanced_processor = AdvancedColorProcessor()

# Integration helper functions
def get_optimized_frequency(r: int, g: int, b: int) -> float:
    """Convenience function for frequency lookup"""
    return advanced_processor.get_frequency_fast(r, g, b)

def process_image_for_audio(image_data, brush_type: str = 'round') -> Dict[int, List[float]]:
    """Convenience function for image processing"""
    return advanced_processor.process_image_advanced(image_data, brush_type)

def get_audio_processor_stats() -> Dict[str, any]:
    """Get processor performance statistics"""
    return advanced_processor.get_processing_stats()

# Flask Integration Example
from flask import Flask, request, jsonify
from io import BytesIO
import base64
import time

app = Flask(__name__)

@app.route('/submit_optimized', methods=['POST'])
def submit_optimized():
    """Optimized submission route using advanced color processor"""
    start_time = time.time()
    
    try:
        # Validate request
        if 'image' not in request.json:
            return jsonify({"error": "No image provided"}), 400
        
        brush = request.json.get('brush', 'round')
        image_data = request.json['image'].split(',')[1]
        
        # Process image with advanced optimization
        timeline = advanced_processor.process_image_advanced(
            BytesIO(base64.b64decode(image_data)), 
            brush
        )
        
        if not timeline:
            return jsonify({"error": "No valid colors detected"}), 400
        
        # Generate audio (you would integrate with your existing audio generation)
        # audio = generate_audio_from_timeline(timeline, brush)
        
        processing_time = time.time() - start_time
        stats = advanced_processor.get_processing_stats()
        
        return jsonify({
            "success": True,
            "processing_time": f"{processing_time:.3f}s",
            "timeline_columns": len(timeline),
            "processor_stats": stats,
            "message": "Advanced processing completed successfully"
        })
        
    except Exception as e:
        logger.error(f"Error in optimized submission: {str(e)}")
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

@app.route('/processor_stats', methods=['GET'])
def get_processor_statistics():
    """Get detailed processor statistics"""
    return jsonify(advanced_processor.get_processing_stats())

@app.route('/reset_stats', methods=['POST'])
def reset_processor_stats():
    """Reset processor statistics"""
    advanced_processor.reset_stats()
    return jsonify({"message": "Statistics reset successfully"})

@app.route('/set_temperament', methods=['POST'])
def set_musical_temperament():
    """Set musical temperament"""
    temperament = request.json.get('temperament', 'equal')
    advanced_processor.set_temperament(temperament)
    return jsonify({
        "message": f"Temperament set to {temperament}",
        "current_temperament": advanced_processor.temperament
    })

@app.route('/set_color_sensitivity', methods=['POST'])
def set_color_sensitivity():
    """Set color sensitivity weights"""
    hue = request.json.get('hue', 1.0)
    saturation = request.json.get('saturation', 0.8)
    brightness = request.json.get('brightness', 0.6)
    
    advanced_processor.set_color_sensitivity(hue, saturation, brightness)
    
    return jsonify({
        "message": "Color sensitivity updated",
        "sensitivity": advanced_processor.color_sensitivity
    })

# Performance monitoring endpoint
@app.route('/performance_report', methods=['GET'])
def get_performance_report():
    """Get comprehensive performance report"""
    stats = advanced_processor.get_processing_stats()
    
    return jsonify({
        "processor_stats": stats,
        "system_info": {
            "cache_size": advanced_processor.cache_size,
            "interpolation_enabled": advanced_processor.enable_interpolation,
            "color_map_size": len(advanced_processor.color_map),
            "temperament": advanced_processor.temperament,
            "color_sensitivity": advanced_processor.color_sensitivity
        },
        "recommendations": generate_performance_recommendations(stats)
    })

def generate_performance_recommendations(stats: Dict[str, any]) -> List[str]:
    """Generate performance recommendations based on stats"""
    recommendations = []
    
    cache_hit_rate = float(stats.get('cache_hit_rate', '0%').rstrip('%'))
    
    if cache_hit_rate < 50:
        recommendations.append("Consider increasing cache size for better performance")
    
    if stats.get('total_lookups', 0) > 10000:
        recommendations.append("High usage detected - consider enabling parallel processing")
    
    if stats.get('cache_misses', 0) > stats.get('cache_hits', 0):
        recommendations.append("Many cache misses - try adjusting color sensitivity weights")
    
    if not recommendations:
        recommendations.append("Performance is optimal")
    
    return recommendations

# Testing and Development Functions
def test_processor_performance():
    """Test processor performance with sample data"""
    print("Testing Advanced Color Processor...")
    
    # Test color lookup
    test_colors = [
        (255, 0, 0),    # Red
        (0, 255, 0),    # Green
        (0, 0, 255),    # Blue
        (255, 255, 0),  # Yellow
        (255, 0, 255),  # Magenta
    ]
    
    print("\nColor Frequency Test:")
    for r, g, b in test_colors:
        freq = advanced_processor.get_frequency_fast(r, g, b)
        print(f"RGB({r}, {g}, {b}) -> {freq:.2f} Hz")
    
    # Test different temperaments
    print("\nTemperament Test:")
    for temperament in ['equal', 'just', 'pythagorean']:
        advanced_processor.set_temperament(temperament)
        freq = advanced_processor.get_frequency_fast(255, 0, 0)
        print(f"{temperament}: RGB(255,0,0) -> {freq:.2f} Hz")
    
    # Get final stats
    print("\nFinal Statistics:")
    stats = advanced_processor.get_processing_stats()
    for key, value in stats.items():
        print(f"{key}: {value}")

if __name__ == "__main__":
    # Run performance test
    test_processor_performance()
    
    # Start Flask app for testing
    app.run(debug=True, port=5001)
