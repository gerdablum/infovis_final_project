from flask import Flask, jsonify, request, render_template
from data_management import DataManager
app = Flask(__name__)

data_manager = None


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/top10Songs/<country>', methods=['GET'])
def get_top_10_songs(country):
    date = request.args.get('date')
    top_songs = data_manager.get_top_10_songs_per_country_and_time(country, date)
    return jsonify(top_songs)

@app.route('/api/songs/<country>', methods=['GET'])
def get_all_songs_per_country(country):
    songs = data_manager.get_all_songs_by_country(country)
    return jsonify(songs)

@app.route('/api/getSongs', methods=['GET'])
def load_songs_datapoints():
    cluster_points = data_manager.get_umap_songs()
    return jsonify(cluster_points)


@app.route('/api/genres', methods=['GET'])
def get_genres():
    genres = data_manager.get_genres()
    return jsonify(genres)


@app.route('/api/audioFeatures/<track_id>', methods=['GET'])
def get_audio_features_for_song(track_id):
    song_with_audio_features = data_manager.get_audio_features(track_id)
    return jsonify(song_with_audio_features)

if __name__ == '__main__':
    data_manager = DataManager()
    app.run(debug=True)