# Backend Performance Optimizations
import asyncio
import concurrent.futures
from functools import lru_cache
import multiprocessing as mp

class HighPerformanceAudioEngine:
    def __init__(self):
        self.thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)
        self.process_pool = concurrent.futures.ProcessPoolExecutor(max_workers=2)
        
    @lru_cache(maxsize=1000)
    def get_frequency_cached(self, r, g, b):
        """Cached frequency lookup for repeated colors"""
        return self.get_frequency_fast(r, g, b)
    
    async def process_image_parallel(self, image_data):
        """Process image in parallel chunks for better performance"""
        img = Image.open(image_data).convert('RGBA')
        width, height = img.size
        
        # Split image into vertical strips for parallel processing
        num_strips = min(4, width)
        strip_width = width // num_strips
        
        tasks = []
        for i in range(num_strips):
            start_x = i * strip_width
            end_x = (i + 1) * strip_width if i < num_strips - 1 else width
            
            # Process strip in separate thread
            task = asyncio.create_task(
                self.process_image_strip_async(img, start_x, end_x)
            )
            tasks.append(task)
        
        # Wait for all strips to complete
        results = await asyncio.gather(*tasks)
        
        # Combine results
        timeline = {}
        for strip_result in results:
            timeline.update(strip_result)
        
        return timeline
    
    async def process_image_strip_async(self, img, start_x, end_x):
        """Async wrapper for strip processing"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.thread_pool,
            self.process_image_strip,
            img, start_x, end_x
        )
    
    def process_image_strip(self, img, start_x, end_x):
        """Process a vertical strip of the image"""
        width, height = img.size
        timeline = {}
        
        for x in range(start_x, end_x):
            freqs = []
            for y in range(height):
                r, g, b, a = img.load()[x, y]
                if not (r == 0 and g == 0 and b == 0) and a > 200:
                    freq = self.get_frequency_cached(r, g, b)
                    if freq:
                        freqs.append(freq)
            
            if freqs:
                timeline[x] = list(np.unique(freqs))
        
        return timeline
    
    def generate_audio_parallel(self, timeline, brush):
        """Generate audio segments in parallel"""
        if not timeline:
            return np.array([])
        
        # Create tasks for parallel audio generation
        tasks = []
        for x, frequencies in timeline.items():
            task = self.thread_pool.submit(
                self.generate_tone_optimized,
                frequencies,
                brush
            )
            tasks.append((x, task))
        
        # Collect results in order
        audio_segments = []
        for x, task in sorted(tasks, key=lambda x: x[0]):
            try:
                segment = task.result(timeout=5)  # 5 second timeout
                audio_segments.append(segment)
            except Exception as e:
                logger.error(f"Error generating audio for column {x}: {e}")
                audio_segments.append(np.zeros(int(SAMPLE_RATE * DURATION_PER_STEP)))
        
        return np.concatenate(audio_segments)
    
    def generate_tone_optimized(self, frequencies, brush, duration=DURATION_PER_STEP):
        """Optimized tone generation with vectorized operations"""
        if not frequencies or frequencies == 0:
            return np.zeros(int(SAMPLE_RATE * duration))
        
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        
        # Vectorized frequency processing
        frequencies = np.clip(frequencies, 20, 20000)
        
        # Use optimized waveform generation
        if brush.lower() == "round":
            waveform = self.generate_sine_wave(t, frequencies)
        elif brush.lower() == "square":
            waveform = self.generate_square_wave(t, frequencies)
        elif brush.lower() == "triangle":
            waveform = self.generate_triangle_wave(t, frequencies)
        elif brush.lower() == "sawtooth":
            waveform = self.generate_sawtooth_wave(t, frequencies)
        else:
            waveform = self.generate_complex_wave(t, frequencies, brush)
        
        # Apply envelope
        envelope = self.generate_envelope(t)
        waveform *= envelope
        
        # Normalize
        max_val = np.max(np.abs(waveform))
        if max_val > 0:
            waveform /= max_val
        
        return waveform
    
    def generate_sine_wave(self, t, frequencies):
        """Vectorized sine wave generation"""
        waveform = np.zeros_like(t)
        for freq in frequencies:
            phase = 2 * np.pi * freq * t
            waveform += np.sin(phase)
        return waveform
    
    def generate_square_wave(self, t, frequencies):
        """Vectorized square wave generation"""
        waveform = np.zeros_like(t)
        for freq in frequencies:
            phase = 2 * np.pi * freq * t
            waveform += signal.square(phase)
        return waveform
    
    def generate_triangle_wave(self, t, frequencies):
        """Vectorized triangle wave generation"""
        waveform = np.zeros_like(t)
        for freq in frequencies:
            phase = 2 * np.pi * freq * t
            waveform += signal.sawtooth(phase, width=0.5)
        return waveform
    
    def generate_sawtooth_wave(self, t, frequencies):
        """Vectorized sawtooth wave generation"""
        waveform = np.zeros_like(t)
        for freq in frequencies:
            phase = 2 * np.pi * freq * t
            waveform += signal.sawtooth(phase)
        return waveform
    
    def generate_complex_wave(self, t, frequencies, brush):
        """Generate complex waveforms for special brushes"""
        waveform = np.zeros_like(t)
        
        for freq in frequencies:
            phase = 2 * np.pi * freq * t
            
            if brush.lower() == "spray":
                # Complex modulated waveform
                mod_ratio = 1.7 + 0.3 * np.sin(2 * np.pi * 0.2 * t)
                carrier = np.sin(phase + 3 * np.sin(mod_ratio * phase))
                tone = carrier * (0.6 + 0.4 * np.sin(2 * np.pi * 5 * t))
                waveform += tone
                
            elif brush.lower() == "star":
                # Harmonic-rich waveform
                harmonics = [(1, 0.6), (2, 0.4), (3, 0.3), (5, 0.2)]
                for h, amp in harmonics:
                    waveform += np.sin(h * phase) * amp
                    
            elif brush.lower() == "cross":
                # Distorted waveform
                distorted_phase = phase + 0.8 * np.sin(phase)
                waveform += np.sin(distorted_phase) * np.sin(2 * distorted_phase)
        
        return waveform
    
    def generate_envelope(self, t):
        """Generate ADSR envelope"""
        envelope = np.ones_like(t)
        attack_len = max(1, int(0.1 * len(t)))
        envelope[:attack_len] = np.linspace(0, 1, attack_len)
        envelope[attack_len:] = np.exp(-5 * np.linspace(0, 1, len(t) - attack_len))
        return envelope

# Integration with Flask
@app.route("/submit", methods=['POST'])
def submit_optimized():
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        # ... existing validation code ...
        
        # Initialize high-performance engine
        audio_engine = HighPerformanceAudioEngine()
        
        # Process image asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            timeline = loop.run_until_complete(
                audio_engine.process_image_parallel(BytesIO(base64.b64decode(image_data)))
            )
        finally:
            loop.close()
        
        if not timeline:
            return jsonify({"error": "No valid colors detected"}), 400
        
        # Generate audio in parallel
        audio = audio_engine.generate_audio_parallel(timeline, brush)
        
        # ... rest of the processing code ...
        
    except Exception as e:
        logger.error(f"Error in optimized submission: {str(e)}")
        return jsonify({"error": f"Failed to process submission: {str(e)}"}), 500
    finally:
        if connection:
            connection.close()
