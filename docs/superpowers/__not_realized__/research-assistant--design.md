# Design Spec/Proposal (Draft)
## Topic Overview 🔍

This document outlines the design for an AI-powered, research/study assistant built into a PDF reader. The goal is to transition the application from an "AI Chatbot in' Side-panel" into a coherent, contextually aware research tool.

## Product Vision: "The Passive Researcher's Companion" 💡
- **Target User**: Students, researchershouseholding heavy reading loads. They need to extract insights without manual friction but want full control over what is captured as knowledge (no "AI bloat").
- **Core Strategy**: Minimal disruption to the reading flow, maximum value per interaction.

## Feature Roadmap (Proposed) 🗺️
Based on our brainstorming, we have identified four key pillars:

### Pillar A. Context-Aware Annotation (The "Quick Interaction" Layer)
*   **Function**: When text is selected, the AI suggests actions: *Explain*, *Summarize this paragraph only*, or *Check definition*.
*   **Mechanism**: Uses `pdfPageCapture` to feed the selected text + local context (surrounding lines) into an LLM.
*   **UI**: A small, non-intrusive floating menu or a side panel update.

### Pillar B. Knowledge Synthesis (The "Output" Layer)
*   **Function**: Allows users to save AI-generated insights into a structured "Knowledge Vault" (side panel).
*   **Mechanism**: Converts chat/annotation interactions into structured data objects stored in `Zustand` (with local persistence via Electron-store).
*   **UI**: A structured sidebar with organized "Cards" (e.g., Definition, Key Point).

### Pillar C/D: Traceability & Scanning (The "Navigation" Layer)
*   **Function**: Every AI response includes a direct link/highlight back to the PDF source.
*   **Function**: A "Scan" mode for rapid chapter/summary viewing to support skimming.

## Technical Architecture (High-Level) 🏗️
*   **Frontend**: React + MUI. The UI must be responsive to the "Selected Text" state in `Zustand`.
*   **Intelligence**: Multimodal LLM (Text + Page Image) to handle layout-heavy content.
*   **Persistence**: Local storage for annotations and notes, allowing user to export/sync later.

## Success Criteria ✅
- **Zero Unnecessary Inputs**: Users should be able to perform key actions with minimal typing. 
- **Nonpadding Interface**: The UI does not obstruct the PDF view unless explicitly interacted with.
- **Source Truthfulness (No Hallucinations)**: All AI insights must clearly point to the source content.
