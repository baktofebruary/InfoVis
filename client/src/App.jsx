import { useCallback, useMemo, useState } from 'react'
import FlatMap from './FlatMap'
import PCAWindow from './PCAWindow'
import LineChart from './LineChart'
import { useProjectData } from './lib/useProjectData'
import { normalizeCountry } from './lib/country'
import './App.css'

function App() {
  const {
    countryFeatures,
    pcaData,
    pcaCountrySet,
    isLoadingData,
    loadError,
  } = useProjectData()

  const [selectedVariable, setSelectedVariable] = useState('')
  const [pcaHoveredCountry, setPcaHoveredCountry] = useState(null)
  const [mapHoveredCountry, setMapHoveredCountry] = useState(null)
  const [clickedCountry, setClickedCountry] = useState(null)
  const [brushedCountries, setBrushedCountries] = useState([])
  const [selectedYear, setSelectedYear] = useState('')

  const years = useMemo(() => pcaData?.years || [], [pcaData])
  const variables = pcaData?.variables || []
  const activeVariable = selectedVariable || variables[0]?.key || ''
  const activeVariableData = variables.find((variable) =>
     variable.key === activeVariable) || null
  const yearMin = years[0] || 0
  const yearMax = years[years.length - 1] || 0
  const defaultYear = pcaData?.year && years.includes(pcaData.year)
    ? pcaData.year
    : yearMax
  const requestedYear = Number(selectedYear)
  const activeYear = years.includes(requestedYear) ? requestedYear : defaultYear
  const brushedCountrySet = useMemo(
    () => new Set(brushedCountries.map(normalizeCountry)),
    [brushedCountries]
  )
  const chartCountries = brushedCountries.length
    ? brushedCountries
    : clickedCountry
      ? [clickedCountry]
      : []

  const handleBrushedCountriesChange = useCallback((countries) => {
    setBrushedCountries(countries)
    setClickedCountry(null)
  }, [])

  const handleCountryClick = useCallback((country) => {
    if (!brushedCountries.length) {
      setClickedCountry(country)
    }
  }, [brushedCountries.length])

  return (
    <div className="app-fullscreen">
      <div className="map-area">
        <div className="variable-menu">
          <div className="variable-select">
            <label htmlFor="variable">
              Indicator
            </label>
              <select
              id="variable"
              value={activeVariable}
              onChange={(event) => setSelectedVariable(event.target.value)}
              disabled={!variables.length}
            >
              {variables.map((variable) => (
                <option key={variable.key} value={variable.key}>
                  {variable.key}
                </option>
              ))}
            </select>
            <div className="year-control">
              <label htmlFor="year">
                Year
              </label>
              <input
                id="year"
                type="range"
                min={yearMin}
                max={yearMax}
                step="1"
                value={activeYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                disabled={!years.length}
              />
              <span className="year-value">{activeYear || '-'}</span>
            </div>
          </div>

          {activeVariableData && (
            <div className="map-legend">
              <div className="map-legend-gradient" />
              <div className="map-legend-values">
                <span>{activeVariableData.min.toFixed(2)}</span>
                <span>{activeVariableData.max.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="map-pane">
          <FlatMap
            countryFeatures={countryFeatures}
            pcaCountrySet={pcaCountrySet}
            pcaHoveredCountry={pcaHoveredCountry}
            onCountryHover={setMapHoveredCountry}
            pcaData = {pcaData}
            selectedVariable={activeVariable}
            selectedYear={activeYear}
            onCountryClick={handleCountryClick}
            brushedCountrySet={brushedCountrySet}
          />
        </div>
      </div>

      {loadError && (
        <div className="app-load-banner" role="status">
          {loadError}
        </div>
      )}

      <aside className="right-panel">
        <PCAWindow
          pcaData={pcaData}
          isLoadingPca={isLoadingData && !pcaData}
          pcaLoadError={loadError}
          onCountryHover={setPcaHoveredCountry}
          mapHoveredCountry={mapHoveredCountry}
          brushedCountrySet={brushedCountrySet}
          onBrushedCountriesChange={handleBrushedCountriesChange}
        />

        <div className="chart-panel">
          <LineChart
            pcaData={pcaData}
            countries={chartCountries}
            variable={activeVariable}
            selectedYear={activeYear}
          />
        </div>
      </aside>
    </div>
  )
}

export default App
