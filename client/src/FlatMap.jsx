import { useEffect, useMemo, useRef, useState } from 'react';
import { geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo';
import { filterCountriesForPca, normalizeCountry } from './lib/country';
import {getCountryMetric, getVariableData, getCountryColorValue,} from './lib/mapColor';

const EARTH_TEXTURE_URL = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg';

export default function FlatMap({
    countryFeatures,
    pcaCountrySet,
    pcaHoveredCountry,
    onCountryHover,
    pcaData,
    selectedVariable,
    selectedYear,
    onCountryClick,
    brushedCountrySet
}) {

    const containerRef = useRef(null);
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [tooltip, setTooltip] = useState(null);

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

    const visibleCountries = useMemo(
        () => filterCountriesForPca(countryFeatures, pcaCountrySet),
        [countryFeatures, pcaCountrySet]
    );

    const selectedVariableData = useMemo(() => 
        getVariableData(pcaData, selectedVariable),
        [pcaData, selectedVariable]);

   
    const isHighlighted = (feature) => {
        const countryName = feature?.properties?.name;

        const isHoveredFromPca =
            normalizeCountry(countryName) === normalizeCountry(pcaHoveredCountry);

        const isHoveredOnMap =
            feature === hoveredCountry;

        const isBrushed =
            brushedCountrySet?.has(normalizeCountry(countryName));

        return isHoveredFromPca || isHoveredOnMap || isBrushed;
    };

    const projection = useMemo(() => {
        if (!size.width || !size.height) return null;

        return geoEquirectangular().fitSize(
            [size.width, size.height],
            { type: 'Sphere' }
        );
    }, [size]);

    const pathGen = useMemo(() => {
        if (!projection) return null;
        return geoPath(projection);
    }, [projection]);

    const tooltipYear = selectedYear || pcaData?.year || 2020;
    const tooltipVariables = [...(pcaData?.variables || [])]
        .sort((a, b) => a.key.length - b.key.length)
        .slice(0, 8);
    const tooltipValues = tooltip
        ? pcaData?.country_values_by_year?.[tooltipYear]?.[tooltip.country] ||
            pcaData?.country_values?.[tooltip.country] ||
            {}
        : {};
    
    return (
        <div ref={containerRef} className="flat-map-stage">
            {size.width > 0 && size.height > 0 && pathGen && (
                <svg
                    className="flat-map-svg"
                    width={size.width}
                    height={size.height}
                    viewBox={`0 0 ${size.width} ${size.height}`}
                >
                                    
                <image
                    href={EARTH_TEXTURE_URL}
                    x={0}
                    y={0}
                    width={size.width}
                    height={size.height}
                    preserveAspectRatio="xMidYMid meet"
                />

                <path
                    d={pathGen({ type: 'Sphere' }) || ''}
                    className="flat-ocean"
                    vectorEffect="non-scaling-stroke"
                />

                <path
                    d={pathGen(geoGraticule10()) || ''}
                    className="flat-graticule"
                    vectorEffect="non-scaling-stroke"
                />

                        {visibleCountries.map((feature) => {
                            const isActive = isHighlighted(feature);
                             const value = getCountryMetric(
                                pcaData,
                                feature?.properties?.name,
                                selectedVariable,
                                selectedYear
                            );
                            
                            return (
                                <path
                                    key={feature.properties?.name}
                                    d={pathGen(feature) || ''}
                                    className="flat-country"
                                    vectorEffect="non-scaling-stroke"
                                    fill={
                                        isActive
                                            ? 'rgba(255, 72, 72, 0.68)'
                                            : getCountryColorValue(value, selectedVariableData)
                                    }
                                    stroke={
                                        isActive
                                            ? 'rgba(0, 0, 0, 0.85)'
                                            : 'rgba(0, 0, 0, 0.62)'
                                    }
                                    strokeWidth={isActive ? 2.15 : 0.9}
                                    onClick={() => {
                                        onCountryClick?.(feature?.properties?.name || null);
                                    }}
                                    onMouseMove={(event) => {
                                        const name = feature?.properties?.name || null;
                                        setHoveredCountry(feature);
                                        onCountryHover?.(name);

                                        setTooltip({
                                        x: event.clientX,
                                        y: event.clientY,
                                        country: name,
                                        });
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredCountry(null);
                                        onCountryHover?.(null);
                                        setTooltip(null);
                                    }}
                                >
                                    <title>{feature?.properties?.name || 'Country'}</title>
                                </path>
                            );
                        })}
                </svg>
            
            )}
            {tooltip && (
                <div
                    className="map-tooltip"
                    style={{
                    left: tooltip.x + 15,
                    top: tooltip.y + 15,
                    }}
                >
                    <strong>{tooltip.country}</strong>
                    <div className="map-tooltip-year">
                        Year: {tooltipYear}
                    </div>
                    {tooltipVariables.map((variable) => (
                        <div key={variable.key} className="map-tooltip-row">
                            <span>{variable.key}</span>
                            <span>
                            {tooltipValues[variable.key] !== undefined
                                ? tooltipValues[variable.key].toFixed(2)
                                : 'no data'}
                            </span>
                        </div>
                    ))}
                </div>
                )}

        </div>
    );
}
