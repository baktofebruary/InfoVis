import { scaleLinear, max, line, format } from 'd3';

const width = 700;
const height = 400;
const margin = {top: 20, right: 20, bottom: 30, left: 60};
export default function LineChart(
    { pcaData, country, variable }) {
    
    const series = country && variable
    ? (pcaData?.country_series?.[country]?.[variable] || [])
      .filter((d) => d.value !== null && d.value !== undefined)
    : [];
  
    if (!country) {
        return <div className="future-chart-panel">Click on a country</div>
    }
  
    if (!series.length) {
        return <div className="future-chart-panel">No data</div>;
    }
   
    const rightEdge = width - margin.right;
    const bottomEdge = height - margin.bottom;
    const maxValue = max(series, (d) => d.value) || 0;

    const x = scaleLinear()
    .domain([1960, 2020])
    .range([margin.left, rightEdge]);
    
    const y = scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([bottomEdge, margin.top]);

    const yTicks = [...y.ticks(5), maxValue];
    const xTicks = x.ticks(5);
    const formatValue = format(".2s");

    const linePath = line()
        .x((d) => x(d.year))
        .y((d) => y(d.value))(series);

  return (
    <div className="line-chart-panel">
      <h3 className="line-chart-title">{country}</h3>
      <div className="line-chart-subtitle">{variable}</div>

      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`}>
        <line
            x1={margin.left}
            y1={bottomEdge}
            x2={rightEdge}
            y2={bottomEdge}
            className="line-chart-axis"
        />

        <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={bottomEdge}
            className="line-chart-axis"
        />

        {xTicks.map((year) => (
        <line
            key={`x-tick-${year}`}
            x1={x(year)}
            y1={bottomEdge}
            x2={x(year)}
            y2={bottomEdge + 5}
            className="line-chart-axis"
        />
        ))}

        {xTicks.map((year) => (
        <text
            key={`x-label-${year}`}
            x={x(year)}
            y={height - 8}
            textAnchor="middle"
            className="line-chart-tick"
        >
            {year.toFixed(0)}
        </text>
        ))}

        {yTicks.map((value) => (
        <line
            key={`y-tick-${value}`}
            x1={margin.left - 5}
            y1={y(value)}
            x2={margin.left}
            y2={y(value)}
            className="line-chart-axis"
        />
        ))}

        {yTicks.map((value) => (
        <text
            key={`y-label-${value}`}
            x={margin.left - 8}
            y={y(value) + 4}
            textAnchor="end"
            className="line-chart-tick"
        >
            {formatValue(value)}
        </text>
        ))}

        {series.filter((d) => d.year % 5 === 0).map((d) => (
        <circle
            key={`point-${d.year}`}
            cx={x(d.year)}
            cy={y(d.value)}
            r="3"
            className="line-chart-point"
        />
        ))}

        <path
            className="line-chart-line"
            d={linePath}
        />
      </svg>
    </div>
  );
}
