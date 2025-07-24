"""
구성한 ERD 를 그대로 코드로 옮기는 파일
"""

from sqlalchemy import (CheckConstraint , Column , Integer , String , Text , DECIMAL , FLOAT , DATETIME, ForeignKey , BIGINT , func)
from sqlalchemy.orm import relationship
from .data_pipe import Base
from datetime import datetime

# 미리 구성한 ERD 의 모든 테이블을 아래 코드를 통해서 파이썬 클래스로 변환함

# position 테이블
class Position(Base) :
    __tablename__ = "position"  # 해당 클래스가 DB 의 어떤 테이블과 연결되는 지 확인
    position_id   = Column(Integer , primary_key = True , index = True)
    position_name = Column(String(50) , unique = True , nullable = False)
    
    # 속함
    # 가짐
    devices = relationship("Device" , back_populates = "position")      # 포지션이 여러 디바이스를 가질 수 있다는 관계 정의
    users   = relationship("User" , back_populates = "position")        # 포지션이 여러 사용자를 가질 수 있다는 관계 정의
    # relationship 설정을 해줌으로서 DB 의 JOIN 을 파이썬 객체처럼 사용할 수 있도록 함

# user 테이블
class User(Base) :
    __tablename__ = "user"
    user_id     = Column(Integer , primary_key = True , index = True)
    username    = Column(String(50) , unique = True , nullable = False)
    password    = Column(String(255))
    position_id = Column(Integer , ForeignKey("position.position_id"))
    
    # 속함
    position = relationship("Position" , back_populates = "users")       # 사용자가 하나의 포지션에 속한다는 관계 정의
    
    # 가짐
    user_presets = relationship("UserPreset" , back_populates = "user")  # 사용자가 여러 유저 프리셋을 가질 수 있다는 관계 정의

# device 테이블
class Device(Base) :
    __tablename__ = "device"
    device_id       = Column(BIGINT , primary_key = True , index = True)
    position_id     = Column(Integer , ForeignKey("position.position_id"))
    device_name     = Column(String(100) , unique = True)
    device_serial   = Column(String(50) , unique = True , nullable = False)
    location        = Column(String(255))
    user_preset_id  = Column(Integer , ForeignKey("userpreset.preset_id") , nullable = True)
    plant_preset_id = Column(Integer , ForeignKey("plantpreset.plant_preset_id") , nullable = True)
    last_active     = Column(DATETIME)
    device_type     = Column(String(50) , nullable = False , default = "SENSOR_ACTUATOR")
    
    # 실시간 제어를 위한 상태 관리 필드들
    target_led_state    = Column(String(10) , default = "OFF")
    target_pump_state_1 = Column(String(10) , default = "OFF")
    target_pump_state_2 = Column(String(10) , default = "OFF")
    target_fan_state    = Column(String(10) , default = "OFF")
    alert_led_state     = Column(String(10) , default = "OFF")
    
    # 사용자 수동 제어 상태 관리 필드들
    override_led_state    = Column(String(10) , nullable = True , default = None)
    override_pump_state_1 = Column(String(10) , nullable = True , default = None)
    override_pump_state_2 = Column(String(10) , nullable = True , default = None)
    override_fan_state    = Column(String(10) , nullable = True , default = None)
    
    # 펌프의 마지막 작동 시간 추가
    # 펌프가 10초만 작동하고 무조건 20초의 휴식타임을 가지도록 함
    pump_1_last_active_time = Column(DATETIME , nullable = True)
    pump_2_last_active_time = Column(DATETIME , nullable = True)
    
    # 테이블 제약 조건
    # 기기가 user_preset_id 또는 plant_preset_id 중 어느 하나만 적용되도록 하기 위해 제약 조건을 거는 코드
    __table_args__ = (
        CheckConstraint("user_preset_id IS NULL or plant_preset_id IS NULL" , name = "chk_one_preset_at_most") ,
    )
    
    # 속함
    position     = relationship("Position" , back_populates = "devices")     # 기기가 하나의 포지션에 속한다는 관계 정의
    user_preset  = relationship("UserPreset" , back_populates = "devices")   # 기기가 하나의 유저 프리셋에 속한다는 관계 정의
    plant_preset = relationship("PlantPreset" , back_populates = "devices")  # 기기가 하나의 개발 프리셋에 속한다는 관계 정의
    sensor_data  = relationship("SensorData" , back_populates = "device")    # 기기가 하나의 센서 데이터에 속한다는 관계 정의
    action_logs  = relationship("ActionLog" , back_populates = "device")     # 기기가 하나의 동작 로그에 속한다는 관계 정의
    plant_images = relationship("PlantImage" , back_populates = "device")    # 촬영된 사진이 어느 장치에서 촬영된 것인지 확인하기 위한 용도
    
    # 가짐

# sensordata 테이블
class SensorData(Base) :
    __tablename__ = "sensordata"
    measure_id      = Column(BIGINT , primary_key = True , index = True)
    device_id       = Column(BIGINT , ForeignKey("device.device_id") , nullable = False)
    measure_date    = Column(DATETIME)
    temperature     = Column(FLOAT)
    humidity        = Column(FLOAT)
    soil_moisture_1 = Column(Integer)
    soil_moisture_2 = Column(Integer)
    light_level     = Column(Integer)
    water_level     = Column(Integer)
    
    # 속함
    # 가짐
    device = relationship("Device" , back_populates = "sensor_data") # 센서데이터는 여러개의 기기를 가진다는 관계 정의
    
# actionlog 테이블
class ActionLog(Base) :
    __tablename__ = "actionlog"
    log_id         = Column(BIGINT , primary_key = True , index = True)
    device_id      = Column(BIGINT , ForeignKey("device.device_id") , nullable = False)
    action_type    = Column(String(50) , nullable = False)
    action_trigger = Column(String(50) , nullable = False)
    action_time    = Column(DATETIME)
    
    # 속함
    # 가짐
    device = relationship("Device" , back_populates = "action_logs") # 동작 로드는 여러 개의 기기를 가진다는 관계 정의

# plantpreset 테이블
class PlantPreset(Base) :
    __tablename__ = "plantpreset"
    plant_preset_id            = Column(Integer , primary_key = True , index = True)
    plant_name                 = Column(String(100) , unique = True , nullable = False)
    description                = Column(Text)
    recomm_temperature_min     = Column(DECIMAL(5,2) , nullable = False)
    recomm_temperature_max     = Column(DECIMAL(5,2) , nullable = False)
    recomm_humidity_min        = Column(DECIMAL(5,2) , nullable = False)
    recomm_humidity_max        = Column(DECIMAL(5,2) , nullable = False)
    recomm_soil_moisture_1_min = Column(Integer , nullable = False)
    recomm_soil_moisture_1_max = Column(Integer , nullable = False)
    recomm_soil_moisture_2_min = Column(Integer , nullable = False)
    recomm_soil_moisture_2_max = Column(Integer , nullable = False)
    darkness_threshold         = Column(Integer , nullable = False)
    led_level                  = Column(Integer)
    light_start_hour           = Column(Integer)
    light_end_hour             = Column(Integer)
    
    # 속함
    # 가짐
    devices = relationship("Device" , back_populates = "plant_preset") # 개발자 프리셋은 여러 개의 기기를 가진다는 관계 정의

# userpreset 테이블
class UserPreset(Base) :
    __tablename__ = "userpreset"
    preset_id                  = Column(Integer , primary_key = True , index = True)
    user_id                    = Column(Integer , ForeignKey("user.user_id"))
    preset_name                = Column(String(100) , unique = True , nullable = False)
    target_temperature_min     = Column(DECIMAL(5,2) , nullable = False)
    target_temperature_max     = Column(DECIMAL(5,2) , nullable = False)
    target_humidity_min        = Column(DECIMAL(5,2) , nullable = False)
    target_humidity_max        = Column(DECIMAL(5,2) , nullable = False)
    target_soil_moisture_1_min = Column(Integer , nullable = False)
    target_soil_moisture_1_max = Column(Integer , nullable = False)
    target_soil_moisture_2_min = Column(Integer , nullable = False)
    target_soil_moisture_2_max = Column(Integer , nullable = False)
    darkness_threshold         = Column(Integer , nullable = False)
    led_level                  = Column(Integer)
    light_start_hour           = Column(Integer)
    light_end_hour             = Column(Integer)
    
    # 속함
    # 가짐
    user   = relationship("User" , back_populates = "user_presets")   # 사용자 프리셋은 여러 개의 사용자를 가진다는 관계 정의
    devices = relationship("Device" , back_populates = "user_preset") # 사용자 프리셋은 여러 개의 기기를 가진다는 관계 정의

# plantimage 테이블
class PlantImage(Base) :
    __tablename__ = "plant_images"
    image_id      = Column(BIGINT , primary_key = True , index = True)
    device_id     = Column(Integer , ForeignKey("device.device_id") , nullable = False)
    image_path    = Column(String(255) , nullable = False)
    captured_at   = Column(DATETIME , server_default = func.now() , nullable = False)
    
    device = relationship("Device" , back_populates = "plant_images")