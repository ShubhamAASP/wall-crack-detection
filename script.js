// Global variables
let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let capturedImage = document.getElementById('capturedImage');
let processedCanvas = document.getElementById('processedCanvas');
let processedContext = processedCanvas.getContext('2d');
let stream = null;

// Buttons
const startCameraBtn = document.getElementById('startCamera');
const captureBtn = document.getElementById('capture');
const analyzeBtn = document.getElementById('analyze');
const resetBtn = document.getElementById('reset');

// Results
const resultsSection = document.getElementById('results');
const resultContent = document.getElementById('resultContent');
const statusSpan = document.getElementById('status');
const crackCountSpan = document.getElementById('crackCount');
const severitySpan = document.getElementById('severity');

// Start Camera
startCameraBtn.addEventListener('click', async () => {
    try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'environment' // Use back camera on mobile
            } 
        });
        
        video.srcObject = stream;
        video.style.display = 'block';
        capturedImage.style.display = 'none';
        
        startCameraBtn.disabled = true;
        captureBtn.disabled = false;
        resetBtn.disabled = false;
        
        statusSpan.textContent = 'Camera Active';
        statusSpan.style.color = '#00ff00';
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Unable to access camera. Please ensure you have granted camera permissions.');
        statusSpan.textContent = 'Camera Error';
        statusSpan.style.color = '#ff0000';
    }
});

// Capture Image
captureBtn.addEventListener('click', () => {
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to image and display
    capturedImage.src = canvas.toDataURL('image/png');
    capturedImage.style.display = 'block';
    video.style.display = 'none';
    
    // Stop video stream
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    captureBtn.disabled = true;
    analyzeBtn.disabled = false;
    
    statusSpan.textContent = 'Image Captured';
    statusSpan.style.color = '#ffff00';
});

// Analyze Image for Cracks
analyzeBtn.addEventListener('click', () => {
    statusSpan.textContent = 'Analyzing...';
    statusSpan.style.color = '#00ffff';
    
    // Show results section
    resultsSection.classList.add('show');
    
    // Set processed canvas size
    processedCanvas.width = canvas.width;
    processedCanvas.height = canvas.height;
    
    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply edge detection (Sobel filter simulation)
    const processedImageData = detectEdges(imageData);
    
    // Draw processed image
    processedContext.putImageData(processedImageData, 0, 0);
    
    // Analyze cracks (simplified analysis)
    const analysis = analyzeCracks(processedImageData);
    
    // Update results
    displayResults(analysis);
    
    analyzeBtn.disabled = true;
    statusSpan.textContent = 'Analysis Complete';
    statusSpan.style.color = '#00ff00';
});

// Edge Detection Function (Simplified Sobel Filter)
function detectEdges(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new ImageData(width, height);
    const outputData = output.data;
    
    // Convert to grayscale and apply edge detection
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            // Get surrounding pixels for edge detection
            const tl = ((y - 1) * width + (x - 1)) * 4;
            const tm = ((y - 1) * width + x) * 4;
            const tr = ((y - 1) * width + (x + 1)) * 4;
            const ml = (y * width + (x - 1)) * 4;
            const mr = (y * width + (x + 1)) * 4;
            const bl = ((y + 1) * width + (x - 1)) * 4;
            const bm = ((y + 1) * width + x) * 4;
            const br = ((y + 1) * width + (x + 1)) * 4;
            
            // Calculate gradients
            const gx = 
                -1 * data[tl] + 1 * data[tr] +
                -2 * data[ml] + 2 * data[mr] +
                -1 * data[bl] + 1 * data[br];
            
            const gy = 
                -1 * data[tl] - 2 * data[tm] - 1 * data[tr] +
                1 * data[bl] + 2 * data[bm] + 1 * data[br];
            
            // Calculate edge magnitude
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            
            // Threshold for edge detection
            const threshold = 50;
            const edgeValue = magnitude > threshold ? 255 : 0;
            
            // Highlight edges in red for cracks
            if (edgeValue > 0) {
                outputData[idx] = 255;     // Red
                outputData[idx + 1] = 0;   // Green
                outputData[idx + 2] = 0;   // Blue
                outputData[idx + 3] = 255; // Alpha
            } else {
                // Original image with transparency
                outputData[idx] = data[idx];
                outputData[idx + 1] = data[idx + 1];
                outputData[idx + 2] = data[idx + 2];
                outputData[idx + 3] = 200;
            }
        }
    }
    
    return output;
}

// Analyze Cracks Function
function analyzeCracks(imageData) {
    const data = imageData.data;
    let edgePixels = 0;
    let totalPixels = imageData.width * imageData.height;
    
    // Count edge pixels (red pixels in our case)
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 0) {
            edgePixels++;
        }
    }
    
    // Calculate crack percentage
    const crackPercentage = (edgePixels / totalPixels) * 100;
    
    // Determine severity
    let severity = 'None';
    let crackCount = 0;
    
    if (crackPercentage < 0.5) {
        severity = 'None/Minimal';
        crackCount = 0;
    } else if (crackPercentage < 2) {
        severity = 'Low';
        crackCount = Math.floor(crackPercentage * 5);
    } else if (crackPercentage < 5) {
        severity = 'Medium';
        crackCount = Math.floor(crackPercentage * 8);
    } else {
        severity = 'High';
        crackCount = Math.floor(crackPercentage * 10);
    }
    
    return {
        edgePixels: edgePixels,
        percentage: crackPercentage.toFixed(2),
        severity: severity,
        crackCount: crackCount
    };
}

// Display Results Function
function displayResults(analysis) {
    crackCountSpan.textContent = analysis.crackCount;
    severitySpan.textContent = analysis.severity;
    
    // Set severity color
    if (analysis.severity === 'None/Minimal') {
        severitySpan.style.color = '#00ff00';
    } else if (analysis.severity === 'Low') {
        severitySpan.style.color = '#ffff00';
    } else if (analysis.severity === 'Medium') {
        severitySpan.style.color = '#ffa500';
    } else {
        severitySpan.style.color = '#ff0000';
    }
    
    resultContent.innerHTML = `
        <div style="background: #f0f0f0; padding: 15px; border-radius: 10px; margin-top: 10px;">
            <p><strong>📊 Analysis Details:</strong></p>
            <ul style="list-style-type: none; padding: 10px 0;">
                <li>✓ Edge Pixels Detected: ${analysis.edgePixels.toLocaleString()}</li>
                <li>✓ Coverage Percentage: ${analysis.percentage}%</li>
                <li>✓ Estimated Cracks: ${analysis.crackCount}</li>
                <li>✓ Severity Level: <span style="font-weight: bold; color: ${
                    analysis.severity === 'High' ? '#ff0000' : 
                    analysis.severity === 'Medium' ? '#ffa500' : 
                    analysis.severity === 'Low' ? '#ffff00' : '#00ff00'
                }">${analysis.severity}</span></li>
            </ul>
            <p style="margin-top: 15px; padding: 10px; background: #fff; border-radius: 5px;">
                <strong>📝 Recommendation:</strong> ${
                    analysis.severity === 'High' ? 
                    'Immediate repair required. Structural integrity may be compromised.' :
                    analysis.severity === 'Medium' ? 
                    'Schedule maintenance soon. Monitor crack progression.' :
                    analysis.severity === 'Low' ? 
                    'Minor cracks detected. Regular monitoring recommended.' :
                    'Surface is in good condition. No immediate action required.'
                }
            </p>
        </div>
    `;
}

// Reset Function
resetBtn.addEventListener('click', () => {
    // Stop any active stream
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    // Reset UI
    video.style.display = 'none';
    capturedImage.style.display = 'none';
    resultsSection.classList.remove('show');
    
    // Reset buttons
    startCameraBtn.disabled = false;
    captureBtn.disabled = true;
    analyzeBtn.disabled = true;
    resetBtn.disabled = true;
    
    // Reset status
    statusSpan.textContent = 'Ready';
    statusSpan.style.color = '#ffffff';
    crackCountSpan.textContent = '-';
    severitySpan.textContent = '-';
    severitySpan.style.color = '#ffd700';
    
    // Clear canvases
    context.clearRect(0, 0, canvas.width, canvas.height);
    processedContext.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
});
