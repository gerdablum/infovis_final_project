from dataclasses import dataclass

@dataclass
class SpotifySong:
    track_id: str
    streams: int
    country: str
    artists: list
    artist_genres: list
    duration: float
    name: str
    date: str
    acousticness: float

    danceability: float
    duration_ms: int
    instrumentalness: float
    key: float
    energy: float
    liveness: float
    loudness: float
    mode: float
    speechiness: float
    tempo: int
    time_signature: float
    valence: float
