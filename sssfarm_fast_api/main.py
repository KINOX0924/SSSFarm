"""
FAST API 메인

API 엔드포인드(경로) 정의
외부 요청 처이 및 응답
백그라운드 작업 스케쥴리
"""

from fastapi import FastAPI , Depends , HTTPException , status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List , Optional
from datetime import datetime
import threading
import time


# 지금까지 만든 모든 모듈들을 로드
from . import models , schemas , crud , control_logic , auth
from .data_pipe import DB_engine , SessionLocal , get_database

# Fast API 앱 인스턴스 생성
app = FastAPI (
    title = "SeSac Smart Farm Fast API" ,
    description = "스마트팜 자동화 관리를 위한 패스트 API"
)

# 백그라운드 자동 제어
# 모든 장치에 대해 주기적으로 자동 제어 로직을 실행하는 반복 함수
def control_loop() :
    while True :
        # 매번 새로운 DB 세션을 생성하여 작업 수행
        db = SessionLocal()
        try :
            # DB 에 등록된 모든 장치를 불러옴
            devices = crud.get_devices(db)
            print(f"\n[CONTROL_LOOP] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} || {len(devices)} 개 장치에 대한 제어 실행")
            for device in devices :
                control_logic.run_control_logic_for_device(db , device_id = device.device_id)
        except Exception as err :
            print(f"[에러] | 백그라운드 작업 중 에러 발생 / 에러 내용 : {err}")
        finally :
            # 작업 종료 후 세션 닫기
            db.close()
        
        # n 초 대기 후 다시 반복
        time.sleep(2)

# FastAPI 앱이 시작될 때 백그라운드 제어 루프를 별도 스레드로 실행
@app.on_event("startup")
def on_startup() :
    thread = threading.Thread(target = control_loop , daemon = True)
    thread.start()

# 로그인 엔드포인트
@app.post("/token" , tags = ["Authentication"] , summary = "사용자 로그인 및 토큰 발급")
def login_for_access_token(db : Session = Depends(get_database) , form_data : OAuth2PasswordRequestForm = Depends()) :
    # 사용자 인증
    user = crud.authenticate_user(db , username = form_data.username , password = form_data.password)
    if not user :
        raise HTTPException(status_code = status.HTTP_401_UNAUTHORIZED , detail = "유효하지 않은 계정 또는 비밀번호입니다." , headers = {"WWW-Authenticate" : "Bearer"} , )
    
    # 액세스 토큰 생성
    # 토큰에 사용자 아이디 저장
    access_token = auth.create_access_token(
        data = {"sub" : user.username}
    )
    
    # 토큰 반환
    return {"access_token" : access_token , "token_type" : "bearer"}

# API 엔드 포인트(라우터) 정의
# 직급(그룹) 엔드 포인트
@app.post("/positions/" , response_model = schemas.Position , tags = ["Positions"] , summary = "새 직급(그룹) 생성")
def create_position(position : schemas.PositionCreate , db : Session = Depends(get_database)) :
    return crud.create_position(db = db , position = position)

@app.get("/positions/" , response_model = List[schemas.Position] , tags = ["Positions"] , summary = "모든 직급(그룹) 조회")
def read_positions(skip : int = 0 , limit : int = 100 , db : Session = Depends(get_database)) :
    return crud.get_positions(db , skip = skip , limit = limit)

# 사용자 엔드포인트
@app.post("/users/" , response_model = schemas.User , tags = ["Users"] , summary = "새 사용자 생성")
def create_user(user : schemas.UserCreate , db : Session = Depends(get_database)) :
    db_user = crud.get_user_by_username(db , username = user.username)
    if db_user :
        raise HTTPException(status_code = 400 , detail = "이미 등록된 사용자 아이디입니다.")
    return crud.create_user(db = db , user = user)

@app.get("/users/" , response_model = List[schemas.User] , tags = ["Users"] , summary = "모든 사용자 조회")
def read_users(skip : int = 0 , limit : int = 100 , db : Session = Depends(get_database)) :
    users = crud.get_users(db , skip = skip , limit = limit)
    return users

@app.get("/users/{user_id}" , response_model = schemas.User , tags = ["Users"] , summary = "사용자 조희")
def read_user(user_id : int , db : Session = Depends(get_database)) :
    db_user = crud.get_user(db , user_id = user_id)
    if db_user is None :
        raise HTTPException(status_code = 404 , detail = "해당 사용자를 찾을 수 없습니다.")
    return db_user

# 장치 엔드포인트 및 프리셋 적용
@app.post("/devices/" , response_model = schemas.Device , tags = ["Devices"] , summary = "새 장치 등록")
def create_device(device : schemas.DeviceCreate , db : Session = Depends(get_database) , current_user : models.User = Depends(auth.get_current_user)) :
    if current_user.position_id != 1 :  # 추후 수정 가능
        raise HTTPException(status_code = status.HTTP_403_FORBIDDEN , detail = "장치를 생성할 권한이 없습니다.")
    return crud.create_device(db = db , device = device)

@app.get("/devices/" , response_model = List[schemas.Device] , tags = ["Devices"] , summary = "모든 장치 조희(전체 또는 이름으로 검색)")
def read_devices(device_name : Optional[str] = None , skip : int = 0 , limit : int = 100 , db : Session = Depends(get_database)) :
    if device_name :
        db_device = crud.get_device_by_devicename(db , device_name = device_name)
        if db_device is None :
            return []
        return [db_device]
    return crud.get_devices(db , skip = skip , limit = limit)

@app.get("/devices/{device_id}" , response_model = schemas.Device , tags = ["Devices"] , summary = "장치 조회(아이디)")
def read_device_byid(device_id : int , db : Session = Depends(get_database)) :
    db_device = crud.get_device(db , device_id = device_id)
    if db_device is None :
        raise HTTPException(status_code = 404 , detail = "해당 장치를 찾을 수 없습니다.")
    return db_device

@app.put("/devices/{device_id}/apply-user-preset/{user_preset_id}" , response_model = schemas.Device , tags = ["Devices"] , summary = "장치 사용자 프리셋 적용(권한 필요)")
def apply_user_preset(device_id : int , user_preset_id : int , db : Session = Depends(get_database) , current_user : models.User = Depends(auth.get_current_user)) :
    device_to_update = crud.get_device(db , device_id = device_id)
    if not device_to_update :
        raise HTTPException(status_code = 404 , detail = "해당 장치를 찾을 수 없습니다.")
    
    # 권한 검증 로직
    if device_to_update.position_id != current_user.position_id :
        raise HTTPException(status_code = status.HTTP_403_FORBIDDEN , detail = "이 장치를 제어할 권한이 없습니다.")
    
    # 권한이 있을 시 적용 로직 수행
    update_device = crud.apply_user_preset_to_device(db , device_id = device_id , user_preset_id = user_preset_id)
    if not update_device :
        raise HTTPException(status_code = 404 , detail = "해당 프리셋을 찾을 수 없습니다.")
    return update_device

@app.put("/devices/{device_id}/apply-plant-preset/{plant_preset_id}" , response_model = schemas.Device , tags = ["Devices"] , summary = "장치 사전 프리셋 적용(권한 필요)")
def apply_plant_preset(device_id : int , plant_preset_id : int , db : Session = Depends(get_database) , current_user : models.User = Depends(auth.get_current_user)) :
    device_to_update = crud.get_device(db , device_id = device_id)
    if not device_to_update :
        raise HTTPException(status_code = 404 , detail = "해당 장치를 찾을 수 없습니다.")
    
    # 권한 검증 로직
    if device_to_update.position_id != current_user.position_id :
        raise HTTPException(status_code = status.HTTP_403_FORBIDDEN , detail = "이 장치를 제어할 권한이 없습니다.")
    
    # 권한이 있을 시 적용 로직 수행
    update_device = crud.apply_plant_preset_to_device(db , device_id = device_id , plant_preset_id = plant_preset_id)
    if not update_device :
        raise HTTPException(status_code = 404 , detail = "해당 프리셋을 찾을 수 없습니다.")
    return update_device

@app.put("/devices/{device_id}/manual-control" , response_model = schemas.Device , tags = ["Devices"] , summary = "장치 수동 제어(권한 필요)")
def manual_control_device(device_id : int , control_data : schemas.ManualControlRequest , db : Session = Depends(get_database) , current_user : models.User = Depends(auth.get_current_user)) :
    device = crud.get_device(db , device_id = device_id)
    if not device :
        raise HTTPException(status_code = 404 , detail = "해당 장치를 찾을 수 없습니다.")
    
    # 권한 검증 로직
    if device.position_id != current_user.position_id :
        raise HTTPException(status_code = status.HTTP_403_FORBIDDEN , detail = "이 장치를 제어할 권한이 없습니다.")
    
    # 권한이 있을 시 적용 로직 수행
    updated_device = crud.set_manual_override(db , device_id = device_id , control_data = control_data)
    if updated_device == "Invalid component" :
        raise HTTPException(status_code = 400 , detail = "잘못된 컴포넌트 이름입니다.")
    return updated_device

# ESP32(장치) 연결 엔드포인트
# ESP32 또는 IOT 장치가 센서 데이터를 서버로 전송하는 엔드 포인트
@app.post("/sensordata/" , response_model = schemas.SensorData , tags = ["스마트팜 장치 데이터 통신"] , summary = "센서 데이터 수신")
def create_sensor_data(data : schemas.SensorDataCreate , db : Session = Depends(get_database)) :
    return crud.create_sensor_data( db = db , data = data)

# ESP32 또는 IOT 장치가 목표 제어 상태(명령) 을 서버로부터 받아가는 엔드 포인트
@app.get("/devices/{device_id}/control_status" , response_model = schemas.DeviceControlStatus , tags = ["스마트팜 장치 명령 송신"] , summary = "명령 데이터 송신")
def get_device_control_status(device_id : int , db : Session = Depends(get_database)) :
    device = crud.get_device(db , device_id = device_id)
    
    if not device :
        raise HTTPException(status_code = 404 , detail = "장치를 찾을 수 없습니다.")
    
    return schemas.DeviceControlStatus (
        target_led_state    = device.target_led_state ,
        target_pump_state_1 = device.target_pump_state_1 , 
        target_pump_state_2 = device.target_pump_state_2 ,
        target_fan_state    = device.target_fan_state ,
        alert_led_state     = device.alert_led_state
    )


# 기타 엔드포인트
@app.post("/user-presets/" , response_model = schemas.UserPreset , tags = ["Presets"] , summary = "사용자 프리셋 생성")
def create_user_preset(preset : schemas.UserPresetCreate , db : Session = Depends(get_database) , current_user : models.User = Depends(auth.get_current_user)) :
    if preset.user_id != current_user.user_id :
        raise HTTPException(status_code = status.HTTP_403_FORBIDDEN , detail = "본인 프리셋만 생성할 수 있습니다.")
    return crud.create_user_preset(db = db , preset = preset)

@app.get("/users/{user_id}/user-presets/" , response_model = List[schemas.UserPreset] , tags = ["Presets"] , summary = "사용자 프리셋 전체 조회(ID 번호)")
def read_user_presets(user_id : int , db : Session = Depends(get_database)) :
    presets = crud.get_user_presets_by_userid(db , user_id = user_id)
    return presets