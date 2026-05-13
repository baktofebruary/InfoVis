import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo';
import { select } from 'd3';
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
    const countriesRef = useRef(null);
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

   
    const isHighlighted = useCallback((feature) => {
        const countryName = feature?.properties?.name;

        const isHoveredFromPca =
            normalizeCountry(countryName) === normalizeCountry(pcaHoveredCountry);

        const isHoveredOnMap =
            feature === hoveredCountry;

        const isBrushed =
            brushedCountrySet?.has(normalizeCountry(countryName));

        return isHoveredFromPca || isHoveredOnMap || isBrushed;
    }, [pcaHoveredCountry, hoveredCountry, brushedCountrySet]);

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

    useEffect(() => {
        if (!countriesRef.current || !pathGen) return;

        const countryLayer = select(countriesRef.current);

        const countries = countryLayer
            .selectAll('path.flat-country')
            .data(
                visibleCountries,
                (feature) => feature?.properties?.name || ''
            )
            .join(
                (enter) => {
                    const paths = enter
                        .append('path')
                        .attr('class', 'flat-country')
                        .attr('vector-effect', 'non-scaling-stroke');

                    paths.append('title');
                    return paths;
                },
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('d', (feature) => pathGen(feature) || '')
            .attr('fill', (feature) => {
                const isActive = isHighlighted(feature);
                const value = getCountryMetric(
                    pcaData,
                    feature?.properties?.name,
                    selectedVariable,
                    selectedYear
                );

                return isActive
                    ? 'rgba(255, 72, 72, 0.68)'
                    : getCountryColorValue(value, selectedVariableData);
            })
            .attr('stroke', (feature) =>
                isHighlighted(feature)
                    ? 'rgba(0, 0, 0, 0.85)'
                    : 'rgba(0, 0, 0, 0.62)'
            )
            .attr('stroke-width', (feature) => isHighlighted(feature) ? 2.15 : 0.9)
            .on('click', (_, feature) => {
                onCountryClick?.(feature?.properties?.name || null);
            })
            .on('mousemove', (event, feature) => {
                const name = feature?.properties?.name || null;
                setHoveredCountry(feature);
                onCountryHover?.(name);

                setTooltip({
                    x: event.clientX,
                    y: event.clientY,
                    country: name,
                });
            })
            .on('mouseleave', () => {
                setHoveredCountry(null);
                onCountryHover?.(null);
                setTooltip(null);
            });

        countries
            .select('title')
            .text((feature) => feature?.properties?.name || 'Country');
    }, [
        visibleCountries,
        pathGen,
        pcaData,
        selectedVariable,
        selectedYear,
        selectedVariableData,
        isHighlighted,
        onCountryClick,
        onCountryHover,
    ]);

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

                <g ref={countriesRef} />
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
