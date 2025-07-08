# 노트북 캠 테스트

import cv2
import time

cap = cv2.VideoCapture(0)

if not cap.isOpened() :
    print("카메라를 찾을 수 없습니다.")
else :
    print("카메라를 실행합니다.")
    
    start_time = time.time()
    
    while(time.time() - start_time < 5) :
        ret , frame = cap.read()
        
        if not ret :
            print("오류 , 프레임을 읽을 수 없습니다.")
            break
        
        cv2.imshow("My webcam" , frame)
        
        if cv2.waitKey(1) == 27 :
            break
        
cap.release()
cv2.destroyAllWindows()