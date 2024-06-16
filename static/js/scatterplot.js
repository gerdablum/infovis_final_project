const endpointSongs = 'api/getSongs';
const endpointCluster = 'api/cluster';

let xScale;
let yScale;
let isClustered = false;
let originalData;

const fetchAndStoreSongs = async () => {
    try {
        const response = await axios.get(endpointSongs);
        const songsData = response.data;
        originalData = [...songsData]; // Store original data
        return songsData;
    } catch (error) {
        console.error('Error fetching songs:', error);
    }
};

const sendFeaturesForClustering = async (selectedFeatures, no_of_clusters = 5) => {
    try {
        const response = await axios.post(endpointCluster, {
            features: selectedFeatures,
            no_of_clusters: no_of_clusters
        });
        const clusteredData = response.data;
        return clusteredData;
    } catch (error) {
        console.error('Error clustering songs:', error);
    }
};

const updateRemoveClusteringButtonState = () => {
    const removeClusteringButton = document.getElementById("removeclustering");
    if (isClustered) {
        removeClusteringButton.removeAttribute("disabled");
    } else {
        removeClusteringButton.setAttribute("disabled", "true");
    }
};

document.addEventListener("DOMContentLoaded", function() {
    fetchAndStoreSongs().then(rawData => {
        // Add scatterplot layout
        let parent = document.getElementById("scatterplotContainer");
        let parentWidth = parent.offsetWidth - 40;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const width = parentWidth - margin.left - margin.right;
        const height = parentWidth - margin.top - margin.bottom;
        const svg = d3.select("#scatterplot")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        const scatterplotData = rawData;
        xScale = d3.scaleLinear().domain(d3.extent(scatterplotData, d => d.embedding_0)).range([0, width]);
        yScale = d3.scaleLinear().domain(d3.extent(scatterplotData, d => d.embedding_1)).range([height, 0]);

        // Make scatterplot layout zoomable
        const zoomableLayer = svg.append("g").attr("id", "zoomableLayer").attr("class", "zoomable-layer");

        // Add a background rectangle for capturing zoom events
        zoomableLayer.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all");

        // Add highlight layer (initially empty) after the zoomable layer
        const highlightLayer = svg.append("g").attr("id", "highlightLayer");

        const zoom = d3.zoom()
            .scaleExtent([0.5, 32])
            .on("zoom", (event) => {
                const zx = event.transform.rescaleX(xScale).interpolate(d3.interpolateRound);
                const zy = event.transform.rescaleY(yScale).interpolate(d3.interpolateRound);
                zoomableLayer.selectAll("circle")
                    .attr('cx', d => zx(d.embedding_0))
                    .attr('cy', d => zy(d.embedding_1));
                highlightLayer.selectAll("circle")
                    .attr('cx', d => zx(d.embedding_0))
                    .attr('cy', d => zy(d.embedding_1));
            });

        svg.call(zoom); // Attach zoom behavior to the svg

        function updateScatterplotDots(rawData, filteredData, isClustered = false) {
           // const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#9467bd", "#8c564b"]; // Distinct colors excluding red

            const colors = ["#1f77b4", "#2ca02c", "#9467bd", "#8c564b", "#e377c2", "#17becf", "#bcbd22"];

            // Remove all circles
            zoomableLayer.selectAll("circle").remove();


            // Draw gray circles for all data points
            zoomableLayer.selectAll("circle.grey")
                .data(rawData.filter(d => !filteredData.includes(d)))
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.embedding_0))
                .attr("cy", d => yScale(d.embedding_1))
                .attr("r", 3) // smaller radius for gray circles
                .attr("class", "grey")
                .style("fill", "lightgray");

            // Draw circles for filtered data
            zoomableLayer.selectAll("circle.black")
                .data(filteredData)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.embedding_0))
                .attr("cy", d => yScale(d.embedding_1))
                .attr("r", 3)
                .attr("class", "black")
                .style("fill", d => isClustered ? colors[d.cluster_assignment] : "black") // Color based on cluster assignment if clustered
                .style("cursor", "pointer")
                .on("click", function (event, d) {
                    svg.selectAll("circle").style("stroke", "none").style("r", 3);
                    d3.select(this)
                        .style("stroke", "red")
                        .style("r", 3)
                        .style("stroke-width", 1);
                    createRadialChart(d['track_id']);

                    // change iframeUrl
                    const newUrl = "https://open.spotify.com/embed/track/" + d['track_id'] + "?utm_source=generator";
                    const iframe = document.getElementById('spotify-iframe');
                    iframe.style.display = "block";
                    iframe.src = newUrl;
                });
        }

        // Initial rendering of the scatterplot dots
        updateScatterplotDots(rawData, rawData, isClustered);

        // Add feature checkboxes
        const featureList = ["acousticness", "valence", "tempo", "speechiness", "liveness", "key", "instrumentalness", "energy", "danceability"];
        const checkboxContainer = document.getElementById('checkboxContainer');
        featureList.forEach(feature => {
            const div = document.createElement('div'); // Create a div for each feature
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = feature;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${feature.charAt(0).toUpperCase() + feature.slice(1)}`));
            div.appendChild(label); // Append label (which includes checkbox) to the div
            checkboxContainer.appendChild(div); // Append the div to the container
        });

        // Add country selection dropdown
        const uniqueCountries = [...new Set(rawData.map(d => d.country))];
        uniqueCountries.unshift("all countries");
        const dropdown = d3.select("#countryDropdown");
        dropdown.selectAll("option.country-option")
            .data(uniqueCountries)
            .enter()
            .append("option")
            .attr("class", "country-option")
            .attr("value", d => d)
            .text(d => d);

        // Set "all countries" as the default selected value
        dropdown.property("value", "all countries");
        updateScatterplotDots([], rawData);

        dropdown.on("change", async function (event) {
            const selectedValue = d3.select(this).property("value");
            document.getElementById('selectedCountry').textContent = selectedValue;

            let filteredData;
            if (selectedValue === "all countries") {
                filteredData = rawData;
            } else {
                filteredData = rawData.filter(d => d.country === selectedValue);
            }
            updateScatterplotDots(rawData, filteredData, isClustered); // Check isClustered flag

            // Trigger bar chart update
            if (selectedValue !== "all countries") {
                const genresData = await fetchGenres(selectedValue);
                d3.select("#barchart").selectAll("*").remove(); // Clear previous chart
                createBarChart(genresData);
            } else {
                d3.select("#barchart").selectAll("*").remove(); // Clear chart if "all countries" is selected
            }
        });

        // Add event listener for reclustering
        document.getElementById("recluster").addEventListener("click", async () => {
            const selectedFeatures = Array.from(document.querySelectorAll('#checkboxContainer input:checked')).map(checkbox => checkbox.value);
            if (selectedFeatures.length > 0) {
                const clusteredData = await sendFeaturesForClustering(selectedFeatures);
                console.log(clusteredData);


                // Update rawData to the clustered data
                rawData = clusteredData.data;
                isClustered = true;
                updateRemoveClusteringButtonState();


                // Filter the data as per the selected country before updating scatterplot
                const selectedValue = dropdown.property("value");
                let filteredClusteredData;
                if (selectedValue === "all countries") {
                    filteredClusteredData = clusteredData.data;
                } else {
                    filteredClusteredData = clusteredData.data.filter(d => d.country === selectedValue);
                }


                updateScatterplotDots(rawData, filteredClusteredData, true); // Update with clustered data
            } else {
                console.error('No features selected for clustering');
            }
        });

        // Add event listener for removing clustering
        document.getElementById("removeclustering").addEventListener("click", () => {
            rawData = [...originalData]; // Reset to original data
            isClustered = false;
            updateRemoveClusteringButtonState();
            const selectedValue = dropdown.property("value");
            let filteredData;
            if (selectedValue === "all countries") {
                filteredData = rawData;
            } else {
                filteredData = rawData.filter(d => d.country === selectedValue);
            }
            updateScatterplotDots(rawData, filteredData, false); // Reset without clustering
        });

        // Initial call to update the state of the "Remove clustering" button
        updateRemoveClusteringButtonState();
    });
});

const highlightScatterplotDots = (genre) => {
    const selectedCountry = document.getElementById('selectedCountry').textContent;

    // Remove any existing highlight circles
    d3.select("#highlightLayer").selectAll("circle").remove();

    d3.select("#zoomableLayer")
        .selectAll("circle")
        .each(function(d) {
            if (d.artist_genres.includes(genre) && (d.country === selectedCountry || selectedCountry === 'all countries')) {
                const [cx, cy] = [d3.select(this).attr('cx'), d3.select(this).attr('cy')];

                d3.select("#highlightLayer").append("circle")
                    .attr("cx", cx)
                    .attr("cy", cy)
                    .attr("r", 3)
                    .style("fill", "#e67e22")
                    .style("opacity", 0.7)
                    .style("stroke", "none");
            }
        });
};

const removeHighlightScatterplotDots = () => {
    d3.select("#highlightLayer").selectAll("circle").remove();
};
