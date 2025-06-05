import os
from django.http import HttpResponse, FileResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404, render
from .models import Video
from .forms import Video_form
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from roboflow import Roboflow
from decouple import config
import supervision as sv
from SoccerNet.Downloader import SoccerNetDownloader
import cv2
from PIL import Image
import io
import warnings
import numpy as np
import tempfile
import re
# Note: These imports may need to be adjusted based on your supervision version
# from supervision import draw_pitch, draw_points_on_pitch, draw_pitch_voronoi_diagram
# from supervision.geometry.core import Position
# from supervision.tracker.byte_tracker.core import ByteTrack
# from supervision.geometry.utils import ViewTransformer
from sports.annotators.soccer import (
    draw_pitch,
    draw_pitch_voronoi_diagram
)


myDownloader = SoccerNetDownloader(LocalDirectory="./SoccernetData/")
os.environ["ONNXRUNTIME_EXECUTION_PROVIDERS"] = "[CPUExecutionProvider]"

# Suppress only 'ModelDependencyMissing' warnings
warnings.filterwarnings("ignore", category=UserWarning, message="ModelDependencyMissing.*")
warnings.filterwarnings("ignore", message="Specified provider '.*' is not in available provider names")


def index(request):
    videos_list = Video.objects.all()
    # Pagination with 2 videos per page
    paginator = Paginator(videos_list, 2)
    page_number = request.GET.get('page', 1)
    
    try:
        videos = paginator.page(page_number)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        videos = paginator.page(1)
    except EmptyPage:
        # If page is out of range, deliver last page of results.
        videos = paginator.page(paginator.num_pages)

    if request.method == 'POST':
        form = Video_form(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return HttpResponse("Video Uploaded")
    else:
        form = Video_form()

    return render(request, 'index.html', 
                  {"form": form,
                   "videos": videos
                   }
            )


def video_detail(request, year, month, day, video):
    video = get_object_or_404(
        Video,
        slug=video,
        publish__year=year,
        publish__month=month,
        publish__day=day
        )
        
    return render(
        request,
        'video/detail.html',
        {'video': video}
    )

def object_detection(request, year, month, day, slug, frame_selected):

    video = get_object_or_404(
        Video,
        slug=slug,
        publish__year=year,
        publish__month=month,
        publish__day=day
        )
    
    try:
        ROBOFLOW_API_KEY = config('ROBOFLOW_API_KEY')
        # Initialize Roboflow
        rf = Roboflow(api_key=ROBOFLOW_API_KEY)
        # Load the model
        PLAYER_DETECTION_MODEL = rf.workspace().project("football-players-detection-3zvbc").version(11).model
    except Exception as e:
        return HttpResponse(f"Error: Environment key missing", status=500)
    
    

    box_annotator = sv.BoxAnnotator(
    color=sv.ColorPalette.from_hex(['#FF8C00', '#00BFFF', '#FF1493', '#FFD700']),
    thickness=2
    )
    label_annotator = sv.LabelAnnotator(
        color=sv.ColorPalette.from_hex(['#FF8C00', '#00BFFF', '#FF1493', '#FFD700']),
        text_color=sv.Color.from_hex('#000000')
    )

    frame_generator = sv.get_video_frames_generator(video.video.url)

    # Select the 10th frame (index 9, as indexing starts from 0)
    for _ in range(frame_selected):
        frame_res = next(frame_generator)

    result_list = PLAYER_DETECTION_MODEL.predict(frame_res, confidence=0.3)

    # result_list is a list of detections
    prediction_json = {
        "image": {
            "width": frame_res.shape[1],
            "height": frame_res.shape[0],
        },
        "predictions": [result.json() for result in result_list]  # Loop through ALL predictions
    }

    
    #We passed the detection results into a supervision.Detections object for easier handling
    detections = sv.Detections.from_inference(prediction_json)
    
    labels = [
        f"{class_name} {confidence:.2f}"
        for class_name, confidence
        in zip(detections['class_name'], detections.confidence)
    ]

    annotated_frame = frame_res.copy()
    annotated_frame = box_annotator.annotate(
        scene=annotated_frame,
        detections=detections)
    annotated_frame = label_annotator.annotate(
        scene=annotated_frame,
        detections=detections,
        labels=labels)
        

    # Convert to image and serve as a response
    image = Image.fromarray(cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")

    return HttpResponse(buffer.getvalue(), content_type="image/png")



def display_voronoi_diagram(request, year, month, day, slug, frame_selected):
    def draw_pitch_voronoi_diagram_2(
        config,
        team_1_xy,
        team_2_xy,
        team_1_color=sv.Color.RED,
        team_2_color=sv.Color.WHITE,
        opacity=0.5,
        padding=50,
        scale=0.1,
        pitch=None
    ):
        """ 
        Draws a Voronoi diagram on a soccer pitch representing the control areas of two
        teams with smooth color transitions.

        Args:
            config: Configuration object containing the dimensions and layout of the pitch.
            team_1_xy: Array of (x, y) coordinates representing the positions of players in team 1.
            team_2_xy: Array of (x, y) coordinates representing the positions of players in team 2.
            team_1_color: Color representing the control area of team 1. Defaults to sv.Color.RED.
            team_2_color: Color representing the control area of team 2. Defaults to sv.Color.WHITE.
            opacity: Opacity of the Voronoi diagram overlay. Defaults to 0.5.
            padding: Padding around the pitch in pixels. Defaults to 50.
            scale: Scaling factor for the pitch dimensions. Defaults to 0.1.
            pitch: Existing pitch image to draw the Voronoi diagram on. If None, a new pitch will be created.

        Returns:
            Image of the soccer pitch with the Voronoi diagram overlay.
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

    return overlay

def generate_pitch_view(request, year, month, day, slug, frame_selected):
  

    SOURCE_VIDEO_PATH = "/content/121364_0.mp4"
    BALL_ID = 0
    GOALKEEPER_ID = 1
    PLAYER_ID = 2
    REFEREE_ID = 3

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

    result = PLAYER_DETECTION_MODEL.infer(frame, confidence=0.3)[0]
    detections = sv.Detections.from_inference(result)

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

    goalkeepers_detections.class_id = resolve_goalkeepers_team_id(
        players_detections, goalkeepers_detections)

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

    sv.plot_image(annotated_frame)

    players_detections = sv.Detections.merge([
        players_detections, goalkeepers_detections
    ])

    # detect pitch key points

    result = FIELD_DETECTION_MODEL.infer(frame, confidence=0.3)[0]
    key_points = sv.KeyPoints.from_inference(result)

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

    # visualize voronoi diagram

    annotated_frame = draw_pitch(CONFIG)
    annotated_frame = draw_pitch_voronoi_diagram(
        config=CONFIG,
        team_1_xy=pitch_players_xy[players_detections.class_id == 0],
        team_2_xy=pitch_players_xy[players_detections.class_id == 1],
        team_1_color=sv.Color.from_hex('00BFFF'),
        team_2_color=sv.Color.from_hex('FF1493'),
        pitch=annotated_frame)

    sv.plot_image(annotated_frame)

    # visualize voronoi diagram with blend

    annotated_frame = draw_pitch(
        config=CONFIG,
        background_color=sv.Color.WHITE,
        line_color=sv.Color.BLACK
    )
    annotated_frame = draw_pitch_voronoi_diagram_2(
        config=CONFIG,
        team_1_xy=pitch_players_xy[players_detections.class_id == 0],
        team_2_xy=pitch_players_xy[players_detections.class_id == 1],
        team_1_color=sv.Color.from_hex('00BFFF'),
        team_2_color=sv.Color.from_hex('FF1493'),
        pitch=annotated_frame)
    annotated_frame = draw_points_on_pitch(
        config=CONFIG,
        xy=pitch_ball_xy,
        face_color=sv.Color.WHITE,
        edge_color=sv.Color.WHITE,
        radius=8,
        thickness=1,
        pitch=annotated_frame)
    annotated_frame = draw_points_on_pitch(
        config=CONFIG,
        xy=pitch_players_xy[players_detections.class_id == 0],
        face_color=sv.Color.from_hex('00BFFF'),
        edge_color=sv.Color.WHITE,
        radius=16,
        thickness=1,
        pitch=annotated_frame)
    annotated_frame = draw_points_on_pitch(
        config=CONFIG,
        xy=pitch_players_xy[players_detections.class_id == 1],
        face_color=sv.Color.from_hex('FF1493'),
        edge_color=sv.Color.WHITE,
        radius=16,
        thickness=1,
        pitch=annotated_frame)

    sv.plot_image(annotated_frame)


def generate_annotated_video(request, year, month, day, slug):
    """
    Process entire video and return annotated video with pitch view overlays
    """
    video = get_object_or_404(
        Video,
        slug=slug,
        publish__year=year,
        publish__month=month,
        publish__day=day
    )
    
    try:
        ROBOFLOW_API_KEY = config('ROBOFLOW_API_KEY')
        rf = Roboflow(api_key=ROBOFLOW_API_KEY)
        # Player detection model
        PLAYER_DETECTION_MODEL = rf.workspace().project("football-players-detection-3zvbc").version(11).model
        # Field detection model (you'll need to replace with your actual field detection model)
        # FIELD_DETECTION_MODEL = rf.workspace().project("your-field-detection-project").version(1).model
    except Exception as e:
        return HttpResponse(f"Error: Environment key missing or model loading failed: {str(e)}", status=500)
    
    # Constants for object IDs
    BALL_ID = 0
    GOALKEEPER_ID = 1
    PLAYER_ID = 2
    REFEREE_ID = 3
    
    # Initialize annotators
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
    
    # Initialize tracker
    tracker = sv.ByteTrack()
    
    # Create temporary file for output video
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        output_path = temp_file.name
    
    try:
        # Open input video
        cap = cv2.VideoCapture(video.video.path)
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Create video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            try:
                # Object detection
                result = PLAYER_DETECTION_MODEL.infer(frame, confidence=0.3)[0]
                detections = sv.Detections.from_inference(result)
                
                # Separate detections by type
                ball_detections = detections[detections.class_id == BALL_ID]
                if len(ball_detections) > 0:
                    ball_detections.xyxy = sv.pad_boxes(xyxy=ball_detections.xyxy, px=10)
                
                all_detections = detections[detections.class_id != BALL_ID]
                if len(all_detections) > 0:
                    all_detections = all_detections.with_nms(threshold=0.5, class_agnostic=True)
                    all_detections = tracker.update_with_detections(detections=all_detections)
                
                    # Separate by player types
                    goalkeepers_detections = all_detections[all_detections.class_id == GOALKEEPER_ID]
                    players_detections = all_detections[all_detections.class_id == PLAYER_ID]
                    referees_detections = all_detections[all_detections.class_id == REFEREE_ID]
                    
                    # Team assignment (simplified - you may need to implement team_classifier)
                    # For now, we'll assign teams based on x-coordinate position
                    if len(players_detections) > 0:
                        players_centers = players_detections.get_anchors_coordinates(anchor=sv.Position.BOTTOM_CENTER)
                        median_x = np.median(players_centers[:, 0])
                        players_detections.class_id = (players_centers[:, 0] > median_x).astype(int)
                    
                    # Assign goalkeeper teams based on proximity to players
                    if len(goalkeepers_detections) > 0 and len(players_detections) > 0:
                        goalkeepers_detections.class_id = resolve_goalkeepers_team_id(
                            players_detections, goalkeepers_detections)
                    
                    if len(referees_detections) > 0:
                        referees_detections.class_id = 2  # Neutral team
                    
                    # Merge all detections
                    all_detections = sv.Detections.merge([
                        players_detections, goalkeepers_detections, referees_detections])
                    
                    # Create labels
                    labels = [
                        f"#{tracker_id}"
                        for tracker_id in all_detections.tracker_id
                    ] if hasattr(all_detections, 'tracker_id') and all_detections.tracker_id is not None else []
                    
                    # Annotate frame
                    annotated_frame = frame.copy()
                    annotated_frame = ellipse_annotator.annotate(
                        scene=annotated_frame,
                        detections=all_detections)
                    if labels:
                        annotated_frame = label_annotator.annotate(
                            scene=annotated_frame,
                            detections=all_detections,
                            labels=labels)
                    if len(ball_detections) > 0:
                        annotated_frame = triangle_annotator.annotate(
                            scene=annotated_frame,
                            detections=ball_detections)
                    
                    # Create pitch view overlay (simplified version)
                    # You can expand this to include full homography transformation
                    pitch_overlay = create_pitch_overlay(
                        players_detections, ball_detections, width, height)
                    
                    # Blend pitch overlay with main frame
                    if pitch_overlay is not None:
                        # Resize pitch overlay to fit in corner
                        pitch_small = cv2.resize(pitch_overlay, (width//3, height//3))
                        annotated_frame[10:10+height//3, 10:10+width//3] = pitch_small
                else:
                    annotated_frame = frame
                    
            except Exception as e:
                print(f"Error processing frame {frame_count}: {str(e)}")
                annotated_frame = frame
            
            # Write frame
            out.write(annotated_frame)
            frame_count += 1
            
            # Optional: limit processing for testing
            if frame_count > 300:  # Process first 10 seconds at 30fps
                break
        
        cap.release()
        out.release()
        
        # Return video as streaming response with range request support
        response = create_video_streaming_response(
            output_path, 
            f"annotated_{slug}.mp4",
            request
        )
        
        return response
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(output_path):
            os.unlink(output_path)
        return HttpResponse(f"Error processing video: {str(e)}", status=500)


def create_pitch_overlay(players_detections, ball_detections, frame_width, frame_height):
    """
    Create a simplified pitch overlay with player positions
    """
    try:
        # Create a simple pitch representation
        pitch_width, pitch_height = 400, 300
        pitch = np.zeros((pitch_height, pitch_width, 3), dtype=np.uint8)
        pitch.fill(34)  # Dark green background
        
        # Draw pitch lines
        cv2.rectangle(pitch, (20, 20), (pitch_width-20, pitch_height-20), (255, 255, 255), 2)
        cv2.line(pitch, (pitch_width//2, 20), (pitch_width//2, pitch_height-20), (255, 255, 255), 2)
        cv2.circle(pitch, (pitch_width//2, pitch_height//2), 50, (255, 255, 255), 2)
        
        # Map player positions to pitch coordinates
        if len(players_detections) > 0:
            players_positions = players_detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
            
            for i, pos in enumerate(players_positions):
                # Simple mapping from frame coordinates to pitch coordinates
                pitch_x = int((pos[0] / frame_width) * (pitch_width - 40) + 20)
                pitch_y = int((pos[1] / frame_height) * (pitch_height - 40) + 20)
                
                # Draw player based on team
                team_id = players_detections.class_id[i] if hasattr(players_detections, 'class_id') else 0
                color = (255, 20, 147) if team_id == 0 else (0, 191, 255)  # Pink or Blue
                cv2.circle(pitch, (pitch_x, pitch_y), 8, color, -1)
                cv2.circle(pitch, (pitch_x, pitch_y), 8, (255, 255, 255), 1)
        
        # Draw ball if detected
        if len(ball_detections) > 0:
            ball_position = ball_detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)[0]
            ball_pitch_x = int((ball_position[0] / frame_width) * (pitch_width - 40) + 20)
            ball_pitch_y = int((ball_position[1] / frame_height) * (pitch_height - 40) + 20)
            cv2.circle(pitch, (ball_pitch_x, ball_pitch_y), 6, (255, 255, 255), -1)
            cv2.circle(pitch, (ball_pitch_x, ball_pitch_y), 6, (0, 0, 0), 1)
        
        return pitch
        
    except Exception as e:
        print(f"Error creating pitch overlay: {str(e)}")
        return None


def resolve_goalkeepers_team_id(players_detections, goalkeepers_detections):
    """
    Assign goalkeeper team based on proximity to players
    """
    if len(players_detections) == 0 or len(goalkeepers_detections) == 0:
        return goalkeepers_detections.class_id
    
    players_positions = players_detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
    goalkeepers_positions = goalkeepers_detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
    
    team_ids = []
    for gk_pos in goalkeepers_positions:
        # Find closest players to each goalkeeper
        distances_team_0 = []
        distances_team_1 = []
        
        for i, player_pos in enumerate(players_positions):
            distance = np.sqrt(np.sum((gk_pos - player_pos) ** 2))
            if players_detections.class_id[i] == 0:
                distances_team_0.append(distance)
            else:
                distances_team_1.append(distance)
        
        # Assign goalkeeper to team with closest players
        avg_distance_team_0 = np.mean(distances_team_0) if distances_team_0 else float('inf')
        avg_distance_team_1 = np.mean(distances_team_1) if distances_team_1 else float('inf')
        
        team_ids.append(0 if avg_distance_team_0 < avg_distance_team_1 else 1)
    
    return np.array(team_ids)


def create_video_streaming_response(file_path, filename, request=None):
    """
    Create a proper streaming response for video files with range request support
    """
    import mimetypes
    
    file_size = os.path.getsize(file_path)
    content_type = mimetypes.guess_type(file_path)[0] or 'video/mp4'
    
    # Check if client supports range requests
    range_header = request.META.get('HTTP_RANGE') if request else None
    
    if range_header:
        # Parse range header
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if range_match:
            start = int(range_match.group(1))
            end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            
            # Ensure end doesn't exceed file size
            end = min(end, file_size - 1)
            content_length = end - start + 1
            
            def ranged_file_iterator(file_path, start, end, chunk_size=8192):
                with open(file_path, 'rb') as f:
                    f.seek(start)
                    remaining = end - start + 1
                    while remaining > 0:
                        chunk_size = min(chunk_size, remaining)
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk
            
            response = StreamingHttpResponse(
                ranged_file_iterator(file_path, start, end),
                status=206,  # Partial Content
                content_type=content_type
            )
            
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Content-Length'] = str(content_length)
            response['Accept-Ranges'] = 'bytes'
            
        else:
            # Invalid range header, return full file
            response = create_full_video_response(file_path, filename, content_type, file_size)
    else:
        # No range header, return full file
        response = create_full_video_response(file_path, filename, content_type, file_size)
    
    return response


def create_full_video_response(file_path, filename, content_type, file_size):
    """
    Create a full video streaming response
    """
    def file_iterator(file_path, chunk_size=8192):
        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk
    
    response = StreamingHttpResponse(
        file_iterator(file_path),
        content_type=content_type
    )
    
    response['Content-Length'] = str(file_size)
    response['Accept-Ranges'] = 'bytes'
    response['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
    response['Content-Disposition'] = f'inline; filename="{filename}"'
    
    return response


def generate_advanced_pitch_video(request, year, month, day, slug):
    """
    Generate video with accurate homography-based pitch mapping
    This function includes field keypoint detection for precise player-to-pitch mapping
    """
    video = get_object_or_404(
        Video,
        slug=slug,
        publish__year=year,
        publish__month=month,
        publish__day=day
    )
    
    try:
        ROBOFLOW_API_KEY = config('ROBOFLOW_API_KEY')
        rf = Roboflow(api_key=ROBOFLOW_API_KEY)
        # Load models
        PLAYER_DETECTION_MODEL = rf.workspace().project("football-players-detection-3zvbc").version(11).model
        # You'll need to replace this with your actual field detection model
        try:
            FIELD_DETECTION_MODEL = rf.workspace().project("football-field-detection").version(1).model
        except:
            FIELD_DETECTION_MODEL = None
            print("Field detection model not available - using simplified mapping")
            
    except Exception as e:
        return HttpResponse(f"Error: Model loading failed: {str(e)}", status=500)
    
    # Soccer pitch configuration (standard FIFA dimensions in meters)
    class SoccerPitchConfig:
        def __init__(self):
            self.length = 105  # meters
            self.width = 68   # meters
            self.penalty_area_length = 16.5
            self.penalty_area_width = 40.3
            self.goal_area_length = 5.5
            self.goal_area_width = 18.3
            self.center_circle_radius = 9.15
            # Define key vertices for homography
            self.vertices = np.array([
                [0, 0],                          # Bottom left corner
                [self.length, 0],                # Bottom right corner
                [self.length, self.width],       # Top right corner
                [0, self.width],                 # Top left corner
                [self.length/2, 0],              # Bottom center
                [self.length/2, self.width],     # Top center
                [self.length/2, self.width/2],   # Field center
                [0, self.width/2],               # Left center
                [self.length, self.width/2],     # Right center
                # Penalty area corners
                [self.penalty_area_length, self.width/2 - self.penalty_area_width/2],
                [self.penalty_area_length, self.width/2 + self.penalty_area_width/2],
                [self.length - self.penalty_area_length, self.width/2 - self.penalty_area_width/2],
                [self.length - self.penalty_area_length, self.width/2 + self.penalty_area_width/2],
            ])
    
    CONFIG = SoccerPitchConfig()
    
    # Initialize tracker and annotators
    tracker = sv.ByteTrack()
    
    # Create temporary file for output video
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        output_path = temp_file.name
    
    try:
        # Open input video
        cap = cv2.VideoCapture(video.video.path)
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Create video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            try:
                # Player and ball detection
                result = PLAYER_DETECTION_MODEL.infer(frame, confidence=0.3)[0]
                detections = sv.Detections.from_inference(result)
                
                # Process detections
                ball_detections = detections[detections.class_id == 0]  # Ball
                player_detections = detections[detections.class_id.isin([1, 2])]  # Goalkeeper + Player
                
                if len(player_detections) > 0:
                    player_detections = player_detections.with_nms(threshold=0.5, class_agnostic=True)
                    player_detections = tracker.update_with_detections(detections=player_detections)
                    
                    # Simple team assignment based on position
                    player_positions = player_detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
                    if len(player_positions) > 0:
                        median_x = np.median(player_positions[:, 0])
                        team_ids = (player_positions[:, 0] > median_x).astype(int)
                        player_detections.class_id = team_ids
                
                # Field keypoint detection and homography calculation
                transformer = None
                if FIELD_DETECTION_MODEL is not None:
                    try:
                        field_result = FIELD_DETECTION_MODEL.infer(frame, confidence=0.3)[0]
                        key_points = sv.KeyPoints.from_inference(field_result)
                        
                        if len(key_points.xy[0]) > 4:
                            # Filter high confidence keypoints
                            filter_mask = key_points.confidence[0] > 0.5
                            frame_reference_points = key_points.xy[0][filter_mask]
                            pitch_reference_points = CONFIG.vertices[filter_mask]
                            
                            if len(frame_reference_points) >= 4:
                                transformer = ViewTransformer(
                                    source=frame_reference_points,
                                    target=pitch_reference_points
                                )
                    except Exception as e:
                        print(f"Field detection failed: {e}")
                
                # Create enhanced frame with annotations
                annotated_frame = create_enhanced_frame(
                    frame, player_detections, ball_detections, transformer, CONFIG, width, height
                )
                
            except Exception as e:
                print(f"Error processing frame {frame_count}: {str(e)}")
                annotated_frame = frame
            
            # Write frame
            out.write(annotated_frame)
            frame_count += 1
            
            # Optional: Limit for testing
            if frame_count > 600:  # Process first 20 seconds at 30fps
                break
        
        cap.release()
        out.release()
        
        # Return video as streaming response with range request support
        response = create_video_streaming_response(
            output_path, 
            f"advanced_pitch_{slug}.mp4",
            request
        )
        
        return response
        
    except Exception as e:
        if os.path.exists(output_path):
            os.unlink(output_path)
        return HttpResponse(f"Error processing video: {str(e)}", status=500)


def create_enhanced_frame(frame, player_detections, ball_detections, transformer, config, width, height):
    """
    Create enhanced frame with pitch overlay and accurate player mapping
    """
    annotated_frame = frame.copy()
    
    try:
        # Draw player detections on main frame
        if len(player_detections) > 0:
            # Draw ellipses around players
            for i, xyxy in enumerate(player_detections.xyxy):
                team_id = player_detections.class_id[i] if hasattr(player_detections, 'class_id') else 0
                color = (255, 20, 147) if team_id == 0 else (0, 191, 255)  # Pink or Blue
                
                # Draw ellipse
                center_x = int((xyxy[0] + xyxy[2]) / 2)
                center_y = int(xyxy[3])  # Bottom of bounding box
                cv2.ellipse(annotated_frame, (center_x, center_y), (20, 10), 0, 0, 360, color, 2)
                
                # Draw tracker ID if available
                if hasattr(player_detections, 'tracker_id') and player_detections.tracker_id is not None:
                    tracker_id = player_detections.tracker_id[i]
                    cv2.putText(annotated_frame, f"#{tracker_id}", 
                              (center_x - 15, center_y - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Draw ball detection
        if len(ball_detections) > 0:
            for xyxy in ball_detections.xyxy:
                center_x = int((xyxy[0] + xyxy[2]) / 2)
                center_y = int((xyxy[1] + xyxy[3]) / 2)
                # Draw triangle for ball
                points = np.array([[center_x, center_y - 10], 
                                 [center_x - 8, center_y + 5], 
                                 [center_x + 8, center_y + 5]], np.int32)
                cv2.fillPoly(annotated_frame, [points], (255, 215, 0))
        
        # Create pitch overlay
        pitch_overlay = create_accurate_pitch_overlay(
            player_detections, ball_detections, transformer, config, width, height
        )
        
        if pitch_overlay is not None:
            # Create side-by-side layout or overlay
            overlay_height, overlay_width = pitch_overlay.shape[:2]
            
            # Option 1: Corner overlay
            scale_factor = min(width // 4, height // 4) / max(overlay_width, overlay_height)
            new_width = int(overlay_width * scale_factor)
            new_height = int(overlay_height * scale_factor)
            
            if new_width > 0 and new_height > 0:
                pitch_small = cv2.resize(pitch_overlay, (new_width, new_height))
                
                # Place in top-right corner with some margin
                margin = 10
                start_x = width - new_width - margin
                start_y = margin
                
                # Add semi-transparent background
                overlay_area = annotated_frame[start_y:start_y+new_height, start_x:start_x+new_width]
                blended = cv2.addWeighted(overlay_area, 0.3, pitch_small, 0.7, 0)
                annotated_frame[start_y:start_y+new_height, start_x:start_x+new_width] = blended
        
    except Exception as e:
        print(f"Error creating enhanced frame: {e}")
    
    return annotated_frame


def create_accurate_pitch_overlay(player_detections, ball_detections, transformer, config, frame_width, frame_height):
    """
    Create accurate pitch overlay using homography transformation
    """
    try:
        # Create pitch visualization
        pitch_width, pitch_height = 800, 600
        pitch = np.zeros((pitch_height, pitch_width, 3), dtype=np.uint8)
        pitch.fill(50)  # Dark green background
        
        # Draw pitch lines (scaled to fit the overlay)
        scale_x = (pitch_width - 40) / config.length
        scale_y = (pitch_height - 40) / config.width
        
        # Outer boundary
        cv2.rectangle(pitch, (20, 20), (pitch_width-20, pitch_height-20), (255, 255, 255), 2)
        
        # Center line
        center_x = int(config.length/2 * scale_x) + 20
        cv2.line(pitch, (center_x, 20), (center_x, pitch_height-20), (255, 255, 255), 2)
        
        # Center circle
        center_y = int(config.width/2 * scale_y) + 20
        radius = int(config.center_circle_radius * min(scale_x, scale_y))
        cv2.circle(pitch, (center_x, center_y), radius, (255, 255, 255), 2)
        
        # Penalty areas
        penalty_width = int(config.penalty_area_width * scale_y)
        penalty_length = int(config.penalty_area_length * scale_x)
        
        # Left penalty area
        cv2.rectangle(pitch, 
                     (20, center_y - penalty_width//2),
                     (20 + penalty_length, center_y + penalty_width//2),
                     (255, 255, 255), 2)
        
        # Right penalty area
        cv2.rectangle(pitch, 
                     (pitch_width - 20 - penalty_length, center_y - penalty_width//2),
                     (pitch_width - 20, center_y + penalty_width//2),
                     (255, 255, 255), 2)
        
        # Map players to pitch
        if len(player_detections) > 0:
            player_positions = player_detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
            
            for i, pos in enumerate(player_positions):
                if transformer is not None:
                    # Use accurate homography transformation
                    try:
                        pitch_pos = transformer.transform_points(points=np.array([pos]))[0]
                        pitch_x = int(pitch_pos[0] * scale_x) + 20
                        pitch_y = int(pitch_pos[1] * scale_y) + 20
                    except:
                        # Fallback to simple mapping
                        pitch_x = int((pos[0] / frame_width) * (pitch_width - 40)) + 20
                        pitch_y = int((pos[1] / frame_height) * (pitch_height - 40)) + 20
                else:
                    # Simple coordinate mapping
                    pitch_x = int((pos[0] / frame_width) * (pitch_width - 40)) + 20
                    pitch_y = int((pos[1] / frame_height) * (pitch_height - 40)) + 20
                
                # Ensure coordinates are within bounds
                pitch_x = max(20, min(pitch_width - 20, pitch_x))
                pitch_y = max(20, min(pitch_height - 20, pitch_y))
                
                # Draw player
                team_id = player_detections.class_id[i] if hasattr(player_detections, 'class_id') else 0
                color = (255, 20, 147) if team_id == 0 else (0, 191, 255)
                cv2.circle(pitch, (pitch_x, pitch_y), 12, color, -1)
                cv2.circle(pitch, (pitch_x, pitch_y), 12, (255, 255, 255), 2)
                
                # Add player number if tracker available
                if hasattr(player_detections, 'tracker_id') and player_detections.tracker_id is not None:
                    tracker_id = str(player_detections.tracker_id[i])
                    text_size = cv2.getTextSize(tracker_id, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)[0]
                    cv2.putText(pitch, tracker_id, 
                              (pitch_x - text_size[0]//2, pitch_y + text_size[1]//2), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)
        
        # Map ball to pitch
        if len(ball_detections) > 0:
            ball_pos = ball_detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)[0]
            
            if transformer is not None:
                try:
                    pitch_ball_pos = transformer.transform_points(points=np.array([ball_pos]))[0]
                    ball_pitch_x = int(pitch_ball_pos[0] * scale_x) + 20
                    ball_pitch_y = int(pitch_ball_pos[1] * scale_y) + 20
                except:
                    ball_pitch_x = int((ball_pos[0] / frame_width) * (pitch_width - 40)) + 20
                    ball_pitch_y = int((ball_pos[1] / frame_height) * (pitch_height - 40)) + 20
            else:
                ball_pitch_x = int((ball_pos[0] / frame_width) * (pitch_width - 40)) + 20
                ball_pitch_y = int((ball_pos[1] / frame_height) * (pitch_height - 40)) + 20
            
            # Ensure ball coordinates are within bounds
            ball_pitch_x = max(20, min(pitch_width - 20, ball_pitch_x))
            ball_pitch_y = max(20, min(pitch_height - 20, ball_pitch_y))
            
            # Draw ball
            cv2.circle(pitch, (ball_pitch_x, ball_pitch_y), 8, (255, 255, 255), -1)
            cv2.circle(pitch, (ball_pitch_x, ball_pitch_y), 8, (0, 0, 0), 2)
        
        return pitch
        
    except Exception as e:
        print(f"Error creating accurate pitch overlay: {e}")
        return None


def stream_original_video(request, year, month, day, slug):
    """
    Stream the original video from Azure Blob Storage or local storage
    """
    video = get_object_or_404(
        Video,
        slug=slug,
        publish__year=year,
        publish__month=month,
        publish__day=day
    )
    
    try:
        # Check if video is stored in Azure Blob Storage or locally
        if hasattr(video.video, 'url') and video.video.url.startswith('http'):
            # Video is in Azure Blob Storage, redirect to the blob URL
            # or proxy the stream (depending on your security requirements)
            from django.http import HttpResponseRedirect
            return HttpResponseRedirect(video.video.url)
        else:
            # Video is stored locally
            video_path = video.video.path
            filename = os.path.basename(video_path)
            
            return create_video_streaming_response(
                video_path,
                filename,
                request
            )
            
    except Exception as e:
        return HttpResponse(f"Error streaming video: {str(e)}", status=500)


def clean_temporary_file_after_response(file_path):
    """
    Clean up temporary file (can be used with background tasks)
    """
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
    except Exception as e:
        print(f"Warning: Could not clean up temporary file {file_path}: {e}")

