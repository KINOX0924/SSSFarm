from django.shortcuts import render                 # Django 의 템플릿 렌더링 기능을 가져옴 , 웹페이지에서 사용자에게 데이터의 렌더링을 보여주는 역할 (API 뷰에서는 데이터를 직접 반환해서 잘 사용되지 않음)
from rest_framework.decorators import api_view      # 특정 HTTP 메소드(GET , POST) 만 허용하도록 뷰를 제한함
from rest_framework.response import Response        # DRF 에서 API 응답을 생성하는 데 사용하는 Response 객체를 가져옴
from rest_framework import status                   # DRF 에서 HTTP 상태 코드를 쉽게 사용할 수 있도록 상수로 정의해놓은 모듈을 가져옴
from django.utils.dateparse import parse_datetime   # Django 에서 날짜과 시간 문자열을 datetime 객체로 파싱(분석) 하는 유틸리티 함수를 가져옴
from .models import Device , SensorData             # models.py 에서 정의된 Device 모델과 SensorData 모델을 가져옴
from .serializers import SensorDataSerializer       # serializers.py 에서 정의된 SensorDataSerializer 클래스를 가져옴

""" ESP32 센서 데이터를 받아서 파싱/저장하는 클래스 """
@api_view(["POST"]) # POST 방식으로만 요청을 허용하도록 하는 데코레이터 코드
def receive_sensor_data(request) :
    try :
        # 수신된 로우 데이터 가져옴
        # 받아낸 요청을 utf-8 형식으로 복호화하여 raw_data 변수에 저장
        raw_data = request.body.decode("utf-8")
        # 로우 데이터 파싱(MAC 주소 , 추출 일자 , 온도 , 습도 , 토양 수분(1) , 토양 수분(2) , 조도 , 수위)
        mac_address , date_time , temp , humi , soil_1 , soil_2 , light , water = raw_data.strip().split(",")
        
        # 장치의 존재 여부를 시리얼 넘버로 확인 후 없으면 생성
        # 단 , device_name 의 Not Null 을 풀어야함 , 아니면 자동으로 mac 주소와 섞어서 넣도록 하는 방법도 있음
        device , created = Device.objects.get_or_create(
            device_serial = mac_address ,                       # device_serial 필드에 mac_address 를 넣음
            defaults      = {"device_serial" : mac_address}     # 해당 mac_address 를 가진 장치가 DB 에 없으면 defaults 로 device_serial 필드에 mac_address 를 넣어서 DB 생성
        )
        
        # 센서 데이터를 객체로 저장
        # 이 때 각각의 변수명이 실제 MySQL 에 있는 필드의 이름과 동일해야함
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
        
        # 클라이언트로부터 받은 esp32_data 를 사용하여 SensorDataSerializer 인스턴스 생성
        # 해당 Serializer 가 받은 데이터를 기반으로 유효성 검사 및 데이터베이스 저장을 위한 준비를 할 수 있도록 세팅
        serializer = SensorDataSerializer(data = esp32_data)
        if serializer.is_valid() :
            serializer.save()
            return Response({"message" : "Success"} , status = status.HTTP_201_CREATED) # 받은 데이터가 유효한 데이터값이라면 저장
        else :
            return Response(serializer.errors , status = status.HTTP_400_BAD_REQUEST)   # 받은 데이터가 유효한 데이터값이 아니라면 저장하지 않음
    
    except Exception as err :
        return Response({"error" : str(err)} , status = status.HTTP_400_BAD_REQUEST)    # POST 방식이 아니거나 수신 자체가 안되면 에러 처리