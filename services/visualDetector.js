/**
 * Visual Dark Pattern Detector (YOLO26n)
 * Performs visual object detection on tab screenshots.
 */

let visualSession = null;

// Class name mapping based on model metadata names:
// 0: attention_distraction, 1: countdown_timer, 2: default_choice, 3: disguised_ads, 4: intermediate_currency
const VISUAL_CLASSES = {
  0: "Attention Distraction",
  1: "Countdown Timer",
  2: "Default Choice",
  3: "Disguised Ads",
  4: "Intermediate Currency"
};

/**
 * Preprocesses HTML Canvas into an 832x832 CHW Float32 normalized array
 */
function preprocessImage(canvas) {
  const targetSize = 832;
  
  // Draw scaled image on temporary canvas
  const resizeCanvas = document.createElement('canvas');
  resizeCanvas.width = targetSize;
  resizeCanvas.height = targetSize;
  const ctx = resizeCanvas.getContext('2d');
  ctx.drawImage(canvas, 0, 0, targetSize, targetSize);
  
  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const data = imgData.data;
  
  const channelSize = targetSize * targetSize;
  const tensor = new Float32Array(3 * channelSize);
  
  // Fill tensor with CHW order, normalized to [0, 1]
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    tensor[idx] = data[i] / 255.0;                 // R
    tensor[channelSize + idx] = data[i + 1] / 255.0; // G
    tensor[2 * channelSize + idx] = data[i + 2] / 255.0; // B
  }
  
  return tensor;
}

/**
 * Rescale bounding boxes from 832x832 back to original screenshot size
 */
function rescaleBbox(x1, y1, x2, y2, scaleX, scaleY) {
  return {
    x1: Math.round(x1 * scaleX),
    y1: Math.round(y1 * scaleY),
    x2: Math.round(x2 * scaleX),
    y2: Math.round(y2 * scaleY)
  };
}

/**
 * Convert Base64 Screenshot URL to an HTML Image/Canvas element
 */
function dataUrlToCanvas(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = (e) => reject(new Error("Failed to load image from data URL."));
    img.src = dataUrl;
  });
}

/**
 * Initialize YOLOv6 inference session
 */
export async function initializeVisualModel() {
  if (visualSession) return visualSession;
  
  try {
    ort.env.wasm.wasmPaths = chrome.runtime.getURL('lib/');
    const url = chrome.runtime.getURL('models/visual_detection.onnx');
    
    visualSession = await ort.InferenceSession.create(url, {
      executionProviders: ['wasm']
    });
    console.log("Visual model loaded successfully.");
    return visualSession;
  } catch (error) {
    console.error("Error loading visual model:", error);
    throw error;
  }
}

/**
 * Run visual inference on tab screenshot
 * @param {string} screenshotDataUrl - Base64 PNG screenshot
 * @param {Object} viewportDims - {width, height} of tab
 * @returns {Promise<Array>} detections
 */
export async function scanScreenshot(screenshotDataUrl, viewportDims) {
  if (!screenshotDataUrl) return [];
  
  if (!visualSession) {
    await initializeVisualModel();
  }
  
  try {
    const canvas = await dataUrlToCanvas(screenshotDataUrl);
    const tensorData = preprocessImage(canvas);
    
    // Model expects shape [1, 3, 832, 832]
    const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, 832, 832]);
    
    const outputs = await visualSession.run({ images: inputTensor });
    
    // Model output: [1, 300, 6] where 6 represents [x1, y1, x2, y2, score, classId]
    const outputTensor = outputs[Object.keys(outputs)[0]];
    const data = outputTensor.data;
    
    const scaleX = viewportDims.width / 832;
    const scaleY = viewportDims.height / 832;
    
    const detections = [];
    
    // 300 bounding boxes
    for (let i = 0; i < 300; i++) {
      const offset = i * 6;
      const x1 = data[offset];
      const y1 = data[offset + 1];
      const x2 = data[offset + 2];
      const y2 = data[offset + 3];
      const score = data[offset + 4];
      const classId = data[offset + 5];
      
      // Filter out low scores and invalid coords
      if (score > 0.40) {
        const patternName = VISUAL_CLASSES[classId];
        if (patternName) {
          detections.push({
            patternType: patternName,
            source: "Visual",
            confidence: Math.round(score * 100),
            bbox: rescaleBbox(x1, y1, x2, y2, scaleX, scaleY)
          });
        }
      }
    }
    
    // Return sorted detections
    return detections.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.error("Error running visual model inference:", error);
    return [];
  }
}
