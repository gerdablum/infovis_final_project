 // Define the endpoint URL
 const endpoint = 'api/getSongs';

 // Function to fetch and store JSON data
 const fetchAndStoreSongs = async () => {
     try {
         // Make a GET request to the endpoint
         const response = await axios.get(endpoint);

         // Store the parsed JSON data in a variable
         const songsData = response.data;
         return songsData;
     } catch (error) {
         console.error('Error fetching songs:', error);
     }
 };

function addCheckBoxes() {

    const featureList = [
        "acousticness", "valence", "tempo", "speechiness", "liveness",
        "key", "instrumentalness", "energy", "danceability"
    ];

    // Container for checkboxes
    const container = document.getElementById('checkboxContainer');

    // Create checkboxes dynamically
    featureList.forEach(feature => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = feature;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${feature.charAt(0).toUpperCase() + feature.slice(1)}`));
        container.appendChild(label);
        container.appendChild(document.createElement('br'));

    });

}
document.addEventListener("DOMContentLoaded", function() {

    addCheckBoxes();
    fetchAndStoreSongs().then(rawData => {

    const heatmapData = rawData

    let parent = document.getElementById("scatterplotContainer");
    let parentWith = parent.offsetWidth - 40;
    const margin = {top: 20, right: 20, bottom: 20, left: 20},
          width = parentWith - margin.left - margin.right,
          height = parentWith - margin.top - margin.bottom;


    const svg = d3.select("#scatterplot")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const xScale = d3.scaleLinear()
                     .domain(d3.extent(heatmapData, d => d.embedding_0))
                     .range([0, width]);
    const yScale = d3.scaleLinear()
                     .domain(d3.extent(heatmapData, d => d.embedding_1))
                     .range([height, 0]);

    const zoomableLayer = svg.append("g")
        .attr("class", "zoomable-layer");
    const zoom = d3.zoom()
    .scaleExtent([0.5, 32])
    .on("zoom", (event) => {
            const zx = event.transform.rescaleX(xScale).interpolate(d3.interpolateRound);
            const zy = event.transform.rescaleY(yScale).interpolate(d3.interpolateRound);

            const new_xScale = event.transform.rescaleX(xScale);
            const new_yScale = event.transform.rescaleY(yScale);

            // Update the axes
            //svg.select(".x-axis").call(d3.axisBottom(new_xScale));
            //svg.select(".y-axis").call(d3.axisLeft(new_yScale));
            console.log("zoomed!!");

            // Update dots
            zoomableLayer.selectAll("circle")
                .attr('cx', d => zx(d.embedding_0))
                .attr('cy', d => zy(d.embedding_1));
        });

    addDots(heatmapData);
    svg.call(zoom);

     // dropdown selection
    const uniqueCountries = [...new Set(rawData.map(d => d.country))];
    uniqueCountries.unshift("all countries");

    const dropdown = d3.select("#countryDropdown");

    dropdown.append("option")
        .text("Select a country")
        .attr("disabled", true)
        .attr("selected", true);

    dropdown.selectAll("option.country-option")
        .data(uniqueCountries)
        .enter()
        .append("option")
        .attr("class", "country-option")
        .attr("value", d => d)
        .text(d => d);

    dropdown.on("change", function(event) {
        const selectedValue = d3.select(this).property("value");
        let filteredData;

        if (selectedValue === "all countries") {
            filteredData = rawData;
        } else {
            filteredData = rawData.filter(d => d.country === selectedValue);
        }

        zoomableLayer.selectAll("circle").remove();

       addDots(filteredData);
    });


        function addDots(data) {
            zoomableLayer.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.embedding_0))
                .attr("cy", d => yScale(d.embedding_1))
                .attr("r", 5)
                .attr("class", d => `team-dot ${d['name'].replace(/\s+/g, '-')}`)
                .style("fill", "grey")
                .style("cursor", "pointer")
                .on("click", function (event, d) {
                    svg.selectAll("circle").style("stroke", "none");
                    d3.select(this)
                        .style("stroke", "red")
                        .style("stroke-width", 2);
                    createRadialChart(d['track_id']);
                });
        }
    });
});