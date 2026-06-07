# 🎯 Sentiment Analysis Web App

A full-stack AI-powered sentiment analysis application built from scratch.

## 🚀 Live Demo
Coming soon...

## 📸 Features
- ✅ **Basic ML Model** — Logistic Regression trained on 50,000 IMDB reviews (89% accuracy)
- ✅ **Groq LLaMA3** — Advanced AI that understands sarcasm and context
- ✅ **File Upload** — Upload .txt files and analyze every sentence
- ✅ **Paragraph Analysis** — Sentence by sentence breakdown
- ✅ **Export CSV** — Download your analysis results
- ✅ **History** — Track last 10 analyses
- ✅ **Dashboard** — Visual analytics with pie chart
- ✅ **Beautiful UI** — Smooth animations with Framer Motion

## 🛠️ Tech Stack

### AI/ML
- Python
- Scikit-learn (Logistic Regression)
- TF-IDF Vectorizer
- Groq LLaMA3 API

### Backend
- FastAPI
- Uvicorn
- Pydantic

### Frontend
- React.js + Vite
- Framer Motion
- Recharts
- React Icons
- Axios

## 📁 Project Structure
sentiment-app/
├── model/
│   ├── train.ipynb
│   ├── model.pkl
│   └── vectorizer.pkl
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
└── README.md

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/EimanZahra1472/sentiment-app.git
cd sentiment-app
```

### 2. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install backend dependencies
```bash
pip install fastapi uvicorn scikit-learn pandas numpy python-multipart groq python-dotenv
```

### 4. Setup environment variables
Create a `.env` file in root folder:
GROQ_API_KEY=your_groq_api_key_here

### 5. Download Dataset
Download IMDB Dataset from Kaggle and place in `model/dataset/` folder:
👉 https://www.kaggle.com/datasets/lakshmi25npathi/imdb-dataset-of-50k-movie-reviews

### 6. Train the model
Open `model/train.ipynb` and run all cells

### 7. Run the backend
```bash
uvicorn backend.main:app --reload
```

### 8. Run the frontend
```bash
cd frontend
npm install
npm run dev
```

### 9. Open the app
http://localhost:5173

## 🧠 How It Works
User Input
↓
React Frontend
↓
FastAPI Backend
↓
ML Model / Groq LLaMA3
↓
Sentiment Result (POSITIVE/NEGATIVE/NEUTRAL)
↓
Beautiful UI Display

## 📊 Model Performance

### Local Model (Logistic Regression)
| Metric | Score |
|---|---|
| Accuracy | 89.55% |
| Precision (Positive) | 90% |
| Recall (Positive) | 91% |
| F1 Score (Positive) | 90% |
| Precision (Negative) | 90% |
| Recall (Negative) | 88% |
| F1 Score (Negative) | 89% |

- **Dataset:** IMDB 50,000 movie reviews
- **Train/Test Split:** 80/20
- **Algorithm:** Logistic Regression + TF-IDF (10,000 features)
- **Training Samples:** 40,000
- **Testing Samples:** 10,000

### Groq LLaMA3 Model
- Handles sarcasm, context and neutral sentiment
- Used as primary model for complex analysis
- Falls back to local model if API unavailable

## 👩‍💻 Author
**Eiman Zahra**
- GitHub: [@EimanZahra1472](https://github.com/EimanZahra1472)
- LinkedIn: [linkedin.com/in/eiman-zahra]

## 📄 License
MIT License