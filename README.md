<div align="center">

# 🔍 NIRIKSHAK
### AI-Powered Statutory Compliance & Enforcement Intelligence Platform

**Scan → Understand → Verify → Explain → Review → Assess Risk**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-Vision-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Groq](https://img.shields.io/badge/Groq-Vision%20AI-FF6B6B)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

*A digital inspection platform for regulatory and field-inspection teams to verify packaged-product labels against applicable statutory requirements — combining AI vision extraction, deterministic rule evaluation, cross-view reconciliation, human verification, and manufacturer-level risk intelligence.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Solution Architecture](#-solution-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Inspection Workflow](#-inspection-workflow)
- [Regulatory Scope](#-regulatory-scope)
- [Compliance Decision Model](#-compliance-decision-model)
- [Dual-Mode Access](#-dual-mode-access)
- [Getting Started](#-getting-started)
- [Use Cases](#-use-cases)
- [Why NIRIKSHAK?](#-why-nirikshak)
- [Roadmap](#-roadmap)

---

## 🎯 Overview

Packaged products carry legally significant information — product identity, generic/common name, net quantity, MRP, batch/lot number, manufacturing and expiry dates, manufacturer/importer details, licence information, ingredients and mandatory declarations.

The challenge is not simply reading this information. An inspector must **locate it, interpret it, compare information across package views, evaluate it against applicable rules, preserve evidence, and decide what requires further human verification**.

NIRIKSHAK is designed to assist with this complete inspection lifecycle.

> **Disclaimer:** NIRIKSHAK is an inspection-assistance tool. It should not be treated as a substitute for official legal interpretation or the final determination of a competent authority.

---

## 🚩 Problem Statement

Traditional label inspection involves manual reading, photographs, paperwork, spreadsheets and separate regulatory references — creating several challenges:

| # | Challenge |
|---|-----------|
| 1 | Manual verification is time-consuming and inconsistent |
| 2 | Important declarations are distributed across multiple package views |
| 3 | OCR alone does not determine statutory compliance |
| 4 | Conflicting declarations across views are difficult to detect |
| 5 | Low-confidence observations require human judgement |
| 6 | Repeated violations are hard to track at manufacturer level |
| 7 | Regulatory knowledge must remain connected to inspection evidence |

---

## 🔧 Solution Architecture

```
Product Images / PDF
        ↓
AI Vision & Information Extraction  (Gemini / Groq)
        ↓
Cross-View Reconciliation
        ↓
Statutory Rule Evaluation Engine
        ↓
Compliance Findings  (VERIFIED / REQUIRES REVIEW / VIOLATION)
        ↓
Human-in-the-Loop Verification
        ↓
Inspection Report (PDF Export)
        ↓
Command Center + Manufacturer Risk Intelligence
```

NIRIKSHAK separates two key responsibilities:
- **AI** — extracts and interprets information from visual product evidence
- **Deterministic Rule Engine** — evaluates extracted information against configured statutory rules

This makes the workflow explainable and gives inspectors a clear opportunity to verify uncertain findings.

---

## ✨ Key Features

### 1. 📸 Multi-Image Product Inspection
Inspect multiple images of the **same packaged product** simultaneously:
- Multiple package view support (Front, Back, Sides, Label, Cap, Neck…)
- Live camera capture
- Label/image upload
- PDF label input
- Evidence association with extracted fields

### 2. 🤖 AI-Powered Visual Information Extraction
Vision-capable AI (Gemini + Groq) identifies relevant statutory information:
- Product name, brand, batch/lot number
- Manufacturing & expiry dates
- MRP and pricing information
- Manufacturer/importer details & address
- Licence/registration numbers
- Ingredient lists & active ingredients
- Mandatory declarations (country of origin, consumer care, etc.)
- OCR confidence scores per extracted field

### 3. ⚔️ Cross-View Conflict Detection
Automatically flags inconsistent declarations across different package views:

```
Front panel:  Product Name = "Antacid Antigas Gel"
Label panel:  Product Name = "DIGENE Gel"
                    ↓
         ⚠️  CROSS-VIEW CONFLICT DETECTED
              → Routed to Manual Verification
```

### 4. ⚖️ Statutory Compliance Evaluation
A powerful deterministic rule engine evaluates extracted data against configured statutory rules. Each finding includes:
- Rule reference & section
- Detected observation & statutory requirement
- Compliance status with rationale
- Source/evidence view & label-location reference

**Possible compliance statuses:**

| Status | Meaning |
|--------|---------|
| ✅ `VERIFIED` | Compliant with the applicable rule |
| ⚠️ `REQUIRES_REVIEW` | Needs human verification |
| 🔴 `VIOLATION` | Non-compliant with the rule |
| 🟡 `WARNING` | Minor issue detected |
| 🔵 `LOW_CONFIDENCE` | Extraction confidence too low to conclude |
| ⬜ `NOT_DETECTED` | Field not found in any image |
| ➖ `NOT_APPLICABLE` | Rule does not apply to this product |
| ❓ `INSUFFICIENT_EVIDENCE` | More evidence required to evaluate |

### 5. 👁️ Human-in-the-Loop Verification
AI observations are never automatic legal conclusions. Inspectors can:
- Edit extracted text and re-evaluate
- Review source evidence per field
- Override a finding to Verified
- Confirm a Violation
- Investigate low-confidence observations

### 6. 💰 Retail Price & MRP Overcharging Audit
- Compare declared MRP vs. actual selling price
- Calculate overcharge amount and percentage
- Flag non-compliant retail pricing under Legal Metrology rules

### 7. 📍 Optical Label Region Detection
Visual evidence for extracted fields:
- Annotated bounding boxes on source images
- Polygon support for angled/rotated label text
- Source view attribution per extracted field
- Filter by category (pricing, dates, product identity, etc.)

### 8. 🖥️ Enforcement Command Center
Operational dashboard for inspection activity:
- Total audited batches & compliance rates
- Flagged non-compliances & pending reviews
- Inspection history with search/filter
- Compliance scores & status breakdowns
- PDF report access
- Real-time inspection monitoring

### 9. 📋 Review Queue
Human attention workflow for:
- Low-confidence extractions
- Missing mandatory declarations
- Cross-view conflicts
- Ambiguous evidence
- Requirements needing physical verification

### 10. 📚 Rules & Regulatory Sandbox
**Statutory Rules Browser** — Browse rules by:
- Commodity category
- Rule/section reference
- Criticality (CRITICAL / MAJOR / MINOR)
- Regulatory framework

**Live Rule Testing Sandbox** — Test hypothetical product declarations against the configured rule engine before real inspections.

### 11. 🏭 Manufacturer Compliance Passports
Risk Center aggregates inspection data at manufacturer/importer level:
- Products inspected & compliance rate
- Total violations, repeat violations, critical violations
- Last inspection date & risk assessment
- Repeat rule infraction tracking
- Full inspection evidence trail

### 12. 📊 Risk-Based Enforcement Intelligence
Surfaces manufacturer-level risk indicators:
- High-risk manufacturer identification
- Repeat offender tracking
- Critical statutory issue surfacing
- Entities requiring priority inspection
- Risk-based inspection planning support

### 13. 🤖 AI Statutory Assistant
Context-aware AI assistant for:
- Mandatory declaration questions
- Rule-specific compliance queries
- Category-specific requirements
- Legal basis for inspection findings
- Enforcement-related guidance

### 14. 🌐 Bilingual Interface
Full **English ↔ Hindi** localization with complete i18n coverage across all modules.

### 15. 📄 Inspection Reports
PDF export with:
- Product information & extracted declarations
- Rule-level findings with evidence
- Compliance score & inspection metadata
- Show Cause Notice generation
- Archiving and enforcement documentation


### 17. 👤 Consumer Mode
Separate public interface allowing users to:
- Scan products for basic compliance information
- View scan history
- Access simplified compliance results
- No inspector authentication required

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19 | UI framework |
| **TypeScript** | 5.8 | Type safety throughout |
| **Vite** | 6 | Build tool & dev server |
| **Tailwind CSS** | 4 | Utility-first styling |
| **Lucide React** | Latest | Icon library |
| **Motion** | 12 | Animations & transitions |

### AI & Vision
| Service | Purpose |
|---------|---------|
| **Google Gemini** (`gemini-2.5-flash` / `gemini-2.5-pro`) | Primary vision AI, multi-key rotation |
| **Groq** (Llama Vision / Compound Beta) | High-speed alternative vision AI |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | API server |
| **TypeScript (tsx)** | Server-side TypeScript execution |
| **dotenv** | Environment configuration |
| **nodemailer** | Email delivery (password reset) |

### Compliance Engine (Custom TypeScript)
| Module | Purpose |
|--------|---------|
| `evaluator.ts` | Core statutory rule evaluator |
| `rules.ts` | Statutory rule definitions & categorization |
| `labRulesEngine.ts` | Laboratory compliance evaluation |
| `additivePermissionEngine.ts` | Food additive permission checking |
| `productClassifier.ts` | AI-assisted product category classification |
| `passportCalculator.ts` | Manufacturer risk passport calculation |
| `unifiedLabAnalysisEngine.ts` | Multi-sample lab report analysis |
| `sgsPdfParser.ts` | SGS PDF lab report parsing |
| `consumerRuleEngine.ts` | Consumer-mode simplified evaluation |

### Document Processing
| Library | Purpose |
|---------|---------|
| **jsPDF** | PDF report generation |
| **pdf-parse** | Lab report PDF parsing |
| **docx** | Document generation |

### Data & Storage
| Technology | Purpose |
|-----------|---------|
| **IndexedDB** | Browser-side persistence |
| **JSON flat files** | Server-side data storage (inspections, reviews, audit logs) |


## 📁 Project Structure

```
nirikshak-project/
├── src/
│   ├── components/
│   │   ├── InspectionWorkspace.tsx       # Main inspection UI
│   │   ├── OverviewDashboard.tsx         # Command Center dashboard
│   │   ├── ReviewQueueView.tsx           # Human review queue
│   │   ├── RiskCenterView.tsx            # Manufacturer risk intelligence
│   │   ├── RulesManagerView.tsx          # Rules browser & sandbox
│   │   ├── AssistantDrawer.tsx           # AI statutory assistant
│   │   ├── InspectionReportModal.tsx     # PDF report modal
│   │   ├── InspectorLogin.tsx            # Authentication UI
│   │   ├── TopHeader.tsx                 # Navigation header
│   │   ├── PrecisionAnnotationViewer.tsx # Label region detection UI
│   │   ├── FontSizeMeasurementCard.tsx   # Font size verification
│   │   ├── ShowCauseNoticeModal.tsx      # Show cause notice generation
│   │   ├── InstructionalSlidesModal.tsx  # Onboarding slides
│   │   ├── ReferenceSetupModal.tsx       # Reference data setup
│   │   ├── ErrorBoundary.tsx             # React error boundary
│   │   ├── consumer/                     # Consumer mode components
│   │   │   ├── ConsumerWorkspace.tsx
│   │   │   ├── ConsumerScanner.tsx
│   │   │   ├── ConsumerResultView.tsx
│   │   │   ├── ConsumerDashboard.tsx
│   │   │   ├── ConsumerHistoryView.tsx
│   │   │   ├── ConsumerTopHeader.tsx
│   │   │   └── ConsumerHowItWorksModal.tsx
│   │   ├── assistant/                    # AI assistant sub-components
│   │   └── risk/                         # Risk center sub-components
│   │
│   ├── engine/
│   │   ├── evaluator.ts                  # Core rule evaluation engine
│   │   ├── rules.ts                      # Statutory rule definitions
│   │   ├── labRulesEngine.ts             # Lab compliance engine
│   │   ├── additivePermissionEngine.ts   # Food additive permissions
│   │   ├── productClassifier.ts          # Product category classification
│   │   ├── passportCalculator.ts         # Risk passport calculation
│   │   ├── unifiedLabAnalysisEngine.ts   # Lab analysis orchestration
│   │   ├── sgsPdfParser.ts               # SGS PDF lab report parser
│   │   ├── consumerRuleEngine.ts         # Consumer evaluation engine
│   │   ├── consumerNormalization.ts      # Consumer data normalization
│   │   ├── foodConsumerAnalysisService.ts
│   │   └── cosmeticConsumerAnalysisService.ts
│   │
│   ├── lib/
│   │   ├── api.ts                        # Frontend API client
│   │   ├── i18n.tsx                      # Internationalization layer
│   │   ├── indexedDB.ts                  # Browser storage
│   │   ├── pdfExport.ts                  # PDF generation
│   │   └── userSession.ts                # Session management
│   │
│   ├── locales/
│   │   ├── en.ts                         # English translations
│   │   └── hi.ts                         # Hindi translations
│   │
│   ├── config/
│   │   └── models.ts                     # AI model configuration
│   ├── data/
│   │   └── presets.ts                    # Demo inspection presets
│   ├── types/                            # Additional type definitions
│   ├── types.ts                          # Core type definitions
│   ├── App.tsx                           # Root application component
│   └── main.tsx                          # Entry point
│
├── api/
│   ├── index.ts                          # Vercel serverless handler
│   └── [...path].ts                      # Dynamic API routing
│
├── data/                                 # Server-side JSON storage
│   ├── inspections.json
│   ├── reviews.json
│   ├── audit-logs.json
│   ├── auth-users.json
│   ├── consumer-scans.json
│   └── lab-reports.json
│
├── tests/
│   ├── consumerMode.test.ts
│   ├── labComplianceEngine.test.ts
│   └── multiSamplePdfExtraction.test.ts
│
├── server.ts                             # Express API server
├── vite.config.ts                        # Vite configuration
├── tsconfig.json                         # TypeScript config
├── vercel.json                           # Vercel deployment config
├── index.html                            # HTML entry point
├── package.json
├── .env.example                          # Environment variable template
└── .gitignore
```

---

## 🔄 Inspection Workflow

```
1. 📷 Capture / Upload Product Evidence
            ↓
2. 🤖 AI Vision Extraction
   (Gemini / Groq analyse all product views simultaneously)
            ↓
3. 🔍 Cross-View Analysis
   (Reconcile declarations across views, flag conflicts)
            ↓
4. ⚖️ Statutory Rule Evaluation
   (Deterministic engine checks each extracted field)
            ↓
5. 📊 Compliance Findings Generated
   VERIFIED  |  REQUIRES REVIEW  |  VIOLATION
            ↓
6. 👁️ Human Verification
   (Inspector reviews, edits, overrides findings)
            ↓
7. 📄 Inspection Report (PDF Export)
            ↓
8. 🖥️ Command Center + Risk Center Updated
   (Manufacturer passport & risk intelligence refreshed)
```

---

## 📜 Regulatory Scope

NIRIKSHAK's rule engine covers statutory frameworks for packaged product inspection in India:

| Regulatory Framework | Applicable Products |
|---------------------|-------------------|
| **Legal Metrology (Packaged Commodities) Rules, 2011** | All packaged commodities |
| **FSSAI / Food Safety & Standards Act** | Food & beverages, supplements |
| **Drugs & Cosmetics Act, 1940 / D&C Rules, 1945** | Schedule G/H/H1/X drugs, biologicals, veterinary |
| **Cosmetics Rules, 2020** | Personal care & cosmetics |
| **Medical Devices Rules, 2017** | Medical devices, IVDs, surgical dressings |
| **Seeds Act, 1966** | Seeds & agriculture |
| **Fertilizer Control Order, 1985** | Fertilizers & chemicals |
| **Pesticide-related regulations** | Crop protection products |
| **BIS / ISI Standards** | Consumer electronics, toys, etc. |
| **Indian Systems of Medicine (ASU)** | Ayurvedic, Siddha, Unani, Homoeopathic |


## 🎯 Compliance Decision Model

NIRIKSHAK ensures AI observations are never automatic legal conclusions:

```
   Visual Evidence (Images / PDF)
            ↓
   AI Information Extraction
   (Confidence score per field)
            ↓
   Cross-View Reconciliation
   (Conflict detection across package sides)
            ↓
   Deterministic Statutory Rule Evaluation
            ↓
   ┌────────────┬──────────────────┬────────────┐
   │  VERIFIED  │ REQUIRES REVIEW  │ VIOLATION  │
   └────────────┴──────────────────┴────────────┘
                        ↓
               Inspector Decision
               (Override / Confirm / Re-evaluate)
```

---

## 👥 Dual-Mode Access

### 🛡️ Inspector Mode (Authenticated)
Full enforcement platform with:
- Inspector login (role-based access: inspector / admin)
- Complete 8-step inspection workflow
- Command Center & Risk Center dashboards
- PDF report generation & Show Cause Notices
- Audit log maintenance

### 🛒 Consumer Mode (Public, No Auth Required)
Simplified public interface at `/consumer`:
- Quick product scans
- Basic compliance results
- Personal scan history
- Consumer-friendly language


## 👤 Use Cases

### 🏃 Field Inspectors
Capture product evidence on-site and receive structured compliance findings with supporting evidence.

### 🏛️ Regulatory Departments
Monitor inspection activity across the organization through the Command Center dashboard.

### ⚖️ Enforcement Teams
Use manufacturer-level compliance passports to identify repeat violators and prioritize which entities to inspect next.

### 🔍 Compliance Auditors
Review statutory findings, evidence trails, and full inspection reports with PDF export capability.

### 📖 Regulatory Knowledge Teams
Browse and test configured rules using the Rules Browser and Live Sandbox.

### 🛒 Consumers
Use Consumer Mode to quickly scan products and verify basic compliance information independently.

---


