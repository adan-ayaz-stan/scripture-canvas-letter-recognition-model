import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image, ImageOps
import io

app = FastAPI(title="Scripture Backend API", description="API for EMNIST Letter Prediction")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
model = None
MODEL_PATH = "emnist_letter_model_robust.h5"
CLASS_NAMES = [chr(i) for i in range(65, 91)]  # A-Z

def load_model():
    global model
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"✅ Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")

# Load model on startup
load_model()

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Prepares the input image for the model.
    1. Opens image from bytes.
    2. Converts to Grayscale.
    3. Resizes to 28x28.
    4. Inverts colors if necessary (EMNIST is white on black background, usually user draws black on white).
       We assume user draws Black text on White background. EMNIST is usually White text on Black background.
    5. Normalizes to [0, 1].
    6. Reshapes to (1, 28, 28, 1).
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to Grayscale
        img = img.convert('L')
        
        # Resize to 28x28
        img = img.resize((28, 28))
        
        # Check contrast. If the image is mostly light (white background), invert it.
        # EMNIST models are typically trained on white strokes on black background.
        extrema = img.getextrema()
        if extrema[1] > 128: 
            # Simple heuristic: if max pixel is bright, assume white background and invert.
            # Ideally, we should check average brightness.
            stat = ImageOps.grayscale(img).getdata()
            if sum(stat) / len(stat) > 127:
                img = ImageOps.invert(img)
                
        img_array = np.array(img)
        
        # Normalize
        img_array = img_array.astype('float32') / 255.0
        
        # Ensure channel dimension matches model input (28, 28, 1)
        img_array = np.expand_dims(img_array, axis=-1)
        
        # Add batch dimension (1, 28, 28, 1)
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {e}")

@app.get("/")
def home():
    return {
        "status": "online",
        "message": "OptiGuess Backend is ready. POST to /predict with an image file."
    }

@app.post("/predict")
def predict_letter(file: UploadFile = File(...)):
    """
    Accepts an image file, preprocesses it, and returns the predicted letter 
    along with confidence metrics for all classes.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    try:
        contents = file.file.read()
        processed_img = preprocess_image(contents)
        
        # Run prediction
        # TensorFlow predictions are thread-safe but standard model.predict is synchronous.
        # FastAPI runs this function in a threadpool so it won't block the main event loop.
        predictions = model.predict(processed_img)
        
        # Get the first result (batch size 1)
        probs = predictions[0]
        
        # Find max confidence
        max_index = np.argmax(probs)
        predicted_class = CLASS_NAMES[max_index]
        confidence = float(probs[max_index])
        
        # Compile all metrics (class -> probability)
        # Sorting them by probability for easier charting on frontend if needed,
        # but returning a dict is standard.
        metrics = {
            CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))
        }
        
        return {
            "prediction": predicted_class,
            "confidence": confidence,
            "metrics": metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
