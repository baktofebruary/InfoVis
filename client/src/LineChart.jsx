export default function LineChart({ pcaData, country, variable }) {
  const series = country && variable
    ? pcaData?.country_series?.[country]?.[variable] || []
    : []

  if (!country) {
    return <div className="future-chart-panel">Click a country</div>
  }

  return (
    <div className="future-chart-panel">
      <div>{country}</div>
      <div>{variable}</div>
      <div>{series.length} points</div>
    </div>
  )
}
