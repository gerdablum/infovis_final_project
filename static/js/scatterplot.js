 // Define the endpoint URL
 const endpoint = 'api/getSongs';

 // Function to fetch and store JSON data
 const fetchAndStoreSongs = async () => {
     try {
         // Make a GET request to the endpoint
         const response = await axios.get(endpoint);

         // Store the parsed JSON data in a variable
         const songsData = response.data;
         console.log(songsData); // You can use console.log to see the data
         return songsData;
     } catch (error) {
         console.error('Error fetching songs:', error);
     }
 };


document.addEventListener("DOMContentLoaded", function() {

    fetchAndStoreSongs().then(songsData => {
    const pcaData = songsData;
    const heatmapData = JSON.parse(rawData).heatmap;

    const margin = {top: 20, right: 20, bottom: 20, left: 20},
          width = 700 - margin.left - margin.right,
          height = 700 - margin.top - margin.bottom;

    const svg = d3.select("#scatterplot")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const xScale = d3.scaleLinear()
                     .domain(d3.extent(pcaData, d => d.embedding_0))
                     .range([0, width]);
    const yScale = d3.scaleLinear()
                     .domain(d3.extent(pcaData, d => d.embedding_1))
                     .range([height, 0]);

    const tooltip = d3.select("#scatterplot_tooltip");
    const infoBox = d3.select("#info_box");

    // Task 5.1: 'By hovering over a dot in the PCA scatterplot, highlight the corresponding team/player on the heatmap (up to 5 points). '
    svg.selectAll("circle")
       .data(pcaData)
       .enter()
       .append("circle")
       .attr("cx", d => xScale(d.PC1))
       .attr("cy", d => yScale(d.PC2))
       .attr("r", 5)
       .attr("class", d => `team-dot ${d['Team Name'].replace(/\s+/g, '-')}`)
       .style("fill", "grey")
       .style("cursor", "pointer")

    });
});