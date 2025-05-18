from typing import List
from ninja import Router
from ninja_jwt.authentication import JWTAuth
from .models import Video  # Import the Video model
from django.shortcuts import get_object_or_404  # Import get_object_or_404
from .schemas import VideoSchema, VideoCreateSchema  # Import the schemas
from django.core.exceptions import ValidationError  # Import ValidationError



router = Router()

@router.get("", response= List[VideoSchema])
def list_videos(request):
    videos = Video.objects.all()
    full_host = request.build_absolute_uri('/')[:-1]  # removes trailing slash

    for v in videos:
        v.video_url = f"{full_host}{v.video.url}"
    return videos


@router.post("videos/upload", auth = JWTAuth(), response=VideoSchema)
def create_video(request, data: VideoCreateSchema):
    try:
        print("Received files:", request.FILES)
        print("Received POST data:", request.POST)
        
        if 'video' not in request.FILES:
            raise ValidationError("No video file provided in request")
            
        video_file = request.FILES['video']
        caption = request.POST.get('caption', '')
        
        video_data = {
            'user': request.user,
            'caption': caption,
            'video': video_file
        }
        
        # Validate file type
        allowed_types = ["video/mp4", "video/mkv", "video/avi", "video/webm"]
        if video_file.content_type not in allowed_types:
            raise ValidationError(f"Invalid video format. Allowed formats: {', '.join(allowed_types)}")
            
        video = Video.objects.create(**video_data)
        return video
    except ValidationError as e:
        print(f"Validation error: {str(e)}")
        raise
    except Exception as e:
        print(f"Error creating video: {str(e)}")
        raise

@router.get("{year}/{month}/{day}/{slug}", response=VideoSchema)
def get_video(request, slug: str, year: int, month: int, day: int):
    video = get_object_or_404(
        Video,
        slug=slug,
        publish__year=year,
        publish__month=month,
        publish__day=day,
    )
    full_host = request.build_absolute_uri('/')[:-1]  # removes trailing slash
    video.video_url = f"{full_host}{video.video.url}"

    return video

@router.get("{year}/{month}/{day}/{slug}/detect-players")
def detect_players(request, year: int, month: int, day: int, slug: str, frame: int):
    from .views import object_detection 
    return object_detection(request, year, month, day, slug, frame)

@router.get("user/{username}", response=List[VideoSchema])
def list_user_videos(request, username: str):
    videos = Video.objects.filter(user__username=username)
    full_host = request.build_absolute_uri('/')[:-1]  # removes trailing slash
    print(videos)
    for v in videos:
        v.video_url = f"{full_host}{v.video.url}"
    return videos