from typing import List
from ninja import Router
from .models import Video  # Import the Video model
from .schemas import VideoSchema, VideoCreateSchema  # Import the schemas

router = Router()

@router.get("", response= List[VideoSchema])
def list_videos(request):
    videos = Video.objects.all()
    return videos


@router.post("/videos", response=VideoSchema)
def create_video(request, data: VideoCreateSchema):
    video = Video.objects.create(**data.dict())
    return video