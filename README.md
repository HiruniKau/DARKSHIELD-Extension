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

### NLP Model (ELECTRA-Small) Performance

| Metric    | Value |
| --------- | ----- |
| Accuracy  | 93.0% |
| Precision | 90.0% |
| Recall    | 90.0% |
| F1-Score  | 90.0% |

### Computer Vision Model (YOLO26n) Performance

| Metric             | Value   |
| ------------------ | ------- |
| Accuracy           | 94.0%   |
| mAP@50             | 20.6%   |
| CPU Inference Time | 38.9 ms |

### Interaction Model (BiLSTM + Attention) Performance

| Metric    | Value |
| --------- | ----- |
| Accuracy  | 98.0% |
| Precision | 98.0% |
| Recall    | 98.0% |
| F1-Score  | 98.0% |

---
<img width="2504" height="705" alt="_- visual selection (6)" src="https://github.com/user-attachments/assets/b3a7c081-8c35-46c3-a916-00c8b6ef5d2e" />


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


