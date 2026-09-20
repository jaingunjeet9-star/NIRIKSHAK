# NIRIKSHAK — Statutory Verifier

> **AI-powered statutory compliance and enforcement intelligence platform for packaged products**

NIRIKSHAK is a digital inspection platform designed to help regulatory and field-inspection teams verify packaged-product labels against applicable statutory requirements. It combines **AI-based visual information extraction, deterministic statutory rule evaluation, cross-view reconciliation, human verification, inspection history, and manufacturer-level risk intelligence** into one workflow.

**Scan → Understand → Verify → Explain → Review → Assess Risk**

## Table of Contents

- [Overview](#overview)
- [Problem](#problem)
- [Solution](#solution)
- [Key Features](#key-features)
- [Inspection Workflow](#inspection-workflow)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Regulatory Scope](#regulatory-scope)
- [Human-in-the-Loop](#human-in-the-loop)
- [Reports and Evidence](#reports-and-evidence)
- [Security](#security)
- [Testing](#testing)
- [Limitations](#limitations)
- [Future Roadmap](#future-roadmap)
- [Use Cases](#use-cases)
- [Why NIRIKSHAK](#why-nirikshak)
- [Project Status](#project-status)

---

## Overview

Packaged products carry legally significant information such as product identity, generic/common name, net quantity, MRP, batch/lot number, manufacturing or packing date, expiry/use-by date, manufacturer/importer details, licence information, ingredients and mandatory declarations.

The challenge is not simply reading this information. An inspector must **locate it, interpret it, compare information across package views, evaluate it against applicable rules, preserve evidence, and decide what requires further human verification**.

NIRIKSHAK is designed to assist with this complete inspection lifecycle.

---

## Problem

Traditional label inspection can involve manual reading, photographs, paperwork, spreadsheets and separate regulatory references. This creates several challenges:

1. **Manual verification is time-consuming.**
2. **Important declarations may be distributed across multiple package views.**
3. **OCR alone does not determine statutory compliance.**
4. **Conflicting declarations across package views can be difficult to detect.**
5. **Low-confidence or ambiguous observations require human judgement.**
6. **Repeated violations are difficult to understand at manufacturer level.**
7. **Regulatory knowledge needs to remain connected to the inspection evidence.**

---

## Solution

NIRIKSHAK connects the complete inspection pipeline:

```text
Product Images / PDF
        ↓
AI Vision & Information Extraction
        ↓
Cross-View Reconciliation
        ↓
Statutory Rule Evaluation
        ↓
Compliance Findings
        ↓
Human Review
        ↓
Inspection Report
        ↓
Command Center & Manufacturer Risk Intelligence
```

The system separates two important responsibilities:

- **AI** extracts and interprets information from visual product evidence.
- **The deterministic rule engine** evaluates extracted information against configured statutory rules.

This makes the workflow more explainable and gives inspectors a clear opportunity to verify uncertain findings.

---

# Key Features

## 1. Multi-Image Product Inspection

NIRIKSHAK can inspect multiple images of the **same packaged product** rather than relying on one photograph.

Supported workflows include:

- Multiple package views
- Live camera capture
- Label/image upload
- PDF label input
- Evidence association with extracted fields

This enables declarations from different sides of a package to be considered together.

---

## 2. AI-Powered Visual Information Extraction

Vision-capable AI services are used to identify relevant product information from package images.

Examples include:

- Product name
- Brand
- Batch/Lot number
- Manufacturing date
- Expiry/use-by date
- MRP
- Manufacturer details
- Licence number
- Ingredients / active ingredients
- Other relevant declarations

Extracted values can be associated with their source view and OCR confidence.

---

## 3. Cross-View Conflict Detection

A package is not just one image.

NIRIKSHAK compares information extracted from different views and can flag inconsistent declarations.

For example:

```text
Front panel:
Product Name = Antacid Antigas Gel

Label panel:
Product Name = DIGENE Gel
```

Instead of silently choosing one value, the system can raise a:

**CROSS-VIEW CONFLICT**

and route it for manual verification.

---

## 4. Statutory Compliance Evaluation

Extracted information is evaluated against configured statutory rules.

A finding can include:

- Rule reference
- Detected observation
- Compliance status
- Statutory requirement
- Rationale
- Source/evidence view
- Label-location reference

Possible states include:

- **VERIFIED**
- **REQUIRES REVIEW**
- **VIOLATION**

This provides more context than a simple pass/fail result.

---

## 5. Human-in-the-Loop Verification

NIRIKSHAK does not assume that every AI observation should become an automatic legal conclusion.

Inspectors can:

- Edit extracted text
- Review evidence
- Override a finding to Verified
- Confirm a Violation
- Investigate low-confidence observations

The core model is:

**AI + Deterministic Rules + Human Verification**

---

## 6. Retail Selling Price & Overcharging Audit

The platform includes a retail price audit workflow for comparing the actual selling price with the declared MRP.

It can display:

- Printed/declared MRP
- Entered actual selling price
- Difference
- Overcharge indication

This extends inspection beyond label declarations into retail-level pricing verification.

---

## 7. Optical Label Region Detection

NIRIKSHAK provides visual evidence for extracted fields using label-region detection.

The interface can show:

- Source image/view
- Detected fields
- Annotated regions
- Bounding boxes
- Verification state

This helps an inspector understand **where an observation came from**.

---

## 8. Enforcement Command Center

The Command Center provides an operational overview of inspection activity.

It can surface:

- Total audited batches
- Statutory compliance rate
- Flagged non-compliances
- Pending human reviews
- Recent audit records
- Compliance scores
- Inspection status
- PDF reports
- Inspection details

The objective is to move from isolated inspections to an enforcement-oriented dashboard.

---

## 9. Review Queue

The Review Queue collects findings requiring human attention.

Typical reasons include:

- Low-confidence extraction
- Missing declarations
- Cross-view conflicts
- Ambiguous evidence
- Visual requirements requiring physical verification

Inspectors can review the observation and take an explicit action.

---

## 10. Rules & Regulatory Sandbox

NIRIKSHAK includes a statutory knowledge workspace.

### Statutory Rules Browser

Rules can be browsed by:

- Commodity category
- Rule/section
- Criticality
- Regulatory framework

### Live Rule Testing Sandbox

Hypothetical product declarations can be evaluated against configured rules.

Inputs can include:

- Product title
- Brand
- Net quantity
- Declared MRP
- Licence number
- Ingredient list
- Manufacturing/packing date
- Expiry/use-by date
- Batch/Lot number
- Manufacturer details
- Customer-care information

The sandbox also provides a foundation for testing and extending the rule engine.

---

## 11. Manufacturer & Importer Compliance Passports

The Risk Center aggregates inspection information at manufacturer/importer level.

A compliance passport can present:

- Number of inspected products
- Compliant products
- Total violations
- Repeat violations
- Critical violations
- Last inspection
- Risk assessment
- Repeat rule infractions
- Inspection evidence

This shifts the question from:

> **“Is this package compliant?”**

to:

> **“Where is the larger compliance risk coming from?”**

---

## 12. Risk-Based Enforcement Intelligence

Repeated and critical findings can be surfaced as manufacturer-level risk indicators.

This can help enforcement teams prioritize:

- High-risk manufacturers
- Repeat offenders
- Critical statutory issues
- Entities requiring further inspection
- Products requiring closer review

The Risk Center is designed to support **risk-based inspection planning**.

---

## 13. AI Statutory Assistant

NIRIKSHAK includes a statutory-focused AI assistant for inspection-related questions.

It is intended for queries involving:

- Mandatory declarations
- Rule-specific requirements
- Category-specific compliance
- Statutory non-compliances
- Enforcement-related questions
- Legal basis for inspection findings

The assistant complements the deterministic rule engine rather than replacing it.

---

## 14. Bilingual Interface

The application supports:

- **English**
- **Hindi**

Localization is implemented through the application's internationalization layer.

---

## 15. Inspection Reports

Inspection results can be exported as PDF reports containing relevant inspection information and findings.

Reports can help with:

- Review
- Archiving
- Sharing
- Enforcement documentation

---

# Inspection Workflow

A typical inspection follows:

```text
1. Capture / Upload Product Evidence
                ↓
2. AI Vision Extraction
                ↓
3. Cross-View Analysis
                ↓
4. Statutory Rule Evaluation
                ↓
5. Verified / Review / Violation
                ↓
6. Human Verification
                ↓
7. Inspection Report
                ↓
8. Command Center + Risk Center
```

### Feature flow

**Product → Evidence → Compliance → Violation → Review → Risk**

---

# Feature Matrix

| Module | Purpose |
|---|---|
| Scanner | Capture/upload product evidence |
| AI Vision Extraction | Extract statutory/product information |
| Cross-View Analysis | Reconcile declarations across package views |
| Compliance Engine | Evaluate configured statutory rules |
| Inspection Report | Present findings and evidence |
| Review Queue | Human verification of uncertain findings |
| Command Center | Monitor inspection activity |
| Risk Center | Analyze manufacturer/importer history |
| Rules & Sandbox | Browse and test statutory rules |
| AI Statutory Assistant | Assist with statutory questions |
| Price Audit | Compare selling price with declared MRP |
| Optical Region Detection | Visualize source regions/evidence |
| Localization | English/Hindi interface |

---

# Compliance Decision Model

NIRIKSHAK is designed so that an AI observation is not automatically treated as a final legal conclusion.

```text
Visual Evidence
      ↓
Information Extraction
      ↓
Confidence / Evidence Check
      ↓
Cross-View Reconciliation
      ↓
Deterministic Rule Evaluation
      ↓
┌──────────────┬──────────────────┬──────────────┐
│   VERIFIED   │  REQUIRES REVIEW │  VIOLATION   │
└──────────────┴──────────────────┴──────────────┘
                         ↓
                  Human Decision
```

---

# Technology Stack

### Frontend

- React.js
- TypeScript
- Vite

### AI & Computer Vision

- Google Gemini Vision
- Groq Vision

### Compliance Intelligence

- Custom TypeScript statutory rule engine
- Rule evaluation logic
- Cross-view reconciliation

### Backend / APIs

- Node.js
- TypeScript
- Application API layer

### Data

- IndexedDB for browser-side persistence where required

### Document Processing

- PDF export/report generation

### Localization

- English / Hindi internationalization

### Development

- npm
- Bun
- TypeScript-based testing utilities

---

# Architecture

```text
                    ┌────────────────────┐
                    │     Inspector      │
                    │    Web Browser     │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ React + TypeScript │
                    │       + Vite       │
                    └─────────┬──────────┘
                              │
                ┌─────────────┴─────────────┐
                ↓                           ↓
       ┌─────────────────┐         ┌─────────────────┐
       │ Gemini / Groq   │         │ Node.js / APIs  │
       │ Vision Services │         │                 │
       └────────┬────────┘         └────────┬────────┘
                └─────────────┬─────────────┘
                              ↓
                    ┌────────────────────┐
                    │ Extraction +       │
                    │ Cross-View Analysis│
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ Statutory Rule     │
                    │ Evaluation Engine  │
                    └─────────┬──────────┘
                              ↓
             ┌────────────────┼────────────────┐
             ↓                ↓                ↓
        ┌──────────┐     ┌──────────┐    ┌────────────┐
        │ Review   │     │ Reports  │    │ Risk Center│
        │ Queue    │     │ / PDF    │    │ + Dashboard│
        └──────────┘     └──────────┘    └────────────┘
```

---

# Project Structure

```text
.
├── src/
│   ├── components/
│   │   ├── AssistantDrawer.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── InspectionReportModal.tsx
│   │   ├── InspectionWorkspace.tsx
│   │   ├── OverviewDashboard.tsx
│   │   ├── ReviewQueueView.tsx
│   │   ├── RiskCenterView.tsx
│   │   ├── RulesManagerView.tsx
│   │   ├── ShowCauseNoticeModal.tsx
│   │   └── TopHeader.tsx
│   │
│   ├── config/
│   │   └── models.ts
│   ├── data/
│   │   └── presets.ts
│   ├── engine/
│   │   ├── evaluator.ts
│   │   └── rules.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── i18n.tsx
│   │   ├── indexedDB.ts
│   │   └── pdfExport.ts
│   ├── locales/
│   │   ├── en.ts
│   │   └── hi.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── server.ts
├── vite.config.ts
├── tsconfig.json
├── index.html
├── .env.example
├── .gitignore
└── README.md
```

# Regulatory Scope

The current interface/rule workspace references statutory frameworks relevant to packaged-product inspection, including examples such as:

- Legal Metrology (Packaged Commodities) Rules, 2011
- Cosmetics Rules, 2020
- Drugs and Cosmetics Act, 1940
- FSSAI-related requirements
- Seeds Act, 1966
- Fertilizer Control Order, 1985

The exact automated checks available depend on the rule definitions implemented in the current version.

> **Disclaimer:** NIRIKSHAK is an inspection-assistance prototype. It should not be treated as a substitute for official legal interpretation or the final determination of a competent authority.

---

# Human-in-the-Loop

Human verification is essential because visual inspection can be affected by:

- Blurry images
- Obstructed labels
- Reflections
- Unusual fonts
- Partial visibility
- Ambiguous declarations
- Conflicting package views
- Requirements that need physical inspection

NIRIKSHAK therefore provides:

```text
Review Evidence
      ↓
Edit Extracted Text
      ↓
Re-evaluate
      ↓
Override to Verified
          OR
Confirm Violation
```

---

# Reports and Evidence

Inspection records can contain:

- Product information
- Extracted declarations
- Rule-level findings
- Compliance status
- Source image/view
- Evidence references
- Review status
- Compliance score
- Inspection metadata

PDF export makes results easier to review and archive.

---

# Security

For production deployment, recommended practices include:

- Keep API keys in a secure server-side environment.
- Never expose private API keys in client-side code.
- Validate uploaded files and MIME types.
- Enforce file-size limits.
- Add authentication and role-based access control.
- Maintain audit logs for enforcement actions.
- Apply appropriate data-retention policies.
- Use managed secret storage for production credentials.

---

# Testing

The project contains TypeScript-based testing and validation utilities covering areas such as:

- Pipeline execution
- AI authentication
- Vision integration
- Scenario testing
- Internationalization coverage

Run the scripts configured in `package.json` according to the development environment.

# Use Cases

### Field Inspectors

Capture product evidence and receive structured compliance findings with supporting evidence.

### Regulatory Departments

Monitor inspection activity through the Command Center.

### Enforcement Teams

Use manufacturer-level compliance passports to identify repeat violations and prioritize inspections.

### Compliance Auditors

Review statutory findings, evidence and inspection reports.

### Regulatory Knowledge Teams

Browse and test configured rules using the Rules Browser and Sandbox.

---

# Why NIRIKSHAK?

A basic compliance workflow often looks like:

**OCR → Checklist → Pass/Fail**

NIRIKSHAK is designed around:

**Evidence → Extraction → Reconciliation → Statutory Evaluation → Human Verification → History → Risk Intelligence**

| Conventional Approach | NIRIKSHAK |
|---|---|
| Single label scan | Multi-view product inspection |
| OCR output | Structured statutory information |
| Simple checklist | Rule-level evaluation |
| Pass/Fail | Verified / Review / Violation |
| Isolated inspection | Inspection history |
| Product-level result | Manufacturer-level risk intelligence |
| AI-only output | AI + rules + human verification |
| Generic report | Evidence-backed inspection workflow |

The key value is not simply adding AI. It is connecting AI with **explicit statutory rules, traceable evidence and accountable human review**.

---

# Design Principles

### Evidence First
Important findings should be traceable to product evidence wherever possible.

### Rules Over Guesswork
Compliance evaluation should use explicit, inspectable rules rather than relying only on a model's judgement.

### Human Accountability
The inspector remains responsible for final verification and enforcement decisions.

### Risk-Based Enforcement
Repeated and critical findings should contribute to a broader understanding of compliance risk.

### Explainability
The platform should help answer:

> What was detected?  
> Where was it detected?  
> Which rule applies?  
> What evidence supports it?  
> What should the inspector review?

---

## NIRIKSHAK at a Glance

```text
                 NIRIKSHAK
             STATUTORY VERIFIER
                     │
       ┌─────────────┼─────────────┐
       │             │             │
    EVIDENCE       AI VISION     STATUTORY
    CAPTURE       EXTRACTION      RULES
       │             │             │
       └─────────────┼─────────────┘
                     ↓
             CROSS-VIEW ANALYSIS
                     ↓
            COMPLIANCE FINDINGS
                     ↓
              HUMAN REVIEW
                     ↓
        ┌────────────┴────────────┐
        ↓                         ↓
   INSPECTION                RISK CENTER
     REPORT               & MANUFACTURER
                             PASSPORT
```

## **NIRIKSHAK — From Reading Labels to Understanding Compliance Risk.**

