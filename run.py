import uvicorn

if __name__ == "__main__":
    # host를 '0.0.0.0'으로 변경하여 모든 인터페이스에서 접속을 허용
    uvicorn.run(
        "sssfarm_fast_api.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True
    )