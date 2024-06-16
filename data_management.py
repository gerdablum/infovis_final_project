from ast import literal_eval
import json
import pandas as pd
import numpy as np
from song_dataclass import SpotifySong
from sklearn.cluster import KMeans

class DataManager:


    def __init__(self) -> None:
        self.dataframe = self._read_csv_file("./data/charts_monthly_top_50_with_details_shortened.csv")
        self.colums = ["track_id","streams","country","artists","artist_genres","duration","artists","date","position",
                       "0_y","acousticness","danceability","duration_ms","instrumentalness","key","energy","liveness",
                       "loudness","mode","speechiness","tempo","time_signature","valence"]

        self.audio_features = ["acousticness","danceability","instrumentalness","energy","liveness",
                       "speechiness","valence", "key_normalized", "tempo_normalized"]




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
        unique_songs = self._get_unique_tracks(self.dataframe)
        unique_songs = unique_songs.drop(columns=["artists"])
        unique_songs = unique_songs.drop(columns=["artist_genres"])
        unique_songs = unique_songs.to_dict(orient='records')
        return unique_songs

    def cluster(self, features, no_of_clusters):
        unique_songs = self._get_unique_tracks(self.dataframe)
        unique_songs = unique_songs.drop(columns=["artists"])
        unique_songs = unique_songs.drop(columns=["artist_genres"])

        # Ensure that features are present in the dataframe
        missing_features = [feature for feature in features if feature not in unique_songs.columns]
        if missing_features:
            raise KeyError(f"Features missing from dataframe: {missing_features}")

        cluster_values = unique_songs[features]
        kmeans = KMeans(n_clusters=int(no_of_clusters))
        kmeans.fit(cluster_values.to_numpy())
        labels = kmeans.labels_
        centroids = kmeans.cluster_centers_

        unique_songs["cluster_assignment"] = labels

        return {
            "data": unique_songs.to_dict(orient='records'),
            "centroids": centroids.tolist()
        }



    def get_audio_features(self, track_id):
        unique_songs = self._get_unique_tracks(self.dataframe)
        song_row = unique_songs[unique_songs['track_id'] == track_id]
        attributes = np.array(self.audio_features)
        additional_columns = ['artists', 'name', 'artist_genres']
        attributes = np.append(attributes, additional_columns)
        song_row = song_row[attributes].to_dict(orient='records')
        for column in ['artists', 'artist_genres']:
            for idx, song in enumerate(song_row):
                    temp_list = self._convert_string_to_list(song[column])
                    song_row[idx][column] = temp_list
        return song_row

    def get_genres(self):
        df =  self._read_csv_file("./data/unique_genres_with_occurence.csv")
        df = df.head(10)
        df = df[['genre','occurence']]
        return df.to_dict(orient='records')

    def _read_csv_file(self, file_path):
        try:
            # Read CSV file into a DataFrame
            df = pd.read_csv(file_path, index_col=[0])

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

    def _convert_string_to_list(self, s):
        return literal_eval(s)

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