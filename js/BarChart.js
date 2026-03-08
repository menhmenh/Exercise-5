async function drawBarChart(selector, csvPath) {

  const rawData = await d3.csv(csvPath, d => ({
    technology: d['Screen_Tech_Clean'],
    energy: +d['Avg_mode_power']
  }));

 
  const aggregated = d3.rollup(
    rawData,
    v => d3.mean(v, d => d.energy),
    d => d.technology
  );

  const data = Array.from(aggregated, ([technology, energy]) => ({
    technology,
    energy: energy / 1000 
  }));

 
  const width = 500;
  const height = 400;
  const margin = { top: 40, right: 20, bottom: 80, left: 65 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;


  const svg = d3.select(selector)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);


  const xScale = d3.scaleBand()
    .domain(data.map(d => d.technology))
    .range([0, innerWidth])
    .padding(0.3);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.energy)])
    .range([innerHeight, 0]);

  const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d.technology))
    .range(d3.schemeCategory10);

  d3.select(selector).insert('h3', ':first-child')
    .style('text-align', 'center')
    .text('Mean Energy Consumption by Screen Technology');

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

  svg.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.technology))
    .attr('y', d => yScale(d.energy))
    .attr('width', xScale.bandwidth())
    .attr('height', d => innerHeight - yScale(d.energy))
    .attr('fill', d => colorScale(d.technology))
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`${d.technology}<br/>Energy: ${d.energy.toFixed(2)} kW`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      tooltip.style('opacity', 0);
    });

  svg.selectAll('.bar-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', d => xScale(d.technology) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.energy) - 5)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('fill', '#333')
    .text(d => d.energy.toFixed(2));

  svg.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .attr('font-size', '12px');

  svg.append('g')
    .call(d3.axisLeft(yScale));

  svg.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + 72)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .text('Screen Technology');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .text('Mean Energy (kW)');
}
