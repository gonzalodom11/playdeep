from django.urls import path
from . import views

app_name = 'video'

urlpatterns = [
   path('', views.index, name='index'),
   path(
    '<int:year>/<int:month>/<int:day>/<slug:video>/',
    views.video_detail,
    name='video_detail')
]