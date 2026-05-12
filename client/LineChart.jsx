import { scaleLinear, extent, max, line } from 'd3';

export default function LineChart(
    { pcaData, country, variable }) {

  const series = country && variable
    ? pcaData?.country_series?.[country]?.[variable] || []
    : []

  if (!country) {
    return <div className="future-chart-panel">Click on a country</div>
  }
  
  if (!series.length) {
    return <div className="future-chart-panel">No data</div>;
  }
//   const x = scaleLinear()
//     .domain([1960, 2020])
//     .range([leftEdge, rightEdge])

//   const yScale = scaleLinear()
//     .domain([0, maxValue])
//     .range([bottomEdge, topEdge])

//     const linePath = line()
//     .x((d) => x(d.year))
//     .y((d) => yScale(d.value))(series)

  console.log(series);
   return (
    <div className="future-chart-panel">
      Chart for {country}
    </div>
  )
}
