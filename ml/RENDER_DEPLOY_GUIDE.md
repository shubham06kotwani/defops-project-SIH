# 🚀 DEFOPS ML Microservice — Render Deployment Guide

This guide walks you through deploying the **DEFOPS Machine Learning Demand Forecasting Engine** to [Render](https://render.com) on the **Free Tier**.

---

## 📋 Microservice Overview
- **Framework:** Python 3.11 / Flask / Gunicorn
- **Directory:** `/ml`
- **Model:** Ridge-Regularized Multivariate Regressor (Alpine supply burn rate)
- **Health Check Endpoint:** `GET /health`
- **Prediction Endpoint:** `POST /ml/predict`
- **Weights & Metrics Endpoint:** `GET /ml/weights`
- **Model Retraining Endpoint:** `POST /ml/train`

---

## 🛠️ Method 1: Deploy via Render Dashboard (Recommended & Easiest)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Configure ML microservice for Render deployment"
   git push origin main
   ```

2. **Log in to [Render Dashboard](https://dashboard.render.com/)**:
   - Click the **New +** button in the top right.
   - Select **Web Service**.

3. **Connect your Git Repository:**
   - Select your GitHub repository (`defops project SIH` or your repo name).
   - Click **Connect**.

4. **Fill in the Web Service Settings:**

   | Setting | Value |
   | :--- | :--- |
   | **Name** | `defops-ml-service` (or any unique name) |
   | **Region** | `Singapore (Southeast Asia)` or closest to your users |
   | **Branch** | `main` (or your active branch) |
   | **Root Directory** | `ml` ⚠️ *(Critical: sets working dir to the ml folder)* |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn app:app --bind 0.0.0.0:$PORT` |
   | **Instance Type** | `Free` ($0/month) |

5. **Advanced Settings (Optional but Recommended):**
   - Click **Advanced**.
   - Under **Health Check Path**, enter: `/health`
   - Under **Auto-Deploy**, set to: `Yes` (automatically redeploys on new git pushes).

6. **Click "Create Web Service"**:
   - Render will clone the repo, install dependencies from `requirements.txt`, and start Gunicorn.
   - Once deployed, you will get a live URL such as:
     `https://defops-ml-service.onrender.com`

---

## ⚡ Method 2: Deploy using Render Blueprint (`render.yaml`)

We have added a `render.yaml` file to your project root.

1. Push your repository to GitHub.
2. In the Render Dashboard, click **New +** ➡️ **Blueprint**.
3. Select your repository.
4. Render will automatically read `render.yaml`, configure the `ml/` root directory, Python runtime, build command, start command, and health check.
5. Click **Apply**.

---

## 🧪 Testing Your Live Deployed Service

Once your service status turns **Live** in Render, test it with `curl` or Postman:

### 1. Test Health Check
```bash
curl https://<your-service-name>.onrender.com/health
```
**Expected Response (200 OK):**
```json
{
  "runtime": "Python 3.11 / Flask",
  "service": "DEFOPS-ML-INFERENCE-ENGINE",
  "status": "HEALTHY"
}
```

### 2. Test Demand Prediction (`POST /ml/predict`)
```bash
curl -X POST https://<your-service-name>.onrender.com/ml/predict \
  -H "Content-Type: application/json" \
  -d '{
    "elevation": 3500,
    "temperature": -10,
    "friction": 1.15,
    "troops": 500,
    "daysAhead": 30,
    "category": "FOL"
  }'
```
**Expected Response (200 OK):**
```json
{
  "success": true,
  "category": "FOL",
  "input": {
    "ambientTempCelsius": -10.0,
    "daysAhead": 30,
    "elevationMeters": 3500.0,
    "terrainFriction": 1.15,
    "troopStrength": 500.0
  },
  "prediction": {
    "dailyBurnRateUnits": 178.69,
    "safetyBufferUnits": 1161,
    "totalProjectedRequirement": 5361
  },
  "modelMetrics": {
    "mae": 8.79,
    "r2Score": 0.9428
  }
}
```

---

## 🔗 Connecting to your Node.js Backend

In your backend `.env` file (e.g. `backend/.env`):
```env
ML_SERVICE_URL=https://<your-service-name>.onrender.com
```

> **Note on Render Free Tier:**
> Free tier Web Services spin down after 15 minutes of inactivity. The first request after sleep may take ~30-50 seconds to wake up (cold start). The `/health` endpoint is configured so Render's internal monitor keeps it warm during active deployment.
