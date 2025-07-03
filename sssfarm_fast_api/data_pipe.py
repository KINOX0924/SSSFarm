"""
파이썬 앱과 MySQL 을 연결하는 설정 파일

get_database 함수는 API 가 호출될때 마다 독립적인 DB 작업 공간(세션) 을 제공하고 끝나면 닫아주는 역할을 진행함
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# MySQL 데이터베이스와 연결하는 주소를 가져옴
# mysql+pymysql://사용자아이디:비밀번호:호스트명:포트번호/DB스키마명 
MY_SQL_DB_URL = "mysql+pymysql://root:1234@localhost:3306/sssmartfarm"

# MySQL 데이터베이스 엔진 생성
# sqlalchemy 가 DB 와 실제로 통신할 수 있도록 연결 통로(엔진) 을 만드는 것
# 내부에 커넥션 풀을 만들어 효율적으로 DB 에 접속할 수 있도록 함
DB_engine = create_engine(MY_SQL_DB_URL)

# MySQL 데이터베이스 세션 생성
# DB 와 대화할 수 있는 작업 공간인 세션을 만들어내는 코드
SessionLocal = sessionmaker(autocommit = False , autoflush = False , bind = DB_engine)

# 모델의 부모 클래스 생성
# models.py 에서 만들 모든 DB 테이블 모델들이 상속받을 부모 클래스
# 이 클래스를 상속받아야만 sqlalchemy 가 '이 클래스가 DB 테이블인지 아닌지' 를 인식할 수 있음
Base = declarative_base()

# DB 세션 제공 함수
# FAST API 의 '의존성 주입' 시스템이 사용하는 핵심 함수
# API 요청이 들어올 때마다 이 함수가 호출되어 새로운 DB 세션을 생성하고 , API 로직 처리가 끝나면 finally 구문을 통해 세션을 닫아줌
# 매번 세션을 만들고 닫는 것이 안전하고 안정적임
def get_database() :
    data_base = SessionLocal()
    try :
        yield data_base
    finally :
        data_base.close()