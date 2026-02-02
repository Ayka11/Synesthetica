// Enhanced Real-time Audio Feedback System
class RealTimeAudioEngine {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.activeNotes = new Map();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.3;
        
        // Enhanced features
        this.reverb = this.createReverb();
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.analyser = this.audioContext.createAnalyser();
        this.visualizerEnabled = false;
        
        // Connect effects chain
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.reverb);
        this.reverb.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        // Performance optimization
        this.noteHistory = new Map();
        this.lastPlayTime = 0;
        this.minNoteInterval = 50; // Minimum ms between notes
        
        // Spatial audio
        this.pannerNodes = new Map();
        
        logger.info("Real-time Audio Engine initialized with enhanced features");
    }
    
    createReverb() {
        const convolver = this.audioContext.createConvolver();
        const length = this.audioContext.sampleRate * 2; // 2 seconds of reverb
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        convolver.buffer = impulse;
        return convolver;
    }
    
    // Enhanced play function with spatial audio and effects
    playColorNote(r, g, b, brushType = 'round', x = 0, canvasWidth = 1000) {
        const now = this.audioContext.currentTime;
        
        // Rate limiting to prevent audio overload
        if (now - this.lastPlayTime < this.minNoteInterval / 1000) {
            return;
        }
        this.lastPlayTime = now;
        
        const frequency = this.getFrequencyFromColor(r, g, b);
        const noteId = `${r}_${g}_${b}_${brushType}`;
        
        // Stop existing note for this color
        if (this.activeNotes.has(noteId)) {
            this.stopNote(noteId);
        }

        // Create enhanced audio nodes
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panner = this.audioContext.createStereoPanner();
        const filter = this.audioContext.createBiquadFilter();
        
        // Spatial positioning based on canvas position
        const panValue = (x / canvasWidth) * 2 - 1; // -1 (left) to 1 (right)
        panner.pan.value = panValue;
        
        // Apply brush-specific waveform and filtering
        this.applyBrushCharacteristics(oscillator, filter, brushType, frequency);
        
        // Enhanced envelope with sustain
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Fast attack
        gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.1); // Decay
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8); // Long release
        
        // Connect audio graph
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + 0.8);
        
        this.activeNotes.set(noteId, { oscillator, gainNode, panner, filter });
        this.pannerNodes.set(noteId, panner);
        
        // Visual feedback
        this.createVisualFeedback(x, frequency, r, g, b);
        
        // Track note for analytics
        this.trackNote(r, g, b, brushType, frequency);
    }
    
    applyBrushCharacteristics(oscillator, filter, brushType, frequency) {
        switch(brushType.toLowerCase()) {
            case 'round':
                oscillator.type = 'sine';
                filter.type = 'lowpass';
                filter.frequency.value = frequency * 2;
                filter.Q.value = 1;
                break;
                
            case 'square':
                oscillator.type = 'square';
                filter.type = 'lowpass';
                filter.frequency.value = Math.min(frequency * 1.5, 2000);
                filter.Q.value = 5;
                break;
                
            case 'triangle':
                oscillator.type = 'triangle';
                filter.type = 'bandpass';
                filter.frequency.value = frequency;
                filter.Q.value = 2;
                break;
                
            case 'sawtooth':
                oscillator.type = 'sawtooth';
                filter.type = 'highpass';
                filter.frequency.value = frequency * 0.5;
                filter.Q.value = 3;
                break;
                
            case 'star':
                oscillator.type = 'sine';
                // Add harmonics for star brush
                this.addHarmonics(oscillator, frequency, [1, 2, 3, 5]);
                filter.type = 'lowpass';
                filter.frequency.value = frequency * 3;
                filter.Q.value = 8;
                break;
                
            case 'spray':
                oscillator.type = 'sawtooth';
                // Add noise component for spray
                this.addNoiseComponent(filter, frequency);
                filter.type = 'bandpass';
                filter.frequency.value = frequency * 1.2;
                filter.Q.value = 0.5;
                break;
                
            case 'cross':
                oscillator.type = 'square';
                // Add frequency modulation for cross
                this.addFrequencyModulation(oscillator, frequency);
                filter.type = 'lowpass';
                filter.frequency.value = frequency * 0.8;
                filter.Q.value = 10;
                break;
                
            default:
                oscillator.type = 'sine';
                filter.type = 'lowpass';
                filter.frequency.value = frequency * 2;
                filter.Q.value = 1;
        }
    }
    
    addHarmonics(oscillator, baseFreq, harmonics) {
        // Create additional oscillators for harmonics
        harmonics.forEach((multiplier, index) => {
            const harmonic = this.audioContext.createOscillator();
            harmonic.frequency.value = baseFreq * multiplier;
            harmonic.type = 'sine';
            // Harmonics would be mixed in a real implementation
        });
    }
    
    addNoiseComponent(filter, frequency) {
        // Add noise for spray brush texture
        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = noiseBuffer;
        // Noise would be mixed with the main signal
    }
    
    addFrequencyModulation(oscillator, baseFreq) {
        // Add FM synthesis for cross brush
        const modulator = this.audioContext.createOscillator();
        const modGain = this.audioContext.createGain();
        
        modulator.frequency.value = baseFreq * 0.1; // Low frequency modulation
        modGain.gain.value = baseFreq * 0.01; // Modulation depth
        
        // Connect modulation (simplified for this example)
    }

    getFrequencyFromColor(r, g, b) {
        // Enhanced color-to-frequency mapping with better musicality
        const hue = this.rgbToHue(r, g, b);
        const saturation = this.getSaturation(r, g, b);
        const brightness = (r + g + b) / 3;
        
        // Map hue to musical scale (pentatonic for more pleasant sounds)
        const pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C, D, E, G, A, C
        const noteIndex = Math.floor((hue / 360) * pentatonicScale.length);
        const baseFreq = pentatonicScale[noteIndex];
        
        // Adjust octave based on brightness (3 octaves)
        const octaveMultiplier = Math.pow(2, Math.floor(brightness / 85));
        
        // Add subtle vibrato based on saturation
        const vibratoAmount = saturation / 255 * 0.02; // Up to 2% vibrato
        
        return baseFreq * octaveMultiplier * (1 + vibratoAmount);
    }
    
    getSaturation(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return max === 0 ? 0 : (max - min) / max * 255;
    }
    
    createVisualFeedback(x, frequency, r, g, b) {
        // Create visual pulse effect at drawing position
        const canvas = document.getElementById('canvas');
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const indicator = document.createElement('div');
        
        // Color-based visual feedback
        const color = `rgb(${r}, ${g}, ${b})`;
        const size = 20 + (frequency / 1000) * 30; // Size based on frequency
        
        indicator.style.cssText = `
            position: fixed;
            left: ${rect.left + x}px;
            top: ${rect.top + rect.height / 2}px;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, ${color}88 0%, ${color}44 50%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            animation: soundPulse 0.6s ease-out;
            z-index: 1000;
            transform: translate(-50%, -50%);
        `;
        
        document.body.appendChild(indicator);
        
        // Remove after animation
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                document.body.removeChild(indicator);
            }
        }, 600);
    }
    
    trackNote(r, g, b, brushType, frequency) {
        // Track note usage for analytics and optimization
        const noteKey = `${r}_${g}_${b}`;
        const now = Date.now();
        
        if (!this.noteHistory.has(noteKey)) {
            this.noteHistory.set(noteKey, {
                count: 0,
                lastPlayed: 0,
                frequency: frequency,
                brushType: brushType
            });
        }
        
        const note = this.noteHistory.get(noteKey);
        note.count++;
        note.lastPlayed = now;
        
        // Clean up old notes (older than 5 minutes)
        if (now - note.lastPlayed > 300000) {
            this.noteHistory.delete(noteKey);
        }
    }
    
    // Enhanced controls
    setMasterVolume(volume) {
        this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
    
    setReverbMix(mix) {
        // Adjust reverb wet/dry mix (0 = dry, 1 = wet)
        this.reverbGain = this.reverbGain || this.audioContext.createGain();
        this.reverbGain.gain.value = mix;
    }
    
    enableVisualizer(enabled) {
        this.visualizerEnabled = enabled;
        if (enabled) {
            this.startVisualizer();
        }
    }
    
    startVisualizer() {
        if (!this.visualizerEnabled) return;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'audioVisualizer';
        canvas.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 200px;
            height: 60px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 8px;
            z-index: 1000;
        `;
        
        document.body.appendChild(canvas);
        
        const canvasCtx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!this.visualizerEnabled) return;
            
            requestAnimationFrame(draw);
            this.analyser.getByteTimeDomainData(dataArray);
            
            canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(102, 126, 234)';
            canvasCtx.beginPath();
            
            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };
        
        draw();
    }
    
    getAnalytics() {
        // Return usage analytics
        const totalNotes = Array.from(this.noteHistory.values()).reduce((sum, note) => sum + note.count, 0);
        const uniqueColors = this.noteHistory.size;
        const mostUsedColor = this.getMostUsedColor();
        
        return {
            totalNotes,
            uniqueColors,
            mostUsedColor,
            activeNotes: this.activeNotes.size
        };
    }
    
    getMostUsedColor() {
        let mostUsed = null;
        let maxCount = 0;
        
        for (const [color, note] of this.noteHistory) {
            if (note.count > maxCount) {
                maxCount = note.count;
                mostUsed = color;
            }
        }
        
        return mostUsed;
    }

    getWaveformFromBrush(brushType) {
        const waveforms = {
            'round': 'sine',
            'square': 'square',
            'triangle': 'triangle',
            'sawtooth': 'sawtooth',
            'star': 'sine', // Complex modulation would be added
            'spray': 'sawtooth',
            'cross': 'square',
            'line': 'sine'
        };
        return waveforms[brushType] || 'sine';
    }

    rgbToHue(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        let hue = 0;
        if (delta !== 0) {
            if (max === r) hue = ((g - b) / delta) % 6;
            else if (max === g) hue = (b - r) / delta + 2;
            else hue = (r - g) / delta + 4;
        }
        
        return hue * 60;
    }

    stopNote(noteId) {
        const note = this.activeNotes.get(noteId);
        if (note) {
            try {
                note.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                note.oscillator.stop(this.audioContext.currentTime + 0.1);
            } catch (e) {
                // Oscillator might have already stopped
            }
            this.activeNotes.delete(noteId);
            this.pannerNodes.delete(noteId);
        }
    }
    
    // Emergency stop all notes
    stopAllNotes() {
        for (const [noteId, note] of this.activeNotes) {
            try {
                note.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                note.oscillator.stop(this.audioContext.currentTime + 0.05);
            } catch (e) {
                // Ignore errors
            }
        }
        this.activeNotes.clear();
        this.pannerNodes.clear();
    }
    
    // Performance monitoring
    getPerformanceMetrics() {
        return {
            activeNotes: this.activeNotes.size,
            noteHistorySize: this.noteHistory.size,
            audioContextState: this.audioContext.state,
            sampleRate: this.audioContext.sampleRate,
            currentTime: this.audioContext.currentTime
        };
    }
}

// Initialize enhanced real-time audio engine
const realTimeAudio = new RealTimeAudioEngine();

// Integration with drawing interface
function integrateRealTimeAudioWithDrawing() {
    // Enhanced drawing function with real-time audio
    const originalDraw = window.draw;
    
    window.draw = function(e) {
        if (!drawing) return;
        
        // Call original draw function first
        originalDraw(e);
        
        // Get drawing position and color
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY;
        
        // Get current color from drawing context
        const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
        const [r, g, b, a] = imageData.data;
        
        // Play sound with spatial positioning
        if (a > 200) {  // Only for non-transparent pixels
            realTimeAudio.playColorNote(r, g, b, tool, x, canvas.width);
        }
    };
    
    // Enhanced color picker with audio preview
    const colorPicker = document.getElementById('colorPicker');
    const colorButtons = document.querySelectorAll('#colorButtons button');
    
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            
            // Play preview note at center of canvas
            realTimeAudio.playColorNote(r, g, b, 'round', canvas.width / 2, canvas.width);
        });
    }
    
    // Add audio preview to color buttons
    colorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const color = button.style.backgroundColor;
            const rgb = color.match(/\d+/g);
            if (rgb) {
                const [r, g, b] = rgb.map(Number);
                realTimeAudio.playColorNote(r, g, b, 'round', canvas.width / 2, canvas.width);
            }
        });
    });
    
    // Enhanced brush selector with audio preview
    const toolSelect = document.getElementById('toolSelect');
    if (toolSelect) {
        toolSelect.addEventListener('change', (e) => {
            const brush = e.target.value;
            const currentColor = colorPicker.value;
            const r = parseInt(currentColor.substr(1, 2), 16);
            const g = parseInt(currentColor.substr(3, 2), 16);
            const b = parseInt(currentColor.substr(5, 2), 16);
            
            // Play brush-specific sound preview
            realTimeAudio.playColorNote(r, g, b, brush, canvas.width / 2, canvas.width);
        });
    }
    
    // Add audio controls UI
    addAudioControls();
    
    console.log('Enhanced real-time audio integrated with drawing interface');
}

function addAudioControls() {
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'audioControls';
    controlsContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        padding: 15px;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 200px;
    `;
    
    controlsContainer.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: 600;">🎵 Audio Controls</h4>
        
        <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; color: #666; font-size: 12px;">Volume</label>
            <input type="range" id="volumeSlider" min="0" max="1" step="0.1" value="0.3" 
                   style="width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px;">
        </div>
        
        <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; color: #666; font-size: 12px;">Reverb</label>
            <input type="range" id="reverbSlider" min="0" max="1" step="0.1" value="0.2" 
                   style="width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px;">
        </div>
        
        <div style="margin-bottom: 10px;">
            <label style="display: flex; align-items: center; gap: 5px; color: #666; font-size: 12px;">
                <input type="checkbox" id="visualizerToggle" style="margin: 0;">
                <span>Show Visualizer</span>
            </label>
        </div>
        
        <button id="stopAllAudio" style="
            width: 100%;
            padding: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        ">🔇 Stop All Audio</button>
        
        <div id="audioStats" style="margin-top: 10px; font-size: 11px; color: #666;"></div>
    `;
    
    document.body.appendChild(controlsContainer);
    
    // Add event listeners
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
        realTimeAudio.setMasterVolume(parseFloat(e.target.value));
    });
    
    document.getElementById('reverbSlider').addEventListener('input', (e) => {
        realTimeAudio.setReverbMix(parseFloat(e.target.value));
    });
    
    document.getElementById('visualizerToggle').addEventListener('change', (e) => {
        realTimeAudio.enableVisualizer(e.target.checked);
    });
    
    document.getElementById('stopAllAudio').addEventListener('click', () => {
        realTimeAudio.stopAllNotes();
    });
    
    // Update stats periodically
    setInterval(() => {
        const stats = realTimeAudio.getAnalytics();
        const metrics = realTimeAudio.getPerformanceMetrics();
        
        document.getElementById('audioStats').innerHTML = `
            <div>🎹 Notes Played: ${stats.totalNotes}</div>
            <div>🎨 Colors Used: ${stats.uniqueColors}</div>
            <div>🔊 Active Notes: ${metrics.activeNotes}</div>
        `;
    }, 1000);
}

// Initialize integration when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', integrateRealTimeAudioWithDrawing);
} else {
    integrateRealTimeAudioWithDrawing();
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes soundPulse {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
        }
    }
    
    #audioControls input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        cursor: pointer;
    }
    
    #audioControls input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        cursor: pointer;
        border: none;
    }
    
    #audioControls button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
`;
document.head.appendChild(style);
