/**
 * DarkShield Popup Controller (popup.js)
 * Coordinates local scanning, orchestrates model runners, and renders the UI dashboard.
 */

import { initializeTextModel, scanTextCandidates } from './services/textDetector.js';
import { initializeVisualModel, scanScreenshot } from './services/visualDetector.js';
import { initializeInteractionModel, scanInteractionHistory } from './services/interactionDetector.js';

// DOM elements
const scanBtn = document.getElementById('scan-btn');
const btnText = scanBtn.querySelector('.btn-text');
const spinner = scanBtn.querySelector('.spinner');
const statusMessage = document.getElementById('status-message');
const targetUrlEl = document.getElementById('target-url');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const stepText = document.getElementById('step-text');
const resultsContainer = document.getElementById('results-container');
const riskCard = document.getElementById('risk-card');
const riskBadge = document.getElementById('risk-badge');
const detectionCountEl = document.getElementById('detection-count');
const riskMeterFill = document.getElementById('risk-meter-fill');
const tableBody = document.getElementById('results-table-body');
const screenshotCanvas = document.getElementById('screenshot-canvas');
const previewPlaceholder = document.getElementById('preview-placeholder');

let activeTabId = null;
let activeTabUrl = "";
let modelsWarmedUp = false;

// Initialize on popup opening
document.addEventListener('DOMContentLoaded', async () => {
  // Query active tab URL and ID
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs && tabs.length > 0) {
      const tab = tabs[0];
      activeTabId = tab.id;
      activeTabUrl = tab.url;
      
      // Clean and display URL
      try {
        const parsed = new URL(tab.url);
        targetUrlEl.textContent = parsed.hostname;
      } catch (_) {
        targetUrlEl.textContent = tab.url || "Unknown Page";
      }

      // Check if restricted page
      if (isRestrictedUrl(tab.url)) {
        scanBtn.disabled = true;
        statusMessage.textContent = "Scanning restricted on browser pages.";
        return;
      }

      // Warm up AI models
      await warmUpModels();
    }
  });

  // Attach button action
  scanBtn.addEventListener('click', runFullScan);
});

/**
 * Pre-load model binaries and set up ONNX sessions
 */
async function warmUpModels() {
  try {
    setStatusText("Warming up local AI models...");
    scanBtn.disabled = true;
    
    await Promise.all([
      initializeTextModel(),
      initializeVisualModel(),
      initializeInteractionModel()
    ]);
    
    modelsWarmedUp = true;
    scanBtn.disabled = false;
    setStatusText("Models loaded. Ready to scan.");
  } catch (error) {
    console.error("Error pre-loading models:", error);
    setStatusText("Ready to scan (models will load on demand).");
    scanBtn.disabled = false;
  }
}

/**
 * Run all three analysis pipelines
 */
async function runFullScan() {
  if (!activeTabId) return;

  // UI loading state
  setScanButtonLoading(true);
  progressContainer.classList.remove('hidden');
  resultsContainer.classList.add('hidden');
  updateProgress(10, "Accessing webpage DOM...");

  try {
    // 1. Get Text Candidates from Content Script
    updateProgress(20, "Extracting page text candidates...");
    const textRes = await sendMessageToTab(activeTabId, { type: "GET_TEXT_CANDIDATES" })
      .catch(e => ({ success: false, error: e.message }));
    const textCandidates = textRes?.success ? textRes.data : [];

    // 2. Get Viewport Dimensions from Content Script
    const viewportDims = await sendMessageToTab(activeTabId, { type: "GET_VIEWPORT_DIMENSIONS" })
      .catch(() => ({ width: 1024, height: 768 }));

    // 3. Get Interaction History Sequence from Content Script
    updateProgress(35, "Retrieving user interaction history...");
    const interactRes = await sendMessageToTab(activeTabId, { type: "GET_INTERACTION_FEATURES" })
      .catch(e => ({ success: false, error: e.message }));
    const interactionHistory = interactRes?.success ? interactRes.data : [];

    // 4. Capture page screenshot via background script
    updateProgress(50, "Capturing webpage screenshot...");
    const captureRes = await chrome.runtime.sendMessage({ action: "captureVisibleTab" })
      .catch(e => ({ success: false, error: e.message }));
    const screenshotDataUrl = captureRes?.success ? captureRes.dataUrl : null;

    // 5. Run local AI models
    updateProgress(70, "Running dark pattern detection AI...");
    
    // Run inferences in parallel
    const [textDetections, visualDetections, interactionDetection] = await Promise.all([
      scanTextCandidates(textCandidates),
      scanScreenshot(screenshotDataUrl, viewportDims),
      scanInteractionHistory(interactionHistory)
    ]);

    // 6. Aggregate results
    updateProgress(90, "Assembling report...");
    const allDetections = [...textDetections, ...visualDetections];
    if (interactionDetection) {
      allDetections.push(interactionDetection);
    }

    // Render results
    renderDashboard(allDetections, screenshotDataUrl, viewportDims);

    updateProgress(100, "Scan completed.");
    setTimeout(() => {
      progressContainer.classList.add('hidden');
      setScanButtonLoading(false);
    }, 600);

  } catch (error) {
    console.error("Scan pipeline failed:", error);
    setStatusText(`Scan failed: ${error.message}`);
    setScanButtonLoading(false);
    progressContainer.classList.add('hidden');
  }
}

/**
 * Render the final dashboard view
 */
function renderDashboard(detections, screenshotDataUrl, viewportDims) {
  // Clear table
  tableBody.innerHTML = "";
  
  const count = detections.length;
  detectionCountEl.textContent = `${count} Detection${count === 1 ? '' : 's'}`;

  // Determine risk category
  let riskLevel = "LOW";
  let badgeClass = "badge-low";
  let fillClass = "fill-low";

  if (count >= 6) {
    riskLevel = "HIGH";
    badgeClass = "badge-high";
    fillClass = "fill-high";
  } else if (count >= 3) {
    riskLevel = "MEDIUM";
    badgeClass = "badge-med";
    fillClass = "fill-med";
  }

  // Update badge & risk meter
  riskBadge.textContent = riskLevel;
  riskBadge.className = `risk-badge ${badgeClass}`;
  
  riskMeterFill.className = `risk-meter-fill ${fillClass}`;

  // Populate results table
  if (count === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="3" style="text-align: center; color: var(--text-muted); padding: 20px;">No dark patterns detected on this website.</td>`;
    tableBody.appendChild(emptyRow);
  } else {
    detections.forEach(det => {
      const row = document.createElement('tr');
      
      const sourceClass = `source-cell source-${det.source.toLowerCase()}`;
      
      // Determine score color
      let scoreClass = "conf-low";
      if (det.confidence >= 80) scoreClass = "conf-high";
      else if (det.confidence >= 60) scoreClass = "conf-med";

      row.innerHTML = `
        <td class="pattern-cell">${det.patternType}</td>
        <td><span class="${sourceClass}">${det.source}</span></td>
        <td class="conf-cell ${scoreClass}">${det.confidence}%</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Handle visual bboxes drawing on preview canvas
  const visualDetections = detections.filter(d => d.source === "Visual");
  if (visualDetections.length > 0 && screenshotDataUrl) {
    drawVisualBboxes(screenshotDataUrl, visualDetections, viewportDims);
  } else {
    screenshotCanvas.style.display = 'none';
    previewPlaceholder.classList.remove('hidden');
  }

  // Display results section
  resultsContainer.classList.remove('hidden');
  setStatusText(`Scanned. Found ${count} pattern${count === 1 ? '' : 's'}.`);
}

/**
 * Draw detected YOLO bounding boxes onto screenshot preview thumbnail
 */
function drawVisualBboxes(screenshotDataUrl, visualDetections, viewportDims) {
  const ctx = screenshotCanvas.getContext('2d');
  const img = new Image();
  
  img.onload = () => {
    const containerWidth = screenshotCanvas.parentElement.clientWidth;
    const scale = containerWidth / img.width;
    
    screenshotCanvas.width = containerWidth;
    screenshotCanvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, screenshotCanvas.width, screenshotCanvas.height);
    
    // Scale coords
    const canvasScaleX = screenshotCanvas.width / viewportDims.width;
    const canvasScaleY = screenshotCanvas.height / viewportDims.height;
    
    visualDetections.forEach(det => {
      const bbox = det.bbox;
      const x = bbox.x1 * canvasScaleX;
      const y = bbox.y1 * canvasScaleY;
      const w = (bbox.x2 - bbox.x1) * canvasScaleX;
      const h = (bbox.y2 - bbox.y1) * canvasScaleY;
      
      // Box outline
      ctx.strokeStyle = '#ef233c'; // premium red
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      
      // Translucent box fill
      ctx.fillStyle = 'rgba(239, 35, 60, 0.12)';
      ctx.fillRect(x, y, w, h);
      
      // Label tag
      ctx.fillStyle = '#ef233c';
      ctx.font = 'bold 9px "Outfit", sans-serif';
      const labelText = `${det.patternType} (${det.confidence}%)`;
      const textWidth = ctx.measureText(labelText).width;
      
      const tagY = y - 13 > 0 ? y - 13 : 0;
      ctx.fillRect(x, tagY, textWidth + 8, 13);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x + 4, tagY + 10);
    });
    
    previewPlaceholder.classList.add('hidden');
    screenshotCanvas.style.display = 'block';
  };
  
  img.src = screenshotDataUrl;
}

/**
 * Helper: send message to content script of active tab
 */
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Helper: check if URL is a browser restricted page
 */
function isRestrictedUrl(url) {
  if (!url) return true;
  return url.startsWith('chrome://') || 
         url.startsWith('chrome-extension://') || 
         url.startsWith('about:') || 
         url.startsWith('data:');
}

/**
 * Helper: update scan status text message
 */
function setStatusText(text) {
  statusMessage.textContent = text;
}

/**
 * Helper: update progress bar level & text step
 */
function updateProgress(percent, label) {
  progressFill.style.width = `${percent}%`;
  stepText.textContent = label;
}

/**
 * Helper: toggle loading visual state on scan button
 */
function setScanButtonLoading(isLoading) {
  if (isLoading) {
    scanBtn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = "Scanning...";
  } else {
    scanBtn.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = "Scan Website";
  }
}
