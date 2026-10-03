# DEFOPS - Indian Army Predictive Logistics & Forward Supply Chain

> **Ministry of Defence (MoD)** | **Defence Services Staff College**  
> **Problem Theme:** Transportation & Logistics (Forward Formations Logistics Assurance)

---

## 🇮🇳 Project Overview

Maintaining assured and timely logistics support to forward formations across geographically dispersed, high-altitude, and operationally challenging sectors (such as Northern Command: Leh, Ladakh, Kargil, and Siachen Base Camp) is a critical defence requirement.

**DEFOPS** integrates AI/ML demand forecasting, GIS-enabled corridor tracking via **OpenStreetMap**, IoT telemetry monitoring, and real-time requisition management into a modern, unified, clean tactical operations portal.

---

## 🎨 Design System

- **Clean White & Shady Forest Green Palette**:
  - Background: Crisp, clean `#f6f9f7` with pure white cards (`#ffffff`).
  - Shady Green Primary: `#1b4332` (deep tactical forest green) and `#2d6a4f` (shady pine green).
  - Accents: Soft moss green borders (`#c7ddce`), sage pills (`#edf4ef`), and alert indicators.
  - Typography: Modern `Inter` for body copy, `Rajdhani` for tactical headings, and `JetBrains Mono` for telemetry and service IDs.
  - Intuitive, user-friendly UI with responsive layout, clear metrics, and instant demo access.

---

## 🛠️ Technology Stack

- **Frontend:**
  - **React 19 + Vite** (High-speed development & production compilation)
  - **Tailwind CSS v3** (Utility-first styling with custom shady green theme tokens)
  - **OpenStreetMap (OSM) + Leaflet** (GIS logistics theatre map with animated convoy markers & strategic corridors)
  - **Socket.IO Client** (Real-time live telemetry ingestion)
  - **Lucide React** (Tactical iconography)

- **Backend:**
  - **Node.js + Express.js**
  - **MongoDB + Mongoose** (Container tracking, indents/requisitions, audit trails)
  - **Socket.IO** (Bi-directional real-time telemetry streaming)
  - **JWT & Passport.js** (Service number role-based authentication)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on port `27017`

### 2. Backend Setup
```bash
# Navigate to backend and install dependencies
cd backend
npm install

# Start backend server (runs on port 5000)
npm run dev
# or
node server.js
```

### 3. Frontend Setup
```bash
# Navigate to frontend and install dependencies
cd frontend
npm install

# Start Vite development server (runs on port 3000 with proxy to 5000)
npm run dev

# Or build production bundle (served directly by backend on port 5000)
npm run build
```

---

## 🔑 Quick Demo Credentials

| Role | Name | Service Number | Password |
|---|---|---|---|
| **Officer** | Major Vikram Singh | `IC-10293` | `password123` |
| **Operator** | Havildar Rajesh Kumar | `OR-88412` | `password123` |

---

## 🗺️ Key Features

1. **Dedicated Authentication Portal:**
   - Military Service Number verification with quick role switching.
2. **Tactical GIS Logistics Map (OpenStreetMap):**
   - Active corridor tracking along NH-1D, Kargil-Leh axis, and Khardung La Pass to Siachen Base Camp.
   - Interactive convoy markers with live pulse indicators and real-time health telemetry.
3. **AI Demand Forecasting Engine:**
   - Multi-echelon horizon projections (7, 15, 30, and 60 days) across Ammunition, Rations, FOL, and Medical supplies.
   - Automatic reorder trigger alerts when sustainability falls below buffer thresholds.
4. **Tactical Indents & Requisitions:**
   - Live status workflow (`PENDING` ➔ `APPROVED` ➔ `DISPATCHED` ➔ `DELIVERED`).
   - Priority filtering (`CRITICAL`, `HIGH`, `MEDIUM`).
5. **IoT Sensor & Convoy Telemetry Tracker:**
   - Live temperature, sealed humidity, and solar battery monitoring.
   - Interactive real-time telemetry injector simulator for instant demonstration during presentations.
