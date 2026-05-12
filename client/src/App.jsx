import { useState } from 'react'
import FlatMap from './FlatMap'
import PCAWindow from './PCAWindow'
import { useProjectData } from './lib/useProjectData'
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

  const variables = pcaData?.variables || []
  const activeVariable = selectedVariable || variables[0]?.key || ''
  const activeVariableData = variables.find((variable) =>
     variable.key === activeVariable) || null

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
        />

        <div className="future-chart-panel">
          Future chart
        </div>
      </aside>
    </div>
  )
}

export default App
