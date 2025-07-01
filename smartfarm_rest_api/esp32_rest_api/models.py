from django.db import models

# Create your models here.
class Device(models.Model) :
    device_id     = models.BigAutoField(primary_key = True) # 기본키 , Bigint , auto-increment
    device_serial = models.CharField(max_length = 50)       # 시리얼 키를 가져옴
    
    class Meta :
        managed  = False
        db_table = "device"

class SensorData(models.Model) :
    device_id       = models.ForeignKey(
        Device , on_delete = models.RESTRICT , db_column = "device_id"   # class Device 에서 가져온 device_id 참조값을 SensorData 의 device_id 에 대입
    )
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