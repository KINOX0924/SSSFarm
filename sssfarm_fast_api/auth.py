# pip install "python-jose[cryptography]"
# 보안 관련 라이브러리 설치 필요

"""
사용자 인증(로그인 , 토큰) 과 관련된 모든 기능을 담당하는 파일
"""

from fastapi import Depends , HTTPException , status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError , jwt
from datetime import datetime , timedelta
from sqlalchemy.orm import Session
from passlib.context import CryptContext    # 비밀번호 처리를 위한 라이브러리 추가
import os

from . import crud , data_pipe

# 시크릿 키 설정
# 실제 배포 운영 시에는 환경변수로 관리되어야 함
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY :
    raise ValueError("시크릿 키 환경변수가 설정되지 않았습니다.")

ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60    # 토큰 유효 시간

# /token 엔드포인트 주소를 가리키는 OAuth2 스키마
oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "token")

# 비밀번호 암호화 컨텍스트 생성
pwd_context = CryptContext(schemes = ["bcrypt"] , deprecated = "auto")

# 비밀번호 검증 함수
def verify_password(plain_password : str , hashed_password : str) -> bool :
    return pwd_context.verify(plain_password , hashed_password)

# 비밀번호 해싱 함수
def get_password_hash(password : str) -> str :
    return pwd_context.hash(password)

# JWT 토큰 생성
def create_access_token(data : dict) :
    to_encode = data.copy()
    expire    = datetime.now() + timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp" : expire})
    encoded_jwt = jwt.encode(to_encode , SECRET_KEY , algorithm = ALGORITHM)
    return encoded_jwt

# 생성한 토큰을 검증하고 현재 로그인된 사용자 정보를 반환하는 의존성 함수
# 이 함수를 API 엔드 포인트에 주입하면 , 해당 엔드포인트는 반드시 유효한 토큰을 필요로 함
def get_current_user(token : str = Depends(oauth2_scheme) , db : Session = Depends(data_pipe.get_database)) :
    credentials_exception = HTTPException(status_code = status.HTTP_401_UNAUTHORIZED , detail = "유효하지 않은 토큰" , headers = {"WWW-Authenticate" : "Bearer"} , )
    
    # 토큰을 디코딩하여 사용자의 이름을 추출
    try :
        payload = jwt.decode(token , SECRET_KEY , algorithms = [ALGORITHM])
        username : str = payload.get("sub")
        if username is None :
            raise credentials_exception
    except JWTError :
        raise credentials_exception
    
    # 추출한 사용자 이름으로 DB 에서 실제 사용자 정보를 조회
    user = crud.get_user_by_username(db , username = username)
    if user is None :
        raise credentials_exception
    return user