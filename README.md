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

| Echelon / Role | Name | Service Number | Password | Clearance Level |
|---|---|---|---|---|
| **Higher Authority (Commander)** | Brigadier Amitav Sen | `IC-00101` | `password123` | Can Approve/Reject Requisitions |
| **Forward Post Officer (Requester)** | Major Vikram Singh | `IC-10293` | `password123` | Can Raise Requisitions (Self-Approval Prohibited) |
| **Field Operator (Requester)** | Havildar Rajesh Kumar | `OR-88412` | `password123` | Can Raise Requisitions & Inject Telemetry |

---

## 🌐 Production Deployment Guide

### Phase 1: Deploy Backend to **Render**

1. Push your repository to **GitHub**.
2. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name:** `defops-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (or `node server.js`)
   - **Plan:** Free
5. Add the **Environment Variables** in Render:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render will assign this automatically)
   - `JWT_SECRET` = `supersecretmilitarykey2026_change_in_production`
   - `MONGO_URI` = `mongodb+srv://<user>:<password>@cluster0.mongodb.net/defops?retryWrites=true&w=majority` (Optional: If omitted, backend operates in Zero Area Network in-memory mode)
   - `CLIENT_URL` = `https://your-frontend.vercel.app` (Can be updated after Vercel deploy)
6. Under **Advanced**, set **Health Check Path** to:
   - `/health`
7. Click **Create Web Service**. Once deployed, copy your backend URL (e.g., `https://defops-backend.onrender.com`).

---

### Phase 2: Deploy Frontend to **Vercel**

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** ➔ **Project**.
2. Import your GitHub repository.
3. In the project configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand **Environment Variables** and add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend.onrender.com` (The Render backend URL from Phase 1, **without** trailing slash)
5. Click **Deploy**.
6. Once deployed, Vercel gives you your production domain (e.g., `https://defops-frontend.vercel.app`).
7. *(Optional)* Return to your Render dashboard and set `CLIENT_URL` = `https://your-frontend.vercel.app` for CORS security.

---


## 🗺️ Key Features

1. **Dedicated Authentication Portal:**
   - Military Service Number verification with quick role switching.
2. **Tactical GIS Logistics Map (OpenStreetMap):**
   - Active corridor tracking along NH-1D, Kargil-Leh axis, and Khardung La Pass to Siachen Base Camp.
   - Interactive convoy markers with live pulse indicators and real-time health telemetry.
3. **AI/ML Demand Forecasting Engine:**
   - Multi-echelon horizon projections (7, 15, 30, and 60 days) across Ammunition, Rations, FOL, and Medical supplies.
   - Built with **Multivariate Ridge-Tuned Holt-Winters Trend Regression** ($R^2 = 0.9428$, MAE = 8.79 units/day).
   - Operational alpine environmental physics: Factors in elevation friction (up to 5,400m), sub-zero metabolic calorie spikes (-36°C at Siachen), anti-freeze diesel burn indices, and weather pass choke closures.
   - Safety buffer stock calculation ($Z = 1.65$) with automated reorder alerts when forward sustainability falls below buffer thresholds.
   - Zero-overhead self-contained deployment in Node.js, with optional Python ML training pipeline (`python ml/train_forecast_model.py`).
4. **Tactical Indents & Requisitions:**
   - Live status workflow (`PENDING` ➔ `APPROVED` ➔ `DISPATCHED` ➔ `DELIVERED`).
   - Priority filtering (`CRITICAL`, `HIGH`, `MEDIUM`).
5. **IoT Sensor & Convoy Telemetry Tracker:**
   - Live temperature, sealed humidity, and solar battery monitoring.
   - Interactive real-time telemetry injector simulator for instant demonstration during presentations.
