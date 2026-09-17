# Task C1: AI预检测

**Files:**
- Create: `backend/app/services/anomaly_detector.py`
- Modify: `backend/app/routers/audio.py`
- Create: `frontend/src/components/AudioWaveform.tsx` (增强)

**Interfaces:**
- Consumes: 音频文件路径
- Produces: `anomaly_segments: [{start: float, end: float, confidence: float}]`

## Steps

### 后端

1. **创建异常检测服务**

```python
# backend/app/services/anomaly_detector.py
import librosa
import numpy as np
from typing import List, Dict

class AnomalyDetector:
    def __init__(self, threshold: float = 0.5):
        self.threshold = threshold
    
    def detect(self, filepath: str) -> List[Dict]:
        y, sr = librosa.load(filepath)
        # 计算频谱质心 (spectral centroid)
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        
        # 简单阈值: 频谱质心高于均值的区域可能是异常
        mean_centroid = np.mean(centroid)
        anomalies = []
        
        frame_length = 512
        hop_length = 256
        
        for i in range(0, len(centroid) - frame_length, frame_length):
            frame_mean = np.mean(centroid[i:i+frame_length])
            if frame_mean > mean_centroid * (1 + self.threshold):
                start_time = librosa.frames_to_time(i, sr=sr, hop_length=hop_length)
                end_time = librosa.frames_to_time(i + frame_length, sr=sr, hop_length=hop_length)
                confidence = min((frame_mean - mean_centroid) / mean_centroid, 1.0)
                anomalies.append({
                    "start": float(start_time),
                    "end": float(end_time),
                    "confidence": float(confidence)
                })
        
        return anomalies
```

2. **添加检测API端点**

```python
# backend/app/routers/audio.py
from app.services.anomaly_detector import AnomalyDetector

@router.get("/{audio_id}/detect-anomalies")
def detect_anomalies(
    audio_id: uuid.UUID,
    threshold: float = 0.5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(404, "Audio not found")
    
    detector = AnomalyDetector(threshold=threshold)
    segments = detector.detect(audio.filepath)
    return {"segments": segments}
```

3. **测试**

```python
# backend/tests/test_anomaly_detector.py (新建)
def test_anomaly_detector_returns_list():
    detector = AnomalyDetector(threshold=0.5)
    # 需要一个实际的音频文件来测试
    # 或者 mock librosa.load
    pass
```

### 前端

4. **在AudioWaveform中添加检测按钮**

```tsx
// AudioWaveform.tsx
const [showDetection, setShowDetection] = useState(false)
const [detectedSegments, setDetectedSegments] = useState([])

const handleDetect = async () => {
  const res = await api.get(`/audio/${audioId}/detect-anomalies`)
  setDetectedSegments(res.data.segments)
  setShowDetection(true)
}

// 添加检测按钮
<button onClick={handleDetect}>AI检测</button>

// 在波形上显示检测到的区域
{showDetection && detectedSegments.map((seg, i) => (
  <div key={i} className="absolute bg-red-500/30" 
       style={{ left: `${(seg.start/duration)*100}%`, width: `${((seg.end-seg.start)/duration)*100}%` }} />
))}
```

5. **提交**
