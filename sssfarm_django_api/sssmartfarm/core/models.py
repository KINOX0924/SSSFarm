from django.db import models

# Create your models here.

# 센서 데이터의 device_id 값을 참조하여 가져오기 위해서 deivce 정보도 가져옴
class Device(models.Model) :
    device_id     = models.BigAutoField(primary_key = True)           # 기본키
    device_serial = models.CharField(max_length = 50 , unique = True) # 장치의 MAC 주소(시리얼번호) 를 받아냄 , 중복 불가
    
    class Meta :
        managed  = False     # Django 에서 이 테이블을 생성/수정하지 않도록 설정함 => 이미 MySQL 에서 테이블을 구성했기 때문
        db_table = "device"  # MySQL 에서 실제 테이블명을 입력

class SensorData(models.Model) :
    device_id       = models.ForeignKey(Device , on_delete = models.CASCADE , db_column = "device_id")
    # 센서 데이터 device_id 는 Device 의 device_id 를 참조하여 들어옴
    measure_date    = models.DateTimeField()
    temperature     = models.FloatField()
    humidity        = models.FloatField()
    soil_moisture_1 = models.IntegerField()
    soil_moisture_2 = models.IntegerField()
    light_level     = models.IntegerField()
    water_level     = models.IntegerField()
    
    class Meta :
        managed  = False
        db_table = "sensordata"