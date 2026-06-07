from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import re
import os
import json
from fastapi import FastAPI, UploadFile, File
import io
import requests
from groq import Groq
from dotenv import load_dotenv


load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
HF_API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"

# Initialize app
app = FastAPI(title="Sentiment Analysis API")

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and vectorizer
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '..', 'model', 'model.pkl')
VECTORIZER_PATH = os.path.join(BASE_DIR, '..', 'model', 'vectorizer.pkl')

with open(MODEL_PATH, 'rb') as f:
    model = pickle.load(f)

with open(VECTORIZER_PATH, 'rb') as f:
    vectorizer = pickle.load(f)

# Input structure
class TextInput(BaseModel):
    text: str

# Clean text function
def clean_text(text):
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = text.lower()
    text = text.strip()
    return text

# Fallback model when Groq fails
def fallback_predict(text: str, reason: str):
    cleaned = clean_text(text)
    vectorized = vectorizer.transform([cleaned])
    prediction = model.predict(vectorized)[0]
    confidence = model.predict_proba(vectorized)[0]
    score = round(max(confidence) * 100, 2)
    label = "POSITIVE" if prediction == 1 else "NEGATIVE"

    return {
        "text": text,
        "sentiment": label,
        "confidence": score,
        "reason": f"Groq unavailable ({reason}) — using local model as fallback",
        "model": "Local ML (fallback)"
    }

# Root endpoint
@app.get("/")
def home():
    return {"message": "Sentiment Analysis API is running! ✅"}

# Predict endpoint
@app.post("/predict")
def predict(input: TextInput):
    cleaned = clean_text(input.text)
    vectorized = vectorizer.transform([cleaned])
    prediction = model.predict(vectorized)[0]
    confidence = model.predict_proba(vectorized)[0]

    label = "POSITIVE" if prediction == 1 else "NEGATIVE"
    score = round(confidence[prediction] * 100, 2)

    return {
        "text": input.text,
        "sentiment": label,
        "confidence": score
    }
@app.post("/predict-file")
async def predict_file(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8")
    
    # Split into sentences
    sentences = [s.strip() for s in text.replace("!", ".").replace("?", ".").split(".") if s.strip()]
    
    results = []
    for sentence in sentences:
        if len(sentence) > 3:
            cleaned = clean_text(sentence)
            vectorized = vectorizer.transform([cleaned])
            prediction = model.predict(vectorized)[0]
            confidence = model.predict_proba(vectorized)[0]
            label = "POSITIVE" if prediction == 1 else "NEGATIVE"
            score = round(confidence[prediction] * 100, 2)
            results.append({
                "text": sentence,
                "sentiment": label,
                "confidence": score
            })
    
    positive = len([r for r in results if r["sentiment"] == "POSITIVE"])
    negative = len([r for r in results if r["sentiment"] == "NEGATIVE"])
    
    return {
        "total": len(results),
        "positive": positive,
        "negative": negative,
        "results": results
    }

@app.post("/predict-paragraph")
def predict_paragraph(input: TextInput):
    text = input.text
    
    # Split into sentences
    sentences = [s.strip() for s in text.replace("!", ".").replace("?", ".").split(".") if s.strip()]
    
    results = []
    for sentence in sentences:
        if len(sentence) > 3:
            cleaned = clean_text(sentence)
            vectorized = vectorizer.transform([cleaned])
            prediction = model.predict(vectorized)[0]
            confidence = model.predict_proba(vectorized)[0]
            label = "POSITIVE" if prediction == 1 else "NEGATIVE"
            score = round(confidence[prediction] * 100, 2)
            results.append({
                "text": sentence,
                "sentiment": label,
                "confidence": score
            })

    positive = len([r for r in results if r["sentiment"] == "POSITIVE"])
    negative = len([r for r in results if r["sentiment"] == "NEGATIVE"])

    return {
        "total": len(results),
        "positive": positive,
        "negative": negative,
        "results": results
    }
@app.post("/predict-bert")
def predict_bert(input: TextInput):
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    payload = {"inputs": input.text}
    
    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload)
        result = response.json()
        
        # Handle model loading
        if "error" in result:
            return {"error": result["error"]}
        
        # Parse result
        scores = result[0]
        top = max(scores, key=lambda x: x["score"])
        
        label = "POSITIVE" if top["label"] == "POSITIVE" else "NEGATIVE"
        confidence = round(top["score"] * 100, 2)
        
        return {
            "text": input.text,
            "sentiment": label,
            "confidence": confidence,
            "model": "BERT"
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict-groq")
def predict_groq(input: TextInput):
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": """You are a sentiment analysis expert. 
                    Analyze the sentiment of the given text and respond with ONLY a JSON object in this exact format:
                    {"sentiment": "POSITIVE", "confidence": 95.5, "reason": "brief reason"}
                    Sentiment must be either POSITIVE or NEGATIVE.
                    Confidence must be a number between 0 and 100.
                    Do not include any other text."""
                },
                {
                    "role": "user", 
                    "content": f"Analyze the sentiment of this text: {input.text}"
                }
            ],
            model="llama-3.3-70b-versatile",
            timeout=10,
        )
        
        response_text = chat_completion.choices[0].message.content
        response_text = response_text.strip()
        json_match = re.search(r'\{.*?\}', response_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            raise ValueError("No JSON found in response")

        sentiment = result.get("sentiment")
        if sentiment not in ["POSITIVE", "NEGATIVE", "NEUTRAL"]:
            sentiment = "NEUTRAL"

        return {
            "text": input.text,
            "sentiment": sentiment,
            "confidence": result.get("confidence"),
            "reason": result.get("reason", ""),
            "model": "Groq LLaMA3"
        }
    except json.JSONDecodeError:
        # Fallback to basic model if Groq returns bad JSON
        return fallback_predict(input.text, "Groq returned invalid response")
    except Exception as e:
        error_msg = str(e)
        # Fallback to basic model if Groq is down
        return fallback_predict(input.text, error_msg)