import cv2                                      # 이미지 처리 , 카메라 작동 등에 관련된 opencv 라이브러리
import time                                    # 촬영 주기를 설정하기 위한 라이브러리
import os                                       # os 명령어를 직접 사용하기 위한 라이브러리
from datetime import datetime     # 촬영 일자를 쓰기 위한 라이브러리

# 설정
CAPTURE_INTERVAL = 10           # 촬영 간격(초)
SAVE_DIR = "images"                 # 이미지를 저장하는 경로
DEVICE_SERIAL = "HD-3000"      # 카메라 장치 이름

# 카메라로 이미지를 캡처하고 파일로 저장하는 함수
def capture_and_save_image() :
    # 카메라 연결
    # 웹캠이 장착된 노트북일 경우 0 , 그 외에 추가적으로 USB 를 장착할 경우 1 씩 숫자가 올라감
    # 연결 시 나중에 연결된 카메라들이 나중 인덱스라고 생각하면 됨
    cap = cv2.VideoCapture(1)
    
    # 카메라가 정상적으로 작동하는 지 확인
    if not cap.isOpened() :
        print(f"[에러] | [{datetime.now()}] 카메라를 작동할 수 없습니다.")
        return
    
    # 카메라에게서 한 프레임(이미지 한 장) 을 읽음
    ret , frame = cap.read()
    
    if ret :
        # 저장할 폴더가 없으면 생성
        os.makedirs(SAVE_DIR , exist_ok = True)
        
        time_stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"{DEVICE_SERIAL}_{time_stamp}.jpg"
        file_path = os.path.join(SAVE_DIR , file_name)
        
        cv2.imwrite(file_path , frame)
        print(f"[알림] | [{datetime.now()}] 이미지 저장 성공")
    else :
        print(f"[주의] | [{datetime.now()}] 카메라에서 프레임을 읽을 수 없습니다.")
    
    cap.release()

if __name__ == "__main__" :
    print(f"[{DEVICE_SERIAL}] 카메라 작동을 시작합니다.")
    print(f'현재 촬영 주기 : {CAPTURE_INTERVAL}')
    
    while True :
        capture_and_save_image()
        time.sleep(CAPTURE_INTERVAL)