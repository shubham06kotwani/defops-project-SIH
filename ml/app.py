"""
DEFOPS - Military Supply Chain Predictive Demand ML Microservice
Framework: Flask / Gunicorn
Endpoints:
- GET  /health          : Health check
- GET  /ml/weights      : Model weights and evaluation metrics
- POST /ml/predict      : Run predictive demand inference
- POST /ml/train        : Retrain Ridge regression model
"""

import os
import json
from flask import Flask, request, jsonify
import numpy as np

app = Flask(__name__)

try:
    from flask_cors import CORS
    CORS(app)
except ImportError:
    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        return response

WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), 'model_weights.json')

def load_weights():
    if os.path.exists(WEIGHTS_PATH):
        with open(WEIGHTS_PATH, 'r') as f:
            return json.load(f)
    return {
        "model": "DEFOPS Ridge Regression Forecaster v2.4",
        "r2_score": 0.9428,
        "mae": 8.79,
        "bias": 33.2935,
        "weights": {
            "elevation_meters": 0.008,
            "ambient_temp_celsius": -1.9369,
            "terrain_friction": 0.0621,
            "troop_strength": 0.0443,
            "is_ammunition": -15.4391,
            "is_rations": 16.1877,
            "is_fol": 57.5476,
            "is_medical": -58.2962
        }
    }

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "ONLINE",
        "service": "DEFOPS Military Supply Chain Predictive Demand ML Microservice",
        "version": "2.4.0",
        "framework": "Flask / Gunicorn",
        "endpoints": {
            "root": "GET /",
            "health": "GET /health",
            "weights": "GET /ml/weights",
            "predict": "POST /ml/predict",
            "train": "POST /ml/train"
        }
    }), 200

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "HEALTHY",
        "service": "DEFOPS-ML-INFERENCE-ENGINE",
        "runtime": "Python 3.11 / Flask"
    }), 200

@app.route('/ml/weights', methods=['GET'])
def get_weights():
    weights = load_weights()
    return jsonify(weights), 200

@app.route('/ml/train', methods=['POST'])
def train():
    try:
        from train_forecast_model import train_and_export_coefficients
        train_and_export_coefficients()
        weights = load_weights()
        return jsonify({
            "success": True,
            "message": "Model retrained and weights updated successfully.",
            "metrics": {
                "r2Score": weights.get("r2_score"),
                "mae": weights.get("mae")
            }
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/ml/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(silent=True) or {}
        
        elevation = float(data.get('elevation', 3500))
        temperature = float(data.get('temperature', -5))
        friction = float(data.get('friction', 1.1))
        troops = float(data.get('troops', 500))
        days_ahead = int(data.get('daysAhead', 30))
        category = str(data.get('category', 'RATIONS')).upper()

        model_data = load_weights()
        w = model_data.get('weights', {})
        bias = model_data.get('bias', 33.2935)

        is_ammo = 1.0 if category == 'AMMUNITION' else 0.0
        is_rat = 1.0 if category == 'RATIONS' else 0.0
        is_fol = 1.0 if category == 'FOL' else 0.0
        is_med = 1.0 if category == 'MEDICAL' else 0.0

        # Ridge Regression inference equation: y = bias + sum(w_i * x_i)
        daily_burn = (
            bias
            + w.get('elevation_meters', 0.008) * elevation
            + w.get('ambient_temp_celsius', -1.9369) * temperature
            + w.get('terrain_friction', 0.0621) * friction
            + w.get('troop_strength', 0.0443) * troops
            + w.get('is_ammunition', -15.4391) * is_ammo
            + w.get('is_rations', 16.1877) * is_rat
            + w.get('is_fol', 57.5476) * is_fol
            + w.get('is_medical', -58.2962) * is_med
        )

        daily_burn = max(5.0, round(float(daily_burn), 2))
        total_projected = round(daily_burn * days_ahead)

        return jsonify({
            "success": True,
            "category": category,
            "input": {
                "elevationMeters": elevation,
                "ambientTempCelsius": temperature,
                "terrainFriction": friction,
                "troopStrength": troops,
                "daysAhead": days_ahead
            },
            "prediction": {
                "dailyBurnRateUnits": daily_burn,
                "totalProjectedRequirement": total_projected,
                "safetyBufferUnits": round(daily_burn * 6.5)
            },
            "modelMetrics": {
                "r2Score": model_data.get('r2_score', 0.9428),
                "mae": model_data.get('mae', 8.79)
            }
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
