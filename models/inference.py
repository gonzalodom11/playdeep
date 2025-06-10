import torch
import numpy as np
from sports.common.team import TeamClassifier

# Load the trained TeamClassifier from file
model = torch.load("team_classifier.pt", map_location="cpu")

# Example: Predict team for a list of player crops (numpy arrays)
def predict_teams(crops):
    """
    Predicts team assignments for a list of player crops (numpy arrays).
    Args:
        crops (List[np.ndarray]): List of player crops as numpy arrays.
    Returns:
        np.ndarray: Predicted team labels (0 or 1)
    """
    return model.predict(crops)

if __name__ == "__main__":
    # Example usage: load a crop and predict
    # Replace this with your own image loading logic
    # For demonstration, we use a dummy crop
    dummy_crop = np.zeros((224, 224, 3), dtype=np.uint8)  # Replace with real crop
    crops = [dummy_crop]
    preds = predict_teams(crops)
    print("Predicted team labels:", preds)
