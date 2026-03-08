async function drawScatterPlot(selector, csvPath) {

  const data = await d3.csv(csvPath, d => ({
    rating: +d['Star Rating Index'],
    energy: +d['Avg_mode_power']
  }));

  const width = 1100;
  const height = 420;
  const margin = { top: 40, right: 40, bottom: 50, left: 65 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.select(selector)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Filter energy outliers using IQR to reduce overplotting
  const energies = data.map(d => d.energy).sort(d3.ascending);
  const q1 = d3.quantile(energies, 0.25);
  const q3 = d3.quantile(energies, 0.75);
  const upperFence = q3 + 1.5 * (q3 - q1);
  const filtered = data.filter(d => d.energy <= upperFence);

  const [ratingMin, ratingMax] = d3.extent(filtered, d => d.rating);

  const xScale = d3.scaleLinear()
    .domain([ratingMin, ratingMax])
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(filtered, d => d.energy)])
    .nice()
    .range([innerHeight, 0]);

  // Light blue → dark blue: both ends clearly visible
  const colorScale = d3.scaleSequential()
    .domain([ratingMin, ratingMax])
    .interpolator(d3.interpolateBlues)
    .interpolator(t => d3.interpolateBlues(0.25 + t * 0.75));

  d3.select(selector).insert('h3', ':first-child')
    .style('text-align', 'center')
    .text('Star Rating vs Energy Consumption');

  const tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('background-color', 'rgba(0, 0, 0, 0.8)')
    .style('color', 'white')
    .style('padding', '8px 12px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  svg.selectAll('.dot')
    .data(filtered)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.rating))
    .attr('cy', d => yScale(d.energy))
    .attr('r', 3.5)
    .attr('fill', d => colorScale(d.rating))
    .attr('opacity', 0.65)
    .attr('stroke', 'none')
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`Rating: ${d.rating}<br/>Energy: ${d.energy.toFixed(2)} W`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      tooltip.style('opacity', 0);
    });

  svg.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(5));

  svg.append('g')
    .call(d3.axisLeft(yScale));

  svg.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .text('Star Rating');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .text('Energy Consumption (W)');
}
