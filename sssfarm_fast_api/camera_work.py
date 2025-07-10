from dotenv import load_dotenv
load_dotenv()

import cv2                      # 이미지 처리 , 카메라 작동 등에 관련된 opencv 라이브러리
import time                     # 촬영 주기를 설정하기 위한 라이브러리
import os                       # os 명령어를 직접 사용하기 위한 라이브러리
import requests                 # API 호출을 위한 라이브러리
from datetime import datetime   # 촬영 일자를 쓰기 위한 라이브러리
from supabase_client import supabase    # 새로 만든 클라이먼트 라이브러리 불러오기

# 설정
API_BASE_URL = os.environ.get("API_BASE_URL" , "http://127.0.0.1:8000")
# "http://127.0.0.1:8000"               # API 서버 주소
CAPTURE_INTERVAL = 10                   # 촬영 간격(초)
SAVE_DIR = "images"                     # 이미지를 저장하는 경로
DEVICE_SERIAL = os.environ.get("DEVICE_SERIAL") # 카메라 장치 이름

if not DEVICE_SERIAL :
    raise ValueError ("장치 환경 변수가 설정되지 않았습니다.")

# 카메라로 이미지를 캡처하고 파일로 저장하는 함수
def capture_and_save_image() :
    # 카메라 연결
    # 웹캠이 장착된 노트북일 경우 0 , 그 외에 추가적으로 USB 를 장착할 경우 1 씩 숫자가 올라감
    # 연결 시 나중에 연결된 카메라들이 나중 인덱스라고 생각하면 됨
    cap = cv2.VideoCapture(0)
    
    # 카메라가 정상적으로 작동하는 지 확인
    # 카메라가 정상 작동하지 않으면 return
    if not cap.isOpened() :
        print(f"[에러] | [{datetime.now()}] 카메라를 작동할 수 없습니다.")
        return
    
    # 카메라에게서 한 프레임(이미지 한 장) 을 읽음
    ret , frame = cap.read()
    
    if ret :
        # 저장할 폴더가 없으면 생성
        os.makedirs(SAVE_DIR , exist_ok = True)
        
        time_stamp = datetime.now().strftime("%Y%m%d_%H%M%S")   # 촬영된 시간 저장
        file_name = f"{DEVICE_SERIAL}_{time_stamp}.jpg"         # 저장할 파일 이름 설정
        
        # 온라인 시 해당 코드 사용
        success , image_buffer = cv2.imencode(".jpg" , frame)
        
        try : 
            supabase.storage.from_("plant-images").upload(
                path = file_name ,
                file = image_buffer.tobytes() ,
                file_options = {"content-type" : "image/jpeg"}
            )

            public_url_response = supabase.storage.from_("plant-images").get_public_url(file_name)
            public_url = public_url_response
            
            payload = {"device_serial" : DEVICE_SERIAL , "image_path" : public_url}
            response = requests.post(f"{API_BASE_URL}/plant-images" , json = payload)
        
        except Exception as err :
            print(f"[주의] | 온라인 DB 에 이미지 저장 실패 에러 코드 : {err}")
    
    cap.release()
"""
        # 오프라인 시 아래 코드 사용
        file_path = os.path.join(SAVE_DIR , file_name)         # 파일명과 저장할 디렉토리 주소를 조인
        
        
        cv2.imwrite(file_path , frame)  # 디렉토리 주소를 사용하여 프레임을 저장
        print(f"[알림] | [{datetime.now()}] 이미지 저장 성공")
        
        try :
            payload  = {"device_serial" : DEVICE_SERIAL , "image_path" : file_path}
            response = requests.post(f"{API_BASE_URL}/plant-image/" , json = payload)
            
            if response.status_code == 200 :
                print("[알림] | API 서버 이미지 저장 성공")
            else :
                print(f"[에러] | API 서버 이미지 저장 실패 : {response.status_code} - {response.text}")
        except Exception as err :
            print(f"[에러] | API 요청 실패 : {err}")
    else :
        print(f"[주의] | [{datetime.now()}] 카메라에서 프레임을 읽을 수 없습니다.")
    
    cap.release()
"""

if __name__ == "__main__" :
    print(f"[{DEVICE_SERIAL}] 카메라 작동을 시작합니다.")
    print(f'현재 촬영 주기 : {CAPTURE_INTERVAL}')
    
    while True :
        capture_and_save_image()
        time.sleep(CAPTURE_INTERVAL)