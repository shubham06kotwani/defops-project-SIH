"""
DEFOPS - Military Supply Chain Predictive Demand ML Training Script
Theme: Forward Formations Logistics Assurance (Northern Command / Siachen / Kargil)

This script trains a Ridge-regularized Multivariate Regression Model
predicting daily consumption burn rate based on:
- Elevation (meters)
- Ambient Temperature (Celsius)
- Terrain & High-Pass Friction Factor
- Operational Post Type (Glacier vs Frontier vs Transit Hub)
- Historical Supply Velocity (Ammunition, Rations, FOL, Medical)
"""

import os
import json
import numpy as np

# Sample operational dataset representing 180 days of forward logistics burn
SECTORS = {
    'NORTHERN_COMMAND': {'elevation': 3500, 'temp': -5, 'friction': 1.05},
    'SIACHEN_SECTOR': {'elevation': 5400, 'temp': -36, 'friction': 1.45},
    'KARGIL_SECTOR': {'elevation': 4200, 'temp': -19, 'friction': 1.28},
}

CATEGORIES = ['AMMUNITION', 'RATIONS', 'FOL', 'MEDICAL']

def generate_synthetic_operational_data(samples=1000):
    np.random.seed(42)
    X = []
    y = []

    for _ in range(samples):
        sec_key = np.random.choice(list(SECTORS.keys()))
        sec = SECTORS[sec_key]
        cat = np.random.choice(CATEGORIES)
        
        cat_idx = CATEGORIES.index(cat)
        cat_one_hot = [1 if i == cat_idx else 0 for i in range(len(CATEGORIES))]
        troop_strength = np.random.randint(150, 600)
        
        # Base consumption per category
        base_burn = {
            'AMMUNITION': 45.0,
            'RATIONS': 60.0,
            'FOL': 80.0,
            'MEDICAL': 24.0
        }[cat]

        # Alpine climate penalty
        temp_penalty = 1.0 + max(0, -sec['temp'] * 0.012)
        elevation_penalty = 1.0 + (sec['elevation'] / 15000.0)
        noise = np.random.normal(0, 1.2)

        burn_rate = (base_burn * temp_penalty * elevation_penalty * sec['friction']) + (troop_strength * 0.04) + noise

        features = [
            sec['elevation'],
            sec['temp'],
            sec['friction'],
            troop_strength
        ] + cat_one_hot
        
        X.append(features)
        y.append(max(5.0, burn_rate))

    return np.array(X), np.array(y)

def train_and_export_coefficients():
    print("=" * 60)
    print("DEFOPS TACTICAL ML MODEL TRAINING PIPELINE")
    print("=" * 60)
    
    X, y = generate_synthetic_operational_data()
    print(f"[1] Synthesized {len(X)} operational supply data points.")

    # Train-test split
    split = int(0.8 * len(X))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    # OLS / Ridge Normal Equation: theta = (X^T X + lambda*I)^-1 X^T y
    X_b = np.c_[np.ones((len(X_train), 1)), X_train]
    X_b_test = np.c_[np.ones((len(X_test), 1)), X_test]
    
    lmbda = 0.1
    I = np.eye(X_b.shape[1])
    I[0, 0] = 0 # Don't regularize bias
    
    theta = np.linalg.inv(X_b.T.dot(X_b) + lmbda * I).dot(X_b.T).dot(y_train)

    # Evaluation
    preds = X_b_test.dot(theta)
    mae = np.mean(np.abs(preds - y_test))
    r2 = 1 - (np.sum((y_test - preds)**2) / np.sum((y_test - np.mean(y_test))**2))

    print(f"[2] Model Trained: Ridge Regression (Alpha = {lmbda})")
    print(f"[3] Test Mean Absolute Error (MAE): {mae:.2f} units/day")
    print(f"[4] Coefficient of Determination (R²): {r2:.4f}")

    weights = {
        'model': 'DEFOPS Ridge Regression Forecaster v2.4',
        'r2_score': float(round(r2, 4)),
        'mae': float(round(mae, 2)),
        'bias': float(round(theta[0], 4)),
        'weights': {
            'elevation_meters': float(round(theta[1], 4)),
            'ambient_temp_celsius': float(round(theta[2], 4)),
            'terrain_friction': float(round(theta[3], 4)),
            'troop_strength': float(round(theta[4], 4)),
            'is_ammunition': float(round(theta[5], 4)),
            'is_rations': float(round(theta[6], 4)),
            'is_fol': float(round(theta[7], 4)),
            'is_medical': float(round(theta[8], 4))
        }
    }

    out_file = os.path.join(os.path.dirname(__file__), 'model_weights.json')
    with open(out_file, 'w') as f:
        json.dump(weights, f, indent=2)

    print(f"[5] Exported trained model weights to: {out_file}")
    print("=" * 60)

if __name__ == '__main__':
    train_and_export_coefficients()
