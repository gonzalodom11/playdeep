import os
import json
import base64
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
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


def analyze_with_llm(request, year, month, day, slug, frame_selected):
    
    client = OpenAI(api_key=config('OPENAI_API_KEY'))

    video = get_object_or_404(
        Video,
        slug=slug,
        publish__year=year,
        publish__month=month,
        publish__day=day
    )

    frame_generator = sv.get_video_frames_generator(video.video.url)

    # Select the 10th frame (index 9, as indexing starts from 0)
    for _ in range(frame_selected):
        frame_res = next(frame_generator)

    




def analyze_video(request, year, month, day, slug, frame_selected):
    video = get_object_or_404(
        Video,
        slug=slug,
        publish__year=year,
        publish__month=month,
        publish__day=day
        )
    
    model = YOLO('models/best.pt')
    results = model.predict(r"C:\Users\User\Videos\Barcelona Villareal La Liga 2025.mp4", save=True)


def analyze_frame_with_ai(request):
    """
    Vista para analizar frames de video usando OpenAI GPT-4o
    Recibe una imagen en base64 y un prompt, devuelve el análisis de la IA
    """
    try:
        # Parsear el JSON del request
        data = json.loads(request.body)
        
        # Validar que los datos requeridos están presentes
        if 'image' not in data or 'prompt' not in data:
            return JsonResponse({
                'error': 'Missing required fields: image and prompt'
            }, status=400)
        
        image_base64 = data['image']
        user_prompt = data['prompt']
        
        # Validar que el prompt no esté vacío
        if not user_prompt.strip():
            return JsonResponse({
                'error': 'Prompt cannot be empty'
            }, status=400)
        
        # Validar el formato de la imagen base64
        if not image_base64.startswith('data:image/'):
            return JsonResponse({
                'error': 'Invalid image format. Expected base64 data URL'
            }, status=400)
        
        # Inicializar cliente de OpenAI
        try:
            client = OpenAI(api_key=config('OPENAI_API_KEY'))
        except Exception as e:
            return JsonResponse({
                'error': 'OpenAI API key not configured'
            }, status=500)
        
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
                                "text": user_prompt
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
                max_tokens=1000,
                temperature=0.7
            )
            
            # Extraer la respuesta
            ai_response = response.choices[0].message.content
            
            return JsonResponse({
                'success': True,
                'analysis': ai_response,
                'prompt_used': user_prompt
            })
            
        except Exception as openai_error:
            return JsonResponse({
                'error': f'OpenAI API error: {str(openai_error)}'
            }, status=500)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'Server error: {str(e)}'
        }, status=500)
    