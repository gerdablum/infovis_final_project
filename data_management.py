import pandas as pd
import numpy as np
from song_dataclass import SpotifySong
import umap
from sklearn.preprocessing import StandardScaler
import json

class DataManager:


    def __init__(self) -> None:
        self.dataframe = self._read_csv_file("./data/charts_monthly_top_50_with_details_shortened.csv")
        self.colums = ["track_id","streams","country","artists","artist_genres","duration","artists","date","position",
                       "0_y","acousticness","danceability","duration_ms","instrumentalness","key","energy","liveness",
                       "loudness","mode","speechiness","tempo","time_signature","valence"]

        self.audio_features = ["acousticness","danceability","instrumentalness","energy","liveness",
                       "speechiness","valence", "key", "tempo", "time_signature"]
        self.reducer = umap.UMAP()



    def get_top_10_songs_per_country_and_time(self, country="global", date = "2014/01"):
        df_country = self.get_all_songs_by_country(country)
        df_country = df_country[df_country['date'] == date]
        df_country = df_country.sort_values(by='streams', ascending=False)
        df_top_10 = df_country.head(10)

        top_10_songs_list = []
        for _, row in df_top_10.iterrows():
            song = self._convert_to_dataclass(row)
            top_10_songs_list.append(song)
        return top_10_songs_list

    def get_all_songs_by_country(self, country):
        return self.dataframe[self.dataframe['country'] == country]


    def get_umap_songs(self):

        # TODO make umap in preprocessing step
        unique_songs = self._get_unique_tracks(self.dataframe)
        features = unique_songs[self.audio_features].values
        scaled_features = StandardScaler().fit_transform(features)
        embedding = self.reducer.fit_transform(scaled_features)
        for i in range(embedding.shape[1]):
            unique_songs[f"embedding_{i}"] = embedding[:, i]
        return unique_songs.to_dict(orient='records')

    def get_audio_features(self, track_id):
        unique_songs = self._get_unique_tracks(self.dataframe)
        song = unique_songs[unique_songs['track_id'] == track_id]
        attributes = np.array(self.audio_features)
        attributes = np.append(attributes,'artists')
        attributes = np.append(attributes, 'name')
        return song[attributes].to_dict(orient='records')

    def get_genres(self):
        df =  self._read_csv_file("./data/unique_genres_with_occurence.csv")
        df = df.head(10)
        df = df[['genre','occurence']]
        return df.to_dict(orient='records')

    def _read_csv_file(self, file_path):
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

    def _get_unique_tracks(self, dataframe):
        unique_tracks_df = dataframe.drop_duplicates(subset='track_id')
        return unique_tracks_df

    def _convert_to_dataclass(self, row):
        return SpotifySong(
                track_id=row['track_id'],
                streams=row['streams'],
                country=row['country'],
                artists=row['artists'],
                artist_genres=row['artist_genres'],
                duration=row['duration'],
                name=row['name'],
                date=row['date'],
                acousticness=row['acousticness'],
                danceability=row['danceability'],
                duration_ms=row['duration_ms'],
                instrumentalness=row['instrumentalness'],
                key=row['key'],
                energy=row['energy'],
                liveness=row['liveness'],
                loudness=row['loudness'],
                mode=row['mode'],
                speechiness=row['speechiness'],
                tempo=row['tempo'],
                time_signature=row['time_signature'],
                valence=row['valence']
            )

