async function drawPieChart(selector, csvPath) {

  const data = await d3.csv(csvPath, d => ({
    category: d['Screen_Size_Category'],
    value: +d['Mean(Avg_mode_power)']
  }));

  const width = 500;
  const height = 420;
  const radius = 118;
  const innerRadius = radius * 0.55;
  const cx = width / 2;   // centred horizontally
  const cy = 178;          // upper portion; legend sits below

  d3.select(selector).insert('h3', ':first-child')
    .style('text-align', 'center')
    .text('Distribution of Screen Sizes');

  const svg = d3.select(selector)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%');

  const g = svg.append('g')
    .attr('transform', `translate(${cx},${cy})`);

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

  const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d.category))
    .range(d3.schemeSet2);

  const pie = d3.pie()
    .value(d => d.value)
    .sort(null);

  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(radius);

  const arcHover = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(radius + 8);

  // Arc used purely for polyline anchor points (just outside outer edge)
  const outerArc = d3.arc()
    .innerRadius(radius * 1.08)
    .outerRadius(radius * 1.08);

  const total = d3.sum(data, d => d.value);
  const arcs = pie(data);

  function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }

  g.selectAll('.slice')
    .data(arcs)
    .enter()
    .append('path')
    .attr('class', 'slice')
    .attr('d', arc)
    .attr('fill', d => colorScale(d.data.category))
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .attr('opacity', 0.85)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('d', arcHover);
      const pct = (d.data.value / total * 100).toFixed(1);
      tooltip.style('opacity', 1)
        .html(`<strong>${d.data.category}</strong><br/>Mean Energy: ${d.data.value.toFixed(2)} W<br/>Share: ${pct}%`)
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 12) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).attr('d', arc);
      tooltip.style('opacity', 0);
    });

  // Only label slices >= 4% to avoid clutter
  const labelledArcs = arcs.filter(d => (d.data.value / total * 100) >= 4);

  // Polyline: inner centroid → outer arc midpoint → horizontal end point
  g.selectAll('.polyline')
    .data(labelledArcs)
    .enter()
    .append('polyline')
    .attr('fill', 'none')
    .attr('stroke', '#aaa')
    .attr('stroke-width', 1)
    .attr('opacity', 0.8)
    .attr('points', d => {
      const inner = arc.centroid(d);
      const outer = outerArc.centroid(d);
      const isRight = midAngle(d) < Math.PI;
      const labelX = (isRight ? 1 : -1) * radius * 1.38;
      return [inner, outer, [labelX, outer[1]]].map(p => p.join(',')).join(' ');
    });

  // External percentage labels with a small gap after the polyline end
  g.selectAll('.outside-label')
    .data(labelledArcs)
    .enter()
    .append('text')
    .attr('class', 'outside-label')
    .attr('transform', d => {
      const isRight = midAngle(d) < Math.PI;
      const outer = outerArc.centroid(d);
      const labelX = (isRight ? 1 : -1) * radius * 1.38;
      return `translate(${labelX + (isRight ? 4 : -4)}, ${outer[1]})`;
    })
    .attr('text-anchor', d => midAngle(d) < Math.PI ? 'start' : 'end')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '11px')
    .attr('fill', '#333')
    .text(d => `${(d.data.value / total * 100).toFixed(1)}%`);

  // Two-column horizontal legend centred below the donut
  const legendRowH = 20;
  const cols = 2;
  const itemsPerCol = Math.ceil(data.length / cols);
  const colWidth = 110;
  const legendLeft = (width - colWidth * cols) / 2;
  const legendTop = cy + radius + 28;

  const legendG = svg.append('g')
    .attr('transform', `translate(${legendLeft}, ${legendTop})`);

  legendG.selectAll('.legend-rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', (d, i) => Math.floor(i / itemsPerCol) * colWidth)
    .attr('y', (d, i) => (i % itemsPerCol) * legendRowH)
    .attr('width', 12)
    .attr('height', 12)
    .attr('rx', 2)
    .attr('fill', d => colorScale(d.category));

  legendG.selectAll('.legend-label')
    .data(data)
    .enter()
    .append('text')
    .attr('x', (d, i) => Math.floor(i / itemsPerCol) * colWidth + 17)
    .attr('y', (d, i) => (i % itemsPerCol) * legendRowH + 10)
    .attr('font-size', '11px')
    .attr('fill', '#444')
    .text(d => d.category);
}
