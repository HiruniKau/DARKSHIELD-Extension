# 🛡️ DarkShield Extension - Research Project

### A Multimodal Deep Learning-Based Approach for Detection of UX Dark Patterns in E-Commerce Web Interfaces

DarkShield is a Chrome Extension developed as part of a research project that aims to automatically detect deceptive User Experience (UX) Dark Patterns in e-commerce websites. The system combines Natural Language Processing (NLP), Computer Vision (CV), and Interaction Sequence Analysis to identify both static and dynamic dark patterns in real time.

---

## 🚀 Try the Demo E-Commerce Website 

👉 https://dark-pattern-e-comme-qvh3.bolt.host/products

🛡️ Launch the DarkShield Extension and scan the website to detect UX Dark Patterns in real time.

This demo website was specifically developed to simulate various UX Dark Patterns commonly found in e-commerce platforms. It serves as a testing environment for the DarkShield Extension, enabling real-time detection and visualization of deceptive design practices.

---

<img width="1895" height="816" alt="darksheild extension" src="https://github.com/user-attachments/assets/68824d02-3d80-484f-b95f-ce66ca2f6876" />

---

## 📖 Research Information

**Research Title**

*A Multimodal Deep Learning-Based Approach for Detection of UX Dark Patterns in E-Commerce Web Interfaces*

**Research Domain**

* Human-Computer Interaction (HCI)
* Artificial Intelligence
* Deep Learning
* UX Design
* Web Security and Consumer Protection

**Objective**

To develop a browser-based multimodal detection framework capable of identifying deceptive UX dark patterns that manipulate user decisions in online shopping environments.

---

## 🚀 Features

### Text-Based Dark Pattern Detection

Uses an ELECTRA-Small NLP model to identify deceptive textual content such as:

* Confirmshaming
* Trick Questions
* Limited Time Messages
* Low Stock Messages
* High Demand Messages
* Activity Messages
* Testimonials
* Pressured Selling

### Visual Dark Pattern Detection

Uses a YOLO26n Computer Vision model to detect:

* Disguised Advertisements
* Attention Distraction Elements
* Countdown Timers
* Default Choice Manipulation
* Intermediate Currency Displays

### Interaction-Based Dark Pattern Detection

Uses a BiLSTM with Attention mechanism to analyze user interaction sequences and detect:

* Roach Motel Patterns
* Nagging Patterns
* Obstruction Techniques

### Real-Time Browser Analysis

* Automatic webpage scanning
* Risk level assessment
* Pattern highlighting
* Detailed detection reports

---

## 🏗️ System Architecture

DarkShield follows a multimodal architecture consisting of three AI models:

### 1. NLP Detection Module

**Model:** ELECTRA-Small

**Purpose:** Analyze webpage text content for deceptive language patterns.

### 2. Computer Vision Detection Module

**Model:** YOLO26n

**Purpose:** Detect visual dark pattern elements from webpage screenshots.

### 3. Interaction Detection Module

**Model:** BiLSTM + Attention

**Purpose:** Analyze user interaction behavior and dynamic webpage changes.

### Decision Fusion Layer

Outputs from all three models are combined using a fusion mechanism to generate:

* Final Dark Pattern Detection Results
* Risk Score
* Risk Level Classification

---

## 📊 Model Performance

### NLP Models Performance
👉 ELECTRA-small: https://www.kaggle.com/code/hirunikaushalya/electra-small-weighted-research-text-v3-for-onnx 

👉 ModernBERT-base: https://www.kaggle.com/code/hirunikaushalya/modernbert-small-weighted-research-text

👉 DeBERTa-v3-xsmall: https://www.kaggle.com/code/hirunikaushalya/debertav3-small-weighted-research-text

👉 DistilBERT-base: https://www.kaggle.com/code/hirunikaushalya/distilbert-weighted-research-text

👉 MobileBERT-uncased: https://www.kaggle.com/code/hirunikaushalya/mobilebert-weighted-research-text 

👉 TinyBERT (4L/312D): https://www.kaggle.com/code/hirunikaushalya/tinybert-weighted-research-text

<img width="625" height="258" alt="nlp models" src="https://github.com/user-attachments/assets/f92bfa9a-d8a9-4eff-8646-4ded6cd1aaaa" />


### Computer Vision Models Performance
👉 YOLOv8n: https://www.kaggle.com/code/hirunikaushalya/dark-pattern-yolov8n-v9 

👉 YOLOv10n: https://www.kaggle.com/code/hirunikaushalya/dark-pattern-yolov10n-v9 

👉 YOLOv11n: https://www.kaggle.com/code/hirunikaushalya/dark-pattern-yolov11n-v9 

👉 YOLOv12n: https://www.kaggle.com/code/hirunikaushalya/dark-pattern-yolov12n-v9

👉 YOLOv26n: https://www.kaggle.com/code/hirunikaushalya/dark-pattern-yolov26n-v9

<img width="639" height="189" alt="cv models" src="https://github.com/user-attachments/assets/500c83ae-761b-45cf-afe2-b635e25c2be3" />


### Interaction Models Performance
👉 BiLSTM + Attention: https://colab.research.google.com/drive/1AUIb4Qi_xv8UVKs_f-vBVPf0BQFjnbVO?usp=sharing 

👉 LSTM Model: https://colab.research.google.com/drive/1WGLUGOng1bMfOVKEI19q69_gWFEm0CXu?usp=sharing  

👉 GRU Model: https://colab.research.google.com/drive/1tUp-CZBPULZrS3Ky7F2tvUKzqOnJw57g?usp=sharing  

👉 Vanilla RNN: https://colab.research.google.com/drive/1tUp-CZBPULZrS3Ky7F2tvUKzqOnJw57g?usp=sharing

👉 Stacked LSTM: https://colab.research.google.com/drive/1tUp-CZBPULZrS3Ky7F2tvUKzqOnJw57g?usp=sharing

<img width="597" height="150" alt="interaction models" src="https://github.com/user-attachments/assets/7149e4fa-f2b9-40d8-baca-7bebea898b36" />


---
<img width="2504" height="655" alt="_- visual selection (6)" src="https://github.com/user-attachments/assets/4f5f1b10-6c5f-4819-b834-610a99cd7f9d" />

## 📂 Dataset Summary

### Text Dataset

* **Total Samples: 1,600**
* Dark Pattern Samples: 800
* Non-Dark Pattern Samples: 800

### Image Dataset

* **Total Images: 700**
* Training Images: 490
* Validation Images: 105
* Testing Images: 105

### Interaction Dataset

* **Total Sequences: 900**
* Normal Interactions: 300
* Roach Motel Interactions: 300
* Nagging Interactions: 300

---

## 🛠️ Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Browser Extension

* Chrome Extension Manifest V3

### Artificial Intelligence

* ONNX Runtime Web
* ELECTRA-Small
* YOLO26n
* BiLSTM + Attention

### Development Tools

* Visual Studio Code
* Google Chrome Developer Tools
* CVAT
* Google Stitch

---

## 📦 Project Structure

```text
DARKSHIELD...
├── icons/
├── lib/
├── models/
│   ├── text_detection/
│   │   ├── config.json
│   │   ├── model.onnx
│   │   ├── model.onnx.data
│   │   ├── tokenizer_config.json
│   │   └── tokenizer.json
│   ├── interaction_detection.onnx
│   └── visual_detection.onnx
├── node_modules/
├── services/
├── background.js
├── content.js
├── manifest.json
├── package-lock.json
├── package.json
├── popup.css
├── popup.html
└── popup.js
```

---

## 🔧 Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/DarkShield-Extension.git
```

2. Open Chrome Extensions

```text
chrome://extensions/
```

3. Enable Developer Mode

4. Click **Load Unpacked**

5. Select the DarkShield-Extension folder

6. Open an e-commerce website and launch DarkShield

---

## 📈 Research Contributions

* Proposes a novel multimodal framework for dark pattern detection.
* Combines NLP, Computer Vision, and Interaction Analysis.
* Supports real-time browser-based detection.
* Detects both static and dynamic dark patterns.
* Improves user awareness and transparency in e-commerce environments.

---


