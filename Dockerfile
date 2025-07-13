# 베이스 이미지 선택
FROM python:3.9-slim

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 라이브러리 설치 파일 선택
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install psycopg2-binary

# 프로젝트 코드 전체 복사
COPY sssfarm_fast_api/ /app/sssfarm_fast_api/

# 실행 명령어 설정
CMD gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT sssfarm_fast_api.main:app