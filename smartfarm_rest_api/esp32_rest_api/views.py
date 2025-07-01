from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils.dateparse import parse_datetime
from .models import Device , SensorData
from .serializers import SensorDataSerializer

# Create your views here.

@api_view(["POST"])
def receive_sensor_data(request) :
    try :
        # 수신된 로우 데이터 가져옴
        raw_data = request.body.decode("utf-8")
        # 로우 데이터 파싱
        mac_address , date_time , temp , humi , soil_1 , soil_2 , light , water = raw_data.strip().split(",")
        
        # 장치의 존재 여부를 시리얼 넘버로 확인 후 없으면 생성
        device , created = Device.objects.get_or_create(
            device_serial = mac_address ,
            defaults      = {"device_serial" : mac_address}
        )
        
        # 센서 데이터를 객체로 저장
        esp32_data = {
            "device_id"       : device.device_id ,
            "measure_date"    : parse_datetime(date_time) ,
            "temperature"     : float(temp) ,
            "humidity"        : float(humi) ,
            "soil_moisture_1" : int(soil_1) ,
            "soil_moisture_2" : int(soil_2) ,
            "light_level"     : int(light) ,
            "water_level"     : int(water) ,
        }
        
        serializer = SensorDataSerializer(esp32_date = esp32_data)
        if serializer.is_vaild() :
            serializer.save()
            return Response({"message" : "Success"} , status = status.HTTP_201_CREATED)
        