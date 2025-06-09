from django.http import HttpResponse
from roboflow import Roboflow
from decouple import config
import os
os.environ["HF_HOME"] = config("HF_HOME")
import supervision as sv
import supervision as sv
from tqdm import tqdm
from sports.common.team import TeamClassifier
from sports.common.view import ViewTransformer
from team_classifier.team_classifier import TeamClassifier as TeamClassifier_v2
import cv2
import torch
import torch.nn as nn
from typing import Optional
import tempfile


from sports.configs.soccer import SoccerPitchConfiguration
import numpy as np
import supervision as sv
from sports.annotators.soccer import (
    draw_pitch,
    draw_points_on_pitch,
    draw_pitch_voronoi_diagram
)


CONFIG = SoccerPitchConfiguration()

def draw_pitch_voronoi_diagram_2(
    config: SoccerPitchConfiguration,
    team_1_xy: np.ndarray,
    team_2_xy: np.ndarray,
    team_1_color: sv.Color = sv.Color.RED,
    team_2_color: sv.Color = sv.Color.WHITE,
    opacity: float = 0.5,
    padding: int = 50,
    scale: float = 0.1,
    pitch: Optional[np.ndarray] = None
) -> np.ndarray:
    """
    Draws a Voronoi diagram on a soccer pitch representing the control areas of two
    teams with smooth color transitions.

    Args:
        config (SoccerPitchConfiguration): Configuration object containing the
            dimensions and layout of the pitch.
        team_1_xy (np.ndarray): Array of (x, y) coordinates representing the positions
            of players in team 1.
        team_2_xy (np.ndarray): Array of (x, y) coordinates representing the positions
            of players in team 2.
        team_1_color (sv.Color, optional): Color representing the control area of
            team 1. Defaults to sv.Color.RED.
        team_2_color (sv.Color, optional): Color representing the control area of
            team 2. Defaults to sv.Color.WHITE.
        opacity (float, optional): Opacity of the Voronoi diagram overlay.
            Defaults to 0.5.
        padding (int, optional): Padding around the pitch in pixels.
            Defaults to 50.
        scale (float, optional): Scaling factor for the pitch dimensions.
            Defaults to 0.1.
        pitch (Optional[np.ndarray], optional): Existing pitch image to draw the
            Voronoi diagram on. If None, a new pitch will be created. Defaults to None.

    Returns:
        np.ndarray: Image of the soccer pitch with the Voronoi diagram overlay.
    """
    if pitch is None:
        pitch = draw_pitch(
            config=config,
            padding=padding,
            scale=scale
        )

    scaled_width = int(config.width * scale)
    scaled_length = int(config.length * scale)

    voronoi = np.zeros_like(pitch, dtype=np.uint8)

    team_1_color_bgr = np.array(team_1_color.as_bgr(), dtype=np.uint8)
    team_2_color_bgr = np.array(team_2_color.as_bgr(), dtype=np.uint8)

    y_coordinates, x_coordinates = np.indices((
        scaled_width + 2 * padding,
        scaled_length + 2 * padding
    ))

    y_coordinates -= padding
    x_coordinates -= padding

    def calculate_distances(xy, x_coordinates, y_coordinates):
        return np.sqrt((xy[:, 0][:, None, None] * scale - x_coordinates) ** 2 +
                       (xy[:, 1][:, None, None] * scale - y_coordinates) ** 2)

    distances_team_1 = calculate_distances(team_1_xy, x_coordinates, y_coordinates)
    distances_team_2 = calculate_distances(team_2_xy, x_coordinates, y_coordinates)

    min_distances_team_1 = np.min(distances_team_1, axis=0)
    min_distances_team_2 = np.min(distances_team_2, axis=0)

    # Increase steepness of the blend effect
    steepness = 15  # Increased steepness for sharper transition
    distance_ratio = min_distances_team_2 / np.clip(min_distances_team_1 + min_distances_team_2, a_min=1e-5, a_max=None)
    blend_factor = np.tanh((distance_ratio - 0.5) * steepness) * 0.5 + 0.5

    # Create the smooth color transition
    for c in range(3):  # Iterate over the B, G, R channels
        voronoi[:, :, c] = (blend_factor * team_1_color_bgr[c] +
                            (1 - blend_factor) * team_2_color_bgr[c]).astype(np.uint8)

    overlay = cv2.addWeighted(voronoi, opacity, pitch, 1 - opacity, 0)

    # Show the overlay (only works in local desktop environments)
    cv2.imshow("Voronoi Overlay", overlay)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    
    return overlay

def resolve_goalkeepers_team_id(
    players: sv.Detections,
    goalkeepers: sv.Detections
) -> np.ndarray:
    goalkeepers_xy = goalkeepers.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
    players_xy = players.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
    team_0_centroid = players_xy[players.class_id == 0].mean(axis=0)
    team_1_centroid = players_xy[players.class_id == 1].mean(axis=0)
    goalkeepers_team_id = []
    for goalkeeper_xy in goalkeepers_xy:
        dist_0 = np.linalg.norm(goalkeeper_xy - team_0_centroid)
        dist_1 = np.linalg.norm(goalkeeper_xy - team_1_centroid)
        goalkeepers_team_id.append(0 if dist_0 < dist_1 else 1)

    return np.array(goalkeepers_team_id)

def player_classification(player_detection_model):
    SOURCE_VIDEO_PATH = r"C:\Users\User\Videos\bundesliga.mp4"
    PLAYER_ID = 2
    STRIDE = 30

    try:
        team_classifier = TeamClassifier(device="cpu")
    except Exception as e:
        return HttpResponse(f"Error: Environment key missing", status=500)

    frame_generator = sv.get_video_frames_generator(
        source_path=SOURCE_VIDEO_PATH, stride=STRIDE)


    crops = []
    for frame in tqdm(frame_generator, desc='collecting crops'):
        # ball, goalkeeper, player, referee detection

        result_list = player_detection_model.predict(frame, confidence=0.3)

        # result_list is a list of detections
        prediction_json = {
            "image": {
                "width": frame.shape[1],
                "height": frame.shape[0],
            },
            "predictions": [result.json() for result in result_list]  # Loop through ALL predictions
        }
        detections = sv.Detections.from_inference(prediction_json)
        players_crops = [sv.crop_image(frame, xyxy) for xyxy in detections.xyxy]
        crops += players_crops

    team_classifier.fit(crops)
    return team_classifier


def radar_view_visualization():
    SOURCE_VIDEO_PATH = r"C:\Users\User\Videos\bundesliga.mp4"
    BALL_ID = 0
    GOALKEEPER_ID = 1
    PLAYER_ID = 2
    REFEREE_ID = 3

    try:
        ROBOFLOW_API_KEY = config('ROBOFLOW_API_KEY')
        # Initialize Roboflow
        rf = Roboflow(api_key=ROBOFLOW_API_KEY)
        # Load the model
        PLAYER_DETECTION_MODEL = rf.workspace().project("football-players-detection-3zvbc").version(11).model
        FIELD_DETECTION_MODEL = rf.workspace().project("football-field-detection-f07vi").version(15).model
        team_classifier = player_classification(PLAYER_DETECTION_MODEL)
    except Exception as e:
        return HttpResponse(f"Error: {e}", status=500)
    
    ellipse_annotator = sv.EllipseAnnotator(
        color=sv.ColorPalette.from_hex(['#00BFFF', '#FF1493', '#FFD700']),
        thickness=2
    )
    label_annotator = sv.LabelAnnotator(
        color=sv.ColorPalette.from_hex(['#00BFFF', '#FF1493', '#FFD700']),
        text_color=sv.Color.from_hex('#000000'),
        text_position=sv.Position.BOTTOM_CENTER
    )
    triangle_annotator = sv.TriangleAnnotator(
        color=sv.Color.from_hex('#FFD700'),
        base=20, height=17
    )

    tracker = sv.ByteTrack()
    tracker.reset()

    frame_generator = sv.get_video_frames_generator(SOURCE_VIDEO_PATH)


    frame = next(frame_generator)

    # ball, goalkeeper, player, referee detection

    result_list = PLAYER_DETECTION_MODEL.predict(frame, confidence=0.4)

    # result_list is a list of detections
    prediction_json = {
        "image": {
            "width": frame.shape[1],
            "height": frame.shape[0],
        },
        "predictions": [result.json() for result in result_list]  # Loop through ALL predictions
    }

    detections = sv.Detections.from_inference(prediction_json)

    ball_detections = detections[detections.class_id == BALL_ID]
    ball_detections.xyxy = sv.pad_boxes(xyxy=ball_detections.xyxy, px=10)

    all_detections = detections[detections.class_id != BALL_ID]
    all_detections = all_detections.with_nms(threshold=0.5, class_agnostic=True)
    all_detections = tracker.update_with_detections(detections=all_detections)

    goalkeepers_detections = all_detections[all_detections.class_id == GOALKEEPER_ID]
    players_detections = all_detections[all_detections.class_id == PLAYER_ID]
    referees_detections = all_detections[all_detections.class_id == REFEREE_ID]

    # team assignment

    players_crops = [sv.crop_image(frame, xyxy) for xyxy in players_detections.xyxy]
    players_detections.class_id = team_classifier.predict(players_crops)

    goalkeepers_detections.class_id = resolve_goalkeepers_team_id(players_detections, goalkeepers_detections)

    referees_detections.class_id -= 1

    all_detections = sv.Detections.merge([
        players_detections, goalkeepers_detections, referees_detections])

    # frame visualization

    labels = [
        f"#{tracker_id}"
        for tracker_id
        in all_detections.tracker_id
    ]

    all_detections.class_id = all_detections.class_id.astype(int)

    annotated_frame = frame.copy()
    annotated_frame = ellipse_annotator.annotate(
        scene=annotated_frame,
        detections=all_detections)
    annotated_frame = label_annotator.annotate(
        scene=annotated_frame,
        detections=all_detections,
        labels=labels)
    annotated_frame = triangle_annotator.annotate(
        scene=annotated_frame,
        detections=ball_detections)

    # sv.plot_image(annotated_frame)

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        temp_path = tmp.name
        cv2.imwrite(temp_path, frame)

    # detect pitch key points
    result_field_list = FIELD_DETECTION_MODEL.predict(temp_path)

    # Save to a text file
    with open("field_detection_result.txt", "w") as f:
        f.write(str(result_field_list))

    # result_list is a list of detections
    prediction_json = {
        "image": {
            "width": frame.shape[1],
            "height": frame.shape[0],
        },
        "predictions": [result.json() for result in result_field_list]  # Loop through ALL predictions
    }

    key_points = sv.KeyPoints.from_inference(prediction_json)

    # project ball, players and referies on pitch

    filter = key_points.confidence[0] > 0.5
    frame_reference_points = key_points.xy[0][filter]
    pitch_reference_points = np.array(CONFIG.vertices)[filter]

    transformer = ViewTransformer(
        source=frame_reference_points,
        target=pitch_reference_points
    )

    frame_ball_xy = ball_detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
    pitch_ball_xy = transformer.transform_points(points=frame_ball_xy)

    players_xy = players_detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
    pitch_players_xy = transformer.transform_points(points=players_xy)

    referees_xy = referees_detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
    pitch_referees_xy = transformer.transform_points(points=referees_xy)

    # visualize video game-style radar view

    annotated_frame = draw_pitch(CONFIG)
    annotated_frame = draw_points_on_pitch(
        config=CONFIG,
        xy=pitch_ball_xy,
        face_color=sv.Color.WHITE,
        edge_color=sv.Color.BLACK,
        radius=10,
        pitch=annotated_frame)
    annotated_frame = draw_points_on_pitch(
        config=CONFIG,
        xy=pitch_players_xy[players_detections.class_id == 0],
        face_color=sv.Color.from_hex('00BFFF'),
        edge_color=sv.Color.BLACK,
        radius=16,
        pitch=annotated_frame)
    annotated_frame = draw_points_on_pitch(
        config=CONFIG,
        xy=pitch_players_xy[players_detections.class_id == 1],
        face_color=sv.Color.from_hex('FF1493'),
        edge_color=sv.Color.BLACK,
        radius=16,
        pitch=annotated_frame)
    annotated_frame = draw_points_on_pitch(
        config=CONFIG,
        xy=pitch_referees_xy,
        face_color=sv.Color.from_hex('FFD700'),
        edge_color=sv.Color.BLACK,
        radius=16,
        pitch=annotated_frame)

    sv.plot_image(annotated_frame)


radar_view_visualization()