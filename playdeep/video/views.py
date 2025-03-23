import os
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from .models import Video
from .forms import Video_form
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from decouple import config
from inference import get_model
import supervision as sv
from SoccerNet.Downloader import SoccerNetDownloader
import cv2
from PIL import Image
import io



# Create your views here.
myDownloader = SoccerNetDownloader(LocalDirectory="./SoccernetData/")
os.environ["ONNXRUNTIME_EXECUTION_PROVIDERS"] = "[CPUExecutionProvider]"

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

""" 
def object_detection(request):
    ROBOFLOW_API_KEY = config('ROBOFLOW_API_KEY')
    PLAYER_DETECTION_MODEL_ID = "football-players-detection-3zvbc/11"
    PLAYER_DETECTION_MODEL = get_model(model_id=PLAYER_DETECTION_MODEL_ID, api_key=ROBOFLOW_API_KEY) 
"""

def object_detection(request, year, month, day, video):

    video = get_object_or_404(
        Video,
        slug=video,
        publish__year=year,
        publish__month=month,
        publish__day=day
        )
    
    try:
        ROBOFLOW_API_KEY = config('ROBOFLOW_API_KEY')
        PLAYER_DETECTION_MODEL_ID = "football-players-detection-3zvbc/11"
        PLAYER_DETECTION_MODEL = get_model(model_id=PLAYER_DETECTION_MODEL_ID, api_key=ROBOFLOW_API_KEY)
    except Exception as e:
        return HttpResponse(f"Error: Environment key missing", status=500)
    

    video_url = video.video.url
    

    box_annotator = sv.BoxAnnotator(
    color=sv.ColorPalette.from_hex(['#FF8C00', '#00BFFF', '#FF1493', '#FFD700']),
    thickness=2
    )
    label_annotator = sv.LabelAnnotator(
        color=sv.ColorPalette.from_hex(['#FF8C00', '#00BFFF', '#FF1493', '#FFD700']),
        text_color=sv.Color.from_hex('#000000')
    )

    frame_generator = sv.get_video_frames_generator(video_url)
    frame = next(frame_generator)

    result = PLAYER_DETECTION_MODEL.infer(frame, confidence=0.3)[0]
    #We passed the detection results into a supervision.Detections object for easier handling
    detections = sv.Detections.from_inference(result)

    labels = [
        f"{class_name} {confidence:.2f}"
        for class_name, confidence
        in zip(detections['class_name'], detections.confidence)
    ]

    annotated_frame = frame.copy()
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




