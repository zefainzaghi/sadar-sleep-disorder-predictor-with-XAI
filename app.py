from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app) # Crucial: Allows your HTML file to talk to this API

# Load the files you downloaded from Colab
model = joblib.load('Model/xgboost_sleep_model.pkl')
le_bmi = joblib.load('Model/le_bmi.pkl')
le_target = joblib.load('Model/le_target.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    
    # 1. Transform the categorical inputs
    bmi_enc = le_bmi.transform([data['bmi']])[0]
    gender_enc = 1 if data['gender'] == 'Male' else 0 
    
    # 2. Structure the data exactly as your model expects
    features = pd.DataFrame([{
        'Age': float(data['age']),
        'Gender_enc': gender_enc,
        'Sleep Duration': float(data['sleep_duration']),
        'Quality of Sleep': float(data['quality_of_sleep']),
        'Physical Activity Level': float(data['physical_activity']),
        'Stress Level': float(data['stress_level']),
        'BMI_enc': float(bmi_enc),
        'Systolic': float(data['systolic']),
        'Diastolic': float(data['diastolic']),
        'Heart Rate': float(data['heart_rate']),
        'Daily Steps': float(data['daily_steps'])
    }])
    
    # 3. Predict and return
    pred_idx = model.predict(features)[0]
    pred_class = le_target.inverse_transform([pred_idx])[0]
    
    return jsonify({'status': 'success', 'prediction': pred_class})

if __name__ == '__main__':
    app.run(port=5000)