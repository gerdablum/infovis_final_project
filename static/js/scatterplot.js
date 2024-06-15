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


document.addEventListener("DOMContentLoaded", function() {

    fetchAndStoreSongs().then(rawData => {

    const heatmapData = rawData

    const margin = {top: 20, right: 20, bottom: 20, left: 20},
          width = 700 - margin.left - margin.right,
          height = 700 - margin.top - margin.bottom;

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

    zoomableLayer.selectAll("circle")
       .data(heatmapData)
       .enter()
       .append("circle")
       .attr("cx", d => xScale(d.embedding_0))
       .attr("cy", d => yScale(d.embedding_1))
       .attr("r", 5)
       .attr("class", d => `team-dot ${d['name'].replace(/\s+/g, '-')}`)
       .style("fill", "grey")
       .style("cursor", "pointer")
       .on("click", function(event, d) {
        svg.selectAll("circle").style("stroke", "none");
        d3.select(this)
            .style("stroke", "red")
            .style("stroke-width", 2);
        createRadialChart(d['track_id']);
    });

    svg.call(zoom);

    });
});