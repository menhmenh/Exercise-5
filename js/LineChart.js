async function drawLineChart(selector, csvPath) {

  const rawData = await d3.csv(csvPath, d => ({
    size: +d['Screen_Size_Extracted'],
    energy: +d['Avg_mode_power']
  }));

  // Bin sizes into 10-inch groups → smooths noise while keeping full range
  const validRaw = rawData.filter(d => d.size > 0 && d.energy > 0);
  const [sizeMin, sizeMax] = d3.extent(validRaw, d => d.size);
  const BIN = 10;
  const thresholds = d3.range(
    Math.floor(sizeMin / BIN) * BIN,
    Math.ceil(sizeMax / BIN) * BIN + BIN,
    BIN
  );

  const bins = d3.bin()
    .value(d => d.size)
    .thresholds(thresholds)(validRaw);

  const data = bins
    .filter(bin => bin.length >= 3)          // skip sparse / empty bins
    .map(bin => ({
      size:   (bin.x0 + bin.x1) / 2,        // bin midpoint
      energy: d3.mean(bin, d => d.energy),
      count:  bin.length
    }))
    .sort((a, b) => a.size - b.size);

  const width = 1100;
  const height = 380;
  const margin = { top: 40, right: 40, bottom: 50, left: 65 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.select(selector)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.size))
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.energy)])
    .range([innerHeight, 0]);

  d3.select(selector).insert('h3', ':first-child')
    .style('text-align', 'center')
    .text('Mean Energy Consumption by Screen Size');

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

  const line = d3.line()
    .x(d => xScale(d.size))
    .y(d => yScale(d.energy))
    .curve(d3.curveMonotoneX);

  const area = d3.area()
    .x(d => xScale(d.size))
    .y0(innerHeight)
    .y1(d => yScale(d.energy))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(data)
    .attr('fill', '#e8f4f8')
    .attr('d', area);

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#1f77b4')
    .attr('stroke-width', 2.5)
    .attr('d', line);

  // Invisible hit-target circles — no visible dot, tooltip still works
  svg.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.size))
    .attr('cy', d => yScale(d.energy))
    .attr('r', 6)
    .attr('fill', 'transparent')
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`Size range: ${d.size - BIN/2}"–${d.size + BIN/2}"<br/>Mean Energy: ${d.energy.toFixed(1)} W<br/>TVs in group: ${d.count}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      tooltip.style('opacity', 0);
    });

  svg.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale));

  svg.append('g')
    .call(d3.axisLeft(yScale));

  svg.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .text('Screen Size (inch)');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .text('Mean Energy (W)');
}
