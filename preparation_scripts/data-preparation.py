import pandas as pd
import pandas as pd
import requests
import time

token_url = "https://accounts.spotify.com/api/token"
headers = {"Content-Type": "application/x-www-form-urlencoded"}
data = {
    'grant_type': 'client_credentials',
    'client_id': 'this_is_very_secret',
    'client_secret': 'this_is_even_more_secret'
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

error_file_path = "c:/Users/Alina/Master-Projects/visual-data-science/project/data/errors.txt"
def read_csv_file(file_path):
    try:
        # Read CSV file into a DataFrame
        df = pd.read_csv(file_path)

        # Display the DataFrame (optional)
        print("Columns in CSV file:")
        print(df.columns)

        return df
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return None

def save_all_tracks_per_country(df):
    for country in df["country"].unique():
        tracks_per_country = df[df["country"] == country]
        tracks_per_country.to_csv("c:/Users/Alina/Master-Projects/visual-data-science/project/charts_per_country/" + country + ".csv")

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
        data = {
        "track_id" : [response.json()['id']],
        "acousticness" : [response.json()['acousticness']],
        "danceability" :  [response.json()['danceability']],
        "duration_ms" : [response.json()['duration_ms']],
        "instrumentalness" : [response.json()['instrumentalness']],
        "key" : [response.json()['key']],
        "energy" : [response.json()['energy']],
        "liveness" :[ response.json()['liveness']],
        "loudness" : [response.json()['loudness']],
        "mode" : [response.json()['mode']],
        "speechiness" : [response.json()['speechiness']],
        "tempo" :[response.json()['tempo']],
        "time_signature" : [response.json()['time_signature']],
        "valence" : [response.json()['valence']]
        }

        df = df.append(pd.DataFrame(data), ignore_index=True)
        return df
    else:
        print(f"Error: {response.status_code}")
        print(response.text)  # Print the response content for debugging
        print(response.request.url)
        print(response.request.headers)
        if response.status_code == 429:
            print(f"Timeout. Waiting for 30 seconds. Appending track {track_id} to error list. Not fetched.")
            with open(error_file_path, 'a') as file:
                file.write(track_id + '\n')
            print(response.headers)
            time.sleep(30)


# df = read_csv_file("./data/charts.csv")

# df = df[df['position'] <= 50]
# print(f"length of dataset is {len(df)}")
# df.to_csv("./data/charts-top-50-shortened.csv")
# all_track_ids = df["track_id"].unique()
# data_frame_track_ids = pd.DataFrame(data=all_track_ids, columns=['track_id'])
# print(f"unique track id length: {len(data_frame_track_ids)}")
# data_frame_track_ids.to_csv("./data/track_ids_shortened.csv")


accessToken = getAccessToken()

df = pd.DataFrame(columns=desired_properties)

track_id_df = read_csv_file("c:/Users/Alina/Master-Projects/visual-data-science/project/data/track_ids_shortened.csv")
rows = len(track_id_df)
for index, track_id in enumerate(track_id_df["track_id"]):
    df = add_track_to_df(df, track_id, accessToken)
    time.sleep(0.3)
    print(f"{index}/{rows} processed")
df.set_index("track_id", inplace=True)

df.to_csv("c:/Users/Alina/Master-Projects/visual-data-science/project/data/track_detail_info.csv")