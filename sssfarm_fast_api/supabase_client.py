import os
from supabase import create_client , Client

url : str = os.environ.get("SUPABASE_URL")
key : str = os.environ.get("SUPABASE_KEY")

if not url or not key :
    raise ValueError("URL 또는 KEY 환경 변수가 설정되지 않았습니다.")

supabase = Client = create_client(url , key)