from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import urllib.parse
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import joblib
import pandas as pd
import os


app = Flask(__name__)
CORS(app) 

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Create table for db
class User(db.Model):
    __tablename__ = 'users' 
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

class PredictionHistory(db.Model):
    __tablename__ = 'prediction_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    age = db.Column(db.Float, nullable=False)
    sleep_duration = db.Column(db.Float, nullable=False)
    quality_of_sleep = db.Column(db.Integer, nullable=False)
    physical_activity = db.Column(db.Integer, nullable=False)
    stress_level = db.Column(db.Integer, nullable=False)
    bmi_category = db.Column(db.String(20), nullable=False)
    blood_pressure = db.Column(db.String(20), nullable=False)
    heart_rate = db.Column(db.Integer, nullable=False)
    daily_steps = db.Column(db.Integer, nullable=False)
    result_prediction = db.Column(db.String(50), nullable=False)
    

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
    
    try:
        bp_string = f"{int(data['systolic'])}/{int(data['diastolic'])}"
        new_history = PredictionHistory(
            user_id=data.get('user_id'), 
            age=float(data['age']),
            sleep_duration=float(data['sleep_duration']),
            quality_of_sleep=int(data['quality_of_sleep']),
            physical_activity=int(data['physical_activity']),
            stress_level=int(data['stress_level']),
            bmi_category=data['bmi'],
            blood_pressure=bp_string,
            heart_rate=int(data['heart_rate']),
            daily_steps=int(data['daily_steps']),
            result_prediction=str(pred_class)
        )
        db.session.add(new_history)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)})
    
    return jsonify({'status': 'success', 'prediction': pred_class})

# Tambahkan import werkzeug untuk keamanan password jika belum ada
from werkzeug.security import generate_password_hash, check_password_hash

# ── ENDPOINT REGISTER ──
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'status': 'error', 'message': 'Username dan password harus diisi'}), 400
        
    # Cek apakah username sudah terdaftar
    user_exists = User.query.filter_by(username=username).first()
    if user_exists:
        return jsonify({'status': 'error', 'message': 'Username sudah digunakan'}), 400
        
    # Hash password demi keamanan sebelum disimpan
    hashed_password = generate_password_hash(password)
    
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'status': 'success', 
        'message': 'Registrasi berhasil!',
        'user': {'id': new_user.id, 'username': new_user.username}
    })

# ── ENDPOINT LOGIN ──
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    # Validasi user dan kecocokan hash password
    if not user or not check_password_hash(user.password, password):
        return jsonify({'status': 'error', 'message': 'Username atau password salah'}), 401
        
    return jsonify({
        'status': 'success',
        'message': 'Login berhasil!',
        'user': {'id': user.id, 'username': user.username}
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)