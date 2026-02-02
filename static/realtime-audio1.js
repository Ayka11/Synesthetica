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
        
        // Connect effects chain with Dry/Wet mix
        // Split master gain into two paths
        this.masterGain.disconnect();
        
        // Dry Path
        this.dryGain = this.audioContext.createGain();
        this.dryGain.gain.value = 0.8; // Mostly dry signal
        
        // Wet Path (Reverb)
        this.reverbInputGain = this.audioContext.createGain();
        this.reverbInputGain.gain.value = 0.2; // Lower initial reverb mix
        
        this.reverbOutputGain = this.audioContext.createGain();
        this.reverbOutputGain.gain.value = 1.0;

        // Connections
        this.masterGain.connect(this.compressor);
        
        // Compressor -> Dry
        // Scales and Rhythm
        this.currentScale = 'chromatic';
        this.bpm = 120;
        
        this.scales = {
            'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            'major': [0, 2, 4, 5, 7, 9, 11],
            'minor': [0, 2, 3, 5, 7, 8, 10],
            'pentatonic': [0, 2, 4, 7, 9],
            'blues': [0, 3, 5, 6, 7, 10],
            'dorian': [0, 2, 3, 5, 7, 9, 10],
            'phrygian': [0, 1, 3, 5, 7, 8, 10]
        };
        
        // Audio chain connections
        this.compressor.connect(this.dryGain);
        this.dryGain.connect(this.analyser);
        
        // Compressor -> Wet
        this.compressor.connect(this.reverbInputGain);
        this.reverbInputGain.connect(this.reverb);
        this.reverb.connect(this.reverbOutputGain);
        this.reverbOutputGain.connect(this.analyser);
        
        // Final Output
        this.analyser.connect(this.audioContext.destination);
        
        // Performance optimization
        this.noteHistory = new Map();
        this.lastPlayTime = 0;
        this.minNoteInterval = 50; // Minimum ms between notes
        
        // Spatial audio
        this.pannerNodes = new Map();
        
        // Instrument settings
        this.currentInstrument = 'sine';
        
        console.log("Real-time Audio Engine initialized with enhanced features");
    }
    setInstrument(instrument) {
        this.currentInstrument = instrument;
        console.log(`Instrument set to: ${instrument}`);
    }
    
    setScale(scale) {
        if (this.scales[scale]) {
            this.currentScale = scale;
            console.log(`Scale set to: ${scale}`);
        }
    }

    setBPM(bpm) {
        this.bpm = Math.max(40, Math.min(300, bpm));
        console.log(`BPM set to: ${this.bpm}`);
    }

    quantizeFrequency(frequency, scaleName) {
        if (scaleName === 'chromatic') return frequency;
        
        // Convert freq to MIDI note number
        // MIDI = 69 + 12 * log2(f / 440)
        const midiNote = 69 + 12 * Math.log2(frequency / 440);
        const roundedMidi = Math.round(midiNote);
        
        // Note class (0-11, where 0=C if we assume A=9... wait)
        // A=440 is MIDI 69. 69 % 12 = 9 (A).
        // C is 0 relative to C.
        // Let's normalize to C = 0.
        // 69 is A4. C4 is 60.
        
        const noteClass = roundedMidi % 12; // 0=C, 1=C#, etc... if we align MIDI standard
        
        const scaleIntervals = this.scales[scaleName];
        
        // Find nearest interval in scale
        let minDiff = Infinity;
        let bestNote = roundedMidi;
        
        // Check current octave, prev octave, next octave for best match
        // Simple scale snapping:
        // We need to find n such that (n % 12) is in scaleIntervals
        // and abs(n - roundedMidi) is minimized.
        
        for (let i = roundedMidi - 6; i <= roundedMidi + 6; i++) {
            const pc = i % 12;
            if (scaleIntervals.includes(pc)) {
                if (Math.abs(i - roundedMidi) < minDiff) {
                    minDiff = Math.abs(i - roundedMidi);
                    bestNote = i;
                }
            }
        }
        
        // Convert back to freq
        return 440 * Math.pow(2, (bestNote - 69) / 12);
    }
    
    createPianoWave() {
        const real = new Float32Array([0, 1.0, 0.4, 0.25, 0.15, 0.08, 0.04, 0.02]);
        const imag = new Float32Array(real.length).fill(0);
        return this.audioContext.createPeriodicWave(real, imag, {disableNormalization: true});
    }

    createGuitarWave() {
        const real = new Float32Array([0, 1.0, 0.6, 0.35, 0.22, 0.14, 0.09, 0.05]);
        const imag = new Float32Array(real.length).fill(0);
        return this.audioContext.createPeriodicWave(real, imag);
    }

    createStringsWave() {
        const real = new Float32Array([0, 0.8, 0.5, 0.3, 0.2, 0.12, 0.08, 0.05, 0.03]);
        const imag = new Float32Array(real.length).fill(0);
        return this.audioContext.createPeriodicWave(real, imag);
    }
    
    createReverb() {
        const convolver = this.audioContext.createConvolver();
        const length = this.audioContext.sampleRate * 1.5; // Reduced to 1.5s
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Smoother exponential decay noise with reduced amplitude
                // Using Math.random() * 0.1 instead of 2.0 to significantly reduce noise floor
                channelData[i] = (Math.random() * 2 - 1) * 0.05 * Math.pow(1 - i / length, 4);
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
        this.applyBrushCharacteristics(oscillator, filter, brushType, frequency, gainNode);
        
        // Enhanced envelope with sustain - adjusted for cleaner release
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Fast attack
        gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.1); // Decay
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8); // Long release to near silence
        
        // Connect audio graph
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + 0.85); // Slightly later stop to avoid click
        
        this.activeNotes.set(noteId, { oscillator, gainNode, panner, filter });
        this.pannerNodes.set(noteId, panner);
        
        // Visual feedback
        this.createVisualFeedback(x, frequency, r, g, b);
        
        // Track note for analytics
        this.trackNote(r, g, b, brushType, frequency);
    }
    
    applyBrushCharacteristics(oscillator, filter, brushType, frequency, gainNode) {
        // First apply instrument timbre (waveform)
        if (['piano', 'guitar', 'strings'].includes(this.currentInstrument)) {
            let wave;
            if (this.currentInstrument === 'piano') wave = this.createPianoWave();
            else if (this.currentInstrument === 'guitar') wave = this.createGuitarWave();
            else if (this.currentInstrument === 'strings') wave = this.createStringsWave();
            
            if (wave) oscillator.setPeriodicWave(wave);
        } else if (this.currentInstrument !== 'default') {
            // Use standard oscillator types if selected explicitly (sine, square, etc)
            // But allow 'default' to let brush type decide
             oscillator.type = this.currentInstrument;
        } else {
             // Fallback to brush default if 'default' or unknown
             oscillator.type = this.getWaveformFromBrush(brushType);
        }

        // Apply filter characteristics based on brush type (still relevant for texture)
        switch(brushType.toLowerCase()) {
            case 'grid':
                // Rhythmic pulsing (LFO) - Modulates Filter for Wah effect
                // AND Modulates Gain for gating effect
                
                // 1. Oscillator Base
                oscillator.type = 'sawtooth'; // Sawtooth cuts through better
                
                // 2. Filter Base
                filter.type = 'lowpass';
                filter.frequency.value = frequency;
                filter.Q.value = 5; // Resonant
                
                // 3. LFO Setup
                const lfo = this.audioContext.createOscillator();
                lfo.type = 'square';
                lfo.frequency.value = this.bpm / 60; // Beat frequency
                
                // 4. LFO -> Filter Frequency (Wah)
                const lfoFilterGain = this.audioContext.createGain();
                lfoFilterGain.gain.value = 1000; // Sweep 1000Hz
                lfo.connect(lfoFilterGain);
                lfoFilterGain.connect(filter.frequency);
                
                // 5. LFO -> Volume Gating (Tremolo)
                // We need to connect to gainNode.gain
                // gainNode.gain is already being automated by the envelope.
                // Modulating it might conflict or require offset.
                // Let's stick to Filter modulation (Wah) which is safer and distinct.
                
                lfo.start(this.audioContext.currentTime);
                lfo.stop(this.audioContext.currentTime + 0.85);
                break;

            case 'round':
                // oscillator.type = 'sine'; // Handled above
                filter.type = 'lowpass';
                filter.frequency.value = frequency * 2;
                filter.Q.value = 1;
                break;
                
            case 'square':
                // oscillator.type = 'square'; // Handled above
                filter.type = 'lowpass';
                filter.frequency.value = Math.min(frequency * 1.5, 2000);
                filter.Q.value = 5;
                break;
                
            case 'triangle':
                // oscillator.type = 'triangle'; // Handled above
                filter.type = 'bandpass';
                filter.frequency.value = frequency;
                filter.Q.value = 2;
                break;
                
            case 'sawtooth':
                // oscillator.type = 'sawtooth'; // Handled above
                filter.type = 'highpass';
                filter.frequency.value = frequency * 0.5;
                filter.Q.value = 3;
                break;
                
            case 'star':
                // oscillator.type = 'sine'; // Handled above
                // Add harmonics for star brush
                this.addHarmonics(oscillator, frequency, [1, 2, 3, 5]);
                filter.type = 'lowpass';
                filter.frequency.value = frequency * 3;
                filter.Q.value = 8;
                break;
                
            case 'spray':
                // oscillator.type = 'sawtooth'; // Handled above
                // Add noise component for spray
                this.addNoiseComponent(filter, frequency);
                filter.type = 'bandpass';
                filter.frequency.value = frequency * 1.2;
                filter.Q.value = 0.5;
                break;
                
            case 'cross':
                // oscillator.type = 'square'; // Handled above
                // Add frequency modulation for cross
                this.addFrequencyModulation(oscillator, frequency);
                filter.type = 'lowpass';
                filter.frequency.value = frequency * 0.8;
                filter.Q.value = 10;
                break;
                
            default:
                // oscillator.type = 'sine'; // Handled above
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
        // Add noise for spray brush texture - Reduced volume significantly
        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1; // Reduced from 1.0 to 0.1
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
        
        let freq = baseFreq * octaveMultiplier * (1 + vibratoAmount);
        
        // Apply Scale Quantization
        return this.quantizeFrequency(freq, this.currentScale);
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
        if (this.reverbInputGain) {
            this.reverbInputGain.gain.value = mix;
            this.dryGain.gain.value = 1.0 - (mix * 0.5); // Slight dip in dry when wet increases
        }
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

// Initialize enhanced real-time audio engine globally
window.realTimeAudio = new RealTimeAudioEngine();

// Add audio controls UI
addAudioControls();

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
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (window.realTimeAudio) window.realTimeAudio.setMasterVolume(parseFloat(e.target.value));
        });
    }
    
    const reverbSlider = document.getElementById('reverbSlider');
    if (reverbSlider) {
        reverbSlider.addEventListener('input', (e) => {
            if (window.realTimeAudio) window.realTimeAudio.setReverbMix(parseFloat(e.target.value));
        });
    }
    
    const visualizerToggle = document.getElementById('visualizerToggle');
    if (visualizerToggle) {
        visualizerToggle.addEventListener('change', (e) => {
            if (window.realTimeAudio) window.realTimeAudio.enableVisualizer(e.target.checked);
        });
    }
    
    const stopAudioBtn = document.getElementById('stopAllAudio');
    if (stopAudioBtn) {
        stopAudioBtn.addEventListener('click', () => {
            if (window.realTimeAudio) window.realTimeAudio.stopAllNotes();
        });
    }
    
    // Update stats periodically
    setInterval(() => {
        if (!window.realTimeAudio) return;
        
        const stats = window.realTimeAudio.getAnalytics();
        const metrics = window.realTimeAudio.getPerformanceMetrics();
        
        const statsDiv = document.getElementById('audioStats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div>🎹 Notes Played: ${stats.totalNotes}</div>
                <div>🎨 Colors Used: ${stats.uniqueColors}</div>
                <div>🔊 Active Notes: ${metrics.activeNotes}</div>
            `;
        }
    }, 1000);
}

// Don't need integration loader anymore as we use window.draw directly from index.html

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
