"""
자동 제어 로직을 담당하는 파일

주기적으로 실행되며 , 센서 데이터와 프리셋를 비교하여 장치의 목표 상태를 결졍하고 DB 에 업데이트함
"""
from sqlalchemy.orm import Session
from datetime import datetime
from . import crud , models , schemas

# 급수통 수위 센서 임계값 (수정 가능함 , 프리셋 설정이 아닌 하드 세팅)
WATER_LEVEL_THRESHOLD = 10

# 펌프 작동 시간 및 쿨다운 설정
PUMP_RUN_DURATION = 15 # 폄프 작동 시간
PUMP_COOLDOWN     = 3600 # 펌프 대기 시간

# 특정 기기에 대한 자동 제어 로직을 실행
def run_control_logic_for_device(db : Session , device_id : int) :
    # device_id 를 사용하여 제어에 필요한 정보들을 DB 에서 가져옴
    # 존재하지 않는 device_id 값이 들어오는 경우를 상정한 예외 처리 진행
    device = crud.get_device(db , device_id = device_id)
    if not device :
        print(f"[에러] | {device_id} 를 가진 장치를 찾을 수 없음")
        return
    
    # 장치 타입이 SENSOR_ACTUATOR 가 아니면 제어 로직을 실행하지 않고 즉시 종료
    if device.device_type != "SENSOR_ACTUATOR" :
        return
    
    # 가져온 장치에서 최신 데이터 정보를 가져옴
    # 장치의 최신 데이터 정보가 없는 경우를 상정한 예외 처리 진행
    latest_data = crud.get_latest_sensor_data(db , device_id = device_id)
    if not latest_data :
        print(f"[에러] | {device.device_id} 장치의 최신 데이터를 찾을 수 없음")
        return
    
    # 프리셋과 무관한 독립 제어 로직들
    # 급수통 수위 값을 체크 후 임계값보다 수위가 낮으면 경고등을 점등 , 이미 ON 상태이면 별도의 경고를 하지 않음
    # 급수통 수위 값을 체크 후 임계값보다 수위가 높으면 경고등을 해제 , 이미 OFF 상태이면 별도의 경고를 하지 않음
    if latest_data.water_level is not None and latest_data.water_level < WATER_LEVEL_THRESHOLD :
        if device.alert_led_state != "ON" :
            device.alert_led_state = "ON"
            print(f" [경고] | 급수통 수위 낮음 || 수위 레벨 : {latest_data.water_level}")
            log_data = schemas.ActionLogCreate(device_id = device_id , action_type = "급수통 경고등 ON" , action_trigger = "급수통 수위 낮음")
            crud.create_action_log(db , action = log_data)
    else :
        if device.alert_led_state != "OFF" :
            device.alert_led_state = "OFF"
            print(f"[알림] | 급수통 수위 정상")
            log_data = schemas.ActionLogCreate(device_id = device_id , action_type = "급수통 경고등 OFF" , action_trigger = "급수통 수위 정상")
            crud.create_action_log(db , action = log_data)
    
    # 프리셋을 기반으로 작동하는 로직들
    # 프리셋을 가져오고 사용자 프리셋인지 사전(개발자) 프리셋인지 확인
    active_preset = device.user_preset if device.user_preset_id is not None else device.plant_preset
    preset_type   = "user" if device.user_preset_id is not None else "developer" if device.plant_preset_id is not None else None
    
    # 프리셋이 적용되어 있는지 아닌지를 확인
    if not active_preset : 
        print(f"[에러] | {device.device_name} 에 활성화된 프리셋이 없어 장치 작동 불가")
        db.commit()
        return
    
    print(f"[제어] | {device.device_name} 장치 상태 판단 및 작동 시작")

    # 팬 제어 로직
    auto_fan_state = device.target_fan_state
    max_temp     = int(active_preset.target_temperature_max if preset_type == "user" else active_preset.recomm_temperature_max)
    min_temp     = int(active_preset.target_temperature_min if preset_type == "user" else active_preset.recomm_temperature_min)
    max_humidity = int(active_preset.target_humidity_max if preset_type == "user" else active_preset.recomm_humidity_max)
    min_humidity = int(active_preset.target_humidity_min if preset_type == "user" else active_preset.recomm_humidity_min)
    
    if latest_data.temperature > max_temp or latest_data.humidity > max_humidity :
        auto_fan_state = "ON"
    elif latest_data.temperature < min_temp or latest_data.humidity < min_humidity :
        auto_fan_state = "OFF"
    else :
        auto_fan_state = device.target_fan_state
        
    # 팬 제어 수동/자동 결정
    final_fan_state = auto_fan_state
    is_manual_fan  = device.override_fan_state is not None
    
    if is_manual_fan :
        final_fan_state = device.override_fan_state
        if auto_fan_state == "OFF" :
            device.override_fan_state = None
            print(f"[제어] | 적용된 프리셋 설정 값에 도달하여 쿨링팬 작동 정지 , 수동 제어 해제")
    else :
        final_fan_state = auto_fan_state
    
    if device.target_fan_state != final_fan_state :
        device.target_fan_state = final_fan_state
        print(f"[제어] | 쿨링팬 작동 상태를 {final_fan_state} (으)로 변경합니다.")
        
        action_type = f"쿨링팬 작동 {final_fan_state}"
        
        if is_manual_fan and device.override_fan_state is not None :
            trigger = f"사용자 수동 작동"
        else : 
            trigger = f"온도 또는 습도 상태 {'과다' if final_fan_state == 'ON' else '적절'}"
            
        log_data = schemas.ActionLogCreate(device_id = device_id , action_type = action_type , action_trigger = trigger)
        crud.create_action_log(db , action = log_data)
        
    
    def process_pump_logic(pump_index : int) :
        target_state_attr     = f"target_pump_state_{pump_index}"
        override_state_attr   = f"override_pump_state_{pump_index}"
        last_active_time_attr = f"pump_{pump_index}_last_active_time"
        soil_moisture_attr    = f"soil_moisture_{pump_index}"
        min_soil_attr         = f"target_soil_moisture_{pump_index}_min" if preset_type == "user" else f"recomm_soil_moisture_{pump_index}_min"
        
        current_state         = getattr(device , target_state_attr)
        override_state        = getattr(device , override_state_attr)
        last_active_time     = getattr(device , last_active_time_attr)
        min_soil_threshold    = getattr(active_preset , min_soil_attr)
        current_soil_moisture = getattr(latest_data , soil_moisture_attr)
        
        now = datetime.now()
        new_state = current_state
        trigger_reason = ""
        
        # 수동 제어 로직
        if override_state is not None:
            trigger_reason = "사용자 수동 작동"
            if override_state == "ON":
                time_since_last_on = (now - last_active_time).total_seconds() if last_active_time else float('inf')
                if time_since_last_on < (PUMP_RUN_DURATION + PUMP_COOLDOWN):
                    print(f"[경고] | 펌프 {pump_index} 쿨다운 중 : 수동 작동 불가함")
                    new_state = "OFF"
                else:
                    new_state = "ON"
            else:
                new_state = "OFF"
            
            setattr(device, override_state_attr, None)

        # 자동 제어 로직
        else:
            time_since_last_on = (now - last_active_time).total_seconds() if last_active_time else float('inf')

            # 펌프를 꺼야 하는 조건: 작동 시간이 N초를 넘었을 때
            if current_state == "ON" and time_since_last_on >= PUMP_RUN_DURATION:
                new_state = "OFF"
                trigger_reason = f"자동 작동 시간({PUMP_RUN_DURATION}초) 도달"
            
            # 펌프를 켜야 하는 조건: 토양이 건조하고 쿨다운이 끝났을 때
            elif current_state == "OFF":
                is_cooldown = time_since_last_on < (PUMP_RUN_DURATION + PUMP_COOLDOWN)
                is_dry = current_soil_moisture is not None and current_soil_moisture > min_soil_threshold

                if not is_cooldown and is_dry:
                    new_state = "ON"
                    trigger_reason = f"토양 {pump_index} 수분 부족"
        
        # 상태 변경 시 DB 업데이트 및 로그 생성
        if current_state != new_state:
            setattr(device, target_state_attr, new_state)
            print(f"[제어] | 급수 펌프 {pump_index} 작동 상태를 {new_state} (으)로 변경합니다.")

            if new_state == "ON":
                setattr(device, last_active_time_attr, now)
            
            action_type = f"급수 펌프 {pump_index} 작동 {new_state}"
            log_data = schemas.ActionLogCreate(device_id=device.device_id, action_type=action_type, action_trigger=trigger_reason)
            crud.create_action_log(db, action=log_data)

    process_pump_logic(1)
    process_pump_logic(2)
        
    """
    # 펌프 제어 로직 함수
    # 펌프 1 제어 로직
    current_pump_1_state = device.target_pump_state_1
    auto_pump_1_state = current_pump_1_state
    min_soil_1  = active_preset.target_soil_moisture_1_min if preset_type == "user" else active_preset.recomm_soil_moisture_1_min
    max_soil_1  = active_preset.target_soil_moisture_1_max if preset_type == "user" else active_preset.recomm_soil_moisture_1_max
    
    if latest_data.soil_moisture_1 > min_soil_1 :
        auto_pump_1_state = "ON"
    elif latest_data.soil_moisture_1 < max_soil_1 :
        auto_pump_1_state = "OFF"
        
    # 수동 제어 여부를 반영하여 최종 목표 상태 설정
    final_pump_1_state = auto_pump_1_state
    is_manual_pump_1     = device.override_pump_state_1 is not None
    
    if is_manual_pump_1 :
        final_pump_1_state = device.override_pump_state_1
        
        if auto_pump_1_state == "OFF" :
            device.override_pump_state_1 = None
            print(f"[제어] | 적용된 프리셋 설정 값에 도달하여 급수펌프 1 작동 정지 , 수동 제어 해제")
    else : 
        final_pump_1_state = auto_pump_1_state
    
    if device.target_pump_state_1 != final_pump_1_state :
        device.target_pump_state_1 = final_pump_1_state
        print(f"[제어] | 급수 펌프 1 작동 상태를 {final_pump_1_state} (으)로 변경합니다.")
        
        action_type = f"급수 펌프 1 작동 {final_pump_1_state}"
        
        if is_manual_pump_1 and device.override_pump_state_1 is not None :
            trigger = f"사용자 수동 작동"
        else :
            trigger = f"토양 1 수분 {'부족' if final_pump_1_state == 'ON' else '충분'}"
            
        log_data = schemas.ActionLogCreate(device_id = device_id , action_type = action_type , action_trigger = trigger)
        crud.create_action_log(db , action = log_data)
        
    # 펌프 2 제어 로직
    current_pump_2_state = device.target_pump_state_2
    auto_pump_2_state = current_pump_2_state
    min_soil_2  = active_preset.target_soil_moisture_2_min if preset_type == "user" else active_preset.recomm_soil_moisture_2_min
    max_soil_2  = active_preset.target_soil_moisture_2_max if preset_type == "user" else active_preset.recomm_soil_moisture_2_max
    
    if latest_data.soil_moisture_2 > min_soil_2 :
        auto_pump_2_state = "ON"
    elif latest_data.soil_moisture_2 < max_soil_2 :
        auto_pump_2_state = "OFF"
        
    # 수동 제어 여부를 반영하여 최종 목표 상태 설정
    final_pump_2_state = auto_pump_2_state
    is_manual_pump_2   = device.override_pump_state_2 is not None
    
    if is_manual_pump_2 :
        final_pump_2_state = device.override_pump_state_2
        
        if auto_pump_2_state == "OFF" :
            device.override_pump_state_2 = None
            print(f"[제어] | 적용된 프리셋 설정 값에 도달하여 급수펌프 2 작동 정지 , 수동 제어 해제")
    else : 
        final_pump_2_state = auto_pump_2_state
    
    if device.target_pump_state_2 != final_pump_2_state :
        device.target_pump_state_2 = final_pump_2_state
        print(f"[제어] | 급수 펌프 2 작동 상태를 {final_pump_2_state} (으)로 변경합니다.")
        
        action_type = f"급수 펌프 2 작동 {final_pump_2_state}"
        
        if is_manual_pump_2 and device.override_pump_state_2 is not None :
            trigger = f"사용자 수동 작동"
        else :
            trigger = f"토양 2 수분 {'부족' if final_pump_2_state == 'ON' else '충분'}"
            
        log_data = schemas.ActionLogCreate(device_id = device_id , action_type = action_type , action_trigger = trigger)
        crud.create_action_log(db , action = log_data)
    """
    
    
    # LED 제어 로직
    auto_led_state       = "OFF"
    preset_coditions_met = False
    darkness_threshold   = active_preset.darkness_threshold
    light_start_hour     = active_preset.light_start_hour
    light_end_hour       = active_preset.light_end_hour
    
    if light_start_hour is not None and light_end_hour is not None :
        is_time_to_light = light_start_hour <= datetime.now().hour < light_end_hour
        is_dark_enough   = latest_data.light_level < darkness_threshold
        
        if is_time_to_light and is_dark_enough :
            preset_coditions_met = True
        # elif is_time_to_light == False or is_dark_enough == False :
        #     auto_led_state = "OFF"
        #     print(f"[제어] | {device.device_name} 생장등 정지")
    
    current_minute = datetime.now().minute
    is_photo_time  = (22 <= current_minute <= 32) or (current_minute >= 52) or (current_minute <= 2)
    
    if preset_coditions_met or is_photo_time :
        auto_led_state = "ON"
        
    final_led_state = auto_led_state
    is_manual_led = device.override_led_state is not None
    
    if is_manual_led :
        final_led_state = device.override_led_state
        if auto_led_state == "OFF" :
            device.override_led_state = None
            print(f"[제어] | 적용된 프리셋 설정 값에 도달하여 LED 작동 정지 , 수동 제어 해제")
    # else :
    #     final_led_state = auto_led_state
        
    if device.target_led_state != final_led_state :
        device.target_led_state = final_led_state
        print(f"[제어] | LED 작동 상태를 {final_led_state} (으)로 변경합니다.")
        
        action_type = f"LED 작동 {final_led_state}"
        
        if is_manual_led and device.override_led_state is not None :
            trigger = f"사용자 수동 작동"
        else :
            trigger = f"조도 및 작동 시간 {'충족' if final_led_state == 'ON' else '불충분'}"

        log_data = schemas.ActionLogCreate(device_id = device_id , action_type = action_type , action_trigger = trigger)
        crud.create_action_log(db , action = log_data)
        
    
    db.commit()
    print(f"[알림] | {device.device_name} 상태 파악 및 작동 제어 명령 완료")