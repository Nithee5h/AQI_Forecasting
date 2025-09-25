import joblib
import os

_model_cache = None

# def load_model(model_path: str = "/Users/nitheeswaran/aqi-weather-app/aqi_multivariate_model_shifted.pkl"):
def load_model(model_path: str = "/Users/nitheeswaran/aqi-weather-app/aqi_2020_multivariate_model.pkl"):

    global _model_cache
    if _model_cache is not None:
        return _model_cache
    try:
        _model_cache = joblib.load(model_path)
    except Exception as e:
        # Fallback dummy model
        class DummyModel:
            def predict(self, X):
                import numpy as np
                return np.sum(X, axis=1) * 0.1 + 50
        _model_cache = DummyModel()
        print(f"[WARN] Could not load model at {model_path}, using DummyModel. Error: {e}")
    return _model_cache
