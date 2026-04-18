import { useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import MapControls from './MapControls';
import {
    filterCountriesForPca,
    getFeatureCenter,
    normalizeCountry,
} from './lib/country';

const DEFAULT_ALTITUDE = 2.2;
const PCA_HOVER_ALTITUDE = 1.08;
const MIN_ALTITUDE = 0.8;
const MAX_ALTITUDE = 4;

const clampAltitude = (altitude) =>
    Math.max(MIN_ALTITUDE, Math.min(MAX_ALTITUDE, altitude));

export default function GlobeViz({
    countryFeatures,
    pcaCountrySet,
    pcaHoveredCountry,
    onCountryHover,
    autoFocusOnPca,
    onAutoFocusOnPcaChange,
}) {
    const containerRef = useRef(null);
    const globeRef = useRef(null);
    const lastFocusedRef = useRef('');
    const [hoveredFeature, setHoveredFeature] = useState(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    const readCurrentPointOfView = () => {
        const current = globeRef.current?.pointOfView?.() || {};

        return {
            lat: typeof current.lat === 'number' ? current.lat : 0,
            lng: typeof current.lng === 'number' ? current.lng : 0,
            altitude:
                typeof current.altitude === 'number'
                    ? current.altitude
                    : DEFAULT_ALTITUDE,
        };
    };

    const zoomGlobe = (targetAltitude) => {
        if (!globeRef.current) return;

        const current = readCurrentPointOfView();
        const nextAltitude = clampAltitude(targetAltitude);

        if (Math.abs(nextAltitude - current.altitude) < 0.0001) return;

        globeRef.current.pointOfView(
            {
                lat: current.lat,
                lng: current.lng,
                altitude: nextAltitude,
            },
            600
        );
    };

    const handleGlobeZoomIn = () => {
        const current = readCurrentPointOfView();
        zoomGlobe(current.altitude * 0.8);
    };

    const handleGlobeZoomOut = () => {
        const current = readCurrentPointOfView();
        zoomGlobe(current.altitude * 1.25);
    };

    const handleGlobeZoomReset = () => {
        zoomGlobe(DEFAULT_ALTITUDE);
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(([entry]) => {
            setSize({
                width: Math.floor(entry.contentRect.width),
                height: Math.floor(entry.contentRect.height),
            });
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    const hoveredPcaName = normalizeCountry(pcaHoveredCountry);
    const hasPcaHover = Boolean(hoveredPcaName);

    useEffect(() => {
        if (hasPcaHover) {
            setHoveredFeature(null);
        }
    }, [hasPcaHover]);

    const isPcaHoveredPolygon = (feature) => {
        if (!hoveredPcaName) return false;

        return normalizeCountry(feature?.properties?.name) === hoveredPcaName;
    };

    const visibleCountries = useMemo(
        () => filterCountriesForPca(countryFeatures, pcaCountrySet),
        [countryFeatures, pcaCountrySet]
    );

    const activePcaFeature = useMemo(() => {
        if (!hasPcaHover) return null;
        return visibleCountries.find((d) => isPcaHoveredPolygon(d)) || null;
    }, [hasPcaHover, visibleCountries, hoveredPcaName]);

    useEffect(() => {
        if (!autoFocusOnPca) {
            lastFocusedRef.current = '';
            return;
        }

        if (!hasPcaHover) {
            lastFocusedRef.current = '';
            return;
        }

        if (!globeRef.current || !activePcaFeature) return;

        const countryKey = activePcaFeature.properties?.name;
        if (countryKey === lastFocusedRef.current) return;

        const center = getFeatureCenter(activePcaFeature);
        if (!center) return;

        lastFocusedRef.current = countryKey;
        globeRef.current.pointOfView(
            { lat: center.lat, lng: center.lng, altitude: PCA_HOVER_ALTITUDE },
            700
        );
    }, [activePcaFeature, hasPcaHover, autoFocusOnPca]);

    return (
        <div ref={containerRef} className="globe-stage">
            <MapControls
                onZoomIn={handleGlobeZoomIn}
                onZoomOut={handleGlobeZoomOut}
                onZoomReset={handleGlobeZoomReset}
                autoFocusOnPca={autoFocusOnPca}
                onAutoFocusOnPcaChange={onAutoFocusOnPcaChange}
            />
            {size.width > 0 && size.height > 0 && (
                <Globe
                    ref={globeRef}
                    globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
                    backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
                    lineHoverPrecision={0}
                    polygonsData={visibleCountries}
                    polygonAltitude={(feature) =>
                        (hasPcaHover
                            ? isPcaHoveredPolygon(feature)
                            : feature === hoveredFeature)
                            ? 0.028
                            : 0.004
                    }
                    polygonCapColor={(feature) =>
                        (hasPcaHover
                            ? isPcaHoveredPolygon(feature)
                            : feature === hoveredFeature)
                            ? 'rgba(255, 72, 72, 0.68)'
                            : 'rgba(255, 255, 255, 0.30)'
                    }
                    polygonSideColor={(feature) =>
                        (hasPcaHover
                            ? isPcaHoveredPolygon(feature)
                            : feature === hoveredFeature)
                            ? 'rgba(255, 72, 72, 0.16)'
                            : 'rgba(255, 255, 255, 0.08)'
                    }
                    polygonStrokeColor={(feature) =>
                        (hasPcaHover
                            ? isPcaHoveredPolygon(feature)
                            : feature === hoveredFeature)
                            ? 'rgba(23, 28, 38, 0.85)'
                            : 'rgba(23, 28, 38, 0.62)'
                    }
                    polygonLabel={({ properties: d }) => `
                        <div><b>${d.name}</b></div>
                    `}
                    onPolygonHover={(feature) => {
                        setHoveredFeature(feature || null);
                        onCountryHover?.(feature ? feature.properties?.name : null);
                    }}
                    polygonsTransitionDuration={300}
                    width={size.width}
                    height={size.height}
                />
            )}
        </div>
    );
}