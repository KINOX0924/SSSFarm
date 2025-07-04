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
from passlib.context import CryptContext    # 비밀번호 암호화를 위한 passlib 라이브러리를 불러옴
from . import models , schemas

# 비밀번호 암호화를 하기 위한 설정 진행
pwd_context = CryptContext(schemes = ["bcrypt"] , deprecated = "auto")

# 비밀번호를 해시값으로 변환(암호화) 
def get_password_hash(password) :
    return pwd_context.hash(password)


# USER CURD
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
    hashed_password = get_password_hash(user.password)  # 입력한 비밀번호를 암호화 진행
    db_user = models.User(
        username = user.username ,
        password = hashed_password ,
        position_id = user.position_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


# POSITION CURD
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


# DEVICE CURD
# device_id 로 특정 장치를 조회
def get_device(db : Session , device_id : int) :
    return db.query(models.Device).filter(models.Device.device_id == device_id).first()

# device_name 으로 특정 장치를 조회
def get_device_by_devicename(db : Session , device_name : str) :
    return db.query(models.Device).filter(models.Device.device_name == device_name).first()

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


