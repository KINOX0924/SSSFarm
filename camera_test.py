# test_webcam.py
import cv2
import time

# 0번 카메라 (노트북 내장 캠)에 연결
cap = cv2.VideoCapture(1)

# 카메라가 정상적으로 열렸는지 확인
if not cap.isOpened():
    print("오류: 카메라를 열 수 없습니다.")
else:
    print("카메라가 성공적으로 열렸습니다. 5초간 화면을 표시합니다.")
    print("ESC 키를 눌러도 조기 종료할 수 있습니다.")

    start_time = time.time()
    # 5초 동안 또는 ESC 키를 누를 때까지 카메라 화면을 보여줌
    while(time.time() - start_time < 3000):
        # 카메라로부터 한 프레임(이미지 한 장)을 읽어옴
        ret, frame = cap.read()
        
        # 프레임을 성공적으로 읽었는지 확인
        if not ret:
            print("오류: 프레임을 읽을 수 없습니다.")
            break
        
        # 'My Webcam' 이라는 이름의 창에 프레임을 보여줌
        cv2.imshow('My Webcam', frame)

        # 1ms 동안 키 입력을 기다림. ESC(ASCII 27) 키가 눌리면 루프 종료
        if cv2.waitKey(1) == 27:
            break
            
    # 사용한 모든 자원 해제
    cap.release()
    cv2.destroyAllWindows()