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

  const [pcaHoveredCountry, setPcaHoveredCountry] = useState(null)
  const [mapHoveredCountry, setMapHoveredCountry] = useState(null)

  return (
    <div className="app-fullscreen">
      {/* <div className="view-menu">
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
      </div> */}

      <div className="map-pane">
        <FlatMap
          countryFeatures={countryFeatures}
          pcaCountrySet={pcaCountrySet}
          pcaHoveredCountry={pcaHoveredCountry}
          onCountryHover={setMapHoveredCountry}
        />
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
