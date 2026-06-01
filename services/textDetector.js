/**
 * Text Dark Pattern Detector (ELECTRA-Small)
 * Runs local text analysis on page content candidates.
 */

let textSession = null;
let tokenizer = null;

// Label mapping from config.json:
// 0: Neutral, 1: Activity, 2: Testimonial, 3: Confirmshaming, 4: Pressured, 5: Trick Q, 6: Limited Time, 7: Low Stock, 8: High Demand
const LABEL_MAP = {
  1: "Activity Message",
  2: "Testimonials",
  3: "Confirmshaming",
  4: "Pressured Selling",
  5: "Trick Questions",
  6: "Limited Time Message",
  7: "Low Stock Message",
  8: "High Demand Message"
};

/**
 * Initialize the WordPiece tokenizer
 */
async function initializeTokenizer() {
  if (tokenizer) return tokenizer;
  
  try {
    const url = chrome.runtime.getURL('models/text_detection/tokenizer.json');
    const response = await fetch(url);
    const config = await response.json();
    
    tokenizer = {
      vocab: config.model.vocab || {},
      cls_token_id: 101,
      sep_token_id: 102,
      pad_token_id: 0,
      unk_token_id: 100,
    };
    return tokenizer;
  } catch (error) {
    console.error("Failed to load tokenizer vocab:", error);
    throw error;
  }
}

/**
 * WordPiece Tokenize helper
 */
function wordpieceTokenize(word, vocab) {
  const tokens = [];
  let start = 0;
  
  while (start < word.length) {
    let end = word.length;
    let found = false;
    
    while (start < end) {
      const substr = start === 0 ? word.substring(start, end) : `##${word.substring(start, end)}`;
      if (vocab[substr] !== undefined) {
        tokens.push(substr);
        found = true;
        break;
      }
      end -= 1;
    }
    
    if (!found) {
      const char = start === 0 ? word[start] : `##${word[start]}`;
      tokens.push(vocab[char] !== undefined ? char : '[UNK]');
      start += 1;
    } else {
      start = end;
    }
  }
  return tokens;
}

/**
 * Encodes text into BERT/ELECTRA input features
 */
async function tokenizeText(text, maxLength = 128) {
  await initializeTokenizer();
  
  const words = text.toLowerCase().trim().split(/\s+/);
  const tokenList = ['[CLS]'];
  
  for (const word of words) {
    const subwords = wordpieceTokenize(word, tokenizer.vocab);
    tokenList.push(...subwords);
  }
  tokenList.push('[SEP]');
  
  // Convert tokens to IDs
  const inputIds = tokenList.slice(0, maxLength).map(token => {
    return tokenizer.vocab[token] !== undefined ? tokenizer.vocab[token] : tokenizer.unk_token_id;
  });
  
  const attentionMask = new Array(inputIds.length).fill(1);
  
  // Pad if necessary
  while (inputIds.length < maxLength) {
    inputIds.push(tokenizer.pad_token_id);
    attentionMask.push(0);
  }
  
  return { inputIds, attentionMask };
}

/**
 * Softmax implementation
 */
function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

/**
 * Initialize ELECTRA inference session
 */
export async function initializeTextModel() {
  if (textSession) return textSession;
  
  try {
    // Set WASM paths for ONNX runtime
    ort.env.wasm.wasmPaths = chrome.runtime.getURL('lib/');
    
    const url = chrome.runtime.getURL('models/text_detection/model.onnx');
    const modelResponse = await fetch(url);
    const modelBuffer = await modelResponse.arrayBuffer();
    
    const dataUrl = chrome.runtime.getURL('models/text_detection/model.onnx.data');
    const dataResponse = await fetch(dataUrl);
    const dataBuffer = await dataResponse.arrayBuffer();
    const dataUint8 = new Uint8Array(dataBuffer);
    
    textSession = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['wasm'],
      externalData: [
        {
          path: 'model.onnx.data',
          data: dataUint8
        }
      ]
    });
    console.log("Text model loaded successfully.");
    return textSession;
  } catch (error) {
    console.error("Error loading text model:", error);
    throw error;
  }
}

/**
 * Run text inference on candidate sentences
 * @param {string[]} candidates 
 * @returns {Promise<Array>} detections
 */
export async function scanTextCandidates(candidates) {
  if (!textSession) {
    await initializeTextModel();
  }
  
  const detections = [];
  
  for (const text of candidates) {
    try {
      if (!text || text.length < 5) continue;
      
      const { inputIds, attentionMask } = await tokenizeText(text, 128);
      
      // ELECTRA expects int64 tensors (BigInt64Array in JS)
      const inputIdsTensor = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [1, 128]);
      const attentionMaskTensor = new ort.Tensor('int64', BigInt64Array.from(attentionMask.map(BigInt)), [1, 128]);
      
      const feeds = {
        input_ids: inputIdsTensor,
        attention_mask: attentionMaskTensor
      };
      
      const outputs = await textSession.run(feeds);
      
      // Extract logits
      let logits = null;
      for (const name in outputs) {
        const outTensor = outputs[name];
        if (outTensor.dims && outTensor.dims[1] === 9) {
          logits = Array.from(outTensor.data);
          break;
        }
      }
      
      if (!logits) continue;
      
      const probs = softmax(logits);
      
      // Get highest index
      let maxIdx = 0;
      let maxProb = 0;
      for (let i = 0; i < probs.length; i++) {
        if (probs[i] > maxProb) {
          maxProb = probs[i];
          maxIdx = i;
        }
      }
      
      // Check if it's a dark pattern (non-neutral, indices 1 to 8)
      if (maxIdx !== 0 && maxProb > 0.45) {
        detections.push({
          patternType: LABEL_MAP[maxIdx] || "Unknown Text Pattern",
          source: "Text",
          confidence: Math.round(maxProb * 100),
          snippet: text
        });
      }
    } catch (err) {
      console.error("Error running text inference on string:", text, err);
    }
  }
  
  // Sort by confidence and return top 15 detections
  return detections.sort((a, b) => b.confidence - a.confidence).slice(0, 15);
}
