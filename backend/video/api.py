from typing import List
from ninja import Router
from ninja_jwt.authentication import JWTAuth
from .views import object_detection, analyze_frame_with_ai
from .models import Video  # Import the Video model
from django.shortcuts import get_object_or_404  # Import get_object_or_404
from .schemas import VideoSchema, ConfirmUploadSchema  # Import the schemas
from django.core.exceptions import ValidationError  # Import ValidationError
from datetime import datetime
from decouple import config



router = Router()

@router.get("", response= List[VideoSchema])
def list_videos(request):
    videos = Video.objects.all()
    return videos


@router.post("videos/upload", auth=JWTAuth(), response=VideoSchema)
def create_video(request):
    try:
        print("Received files:", request.FILES)
        print("Received POST data:", request.POST)
        
        if 'video' not in request.FILES:
            raise ValidationError("No video file provided in request")
            
        video_file = request.FILES['video']
        caption = request.POST.get('caption', '')
        
        # Validate file type
        allowed_types = ["video/mp4", "video/mkv", "video/avi", "video/webm"]
        if video_file.content_type not in allowed_types:
            raise ValidationError(f"Invalid video format. Allowed formats: {', '.join(allowed_types)}")
            
        video = Video.objects.create(
            user=request.user,
            caption=caption,
            video=video_file
        )
        

        
        # Convert to schema for JSON serialization
        return VideoSchema.from_orm(video)
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
    return video

@router.get("{year}/{month}/{day}/{slug}/detect-players")
def detect_players(request, year: int, month: int, day: int, slug: str, frame: int):
    
    return object_detection(request, year, month, day, slug, frame)

@router.post("{year}/{month}/{day}/{slug}/analyze-llm")
def analyze_llm(request, year: int, month: int, day: int, slug: str):
    return analyze_frame_with_ai(request, year, month, day, slug)

@router.get("user/{username}", response=List[VideoSchema])
def list_user_videos(request, username: str):
    videos = Video.objects.filter(user__username=username)
    return videos

@router.post("videos/sas-upload-url", auth=JWTAuth())
def get_sas_upload_url(request, blob_name: str):
    # Check if the user has reached the upload limit
    try:
        user_video_count = Video.objects.filter(user=request.user).count()
        if user_video_count >= 4:
            raise ValidationError("Upload limit reached. You can only upload up to 4 videos in Basic Plan.")

        account_name = config("AZURE_ACCOUNT_NAME")
        container = config("AZURE_CONTAINER")
        sas_token = config("AZURE_SAS_TOKEN")  # Get the static SAS token from .env

        # Ensure publish date is set (default=timezone.now takes care of this on create)
        # Construct the target path using the publish date and blob_name
        publish_date = datetime.now()
        # Format the date as YY/MM/DD
        date_path = publish_date.strftime('%y/%m/%d')
        url = f"https://{account_name}.blob.core.windows.net/{container}/{date_path}/{blob_name}?{sas_token}"
        return {"upload_url": url}
    except ValidationError as e:
        print(f"Validation error in SAS upload URL: {str(e)}")
        raise

@router.post("videos/confirm-upload", auth=JWTAuth(), response=VideoSchema)
def confirm_upload(request, payload: ConfirmUploadSchema):
    print("Received payload for confirm_upload:", payload.dict())
    # Extract just the relative path from the URL
    relative_path = payload.uploadUrl.split('/videos/')[1].split('?')[0]
    video = Video.objects.create(
        user=request.user,
        caption=payload.caption,
        video=relative_path,  # Store only the relative path
        slug=payload.caption.replace(" ", "-")
    )
    
    return VideoSchema.from_orm(video)