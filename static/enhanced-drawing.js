// Enhanced Drawing Interface with Advanced Features
function integrateRealTimeAudio() {
    // Add real-time audio to existing drawing functions
    const originalDraw = window.draw;
    
    window.draw = function(e) {
        if (!drawing) return;
        
        // Call original draw function first
        originalDraw(e);
        
        // Enhanced drawing position tracking
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY;
        
        // Get pixel color at drawing position with better accuracy
        const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
        const [r, g, b, a] = imageData.data;
        
        if (a > 200) {  // Only play for non-transparent pixels
            // Enhanced audio with spatial positioning
            realTimeAudio.playColorNote(r, g, b, tool, x, canvas.width);
            
            // Advanced visual feedback
            createAdvancedSoundIndicator(x, y, r, g, b, tool);
            
            // Track drawing patterns
            trackDrawingPattern(x, y, r, g, b, tool);
        }
    };
    
    // Advanced visual feedback system
    function createAdvancedSoundIndicator(x, y, r, g, b, brushType) {
        const indicator = document.createElement('div');
        const frequency = realTimeAudio.getFrequencyFromColor(r, g, b);
        const color = `rgb(${r}, ${g}, ${b})`;
        
        // Dynamic size based on frequency and brush
        const baseSize = 15;
        const frequencySize = (frequency / 1000) * 25;
        const brushMultiplier = getBrushSizeMultiplier(brushType);
        const finalSize = baseSize + frequencySize * brushMultiplier;
        
        // Brush-specific visual effects
        const visualEffect = getBrushVisualEffect(brushType, color);
        
        indicator.style.cssText = `
            position: fixed;
            left: ${x + rect.left}px;
            top: ${y + rect.top}px;
            width: ${finalSize}px;
            height: ${finalSize}px;
            background: ${visualEffect};
            border-radius: ${getBrushBorderRadius(brushType)};
            pointer-events: none;
            animation: ${getBrushAnimation(brushType)} 0.8s ease-out;
            z-index: 1000;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 ${finalSize/2}px ${color}44;
        `;
        
        document.body.appendChild(indicator);
        
        // Enhanced cleanup with fade effect
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                indicator.style.opacity = '0';
                indicator.style.transform = 'translate(-50%, -50%) scale(2)';
                setTimeout(() => {
                    if (document.body.contains(indicator)) {
                        document.body.removeChild(indicator);
                    }
                }, 200);
            }
        }, 600);
    }
    
    function getBrushSizeMultiplier(brushType) {
        const multipliers = {
            'round': 1.0,
            'square': 1.2,
            'triangle': 0.8,
            'star': 1.5,
            'spray': 2.0,
            'cross': 1.1,
            'sawtooth': 1.3,
            'line': 0.6
        };
        return multipliers[brushType] || 1.0;
    }
    
    function getBrushVisualEffect(brushType, color) {
        const effects = {
            'round': `radial-gradient(circle, ${color}88 0%, ${color}44 40%, transparent 70%)`,
            'square': `linear-gradient(45deg, ${color}88 0%, ${color}44 50%, transparent 100%)`,
            'triangle': `conic-gradient(from 0deg, ${color}88 0%, ${color}44 120deg, transparent 120deg)`,
            'star': `radial-gradient(circle, ${color}88 0%, ${color}44 20%, transparent 40%, ${color}44 60%, transparent 80%)`,
            'spray': `radial-gradient(circle, ${color}88 0%, transparent 10%, ${color}44 20%, transparent 30%, ${color}44 40%, transparent 60%)`,
            'cross': `linear-gradient(90deg, ${color}88 0%, transparent 40%, ${color}88 60%, transparent 100%)`,
            'sawtooth': `linear-gradient(135deg, ${color}88 0%, transparent 25%, ${color}44 50%, transparent 75%)`,
            'line': `linear-gradient(0deg, ${color}88 0%, ${color}44 100%)`
        };
        return effects[brushType] || effects['round'];
    }
    
    function getBrushBorderRadius(brushType) {
        const radiuses = {
            'round': '50%',
            'square': '10%',
            'triangle': '0%',
            'star': '50%',
            'spray': '50%',
            'cross': '0%',
            'sawtooth': '0%',
            'line': '50%'
        };
        return radiuses[brushType] || '50%';
    }
    
    function getBrushAnimation(brushType) {
        const animations = {
            'round': 'soundPulse',
            'square': 'soundExpand',
            'triangle': 'soundRotate',
            'star': 'soundBurst',
            'spray': 'soundSpray',
            'cross': 'soundCross',
            'sawtooth': 'soundSaw',
            'line': 'soundLine'
        };
        return animations[brushType] || 'soundPulse';
    }
    
    // Drawing pattern tracking for analytics
    function trackDrawingPattern(x, y, r, g, b, brushType) {
        if (!window.drawingAnalytics) {
            window.drawingAnalytics = {
                totalStrokes: 0,
                colorUsage: new Map(),
                brushUsage: new Map(),
                positions: [],
                startTime: Date.now()
            };
        }
        
        const analytics = window.drawingAnalytics;
        analytics.totalStrokes++;
        
        // Track color usage
        const colorKey = `${r}_${g}_${b}`;
        analytics.colorUsage.set(colorKey, (analytics.colorUsage.get(colorKey) || 0) + 1);
        
        // Track brush usage
        analytics.brushUsage.set(brushType, (analytics.brushUsage.get(brushType) || 0) + 1);
        
        // Track positions (keep last 100)
        analytics.positions.push({ x, y, time: Date.now() });
        if (analytics.positions.length > 100) {
            analytics.positions.shift();
        }
    }
    
    // Add advanced CSS animations for all brush types
    const style = document.createElement('style');
    style.textContent = `
        @keyframes soundPulse {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }
        
        @keyframes soundExpand {
            0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.5) rotate(45deg); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(2.5) rotate(90deg); opacity: 0; }
        }
        
        @keyframes soundRotate {
            0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(2.5) rotate(360deg); opacity: 0; }
        }
        
        @keyframes soundBurst {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            25% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.9; }
            50% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.7; }
            75% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
            100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        
        @keyframes soundSpray {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
        
        @keyframes soundCross {
            0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.5) rotate(45deg); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(2) rotate(90deg); opacity: 0; }
        }
        
        @keyframes soundSaw {
            0% { transform: translate(-50%, -50%) scale(0) skew(0deg); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(3) skew(15deg); opacity: 0; }
        }
        
        @keyframes soundLine {
            0% { transform: translate(-50%, -50%) scale(0, 1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(3, 1); opacity: 0; }
        }
        
        .sound-indicator {
            position: absolute;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

// Enhanced color picker with advanced features
function enhanceColorPicker() {
    const colorPicker = document.getElementById('colorPicker');
    const colorButtons = document.querySelectorAll('#colorButtons button');
    
    if (colorPicker) {
        // Enhanced color picker with audio preview and visual feedback
        colorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            
            // Play enhanced preview note
            realTimeAudio.playColorNote(r, g, b, 'round', canvas.width / 2, canvas.width);
            
            // Show color info tooltip
            showColorInfo(r, g, b, e.target);
        });
        
        // Add hover preview
        colorPicker.addEventListener('mouseover', (e) => {
            const color = e.target.value;
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            
            // Play soft preview
            realTimeAudio.setMasterVolume(0.1);
            realTimeAudio.playColorNote(r, g, b, 'round', canvas.width / 2, canvas.width);
            realTimeAudio.setMasterVolume(0.3);
        });
    }
    
    // Enhanced color buttons with animations
    colorButtons.forEach((button, index) => {
        // Add audio preview with delay for each button
        button.addEventListener('click', () => {
            const color = button.style.backgroundColor;
            const rgb = color.match(/\d+/g);
            if (rgb) {
                const [r, g, b] = rgb.map(Number);
                
                // Animate button
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 100);
                
                // Play preview with spatial positioning based on button position
                const buttonRect = button.getBoundingClientRect();
                const x = buttonRect.left + buttonRect.width / 2;
                realTimeAudio.playColorNote(r, g, b, 'round', x, window.innerWidth);
                
                // Show color info
                showColorInfo(r, g, b, button);
            }
        });
        
        // Add hover effects
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '';
        });
    });
}

// Show color information tooltip
function showColorInfo(r, g, b, element) {
    // Remove existing tooltip
    const existingTooltip = document.getElementById('colorTooltip');
    if (existingTooltip) {
        document.body.removeChild(existingTooltip);
    }
    
    const frequency = realTimeAudio.getFrequencyFromColor(r, g, b);
    const note = getNoteFromFrequency(frequency);
    const color = `rgb(${r}, ${g}, ${b})`;
    
    const tooltip = document.createElement('div');
    tooltip.id = 'colorTooltip';
    tooltip.innerHTML = `
        <div style="background: white; padding: 8px; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-size: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="width: 20px; height: 20px; background: ${color}; border-radius: 4px;"></div>
                <span style="font-weight: 600;">${note}</span>
            </div>
            <div style="color: #666; font-size: 11px;">
                <div>RGB: ${r}, ${g}, ${b}</div>
                <div>Frequency: ${frequency.toFixed(1)} Hz</div>
            </div>
        </div>
    `;
    
    const rect = element.getBoundingClientRect();
    tooltip.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2 - 60}px;
        top: ${rect.bottom + 10}px;
        z-index: 10000;
    `;
    
    document.body.appendChild(tooltip);
    
    // Auto-remove after 2 seconds
    setTimeout(() => {
        if (document.body.contains(tooltip)) {
            document.body.removeChild(tooltip);
        }
    }, 2000);
}

function getNoteFromFrequency(frequency) {
    // Map frequency to musical note name
    const noteFrequencies = {
        261.63: 'C4', 293.66: 'D4', 329.63: 'E4', 349.23: 'F4',
        392.00: 'G4', 440.00: 'A4', 493.88: 'B4', 523.25: 'C5'
    };
    
    let closestNote = '';
    let minDiff = Infinity;
    
    for (const [freq, note] of Object.entries(noteFrequencies)) {
        const diff = Math.abs(frequency - parseFloat(freq));
        if (diff < minDiff) {
            minDiff = diff;
            closestNote = note;
        }
    }
    
    return closestNote;
}

// Enhanced brush selector with advanced features
function enhanceBrushSelector() {
    const toolSelect = document.getElementById('toolSelect');
    
    if (toolSelect) {
        toolSelect.addEventListener('change', (e) => {
            const brush = e.target.value;
            const currentColor = colorPicker.value;
            const r = parseInt(currentColor.substr(1, 2), 16);
            const g = parseInt(currentColor.substr(3, 2), 16);
            const b = parseInt(currentColor.substr(5, 2), 16);
            
            // Play brush-specific sound preview with enhanced effects
            realTimeAudio.playColorNote(r, g, b, brush, canvas.width / 2, canvas.width);
            
            // Show brush information
            showBrushInfo(brush, e.target);
            
            // Update canvas cursor based on brush
            updateCanvasCursor(brush);
        });
        
        // Add visual feedback for brush selection
        toolSelect.addEventListener('focus', () => {
            toolSelect.style.transform = 'scale(1.02)';
            toolSelect.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        });
        
        toolSelect.addEventListener('blur', () => {
            toolSelect.style.transform = 'scale(1)';
            toolSelect.style.boxShadow = '';
        });
    }
}

// Show brush information tooltip
function showBrushInfo(brushType, element) {
    // Remove existing tooltip
    const existingTooltip = document.getElementById('brushTooltip');
    if (existingTooltip) {
        document.body.removeChild(existingTooltip);
    }
    
    const brushInfo = {
        'round': { name: 'Round Brush', description: 'Smooth, classic sound with warm tone', character: '🎵' },
        'square': { name: 'Square Brush', description: 'Bright, digital sound with harmonics', character: '🔲' },
        'triangle': { name: 'Triangle Brush', description: 'Soft, mellow sound with gentle attack', character: '🔺' },
        'sawtooth': { name: 'Sawtooth Brush', description: 'Bright, edgy sound with rich overtones', character: '⚡' },
        'star': { name: 'Star Brush', description: 'Magical sound with sparkling harmonics', character: '⭐' },
        'spray': { name: 'Spray Brush', description: 'Textured sound with noise elements', character: '💨' },
        'cross': { name: 'Cross Brush', description: 'Complex sound with frequency modulation', character: '✚' },
        'line': { name: 'Line Brush', description: 'Clean, focused sound with minimal harmonics', character: '➖' }
    };
    
    const info = brushInfo[brushType] || brushInfo['round'];
    
    const tooltip = document.createElement('div');
    tooltip.id = 'brushTooltip';
    tooltip.innerHTML = `
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-size: 12px; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 20px;">${info.character}</span>
                <span style="font-weight: 600; font-size: 14px;">${info.name}</span>
            </div>
            <div style="color: #666; font-size: 11px; line-height: 1.4;">
                ${info.description}
            </div>
        </div>
    `;
    
    const rect = element.getBoundingClientRect();
    tooltip.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2 - 100}px;
        top: ${rect.bottom + 10}px;
        z-index: 10000;
    `;
    
    document.body.appendChild(tooltip);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (document.body.contains(tooltip)) {
            document.body.removeChild(tooltip);
        }
    }, 3000);
}

// Update canvas cursor based on brush type
function updateCanvasCursor(brushType) {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    const cursors = {
        'round': 'crosshair',
        'square': 'cell',
        'triangle': 'pointer',
        'sawtooth': 'crosshair',
        'star': 'grab',
        'spray': 'crosshair',
        'cross': 'crosshair',
        'line': 'crosshair'
    };
    
    canvas.style.cursor = cursors[brushType] || 'crosshair';
}

// Advanced submission process with enhanced UX
function enhanceSubmitProcess() {
    const originalSubmit = window.submitDrawing;
    
    window.submitDrawing = async function() {
        if (undoStack.length <= 1) {
            showNotification('Please draw something before submitting!', 'warning');
            return;
        }
        
        // Show enhanced progress indicator
        showEnhancedProgressIndicator();
        
        try {
            const dataURL = canvas.toDataURL("image/png");
            const brush = document.getElementById("toolSelect").value;
            
            // Add drawing analytics to submission
            const analytics = window.drawingAnalytics || {};
            const submissionData = {
                image: dataURL,
                brush: brush,
                analytics: {
                    totalStrokes: analytics.totalStrokes || 0,
                    colorCount: analytics.colorUsage ? analytics.colorUsage.size : 0,
                    dominantColor: getDominantColor(analytics.colorUsage),
                    drawingTime: analytics.startTime ? Date.now() - analytics.startTime : 0
                }
            };
            
            const res = await fetch("/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionData),
            });
            
            const data = await res.json();
            
            if (data.error) {
                handleError(data.error);
                return;
            }
            
            // Success - play the generated audio with celebration
            const player = document.getElementById("player");
            player.src = data.url + "?t=" + new Date().getTime();
            player.play();
            
            hideProgressIndicator();
            showCelebrationMessage();
            
            // Reset analytics for next drawing
            window.drawingAnalytics = null;
            
        } catch (error) {
            console.error("Error submitting drawing:", error);
            hideProgressIndicator();
            showNotification('Failed to generate audio. Please try again or check your drawing.', 'error');
        }
    };
}

function getDominantColor(colorUsage) {
    if (!colorUsage || colorUsage.size === 0) return null;
    
    let maxCount = 0;
    let dominantColor = null;
    
    for (const [color, count] of colorUsage) {
        if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
        }
    }
    
    return dominantColor;
}

function showEnhancedProgressIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'progressIndicator';
    indicator.innerHTML = `
        <div class="progress-modal">
            <div class="progress-content">
                <div class="enhanced-spinner"></div>
                <h3>Creating Your Symphony...</h3>
                <p>Analyzing colors and generating audio</p>
                <div class="progress-steps">
                    <div class="step active" id="step1">
                        <div class="step-icon">🎨</div>
                        <div class="step-text">Analyzing Colors</div>
                    </div>
                    <div class="step" id="step2">
                        <div class="step-icon">🎵</div>
                        <div class="step-text">Generating Audio</div>
                    </div>
                    <div class="step" id="step3">
                        <div class="step-icon">✨</div>
                        <div class="step-text">Finalizing</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(5px);
    `;
    
    document.body.appendChild(indicator);
    
    // Simulate progress steps
    setTimeout(() => {
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        if (step1) step1.classList.add('completed');
        if (step2) step2.classList.add('active');
    }, 1000);
    
    setTimeout(() => {
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');
        if (step2) step2.classList.add('completed');
        if (step3) step3.classList.add('active');
    }, 2000);
}

function showCelebrationMessage() {
    const celebration = document.createElement('div');
    celebration.innerHTML = `
        <div class="celebration-modal">
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <h3>Your Symphony is Ready!</h3>
                <p>Listen to your unique audio creation</p>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="celebration-btn">
                    Enjoy Your Music
                </button>
            </div>
        </div>
    `;
    
    celebration.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(celebration);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(celebration)) {
            celebration.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(celebration)) {
                    document.body.removeChild(celebration);
                }
            }, 300);
        }
    }, 5000);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">×</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

// Enhanced CSS for all components
const enhancedStyle = document.createElement('style');
enhancedStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .progress-modal {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 400px;
    }
    
    .enhanced-spinner {
        width: 60px;
        height: 60px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .progress-steps {
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
        position: relative;
    }
    
    .progress-steps::before {
        content: '';
        position: absolute;
        top: 20px;
        left: 30px;
        right: 30px;
        height: 2px;
        background: #e2e8f0;
        z-index: 0;
    }
    
    .step {
        flex: 1;
        text-align: center;
        position: relative;
        z-index: 1;
        opacity: 0.5;
        transition: all 0.3s ease;
    }
    
    .step.active {
        opacity: 1;
    }
    
    .step.completed {
        opacity: 1;
    }
    
    .step.completed .step-icon {
        background: #10b981;
        color: white;
    }
    
    .step.active .step-icon {
        background: #667eea;
        color: white;
        animation: pulse 2s infinite;
    }
    
    .step-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 8px;
        font-size: 16px;
        transition: all 0.3s ease;
    }
    
    .step-text {
        font-size: 11px;
        color: #666;
        font-weight: 500;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .celebration-modal {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 400px;
    }
    
    .celebration-icon {
        font-size: 60px;
        margin-bottom: 20px;
        animation: bounce 1s ease infinite;
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }
    
    .celebration-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 20px;
    }
    
    .celebration-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s ease;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(enhancedStyle);

// Initialize all enhancements when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        integrateRealTimeAudio();
        enhanceColorPicker();
        enhanceBrushSelector();
        enhanceSubmitProcess();
        
        console.log('Enhanced Drawing Interface initialized with all features');
    });
} else {
    integrateRealTimeAudio();
    enhanceColorPicker();
    enhanceBrushSelector();
    enhanceSubmitProcess();
    
    console.log('Enhanced Drawing Interface initialized with all features');
}

// Export functions for external use
window.SynestheticaEnhanced = {
    getDrawingAnalytics: () => window.drawingAnalytics,
    resetAnalytics: () => { window.drawingAnalytics = null; },
    showNotification: showNotification,
    updateCanvasCursor: updateCanvasCursor
};
