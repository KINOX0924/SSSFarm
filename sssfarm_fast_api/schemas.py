"""
API 의 입출력 데이터 형식을 Pydantic 모델로 정의하는 파일

외부와 통신하는 데이터의 규칙(명세)
데이터 유효성 검사 진행 및 자동으로 형 변환(타입) , API 문서화에 사용

Fast API 는 여기서 정의된 스키마를 보고 들어오는 요청의 데이터가
올바른 데이터인지 자동으로 검증하고 , 나가는 응답의 형식을 JSON 형태로 포장함

model.py 는 DB 내부의 규칙 , schemas.py 는 API 외부 규칙이라고 생각하면 편함
"""

from pydantic import BaseModel      # 모든 스키마는 Pydantic 의 BaseModel 을 상속받아 생성됨
from typing import Optional , List  # Optional[타입] : 타입의 값이 있을 수 있거나 없을 수도 있음(Null)
from datetime import datetime       # List[필드] : 스키마 형태의 객체들이 여러 개 들어있는 리스트(배열)
from decimal import Decimal

# POSITION SCHEMAS
class PositionBase(BaseModel) :
    position_name : str

class PositionCreate(PositionBase) :
    pass

class Position(PositionBase) :
    position_id : int
    
    # SQLAlchemt 모델 객체를 Pydantic 모델로 변환 가능하게 만듬
    class Config :
        from_attributes = True


# USER SCHEMAS
class UserBase(BaseModel) :
    username    : str
    position_id : Optional[int] = None
    
class UserCreate(UserBase) :
    password : str

class User(UserBase) :
    user_id  : int
    position : Optional[Position] = None    # 포지션(직급) 과 관계된 정보를 같이 보여줌
    
    class Config :
        from_attributes = True


# USER PRESET SCHEMAS
class UserPresetBase(BaseModel) :
    preset_name                : str
    target_temperature_min     : Decimal
    target_temperature_max     : Decimal
    target_humidity_min        : Decimal
    target_humidity_max        : Decimal
    target_soil_moisture_1_min : int
    target_soil_moisture_1_max : int
    target_soil_moisture_2_min : int
    target_soil_moisture_2_max : int
    darkness_threshold         : int
    led_level                  : Optional[int] = None
    light_start_hour           : Optional[int] = None
    light_end_hour             : Optional[int] = None
    
class UserPresetCreate(UserPresetBase) :
    user_id : int

class UserPreset(UserPresetBase) :
    preset_id : int
    user_id   : int
    
    class Config :
        from_attributes = True


# PLANT PRESET SCHEMAS
class PlantPresetBase(BaseModel) :
    plant_name                 : str
    description                : Optional[str] = None
    recomm_temperature_min     : Decimal
    recomm_temperature_max     : Decimal
    recomm_humidity_min        : Decimal
    recomm_humidity_max        : Decimal
    recomm_soil_moisture_1_min : int
    recomm_soil_moisture_1_max : int
    recomm_soil_moisture_2_min : int
    recomm_soil_moisture_2_max : int
    darkness_threshold         : int
    led_level                  : Optional[int] = None
    light_start_hour           : Optional[int] = None
    light_end_hour             : Optional[int] = None

class PlantPresetCreate(PlantPresetBase) :
    pass

class PlantPreset(PlantPresetBase) :
    plant_preset_id : int
    
    class Config :
        from_attributes = True


# ACTION LOG SCHEMAS
class ActionLogBase(BaseModel) :
    action_type    : str
    action_trigger : str

class ActionLogCreate(ActionLogBase) :
    device_id : int

class ActionLog(ActionLogBase) :
    log_id      : int
    device_id   : int
    action_time : datetime
    
    class Config :
        from_attributes = True


# SENSORDATA SCHEMAS
class SensorDataBase(BaseModel) :
    temperature     : Optional[float] = None
    humidity        : Optional[float] = None
    soil_moisture_1 : Optional[int] = None
    soil_moisture_2 : Optional[int] = None
    light_level     : Optional[int] = None
    water_level     : Optional[int] = None

class SensorDataCreate(SensorDataBase) :
    device_serial : str

class SensorData(SensorDataBase) :
    measure_id   : int
    device_id    : int
    measure_date : datetime

    class Config :
        from_attributes = True


# DEVICE SCHEMAS
# DEVICE 스키마 외 다른 스키마들을 조합
# 가장 중요한 스키마이며 다른 스키마들을 타입 힌트로 사용하여, 장치 정보를 조회하고
# 위치 정보 , 프리셋 정보 등을 한 번에 중첩된 JSON 형태로 보여줄 수 있음 => 프론트엔드 개발자가 작업하기 매우 편리한 구조가 됨
class DeviceBase(BaseModel) :
    device_name : str
    location    : Optional[str] = None

class DeviceCreate(DeviceBase) :
    device_serial   : str
    position_id     : int
    user_preset_id  : Optional[int] = None
    plant_preset_id : Optional[int] = None

# 장치 메뉴얼 작동(수동 작동) 스키마
class ManualControlRequest(BaseModel) :
    # 제어 컴포넌트 이름 : pump_1 , pump_2 , fan , led
    component : str
    command   : str

class Device(DeviceBase) :  # 가장 복잡하고 많은 정보를 보여주는 Device 조회용 스키마
    device_id     : int
    device_serial : str
    last_active   : Optional[datetime] = None
    
    # 관계된 다른 정보들을 포함하여 보여줌
    position     : Optional[Position] = None
    user_preset  : Optional[UserPreset] = None
    plant_preset : Optional[PlantPreset] = None
    sensor_data  : List[SensorData] = []
    action_logs  : List[ActionLog] = []
    
    class Config :
        from_attributes = True


# ESP32 아두이노가 자신의 제어 상태를 받아갈 때 사용할 스키마 설정
class DeviceControlStatus(BaseModel) :
    target_led_state    : str
    target_pump_state_1 : str
    target_pump_state_2 : str
    target_fan_state    : str
    alert_led_state     : str

# class Config : from_attributes = True
# SQLAlchemt 로 조회한 DB 모델 객체를 Pydantic 스키마로 변환할 때 , 객체의 속성으로 값에 접근하여 데이터를 읽어오도록 허용하는 옵션
# 이 설정이 없으면 ORM 객체를 스키마로 변환할 수 없음