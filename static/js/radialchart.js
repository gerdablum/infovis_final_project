function createRadialChart(trackId) {
    axios.get('/api/audioFeatures/' + trackId)
    .then(response => {
        // Hide the hint and show the song info
        document.querySelector('#song_info_hint').style.display = 'none';
        document.querySelector('#song_info').style.display = 'block';
        document.querySelector('#radialchart').style.display = 'block';

        document.querySelector('#name').textContent  = "Song title: " + response.data[0]['name'];

        let artists = response.data[0]['artists'];
        let artistsStr = listToPrettyString(artists);
        document.querySelector('#artists').textContent  = "Artists: " + artistsStr;

        let genres = response.data[0]['artist_genres'];
        let genreStr = listToPrettyString(genres);
        document.querySelector('#genres').textContent  = "Genres: " + genreStr;
        createAudioFeaturesRadialChart(response.data);
    })
    .catch(error => console.error('Error:', error));
}


function listToPrettyString(lst) {
    let str = "";
    for (let index = 0; index < lst.length; index++) {
        if (index < lst.length-1) {
            str += lst[index] + ", ";
        } else {
            str += lst[index];
        }
    }
    return str;
}

// adapted from https://yangdanny97.github.io/blog/2019/03/01/D3-Spider-Chart
function createAudioFeaturesRadialChart(data) {

    let parent = document.getElementById("radialChartContainer");
    let parentWith = parent.offsetWidth - 320;

    const margin = {top: 0, right: 20, bottom: 0, left: 20},
    width = parentWith - margin.left - margin.right,
    height = parentWith - margin.top - margin.bottom;
    const radius = parentWith / 3.5;
    const svg = d3.select("#radialchart");

    svg.selectAll("*").remove();

    svg.attr("class", "chart")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

    let radialScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, radius]);
    let ticks = [0.2, 0.4, 0.6, 0.8, 1];

    function angleToCoordinate(angle, value){
        let x = Math.cos(angle) * radialScale(value);
        let y = Math.sin(angle) * radialScale(value);
        return {"x": width / 2 + x, "y": height / 2 - y};
    }

    function isLabelOnLeftSide(angle){
       return angle > 5;
    }

    // create the circles for the radial chart
    svg.selectAll("circle")
    .data(ticks)
    .join(
        enter => enter.append("circle")
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("r", d => radialScale(d))
    );

    // create labels
    svg.selectAll(".ticklabel")
    .data(ticks)
    .join(
        enter => enter.append("text")
            .attr("class", "ticklabel")
            .attr("x", width / 2 + 5)
            .attr("y", d => height / 2 - radialScale(d))
            .text(d => d.toString())

    );

    // draw the axes
    data = data[0]
    delete data['name']
    delete data['artists']
    delete data['artist_genres']
    let features = Object.keys(data);
    let featureData = features.map((f, i) => {
        let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
        if (f === "key_normalized") {
            f = "key";
        }
        if (f === "tempo_normalized") {
            f = "tempo";
        }
        return {
            "name": f,
            "angle": angle,
            "line_coord": angleToCoordinate(angle, 1),
            "label_coord": angleToCoordinate(angle, 1.1),
            "label_left_side": isLabelOnLeftSide(angle)
        };
    });

    // draw axis line
    svg.selectAll("line")
    .data(featureData)
    .join(
        enter => enter.append("line")
            .attr("x1", width / 2)
            .attr("y1", height / 2)
            .attr("x2", d => d.line_coord.x)
            .attr("y2", d => d.line_coord.y)
            .attr("stroke","black"));

    // draw axis label
    svg.selectAll(".axislabel")
    .data(featureData)
    .join(
        enter => enter.append("text")
            .attr("x", d => d.label_coord.x)
            .attr("y", d => d.label_coord.y)
            .attr("text-anchor", d => d.label_left_side ? "start" : "end")
            .text(d => d.name));


    // create Line

    coords = getPathCoordinates(data);
    var path = d3.path();
    path.moveTo(coords[0][0], coords[0][1])
    for (let i = 1; i < coords.length; i++) {
        path.lineTo(coords[i][0], coords[i][1]);
    }
    path.closePath();
    console.log(path.toString())


    // helper functio to map data to path coordinates
    function getPathCoordinates(data_point){
        let coordinates = [];
        for (var i = 0; i < features.length; i++){
            feature = features[i]
            let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
            let coordsDict = angleToCoordinate(angle, data_point[feature]);
            let coords = [coordsDict['x'], coordsDict['y']]
            coordinates.push(coords);
        }
        return coordinates;
    }

    // draw the path element
    svg.selectAll("path")
        .data(data)
        .join(
            enter => enter.append("path")
                .datum(d => getPathCoordinates(d))
                .attr("d", path)
                .attr("stroke-width", 3)
                .attr("stroke", (_, i) => colors[i])
                .attr("fill", (_, i) => colors[i])
                .attr("stroke-opacity", 1)
                .attr("opacity", 0.5));

    svg.append("path")
        .attr("d", path.toString())
        .attr("stroke", "black")
        .attr("fill", "#d35400")
        .attr("stroke-opacity", 1)
        .attr("opacity", 0.5);


   /* let element = document.getElementById("radialchart");
    if (element.hasChildNodes()) {
        element.removeChild(element.firstChild);
    }

    element.appendChild(svg.node());*/

}