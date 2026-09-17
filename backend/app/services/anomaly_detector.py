import librosa
import numpy as np
from typing import List, Dict


class AnomalyDetector:
    """基于频谱分析的异常检测器

    使用频谱质心(spectral centroid)来检测音频中的异常区间。
    频谱质心高于均值的区域可能表示异常噪音。
    """

    def __init__(self, threshold: float = 0.5):
        """
        初始化异常检测器

        Args:
            threshold: 异常阈值，表示高于均值多少倍时认为是异常 (默认0.5，即高于均值50%)
        """
        self.threshold = threshold

    def detect(self, filepath: str) -> List[Dict]:
        """
        检测音频文件中的异常区间

        Args:
            filepath: 音频文件路径

        Returns:
            List[Dict]: 异常区间列表，每个区间包含 start, end, confidence
        """
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
