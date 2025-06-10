from django.urls import path
from . import views

app_name = 'video'

urlpatterns = [
    path('', views.index, name='index'),
    path(
        '<int:year>/<int:month>/<int:day>/<slug:video>/',
        views.video_detail,
        name='video_detail'),
    path('<int:year>/<int:month>/<int:day>/<slug:video>/analyze/', views.object_detection, name='object_detection'),
    path('analyze-frame/', views.analyze_frame_with_ai, name='analyze_frame_with_ai'),
]