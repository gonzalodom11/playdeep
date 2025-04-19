from typing import List
from ninja import Router
from .models import Video  # Import the Video model
from django.shortcuts import get_object_or_404  # Import get_object_or_404
from .schemas import VideoSchema, VideoCreateSchema  # Import the schemas

router = Router()

@router.get("", response= List[VideoSchema])
def list_videos(request):
    videos = Video.objects.all()
    full_host = request.build_absolute_uri('/')[:-1]  # removes trailing slash

    for v in videos:
        v.video_url = f"{full_host}{v.video.url}"
    return videos


@router.post("", response=VideoSchema)
def create_video(request, data: VideoCreateSchema):
    video = Video.objects.create(**data.dict())
    return video

@router.get("{year}/{month}/{day}/{slug}", response=VideoSchema)
def get_video(request, slug: str, year: int, month: int, day: int):
    video = get_object_or_404(Video, slug=slug)
    return video
