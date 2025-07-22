"""
FAST API 메인

API 엔드포인드(경로) 정의
외부 요청 처이 및 응답
백그라운드 작업 스케쥴리
"""
from dotenv import load_dotenv
load_dotenv()


from fastapi import FastAPI , Depends , HTTPException , status , WebSocket , WebSocketDisconnect
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
# from supabase import create_client , Client
from sqlalchemy.orm import Session
from typing import List , Optional
from datetime import datetime , timedelta
import threading
import time
# import os


# 지금까지 만든 모든 모듈들을 로드
from . import models , schemas , crud , control_logic , auth
from .data_pipe import SessionLocal , get_database , DB_engine

# Fast API 앱 인스턴스 생성
app = FastAPI (
    title = "SeSac Smart Farm Fast API" ,
    description = "스마트팜 자동화 관리를 위한 패스트 API"
)

models.Base.metadata.create_all(bind = DB_engine)

app.add_middleware(
    CORSMiddleware ,
    allow_origins = "http://localhost:3000" ,
    allow_credentials = True ,
    allow_methods = ["*"] ,
    allow_headers = ["*"] ,
)

# 정적파일 마운트
app.mount("/static" , StaticFiles(directory = "sssfarm_fast_api/image") , name = "static")

"""
# supabase 클라이언트를 앱 시작 시 한번만 생성 => 작동하지 않음 => 코드 원상복구 진행
supabase_url : str = os.environ.get("SUPABASE_URL")
supabase_key : str = os.environ.get("SUPABASE_KEY")
supabase : Client = create_client(supabase_url , supabase_key)
"""

# FastAPI 앱이 시작될 때 백그라운드 제어 루프를 별도 스레드로 실행
@app.on_event("startup")
def startup_event() :
    thread = threading.Thread(target = control_loop , daemon = True)
    thread.start()
    
@app.on_event("shutdown")
def shutdown_event() :
    DB_engine.dispose()

# 백그라운드 자동 제어
# 모든 장치에 대해 주기적으로 자동 제어 로직을 실행하는 반복 함수
def control_loop() :
    while True :
        # n 초 대기 후 다시 반복
        # 타임시간 2초 -> 30초로 수정
        time.sleep(10)
        
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
        
    
# 웹소켓 연결 관리자
# 프론트엔드에 실시간으로 센서데이터를 전달해주기 위한 클래스
class ConnectionManager :
    def __init__(self) :
        self.active_connections : list[WebSocket] = []
    
    async def connect(self , websocket : WebSocket) :
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self , websocket : WebSocket) :
        self.active_connections.remove(websocket)
    
    async def broadcast(self , message : str) :
        # 연결된 모든 클라이언트에게 메시지 전송 함수
        for connection in self.active_connections :
            await connection.send_text(message)

manager = ConnectionManager()

# 웹소켓 엔드포인트
@app.websocket("/ws")
async def websocket_endpoint(websocket : WebSocket) :
    # 클라이언트가 접속하면 관리자에 클라이언트 추가
    await manager.connect(websocket)
    try :
        while True :
            # 클라이언트로부터 메시지 대기
            await websocket.receive_text()
    except WebSocketDisconnect :
        manager.disconnect(websocket)

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
"""
# 전송 지연 문제를 해결하기 위해서 센서 데이터를 DB 서버로 전송하는 엔드 포인트를 수정했으나 호전되지 않음
@app.post("/sensordata/" , tags = ["GetData"] , summary = "센서 데이터 수신")
async def create_sensor_data(data : schemas.SensorDataCreate) :
    try :
        insert_data = data.model_dump()
        response = supabase.table("sensor_data").insert(insert_data).execute()
        
        if len(response.data) == 0 :
            raise HTTPException(status_code = 400 , detail = "데이터 삽입에 실패했습니다.")
        
        return response.data[0]
    
    except Exception as err :
        print(f"[/sensordata] Error : {err}")
        raise HTTPException(status_code = 500 , detail = "서버 내부 오류가 발생했습니다.")
"""

@app.post("/sensordata/" , response_model = schemas.SensorData , tags = ["GetData"] , summary = "센서 데이터 수신")
async def create_sensor_data(data : schemas.SensorDataCreate , db : Session = Depends(get_database)) :
    db_data = crud.create_sensor_data(db = db , data = data)
    if db_data is None :
        raise HTTPException(status_code = 404 , detail = "등록되지 않은 시리얼 번호의 장치입니다.")
    
    response_data = schemas.SensorData.from_orm(db_data)
    await manager.broadcast(response_data.model_dump_json())
    return db_data

# 차트를 그리기 위한 데이터 전달 엔드포인트
@app.get("/devices/{device_id}/historical-data" , response_model = List[schemas.SensorData] , tags = ["Charts"] , summary = "장치 데이터 수신(특정 기간)")
def read_historical_data(device_id : int , hours_ago : int = 24 , db : Session = Depends(get_database)) :
    # /devices/1/historical-data?hours_ago=48 <= 로 시간 변경 가능
    end_date   = datetime.now()
    start_date = end_date - timedelta(hours = hours_ago)
    
    historical_data = crud.get_historical_sensor_data(db , device_id = device_id , start_date = start_date , end_date = end_date)
    return historical_data

# ESP32 또는 IOT 장치가 목표 제어 상태(명령) 을 서버로부터 받아가는 엔드 포인트
@app.get("/devices/{device_id}/control_status" , response_model = schemas.DeviceControlStatus , tags = ["SendCommand"] , summary = "명령 데이터 송신")
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
    
    
# 이미지 정보 수신 엔드포인트
@app.post("/plant-images/" , response_model = schemas.PlantImage , tags = ["Images"] , summary = "이미지 수신")
def create_plant_image_info(image_data : schemas.PlantImageCreate , db : Session = Depends(get_database)) :
    db_image = crud.create_plant_image(db , image_data = image_data)
    if db_image is None :
        raise HTTPException(status_code = 404 , detail = "등록되지 않은 시리얼 번호의 장치입니다.")
    return db_image

# 이미지 목록 조회 API
@app.get("/devices/{device_id}/images" , response_model = List[schemas.PlantImage] , tags = ["Images"] , summary = "특정 장치의 이미지 정보 조회")
def read_device_images(device_id : int , skip : int = 0 , limit : int = 20 , db : Session = Depends(get_database)) :
    images = crud.get_image_by_device(db , device_id = device_id , skip = skip , limit = limit)
    return images


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

# 사용자 프리셋 편집 엔드 포인트
@app.post("/user-presets/{preset_id}" , response_model = schemas.UserPreset , tags = ["Presets"] , summary = "사용자 프리셋 편집(권한 필요)")
def update_user_preset(preset_id : int , preset_update : schemas.UserPresetUpdate , db : Session = Depends(get_database) , current_user : models.User = Depends(auth.get_current_user)) :
    db_preset = crud.get_user_preset(db , preset_id = preset_id)
    
    if db_preset is None :
        raise HTTPException(status_code = 404 , detail = "해당 프리셋을 찾을 수 없습니다.")
    
    if db_preset.user_id != current_user.user_id :
        raise HTTPException(status_code = status.HTTP_403_FORBIDDEN , detail = "이 프리셋을 수정할 권한이 없습니다.")
    
    return crud.update_user_preset(db = db , preset_id = preset_id , preset_update = preset_update)

# 사용자 프리셋 삭제 엔드 포인트
@app.delete("/user-presets/{preset_id}" , tags = ["Presets"] , summary = "사용자 프리셋 삭제")
def delete_user_preset(preset_id : int , db : Session = Depends(get_database) , current_user : models.User = Depends(auth.get_current_user)) :
    db_preset = crud.get_user_preset(db , preset_id = preset_id)
    if db_preset is None :
        raise HTTPException(status_code = 404 , detail = "해당 프리셋을 찾을 수 없습니다.")
    
    if db_preset.user_id != current_user.user_id :
        raise HTTPException(status_code = status.HTTP_403_FORBIDDEN , detail = "이 프리셋을 삭제할 권한이 없습니다.")
    
    crud.delete_user_preset(db = db , preset_id = preset_id)
    return {"message" : "프리셋이 성공적으로 삭제되었습니다."}

@app.get("/health")
def health_check() :
    """서버 콜드 스타트 방지용 엔드포인트 / 사용하지 말 것"""
    print("Health check ping received!!")
    return {"status" : "OK"}