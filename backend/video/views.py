import io
import os
import json
import base64
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from .models import Video
from .forms import Video_form
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from roboflow import Roboflow
from decouple import config
import supervision as sv
from SoccerNet.Downloader import SoccerNetDownloader
import cv2
from PIL import Image
from io import BytesIO
import warnings
import supervision as sv
from openai import OpenAI
from ultralytics import YOLO 


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
        PLAYER_DETECTION_MODEL = rf.workspace().project("football-players-detection-3zvbc").version(12).model
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
    frame_selected = frame_selected * 30
    frame_res = None
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


def analyze_video(request, year, month, day, slug, frame_selected):
    video = get_object_or_404(
        Video,
        slug=slug,
        publish__year=year,
        publish__month=month,
        publish__day=day
        )
    
    model = YOLO('models/best.pt')
    results = model.predict(r"Video/route", save=True)



def extract_frame_as_base64(video_url: str, frame_number: int) -> str:
    frame_generator = sv.get_video_frames_generator(video_url)
     # Default to first frame
    frame = next(frame_generator)
    for _ in range(frame_number-1):
        frame = next(frame_generator)

    # Convert BGR (OpenCV) to RGB for PIL
    image = Image.fromarray(frame[:, :, ::-1])
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    buffer.close()
    return f"data:image/jpeg;base64,{base64_str}"


@csrf_exempt
def analyze_frame_with_ai(request, year, month, day, slug):
    """
    Vista para analizar frames de video usando OpenAI GPT-4o
    Recibe una imagen en base64 y un prompt, devuelve el análisis de la IA
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
        
    video = get_object_or_404(
        Video,
        slug=slug,
        publish__year=year,
        publish__month=month,
        publish__day=day
    )
    cap = cv2.VideoCapture(video.video.url)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()

    # Inicializar cliente de OpenAI
    try:
        client = OpenAI(api_key=config('OPENAI_API_KEY'))
    except Exception as e:
        return JsonResponse({
            'error': 'OpenAI API key not configured'
        }, status=500)
    # Get frame number from query parameters
    ai_response = ""
    try:
        # Parse JSON from request body
        data = json.loads(request.body)
        user_prompt = data.get('prompt', 'Describe what you see in this frame')
        
        # Validate prompt
        if not user_prompt.strip():
            return JsonResponse({
                'error': 'Prompt cannot be empty'
            }, status=400)
        for n in range(frame_count):
            if n % 300 == 0 and n != 0:
                # Extract frame from video
                image_base64 = extract_frame_as_base64(video.video.url, n)
                
                # Llamar a la API de OpenAI GPT-4o
                try:
                    response = client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": user_prompt + 
                                        "Haz un analisis futbolistico de la imagen, intenta identificar jugadores, equipos y acciones clave."
                                    },
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": image_base64
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens=250,
                        temperature=0.6
                    )
                    
                    # Extraer la respuesta
                    ai_response += "\n A los "+ str(n/30) + " segundos: \n"
                    ai_response += response.choices[0].message.content
                    ai_response += "\n"

                except Exception as openai_error:
                    return JsonResponse({
                        'error': f'OpenAI API error: {str(openai_error)}'
                    }, status=500)
        return JsonResponse({
                'success': True,
                'analysis': ai_response,
                'prompt_used': user_prompt,
            })
            
       
            
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'Server error: {str(e)}'
        }, status=500)
    