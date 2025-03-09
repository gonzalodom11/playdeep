from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from .models import Video
from .forms import Video_form
# Create your views here.


def index(request):
    videos = Video.objects.all()
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