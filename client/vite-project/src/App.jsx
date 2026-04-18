import { useState } from 'react'
import GlobeViz from './globe'
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

  const [pcaHoveredCountry, setPcaHoveredCountry] = useState(null)
  const [globeHoveredCountry, setGlobeHoveredCountry] = useState(null)
  const [viewMode, setViewMode] = useState('globe')
  const [isPcaDockedRight, setIsPcaDockedRight] = useState(false)
  const [autoFocusOnPca, setAutoFocusOnPca] = useState(true)

  return (
    <div className={`app-fullscreen${isPcaDockedRight ? ' has-pca-docked' : ''}`}>
      <div className="view-menu">
        <label htmlFor="view-mode" className="view-menu-label">
          Map View
        </label>
        <select
          id="view-mode"
          className="view-menu-select"
          value={viewMode}
          onChange={(event) => setViewMode(event.target.value)}
        >
          <option value="globe">Globe</option>
          <option value="flat">Paper Map</option>
        </select>
      </div>

      <div className="map-pane">
        {viewMode === 'globe' ? (
          <GlobeViz
            countryFeatures={countryFeatures}
            pcaCountrySet={pcaCountrySet}
            pcaHoveredCountry={pcaHoveredCountry}
            onCountryHover={setGlobeHoveredCountry}
            autoFocusOnPca={autoFocusOnPca}
            onAutoFocusOnPcaChange={setAutoFocusOnPca}
          />
        ) : (
          <FlatMap
            countryFeatures={countryFeatures}
            pcaCountrySet={pcaCountrySet}
            pcaHoveredCountry={pcaHoveredCountry}
            onCountryHover={setGlobeHoveredCountry}
            autoFocusOnPca={autoFocusOnPca}
            onAutoFocusOnPcaChange={setAutoFocusOnPca}
          />
        )}
      </div>

      {loadError && (
        <div className="app-load-banner" role="status">
          {loadError}
        </div>
      )}

      <PCAWindow
        pcaData={pcaData}
        isLoadingPca={isLoadingData && !pcaData}
        pcaLoadError={loadError}
        onCountryHover={setPcaHoveredCountry}
        globeHoveredCountry={globeHoveredCountry}
        onDockedRightChange={setIsPcaDockedRight}
      />
    </div>
  )
}

export default App
