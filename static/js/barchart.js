const fetchGenres = async (country = 'all countries') => {
    try {
        const response = await axios.get(`/api/genres?country=${country}`);
        const genresData = response.data;
        return genresData;
    } catch (error) {
        console.error('Error fetching genres:', error);
    }
};

const createBarChart = (data) => {
    document.querySelector('#barchart').style.display = 'block';

    const margin = { top: 20, right: 100, bottom: 100, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#barchart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.genre))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.occurence)])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.genre))
        .attr("y", d => y(d.occurence))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.occurence))
        .attr("fill", "#d35400");

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .attr("text-anchor", "middle")
        .text("Genres");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left / 2)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Occurrence");
};

document.addEventListener("DOMContentLoaded", async function() {
    // Fetch genres for "all countries" and create the default bar chart
    const defaultGenresData = await fetchGenres('all countries');
    document.getElementById('selectedCountry').textContent = 'all countries';
    createBarChart(defaultGenresData);
});
