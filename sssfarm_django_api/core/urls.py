from django.urls import path
from . import views

# POST 요청으로 센서 원시 데이터를 수신하는 경로
urlpatterns = [
    path("sensordata/" , views.receive_sensor_data , name = "receive_sensor_data")
]
