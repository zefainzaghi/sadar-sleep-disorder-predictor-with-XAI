# SADAR — Sleep Apnea & Disorder Advanced Reasoning

> **Disclaimer:** This application is not a substitute for medical diagnosis. All results are indicative only and should be discussed with a qualified healthcare professional.

**Live Demo:** [sadarai.netlify.app](https://sadarai.netlify.app)

## Table of Contents

- [Project Description](#project-description)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Machine Learning Model](#machine-learning-model)
- [API Endpoints](#api-endpoints)
- [Tech Stack](#tech-stack)
- [Local Development Setup](#local-development-setup)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Input Fields & Validation](#input-fields--validation)
- [Output & Result Interpretation](#output--result-interpretation)
- [Development Notes](#development-notes)
- [License](#license)

---

## Project Description

**SADAR** is an AI-powered web application for early detection of sleep disorder indicators. Users fill out a short health form, and the system processes the input through a trained **XGBoost** machine learning model to classify the user's sleep condition and deliver personalized recommendations.

Designed as an accessible self-screening tool — no special equipment required, results in under 2 minutes.

**Detectable conditions:**

- **Insomnia** — difficulty initiating or maintaining sleep
- **Sleep Apnea** — repeated interruptions in breathing during sleep
- **Healthy Sleep Pattern** — no disorder indicators detected (`None`)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│                                                          │
│   index.html  →  login.html  →  dashboard.html           │
│                       ↑               ↑                  │
│                  style.css       dashboard.js            │
│                                                          │
│              Hosted on: Netlify                          │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTPS POST (JSON)
                          │ https://sadar-sleep-disorder-predictor-
                          │ with-xai-production.up.railway.app
                          ▼
┌──────────────────────────────────────────────────────────┐
│                BACKEND (Flask / Python)                  │
│                                                          │
│   /login    ──►  PostgreSQL (table: users)               │
│   /register ──►  PostgreSQL (table: users)               │
│   /predict  ──►  XGBoost Model                           │
│                       └──► PostgreSQL                    │
│                            (table: prediction_history)   │
│                                                          │
│              Hosted on: Railway                          │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                  MODEL (folder: Model/)                  │
│                                                          │
│   xgboost_sleep_model.pkl                                │
│   le_bmi.pkl  ·  le_gender.pkl  ·  le_target.pkl         │
└──────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
sadar-sleep-disorder-predictor-with-XAI/
│
├── app.py                      # Flask backend (API server)
│
├── index.html                  # Entry point (redirects to landing page)
├── landingPage.html            # Public landing page
├── login.html                  # Login & registration page
├── dashboard.html              # Main analysis dashboard
│
├── css/
│   └── style.css               # Global design system (dark theme)
│
├── js/
│   └── dashboard.js            # Frontend logic: form, XAI engine, history
│
├── Model/
│   ├── xgboost_sleep_model.pkl # Trained XGBoost classifier
│   ├── le_bmi.pkl              # Label encoder for BMI category
│   ├── le_gender.pkl           # Label encoder for gender
│   └── le_target.pkl           # Label encoder for prediction output
│
├── Procfile                    # Railway process declaration
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

### Key File Descriptions

**`app.py`**
Flask API server. Handles user authentication (login/register) with secure password hashing via Werkzeug, loads the ML model and encoders from the `Model/` folder, saves every prediction result to PostgreSQL, and exposes `/predict`, `/login`, and `/register` endpoints.

**`dashboard.html`**
The core application page after login. Renders the health input form, prediction result card with an Explainable AI (XAI) panel, factor contribution visualizations, personalized recommendations, and the user's analysis history.

**`login.html`**
Authentication page with two modes: Login and Register. Saves the user session to `sessionStorage` upon successful authentication.

**`css/style.css`**
Global design system with a night-sky dark theme using CSS variables: `--night`, `--sage`, `--moon`, `--muted`, etc. Covers navigation, buttons, forms, cards, sidebar, tags, and slider components.

**`js/dashboard.js`**
Frontend logic including: form submission to the backend API, XAI factor computation engine (`computeFactors`), prediction and recommendation rendering, local history management via `localStorage`, and user profile initialization from `sessionStorage`.

---

## Key Features

### Sleep Disorder Prediction

The XGBoost model analyzes 11 health and lifestyle parameters to classify sleep conditions into three categories: Healthy Sleep, Insomnia, or Sleep Apnea.

### Explainable AI (XAI)

Every prediction result is accompanied by a transparent explanation of _why_ the model reached that conclusion:

- Top three most influential factors with progress bar visualizations
- Relative contribution percentage per factor
- Qualitative status labels (e.g., "Very Relaxed", "Active", "Ideal")
- Decision summary narrative in plain language

### Personalized Recommendations

Tailored sleep hygiene advice based on the prediction result — tips for maintaining a healthy pattern, steps for managing insomnia, or guidance for sleep apnea.

### Local Analysis History

Each prediction is saved in the browser's `localStorage`. Users can track trends over time and clear history at any time.

### Persistent Database History

Each prediction is also permanently stored in the `prediction_history` table in PostgreSQL on Railway, linked to the logged-in user's account.

### Dark Mode UI

The entire interface uses a night-sky dark theme, comfortable for evening use.

---

## Machine Learning Model

### Algorithm

The model uses **XGBoost (Extreme Gradient Boosting)** trained for multi-class sleep disorder classification.

### Model Input Features

The model receives 11 features after preprocessing:

| Feature Name in Model     | Input Field              | Type      |
| ------------------------- | ------------------------ | --------- |
| `Age`                     | Age                      | Float     |
| `Gender_enc`              | Gender                   | Int (0/1) |
| `Sleep Duration`          | Sleep Duration           | Float     |
| `Quality of Sleep`        | Sleep Quality            | Float     |
| `Physical Activity Level` | Physical Activity        | Float     |
| `Stress Level`            | Stress Level             | Float     |
| `BMI_enc`                 | BMI Category             | Float     |
| `Systolic`                | Systolic Blood Pressure  | Float     |
| `Diastolic`               | Diastolic Blood Pressure | Float     |
| `Heart Rate`              | Heart Rate               | Float     |
| `Daily Steps`             | Daily Steps              | Float     |

### Encoders

- **`le_bmi.pkl`** — converts `"Normal"`, `"Overweight"`, `"Obese"` to numeric values
- **`le_gender.pkl`** — gender encoding reference (implemented manually: Male=1, Female=0)
- **`le_target.pkl`** — converts prediction index back to class label (`None`, `Insomnia`, `Sleep Apnea`)

### Output Labels

| Label         | Meaning                               |
| ------------- | ------------------------------------- |
| `None`        | No sleep disorder indicators detected |
| `Insomnia`    | Insomnia indicators detected          |
| `Sleep Apnea` | Sleep apnea indicators detected       |

---

## API Endpoints

**Production Base URL:** `https://sadar-sleep-disorder-predictor-with-xai-production.up.railway.app`

**Local Development Base URL:** `http://127.0.0.1:5000`

### `POST /register`

Register a new user account.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Registrasi berhasil!",
  "user": { "id": 1, "username": "yourusername" }
}
```

**Error Response (400):**

```json
{
  "status": "error",
  "message": "Username sudah digunakan"
}
```

---

### `POST /login`

Authenticate an existing user.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Login berhasil!",
  "user": { "id": 1, "username": "yourusername" }
}
```

**Error Response (401):**

```json
{
  "status": "error",
  "message": "Username atau password salah"
}
```

---

### `POST /predict`

Run a sleep disorder prediction and save the result to the database.

**Request Body:**

```json
{
  "user_id": 1,
  "age": 30,
  "gender": "Male",
  "sleep_duration": 6.5,
  "quality_of_sleep": 5,
  "physical_activity": 45,
  "stress_level": 7,
  "bmi": "Normal",
  "systolic": 120,
  "diastolic": 80,
  "heart_rate": 72,
  "daily_steps": 6000
}
```

**Success Response (200):**

```json
{
  "status": "success",
  "prediction": "Insomnia"
}
```

---

## Tech Stack

| Component     | Technology                                               |
| ------------- | -------------------------------------------------------- |
| Backend       | Python, Flask, Flask-CORS, Flask-SQLAlchemy              |
| Database      | PostgreSQL, pg8000 (driver)                              |
| ML Model      | XGBoost, joblib, pandas, scikit-learn                    |
| Security      | Werkzeug (bcrypt password hashing)                       |
| Frontend      | HTML5, CSS3 (CSS Variables), Vanilla JavaScript          |
| Fonts         | Google Fonts — DM Serif Display, DM Sans                 |
| Session       | `sessionStorage` (login), `localStorage` (local history) |
| Frontend Host | Netlify                                                  |
| Backend Host  | Railway                                                  |
| Database Host | Railway (PostgreSQL managed service)                     |

---

## Local Development Setup

### Prerequisites

- Python 3.10 or newer
- PostgreSQL 13 or newer
- A modern browser (Chrome, Firefox, Edge, Safari)

### 1. Clone the Repository

```bash
git clone https://github.com/zefainzaghi/sadar-sleep-disorder-predictor-with-XAI.git
cd sadar-sleep-disorder-predictor-with-XAI
```

### 2. Set Up PostgreSQL

Make sure PostgreSQL is running locally, then create the database:

```sql
CREATE DATABASE sadar;
```

### 3. Create and Activate a Virtual Environment

```bash
python -m venv venv
```

**Windows PowerShell:**

```powershell
venv\Scripts\Activate.ps1
```

**Windows Command Prompt:**

```cmd
venv\Scripts\activate.bat
```

**macOS / Linux:**

```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure the Database Connection

For local development, update `app.py` to point to your local PostgreSQL:

```python
safe_password = urllib.parse.quote_plus("your_password_here")
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+pg8000://postgres:{safe_password}@localhost:5432/sadar'
```

### 6. Verify Model Files

Ensure the `Model/` folder contains all four required files:

```
Model/
├── xgboost_sleep_model.pkl
├── le_bmi.pkl
├── le_gender.pkl
└── le_target.pkl
```

### 7. Run the Backend

```bash
python app.py
```

Database tables (`users` and `prediction_history`) are created automatically on first run. Expected terminal output:

```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### 8. Open the Frontend

Open `index.html` directly in a browser, or use a local HTTP server:

```bash
python -m http.server 8080
# Then visit: http://localhost:8080
```

> **Note:** For local development, make sure the API URLs in `login.html` and `js/dashboard.js` point to `http://127.0.0.1:5000` instead of the Railway production URL.

---

## Deployment

This project uses a **decoupled deployment architecture** — frontend and backend are hosted on separate platforms.

### Overview

| Component | Platform | URL                                                                       |
| --------- | -------- | ------------------------------------------------------------------------- |
| Frontend  | Netlify  | https://sadarai.netlify.app                                               |
| Backend   | Railway  | https://sadar-sleep-disorder-predictor-with-xai-production.up.railway.app |
| Database  | Railway  | PostgreSQL managed service (internal)                                     |

### Frontend — Netlify

The frontend (HTML/CSS/JS) is deployed as a static site on Netlify, connected to this GitHub repository. Every push to the `main` branch triggers an automatic re-deploy.

### Backend — Railway

The Flask backend is deployed on Railway. It reads the `DATABASE_URL` environment variable (injected automatically via Railway's Variable Reference from the PostgreSQL service) to connect to the database.

Key files required for Railway deployment:

- **`Procfile`** — declares the process: `web: python app.py`
- **`requirements.txt`** — lists all Python dependencies
- **`app.py`** — reads `DATABASE_URL` and `PORT` from environment variables

### Checking the Database (Production)

To verify data in the production database, go to the Railway dashboard → Postgres service → **Data** or **Console** tab, then run:

```sql
-- Check registered users
SELECT * FROM users;

-- Check prediction history
SELECT * FROM prediction_history;
```

---

## Usage Guide

1. **Visit** [sadarai.netlify.app](https://sadarai.netlify.app) to access the landing page.
2. **Click "Mulai Analisis"** to go to the login page.
3. **Register or Log In** — create a new account or log in with existing credentials.
4. **Fill in the health form** on the dashboard with your data.
5. **Click "Mulai Analisis AI"** — results appear in under 2 seconds.
6. **Read your results** — prediction label, XAI factor breakdown, and personalized recommendations.
7. **View your history** at the bottom of the dashboard to track trends over time.

---

## Input Fields & Validation

| Field                    | Type    | Range / Options             | Example |
| ------------------------ | ------- | --------------------------- | ------- |
| Age                      | Number  | 1 – 120 years               | 30      |
| Gender                   | Select  | Male / Female               | Male    |
| Sleep Duration           | Decimal | 1 – 24 hours                | 6.5     |
| Sleep Quality            | Slider  | 1 – 10                      | 7       |
| Stress Level             | Slider  | 1 – 10                      | 5       |
| Physical Activity        | Number  | 0 – 480 min/day             | 45      |
| BMI Category             | Select  | Normal / Overweight / Obese | Normal  |
| Systolic Blood Pressure  | Number  | 80 – 200 mmHg               | 120     |
| Diastolic Blood Pressure | Number  | 50 – 130 mmHg               | 80      |
| Resting Heart Rate       | Number  | 40 – 150 BPM                | 72      |
| Daily Steps              | Number  | 0 – 40,000 steps            | 6000    |

All fields are required. Empty fields are highlighted with a red border and focus is directed to the first unfilled field.

---

## Output & Result Interpretation

### Result Labels

| Label                 | Icon | Color  | Interpretation                                      |
| --------------------- | ---- | ------ | --------------------------------------------------- |
| Healthy Sleep         | ✅   | Green  | No disorder detected — maintain your current habits |
| Insomnia Indicator    | ⚠️   | Yellow | Sleep habits and stress management need improvement |
| Sleep Apnea Indicator | 🔴   | Red    | Strongly recommended to consult a doctor            |

### Explainable AI (XAI) Panel

Displays the top three factors most influencing the prediction, each showing:

- The actual value entered by the user
- Relative contribution percentage to the model's decision
- Qualitative status (e.g., "Very Relaxed", "Active", "Ideal")
- A brief description of the factor's influence

### Decision Summary

An auto-generated narrative summarizing the two dominant factors and explaining whether the model's decision was driven by a single factor or a combination of several.

---

## Development Notes

### Current Limitations

- Authentication does not use JWT tokens; sessions are stored in `sessionStorage` and do not persist across browser tabs.
- The model is not updated online; predictions are based on the existing training data.
- No password reset / forgot password mechanism.
- Local history (`localStorage`) is cleared if the user clears browser data.

### Potential Improvements

- Implement JWT for more secure and persistent authentication.
- Add a user profile page to display database-stored prediction history with charts.
- Visualize prediction trends over time with graphs.
- Add server-side input validation before passing data to the model.
- Export analysis history to PDF or CSV.

---

## License

This project was created as part of an academic course assignment.

**SADAR** · Syifa · Zefa · Ranabil · 2026
