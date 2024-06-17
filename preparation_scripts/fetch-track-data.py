import pandas as pd
import requests

token_url = "https://accounts.spotify.com/api/token"
headers = {"Content-Type": "application/x-www-form-urlencoded"}
data = {
    'grant_type': 'client_credentials',
    'client_id': 'b53e8d8312fc4413bff477853fc335c6',
    'client_secret': '95d90634ba1d4da39f2acebfe7dc7c37'
}

audio_features_url = "https://api.spotify.com/v1/audio-features/"

desired_properties = [
 "acousticness",
  "danceability",
  "duration_ms",
  "energy",
  "instrumentalness",
  "key",
  "liveness",
  "loudness",
  "mode",
  "speechiness",
  "tempo",
  "time_signature",
  "valence"]


def getAccessToken():
    response = requests.post(token_url, headers=headers, data=data)

    if response.status_code == 200:
        # Successful request
        result = response.json()
        print(result)
        return result.get('access_token')
    else:
        print(f"Error: {response.status_code}")
        print(response.text)  # Print the response content for debugging


def add_track_to_df(df, track_id, access_token):
    auth_header = {"Authorization": "Bearer " + access_token}
    response = requests.get(audio_features_url + track_id, headers=auth_header)

    if response.status_code == 200:
        # Successful request
        result = response.json()
        print(result)
        data = {
         "track_id" : [result.get('id')],
        "acousticness" : [result.get('acousticness')],
        "danceability" :  [result.get('danceability')],
        "duration_ms" : [result.get('duration_ms')],
        "instrumentalness" : [result.get('instrumentalness')],
        "key" : [result.get('key')],
        "energy" : [result.get('energy')],
        "liveness" :[ result.get('liveness')],
        "loudness" : [result.get('loudness')],
        "mode" : [result.get('mode')],
        "speechiness" : [result.get('speechiness')],
        "tempo" :[ result.get('tempo')],
        "time_signature" : [result.get('time_signature')],
        "valence" : [result.get('valence')]
        }

        df = df.append(pd.DataFrame(data), ignore_index=True)
        return df
    else:
        print(f"Error: {response.status_code}")
        print(response.text)  # Print the response content for debugging
        print(response.request.url)
        print(response.request.headers)


accessToken = getAccessToken()

df = pd.DataFrame(columns=desired_properties)

df = add_track_to_df(df, "11dFghVXANMlKmJXsNCbNl", accessToken)
df.set_index("track_id", inplace=True)