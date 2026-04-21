# Scripture Backend API Guide

This guide details the endpoints available in the Scripture backend API.

## Base URL

`http://localhost:8000`

## Endpoints

### 1. Health Check

Checks if the API is running.

- **URL:** `/`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "status": "online",
    "message": "Scripture Backend is ready. POST to /predict with an image file."
  }
  ```

### 2. Predict Letter

Upload an image of a handwritten letter to get a prediction.

- **URL:** `/predict`
- **Method:** `POST`
- **Headers:** `Content-Type: multipart/form-data`
- **Body:**
  - `file`: The image file (binary). Supports PNG, JPG, JPEG.
- **Response:**
  ```json
  {
    "prediction": "A",
    "confidence": 0.985,
    "metrics": {
      "A": 0.985,
      "B": 0.001,
      "C": 0.000,
      ...
      "Z": 0.002
    }
  }
  ```

## Integration Guide (Frontend)

To integrate this with your frontend:

1.  **Capture Image:** Get the canvas data or file input from the user.
2.  **FormData:** Create a `FormData` object.
    ```javascript
    const formData = new FormData();
    formData.append("file", imageFile); // 'imageFile' is your Blob or File object
    ```
3.  **Fetch Request:**
    ```javascript
    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    ```
4.  **Display Results:**
    - Use `data.prediction` to show the main result.
    - Use `data.metrics` (which is a dictionary of 'Letter': Probability) to draw a bar chart showing the model's confusion or confidence distribution.

## Notes

- The model expects **white text on a black background** (standard EMNIST).
- The API includes an automatic inverter: if you send **black text on a white background** (typical drawing canvas), the API will automatically invert it before processing.
