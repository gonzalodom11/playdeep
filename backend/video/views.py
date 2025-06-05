import os
from django.http import HttpResponse
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
import supervision as sv
from tqdm import tqdm
from sports.common.team import TeamClassifier


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



def player_classification():
    SOURCE_VIDEO_PATH = r"C:\Users\User\Videos\PSG 4-2 MAN CITY  UEFA Champions League.mp4"
    PLAYER_ID = 2
    STRIDE = 30

    try:
        ROBOFLOW_API_KEY = config('ROBOFLOW_API_KEY')
        # Initialize Roboflow
        rf = Roboflow(api_key=ROBOFLOW_API_KEY)
        # Load the model
        PLAYER_DETECTION_MODEL = rf.workspace().project("football-players-detection-3zvbc").version(11).model
    except Exception as e:
        return HttpResponse(f"Error: Environment key missing", status=500)

    frame_generator = sv.get_video_frames_generator(
        source_path=SOURCE_VIDEO_PATH, stride=STRIDE)

    # result_list = PLAYER_DETECTION_MODEL.predict(frame_res, confidence=0.3)

    crops = []
    for frame in tqdm(frame_generator, desc='collecting crops'):
        result = PLAYER_DETECTION_MODEL.predict(frame, confidence=0.3)[0]
        detections = sv.Detections.from_inference(result)
        players_detections = detections[detections.class_id == PLAYER_ID]
        players_crops = [sv.crop_image(frame, xyxy) for xyxy in detections.xyxy]
        crops += players_crops

    team_classifier = TeamClassifier()
    team_classifier.fit(crops)
    return team_classifier
