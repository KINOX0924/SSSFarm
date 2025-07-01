from rest_framework import serializers
from .models import SensorData

class SensorDataSerializer(serializers.ModelSerializer) :
    class Meta :
        model  = SensorData
        fields = "__all__"  # 모든 필드 자동 직렬화