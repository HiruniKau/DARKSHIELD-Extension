/**
 * Interaction Dark Pattern Detector (BiLSTM + Attention)
 * Classifies sequence of interaction states on the page.
 */

let interactionSession = null;

const INTERACTION_LABELS = {
  0: "Neutral",
  1: "Nagging",
  2: "Roach Motel"
};

const FEATURE_ORDER = [
  'cancel_link_count',
  'hidden_cancel_ratio',
  'modal_count',
  'modal_reappear_rate',
  'urgency_score',
  'button_size_ratio',
  'form_field_count',
  'redirect_count',
  'countdown_timer',
  'confirmshame',
  'number_of_clicks_to_cancel',
  'button_enabled_after_seconds',
  'background_blocked_duration',
  'dom_mutations_per_minute',
];

const FEATURE_NORMALIZATION = {
  cancel_link_count: { min: 0, max: 20 },
  hidden_cancel_ratio: { min: 0, max: 1 },
  modal_count: { min: 0, max: 10 },
  modal_reappear_rate: { min: 0, max: 5 },
  urgency_score: { min: 0, max: 1 },
  button_size_ratio: { min: 0.1, max: 10 },
  form_field_count: { min: 0, max: 50 },
  redirect_count: { min: 0, max: 10 },
  countdown_timer: { min: 0, max: 1 },
  confirmshame: { min: 0, max: 1 },
  number_of_clicks_to_cancel: { min: 0, max: 20 },
  button_enabled_after_seconds: { min: 0, max: 300 },
  background_blocked_duration: { min: 0, max: 600 },
  dom_mutations_per_minute: { min: 0, max: 1000 },
};

/**
 * Normalizes a single feature value to [0, 1] based on training set stats
 */
function normalizeFeature(value, name) {
  const stats = FEATURE_NORMALIZATION[name];
  if (!stats) return Math.max(0, Math.min(1, value));
  
  const { min, max } = stats;
  if (max === min) return 0;
  
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized)); // Clamp to [0, 1]
}

/**
 * Softmax activation function
 */
function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

/**
 * Initialize BiLSTM inference session
 */
export async function initializeInteractionModel() {
  if (interactionSession) return interactionSession;
  
  try {
    ort.env.wasm.wasmPaths = chrome.runtime.getURL('lib/');
    
    const url = chrome.runtime.getURL('models/interaction_detection.onnx');
    
    interactionSession = await ort.InferenceSession.create(url, {
      executionProviders: ['wasm']
    });
    console.log("Interaction model loaded successfully.");
    return interactionSession;
  } catch (error) {
    console.error("Error loading interaction model:", error);
    throw error;
  }
}

/**
 * Run interaction inference on a sequence of feature snapshots
 * @param {Array<Object>} historySnapshots - Array of up to 10 feature objects
 * @returns {Promise<Object|null>} detection result or null
 */
export async function scanInteractionHistory(historySnapshots) {
  if (!interactionSession) {
    await initializeInteractionModel();
  }
  
  try {
    const rawSnapshots = historySnapshots || [];
    const sequenceLength = 10;
    const numFeatures = 14;
    
    // Create Float32Array for input tensor of shape [1, 10, 14]
    const tensorData = new Float32Array(1 * sequenceLength * numFeatures);
    
    // Fill the tensor: pad with zero vectors if we have fewer than 10 snapshots
    const paddingLength = Math.max(0, sequenceLength - rawSnapshots.length);
    
    // Pad first
    for (let t = 0; t < paddingLength; t++) {
      const stepOffset = t * numFeatures;
      for (let f = 0; f < numFeatures; f++) {
        tensorData[stepOffset + f] = 0.0;
      }
    }
    
    // Fill the rest with actual normalized snapshots
    for (let i = 0; i < Math.min(rawSnapshots.length, sequenceLength); i++) {
      const snapshot = rawSnapshots[i];
      const stepOffset = (paddingLength + i) * numFeatures;
      
      FEATURE_ORDER.forEach((featureName, fIdx) => {
        const val = snapshot[featureName] !== undefined ? snapshot[featureName] : 0.0;
        tensorData[stepOffset + fIdx] = normalizeFeature(val, featureName);
      });
    }
    
    const inputTensor = new ort.Tensor('float32', tensorData, [1, sequenceLength, numFeatures]);
    const outputs = await interactionSession.run({ input: inputTensor });
    
    // Get output logits
    const outputTensor = outputs[Object.keys(outputs)[0]];
    const logits = Array.from(outputTensor.data);
    const probs = softmax(logits);
    
    let maxIdx = 0;
    let maxProb = 0;
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > maxProb) {
        maxProb = probs[i];
        maxIdx = i;
      }
    }
    
    // Check if it's a dark pattern (indices 1: Nagging, 2: Roach Motel)
    if (maxIdx !== 0 && maxProb > 0.40) {
      return {
        patternType: INTERACTION_LABELS[maxIdx],
        source: "Interaction",
        confidence: Math.round(maxProb * 100)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error in interaction model inference:", error);
    return null;
  }
}
