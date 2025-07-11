#파이썬 어플리케이션이 MySQL 데이터베이스와 통신하기 위한 다리(연결 설정) 역할
#SQLAlchemy ORM 을 사용하여 데이터베이스 작업을 보다 안전하게 처리할 수 있도록 초기 환경을 설정함

"""
SQLAlchemy : 파이썬의 대표적인 ORM(Object-Relational Mapper)
    해당 ORM 을 사용하면 SQL 쿼리문을 직접 작성하지 않고, 파이썬 객체를 사용해서 데이터베이스의 테이블과 데이터를 조작할 수 있음
    
    ORM(Object-Relational Mapper)
    객체 지향 프로그래밍 언어와 관계형 데이터베이스 사이의 통합을 위한 기술을 말함
    ORM 을 사용하면 데이터베이스 테이블을 객체(클래스 및 인스턴스) 로 매핑하여
    개발자가 SQL 쿼리 대신 객체를 조작하는 코드로 데이터베이스와 상호작용할 수 있게됨
"""

import os
# 운영체제와의 상호작용을 하기 위해서 os 라이브러리를 가져옴

from sqlalchemy.pool import NullPool
"""
NullPool 은 sqlalchemy 에서 데이터베이스 연결 풀링(Pooling) 기능을 제어함
일반적으로 sqlalchemy 는 연결 풀링을 통해 성능을 최적화하지만 , NullPoll 은 연결을 즉시 생성하고 닫는 방식으로 사용됨
테스트 환경 , 일시적인 연결관리 , 외부에서의 연결을 관리하는 경우에 유용함
"""

from sqlalchemy import create_engine
"""
create_engine : 데이터베이스와 실제 연결을 설정하고 관리하는 엔진을 만들기 위한 라이브러리
    데이터베이스 서버와 통신을 담당하는 핵심 객체
    내부적으로 커넥션 풀을 관리하여 , 필요할 때마다 데이터베이스 연결을 새로 만드는 대신 기존 연결을 재사용함으로서 성능을 향상시킴
"""
from sqlalchemy.ext.declarative import declarative_base
"""
declarative_base : 데이터베이스 테이블과 매핑될 파이썬 클래스들의 기반이 되는 부모 클래스 생성하기 위한 라이브러리
    해당 함수로 호출하여 만든 Base 클래스를 상속하는 모든 파이썬 클래스는 SQLAlchemy 에 의해 하나의 데이터베이스로 테이블로 인식되고 관리됨
    즉, 테이블의 구조를 정의하는 모델을 만들기 위한 것
"""
from sqlalchemy.orm import sessionmaker
"""
sessionmaker : 데이터베이스와의 모든 상호작용(읽기 , 쓰기 , 수정 , 삭제) 가 일어나는 세션 팩토리 생성을 위한 라이브러리
    실제 데이터베이스 작업을 수행하는 통로 역할
    이 클래스를 호출하여 필요할 때마다 새로운 세션 객체를 얻을 수 있음
"""

# MySQL 데이터베이스와 연결하는 주소를 가져옴
# mysql+pymysql://사용자아이디:비밀번호:호스트명:포트번호/DB스키마명 
MY_SQL_DB_URL = os.environ.get("DATABASE_URL")
if not MY_SQL_DB_URL :
    raise ValueError("DATABASE_URL 환경변수가 설정되지 않았습니다.")
# "mysql+pymysql://root:1234@localhost:3306/sssmartfarm" : 오프라인 주소

"""
MySQL 데이터베이스 엔진 생성
    20 번줄 코드에서 정의한 URL 정보를 create_engine 함수에 전달하여 데이터베이스 엔진을 생성
    DB_engine 이 sssmartfarm 데이터베이스와 통신할 준비가 됨
    
poolclass = NullPoll
    연결 풀 클래스를 NullPool 로 설정함
    데이터베이스 연결 풀링을 하지 않고 , 매 쿼리마다 새로운 연결을 생성하고 즉시 해제하는 방식
    가벼운 작업 , 각 연결이 짧게 유지되기를 원할 때 주로 사용함
"""
DB_engine = create_engine(MY_SQL_DB_URL , poolclass = NullPool)

"""
데이터베이스 세션을 생성하는 클래스(SessionLocal) 를 정의
세션을 만드는 것은 아니고 세션을 만드는 틀을 만드는 것
    autocommit : 데이터를 변경(추가/수정/삭제) 했을 때 자동으로 데이터베이스에 최종 반영(커밋) 할지 말지를 결정하는 옵션
    autoflush  : 변경사항을 최종 반영(커밋) 은 하지 않더라도 데이터베이스에 임시로 보낼지 말지를 결정하는 옵션
    bind       : 이 클래스가 생성하는 모든 세션은 DB_engine 과 연결되도록 지정
"""
SessionLocal = sessionmaker(autocommit = False , autoflush = False , bind = DB_engine)

# 모델의 부모 클래스 생성
# 앞으로 데이터베이스 테이블을 정의할 모든 파이썬 클래스들이 상속받아야 할 Base 클래스를 생성
Base = declarative_base()

"""
DB 세션 제공 함수
Fast API 의 의존성 주입 시스템을 위해 작성된 코드
    동작 원리
    [1] API 요청이 들어와서 데이터베이스 연결이 필요하면 FastAPI 가 get_database 함수를 호출
    [2] data_base = SessionLocal() : 위에서 작성한 세션 팩토리인 Session 을 호출하여 새로운 데이터베이스 세션을 생성
    [3] yield data_base : 함수를 잠시 멈추고 data_base 값을 API 엔드포인트 함수에 전달
    [4] API 엔드포인트 함수가 모든 작업을 진행하고 마침(성공/오류 여부와는 관계없음)
    [5] finally : yield 로 인해 멈추어있던 get_database 함수가 다시 시작되어 finally 블록으로 이동
        *finally 는 try 블록에서 오류 발생 여부와 관계 없이 무조건 항상 실행됨
    [6] data_base.close() : 사용했던 세션을 닫음 , 일련의 과정에서 사용했던 데이터베이스 커넥션은 엔진의 커넥션 풀로 반환되어 다른 요청이 재사용 가능함
"""
def get_database() :
    data_base = SessionLocal()
    try :
        yield data_base
    finally :
        data_base.close()
        
"""
위 49 ~ 54 번 코드를 사용했을 시의 장점
    개발자가 매번 세션을 열고 닫는 코드를 신경 쓸 필요 없이 FastAPI 가 알아서 자동으로 자원 관리를 진행함
    에러 발생 유무와 관계없이 무조건 세션이 닫히는 것을 보장하므로 , 연결이 계속 열려있어 발생하는 커넥션 누수를 방지함
    모든 API 요청이 자신만의 세션을 가지므로 , 한 요청의 작업이 다른 요청에 영향이 미치는 것을 방지함
"""