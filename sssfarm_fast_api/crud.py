"""
데이터베이스에 직접 접근하는 코드들을 함수로 분리하여 모아놓은 파일
실제로 데이터베이스에 데이터를 읽고 쓰는 관리인의 역할을 함

main.py 의 API 로직이 간결해지고 , 데이터베이스 작업 코드를 재사용하기 편리해짐
즉 , 이 파일의 목적은 데이터베이스 관련 로직을 API 경로 처리 로직(main.py) 으로부터 완전히 분리시키는 것

사용자의 비밀번호를 암호화하기 위해서 passlib 라는 라이브러리를 사용함 : pip install "passlib[bcrypt]"

Create : 새 데이터 생성
Read   : 데이터 조회
Update : 데이터 수정
Delete : 데이터 삭제
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from . import models , schemas , auth


# USER CRUD
# user_id 로 특정 사용자 한 명을 조회하는 함수
def get_user(db : Session , user_id : int) :
    return db.query(models.User).filter(models.User.user_id == user_id).first()

# username 으로 특정 사용자 한 명을 조회하는 함수
def get_user_by_username(db : Session , username : str) :
    return db.query(models.User).filter(models.User.username == username).first()

# 모든 사용자 목록을 조회하는 함수(페이지네이션 적용)
def get_users(db : Session , skip : int = 0 , limit : int = 100) :
    return db.query(models.User).offset(skip).limit(limit).all()

# 새로운 사용자를 생성(비밀번호 암호화 포함)
def create_user(db : Session , user :schemas.UserCreate) :
    hashed_password = auth.get_password_hash(user.password)  # 입력한 비밀번호를 암호화 진행
    db_user = models.User(
        username = user.username ,
        password = hashed_password ,
        position_id = user.position_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

# 사용자 이름과 비밀번호를 확인하여 일치하면 사용자 객체를 , 아니면 False 반환 함수
def authenticate_user(db : Session , username : str , password : str) :
    user = get_user_by_username(db , username = username)
    if not user :
        return False
    if not auth.verify_password(password , user.password) :
        return False
    return user


# POSITION CRUD
# position_id 로 특정 직급(그룹) 을 조회
def get_position(db : Session , position_id : int) :
    return db.query(models.Position).filter(models.Position.position_id == position_id).first()

# position_name 으로 특정 직급(그룹) 을 조회
def get_position_by_positionname(db : Session , position_name :str) :
    return db.query(models.Position).filter(models.Position.position_name == position_name).first()

# 모든 직급(그룹) 을 조회
def get_positions(db : Session , skip : int = 0 , limit : int = 100) :
    return db.query(models.Position).offset(skip).limit(limit).all()

# 새로운 직급(그룹) 을 생성
def create_position(db : Session , position : schemas.PositionCreate) :
    db_position = models.Position(**position.model_dump())
    # ** 연산자는 딕셔너리 언패킹을 의미함
    # 딕셔너리 앞에 붙이면 딕셔너리의 key : value 쌍을 key = value 형태의 키워드 인자로 풀어냄
    # models.py 에서 정의한 Device 클래스 생성자를 호출하여 Device SQLAlchemy 객체를 반들어 db_device 변수에 할당하라는 의미
    db.add(db_position)                                     
    db.commit()                                             
    db.refresh(db_position)
    
    return db_position


# DEVICE CRUD
# device_id 로 특정 장치를 조회
def get_device(db : Session , device_id : int) :
    return db.query(models.Device).filter(models.Device.device_id == device_id).first()

# device_name 으로 특정 장치를 조회
def get_device_by_devicename(db : Session , device_name : str) :
    return db.query(models.Device).filter(models.Device.device_name == device_name).first()

# device_serial 로 특정 장치를 조회
def get_device_by_serial(db : Session , serial : str) :
    return db.query(models.Device).filter(func.trim(models.Device.device_serial) == serial.strip()).first()
# 좌우 공백 제거를 통해 혹시라도 발생할 수 있는 오류를 차단

# 모든 장치 목록을 조회
def get_devices(db : Session , skip : int = 0 , limit : int = 100) :
    return db.query(models.Device).offset(skip).limit(limit).all()

# 새로운 장치를 생성
def create_device(db : Session , device : schemas.DeviceCreate) :
    db_device = models.Device(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    
    return db_device

# 사용자 프리셋을 적용하고 식물(개발자) 프리셋을 해제
def apply_user_preset_to_device(db : Session , device_id : int , user_preset_id : int) :
    device = get_device(db , device_id = device_id)
    if not device :
        return None
    
    device.user_preset_id  = user_preset_id
    device.plant_preset_id = None
    
    db.commit()
    db.refresh(device)
    
    return device

# 식물(개발자) 프리셋을 적용하고 사용자 프리셋을 해제
def apply_plant_preset_to_device(db : Session , device_id : int , plant_preset_id : int) :
    device = get_device(db , device_id = device_id)
    if not device :
        return None
    
    device.plant_preset_id = plant_preset_id
    device.user_preset_id  = None
    
    db.commit()
    db.refresh(device)
    
    return device

# 수동 작동 CRUD
# 장치의 수동 제어 상태 설정
def set_manual_override(db : Session , device_id : int , control_data : schemas.ManualControlRequest) :
    device = get_device(db , device_id = device_id)
    if not device :
        return None
    
    component = control_data.component
    command   = control_data.command.upper()
    
    # 컴포넌트 이름에 따라 override 필드 업데이트
    if component == "pump_1" :
        device.override_pump_state_1 = command
    elif component == "pump_2" :
        device.override_pump_state_2 = command
    elif component == "fan" :
        device.override_fan_state = command
    elif component == "led" :
        device.override_led_state = command
    else :
        return "Invalid component"
    
    db.commit()
    db.refresh(device)
    return device


# SENSOR CRUD
# sensor 데이터를 생성(저장)
def create_sensor_data(db : Session , data : schemas.SensorDataCreate) :
    device = get_device_by_serial(db , serial = data.device_serial)
    
    if device :
        device.last_active = datetime.now()
    else :
        return None
        
    db_data = models.SensorData(
        device_id = device.device_id ,
        temperature = data.temperature ,
        humidity = data.humidity ,
        soil_moisture_1 = data.soil_moisture_1 ,
        soil_moisture_2 = data.soil_moisture_2 ,
        light_level = data.light_level ,
        water_level = data.water_level ,
        measure_date = datetime.now()
    )
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    
    return db_data

# 특정 장치의 가장 최근 센서 데이터를 하나만 조회
def get_latest_sensor_data(db : Session , device_id : int) :
    return db.query(models.SensorData).filter(models.SensorData.device_id == device_id).order_by(models.SensorData.measure_date.desc()).first()


# USERPRESET CRUD
# 사용자 프리셋을 생성(저장)
def create_user_preset(db : Session , preset : schemas.UserPresetCreate) :
    db_preset = models.UserPreset(**preset.model_dump())
    db.add(db_preset)
    db.commit()
    db.refresh(db_preset)
    
    return db_preset

# preset_id 로 사용자 프리셋을 조회
def get_user_preset(db : Session , preset_id : int) :
    return db.query(models.UserPreset).filter(models.UserPreset.preset_id == preset_id).first()

# user_id 로 사용자 프리셋을 조회
def get_user_presets_by_userid(db : Session , user_id : int) :
    return db.query(models.UserPreset).filter(models.UserPreset.user_id == user_id).all()

# PLANTPRESET CRUD
# 개발자 프리셋을 생성(저장)
def create_plant_preset(db : Session , preset : schemas.PlantPresetCreate) :
    db_preset = models.PlantPreset(**preset.model_dump())
    db.add(db_preset)
    db.commit()
    db.refresh(db_preset)
    
    return db_preset

# plant_preset_id 로 사용자 프리셋을 조회
def get_plant_preset(db : Session , plant_preset_id : int) :
    return db.query(models.PlantPreset).filter(models.PlantPreset.plant_preset_id == plant_preset_id).first()


# ACTIONLOG CRUD
# 작동 로그 생성(저장)
def create_action_log(db : Session , action : schemas.ActionLogCreate) :
    db_action = models.ActionLog(**action.model_dump() , action_time=datetime.now())
    db.add(db_action)
    db.commit()
    db.refresh(db_action)

    return db_action

# device_id 로 로그 조회
def get_action_logs_by_deviceid(db : Session , device_id : int , skip : int = 0 , limit = 100) :
    return db.query(models.ActionLog).filter(models.ActionLog.device_id == device_id).order_by(models.ActionLog.action_time.desc()).offset(skip).limit(limit).all()


# PLANTIMAGE CRUD
def create_plant_image(db : Session , image_data : schemas.PlantImageCreate) :
    device = get_device_by_serial(db , serial = image_data.device_serial)
    
    if not device :
        return None

    db_image = models.PlantImage (
        device_id = device.device_id ,
        image_path = image_data.image_path ,
        captured_time = datetime.now()
    )
    
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image