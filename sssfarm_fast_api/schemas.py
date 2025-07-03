"""
API 의 입출력 데이터 형식을 Pydantic 모델로 정의하는 파일

외부와 통신하는 데이터의 규칙(명세)
데이터 유효성 검사 진행 및 자동으로 형 변환(타입) , API 문서화에 사용
"""

from pydantic import BaseModel
from typing import Optional , List
from datetime import datetime
from decimal import Decimal

# POSITION SCHEMAS
class PositionBase(BaseModel) :
    position_name : str

class PositionVreate(PositionBase) :
    pass

class Position(PositionBase) :
    position_id : int
    
    # SQLAlchemt 모델 객체를 Pydantic 모델로 변환 가능하게 만듬
    class Config :
        from_attributes = True


# USER SCHEMAS
class UserBase(BaseModel) :
    username : str
    position_id : Optional[int] = None
    
class UserCreate(UserBase) :
    password : int

class User(UserBase) :
    user_id : int
    position : Optional[Position] = None    # 포지션(직급) 과 관계된 정보를 같이 보여줌
    
    class Config :
        from_attributes = True