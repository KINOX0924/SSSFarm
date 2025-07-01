from django.urls import path
from .views import receive_sensor_data

urlpatterns = [
    path("sensordata/" , receive_sensor_data) ,
]
