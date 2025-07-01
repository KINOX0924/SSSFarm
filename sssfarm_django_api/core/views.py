from django.shortcuts import render
from django.http import JsonResponse                    # JSON 응답 생성을 위한 라이브러리
from django.views.decorators.csrf import csrf_exempt    # CSRF 검증 생략
from django.utils.dateparse import parse_datetime       # 문자열 datetime 객체 파싱
from .models import Device , SensorData                 # 작성한 model 가져옴
import datetime
import traceback

# Create your views here.
# 코드 흐름
"""
[1] 외부 장치(ESP32 또는 POSTMAN) 에서 가공되지 않은 문자열을 POST 로 전송
[2] Django 에서 문자열을 받아서 파싱한 뒤, MySQL 테이블에 저장
[3] device_serial 은 MAC 주소이며 , 기존에 없던 MAC 주소이면 자동으로 등록
[4] SensorData 테이블에 각 필드에 맞게 데이터 저장
"""

@csrf_exempt    # CSRF 토근 없이도 외부 요청 허용함 ( ESP32 등 외부 장치에서 전송 시 토근 없어도 되도록 함 )
def receive_sensor_data(request) :
    if request.method == "POST" :   # HTTP POST 요청만 받아서 처리 진행
        try :                       # 수신된 데이터를 파밍
            data_body = request.body.decode("utf-8")
            # 바이트 체계를 문자열 체계로 변경
            mac_address , date_time , temp , humi , soil_1 , soil_2 , light , water = data_body.strip().split(",")
            # 수신된 데이터를 "," 로 구분하여 나누고 각 변수에 저장
            
            # 받은 MAC 주소를 이용하여 기기를 검색 , 만약 해당 MAC 주소의 기기가 없는 경우 새로 생성됨
            device , created = Device.objects.get_or_create(
                device_serial = mac_address , 
                defaults      = {"device_serial" : mac_address}
            )
            
            # sensordata 객체 생성 후 저장
            SensorData.objects.create (
                device_id       = device ,            # 외래키를 참조하여 전달
                measure_date    = parse_datetime(date_time) , # 문자열 => datetime 형태로 변환하여 저장
                temperature     = float(temp) ,
                humidity        = float(humi) ,
                soil_moisture_1 = int(soil_1) ,
                soil_moisture_2 = int(soil_2) ,
                light_level     = int(light) ,
                water_level     = int(water)
            )
            
            return JsonResponse({"message" : "Success"} , status = 201)         # 파싱 성공 시 메세지 반환
        
        except Exception as err :
            return JsonResponse({"error" : str(err)} , status = 400)            # 파싱 실패 시 메세지 반환
        
    return JsonResponse({"error" : "Invalid request method"} , status = 405)    # 유효하지 않은 요청을 받았을 시에 반환