import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo';
import MapControls from './MapControls';
import { filterCountriesForPca, normalizeCountry } from './lib/country';

const IMAGE_ASPECT = 2;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const EARTH_TEXTURE_URL =
    'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function FlatMap({
    countryFeatures,
    pcaCountrySet,
    pcaHoveredCountry,
    onCountryHover,
    autoFocusOnPca,
    onAutoFocusOnPcaChange,
}) {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const dragRef = useRef(null);
    const focusAnimationRef = useRef(null);
    const viewTransformRef = useRef({ k: 1, x: 0, y: 0 });
    const [hoverD, setHoverD] = useState(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [viewTransform, setViewTransform] = useState({ k: 1, x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

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

    const hoveredGeoName = pcaHoveredCountry;
    const hasPcaHover = Boolean(pcaHoveredCountry);

    useEffect(() => {
        viewTransformRef.current = viewTransform;
    }, [viewTransform]);

    useEffect(
        () => () => {
            if (focusAnimationRef.current) {
                window.cancelAnimationFrame(focusAnimationRef.current);
            }
        },
        []
    );

    useEffect(() => {
        if (hasPcaHover) {
            setHoverD(null);
        }
    }, [hasPcaHover]);

    const visibleCountries = useMemo(
        () => filterCountriesForPca(countryFeatures, pcaCountrySet),
        [countryFeatures, pcaCountrySet]
    );

    const isPcaHoveredPolygon = useCallback(
        (feature) =>
            normalizeCountry(feature?.properties?.name) ===
            normalizeCountry(hoveredGeoName),
        [hoveredGeoName]
    );

    const mapRect = useMemo(() => {
        if (!size.width || !size.height) return null;

        const containerAspect = size.width / size.height;

        if (containerAspect >= IMAGE_ASPECT) {
            const drawHeight = size.height;
            const drawWidth = drawHeight * IMAGE_ASPECT;
            const x = (size.width - drawWidth) / 2;
            return { x, y: 0, width: drawWidth, height: drawHeight };
        }

        const drawWidth = size.width;
        const drawHeight = drawWidth / IMAGE_ASPECT;
        const y = (size.height - drawHeight) / 2;
        return { x: 0, y, width: drawWidth, height: drawHeight };
    }, [size]);

    const clampTransform = useCallback((nextTransform) => {
        if (!mapRect) return { k: 1, x: 0, y: 0 };

        const k = clamp(nextTransform.k, MIN_ZOOM, MAX_ZOOM);
        const maxX = Math.max(0, ((mapRect.width * k) - mapRect.width) / 2);
        const maxY = Math.max(0, ((mapRect.height * k) - mapRect.height) / 2);

        return {
            k,
            x: Math.min(Math.max(nextTransform.x, -maxX), maxX),
            y: Math.min(Math.max(nextTransform.y, -maxY), maxY),
        };
    }, [mapRect]);

    useEffect(() => {
        setViewTransform((current) => clampTransform(current));
    }, [clampTransform]);

    const zoomAroundCenter = useCallback((scaleFactor) => {
        if (!mapRect) return;

        setViewTransform((current) => {
            const clampedK = clamp(current.k * scaleFactor, MIN_ZOOM, MAX_ZOOM);
            if (Math.abs(clampedK - current.k) < 0.0001) {
                return current;
            }

            const ratio = clampedK / current.k;

            return clampTransform({
                k: clampedK,
                x: current.x * ratio,
                y: current.y * ratio,
            });
        });
    }, [clampTransform, mapRect]);

    const handleZoomIn = () => zoomAroundCenter(1.2);

    const handleZoomOut = () => zoomAroundCenter(1 / 1.2);

    const handleZoomReset = useCallback(() => {
        setViewTransform({ k: 1, x: 0, y: 0 });
    }, []);

    const handleWheel = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!mapRect || !svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        const centerX = mapRect.x + mapRect.width / 2;
        const centerY = mapRect.y + mapRect.height / 2;

        const delta =
            event.deltaMode === 1
                ? event.deltaY * 16
                : Math.abs(event.deltaY) < 12
                    ? event.deltaY * 24
                    : event.deltaY;
        const zoomFactor = Math.exp(-delta * 0.0025);

        setViewTransform((current) => {
            const clampedK = clamp(current.k * zoomFactor, MIN_ZOOM, MAX_ZOOM);

            if (Math.abs(clampedK - current.k) < 0.0001) {
                return current;
            }

            const localX = pointerX - centerX - current.x;
            const localY = pointerY - centerY - current.y;
            const ratio = clampedK / current.k;

            return clampTransform({
                k: clampedK,
                x: pointerX - centerX - localX * ratio,
                y: pointerY - centerY - localY * ratio,
            });
        });
    }, [mapRect, clampTransform]);

    const handleMouseDown = useCallback((event) => {
        if (!mapRect || event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();

        dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            initialX: viewTransform.x,
            initialY: viewTransform.y,
        };

        setIsDragging(true);

        const onMove = (moveEvent) => {
            if (!dragRef.current) return;

            const nextX =
                dragRef.current.initialX +
                (moveEvent.clientX - dragRef.current.startX);
            const nextY =
                dragRef.current.initialY +
                (moveEvent.clientY - dragRef.current.startY);

            setViewTransform((current) =>
                clampTransform({ ...current, x: nextX, y: nextY })
            );
        };

        const onUp = () => {
            setIsDragging(false);
            dragRef.current = null;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [mapRect, viewTransform.x, viewTransform.y, clampTransform]);

    const projection = useMemo(() => {
        if (!mapRect) return null;

        const proj = geoEquirectangular();
        proj.fitExtent(
            [
                [mapRect.x, mapRect.y],
                [mapRect.x + mapRect.width, mapRect.y + mapRect.height],
            ],
            { type: 'Sphere' }
        );

        return proj;
    }, [mapRect]);

    const pathGen = useMemo(() => {
        if (!projection) return null;
        return geoPath(projection);
    }, [projection]);

    const mapLayerStyle = {
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'none',
        willChange: 'transform',
    };

    useEffect(() => {
        if (focusAnimationRef.current) {
            window.cancelAnimationFrame(focusAnimationRef.current);
            focusAnimationRef.current = null;
        }

        if (!autoFocusOnPca) return;

        if (!hoveredGeoName || !mapRect || !pathGen) return;

        const hoveredFeature =
            visibleCountries.find((feature) => isPcaHoveredPolygon(feature)) || null;

        if (!hoveredFeature) return;

        const [[x0, y0], [x1, y1]] = pathGen.bounds(hoveredFeature);
        const boundsWidth = Math.max(1, x1 - x0);
        const boundsHeight = Math.max(1, y1 - y0);
        const padding = Math.min(mapRect.width, mapRect.height) * 0.12;
        const availableWidth = Math.max(1, mapRect.width - padding * 2);
        const availableHeight = Math.max(1, mapRect.height - padding * 2);
        const nextK = Math.min(
            MAX_ZOOM,
            Math.max(
                MIN_ZOOM,
                Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight)
            )
        ) * 0.52;

        const featureCenterX = (x0 + x1) / 2;
        const featureCenterY = (y0 + y1) / 2;
        const mapCenterX = mapRect.x + mapRect.width / 2;
        const mapCenterY = mapRect.y + mapRect.height / 2;
        const offsetX = featureCenterX - mapCenterX;
        const offsetY = featureCenterY - mapCenterY;

        const targetTransform = clampTransform({
            k: nextK,
            x: (1 - nextK) * offsetX,
            y: (1 - nextK) * offsetY,
        });

        const startTransform = viewTransformRef.current;
        const duration = 360;
        const startTime = window.performance.now();

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animate = (now) => {
            const progress = Math.min(1, (now - startTime) / duration);
            const eased = easeOutCubic(progress);

            setViewTransform(
                clampTransform({
                    k: startTransform.k + (targetTransform.k - startTransform.k) * eased,
                    x: startTransform.x + (targetTransform.x - startTransform.x) * eased,
                    y: startTransform.y + (targetTransform.y - startTransform.y) * eased,
                })
            );

            if (progress < 1) {
                focusAnimationRef.current = window.requestAnimationFrame(animate);
            } else {
                focusAnimationRef.current = null;
            }
        };

        focusAnimationRef.current = window.requestAnimationFrame(animate);
    }, [
        hoveredGeoName,
        mapRect,
        pathGen,
        visibleCountries,
        autoFocusOnPca,
        clampTransform,
        isPcaHoveredPolygon,
    ]);

    useEffect(() => {
        const node = svgRef.current;
        if (!node) return;

        node.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            node.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    return (
        <div ref={containerRef} className="flat-map-stage">
            <MapControls
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
                autoFocusOnPca={autoFocusOnPca}
                onAutoFocusOnPcaChange={onAutoFocusOnPcaChange}
            />
            {size.width > 0 && size.height > 0 && pathGen && (
                <svg
                    ref={svgRef}
                    className="flat-map-svg"
                    width={size.width}
                    height={size.height}
                    viewBox={`0 0 ${size.width} ${size.height}`}
                    onMouseDown={handleMouseDown}
                    style={mapLayerStyle}
                >
                    <defs>
                        <clipPath id="flat-map-clip">
                            <rect
                                x={mapRect.x}
                                y={mapRect.y}
                                width={mapRect.width}
                                height={mapRect.height}
                            />
                        </clipPath>
                    </defs>
                    <g
                        transform={`translate(${mapRect.x + mapRect.width / 2 + viewTransform.x} ${mapRect.y + mapRect.height / 2 + viewTransform.y}) scale(${viewTransform.k} ${viewTransform.k}) translate(${-mapRect.x - mapRect.width / 2} ${-mapRect.y - mapRect.height / 2})`}
                        clipPath="url(#flat-map-clip)"
                    >
                        <image
                            href={EARTH_TEXTURE_URL}
                            x={mapRect.x}
                            y={mapRect.y}
                            width={mapRect.width}
                            height={mapRect.height}
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
                            const isActive = hasPcaHover
                                ? isPcaHoveredPolygon(feature)
                                : feature === hoverD;

                            return (
                                <path
                                    key={feature.properties?.name || Math.random()}
                                    d={pathGen(feature) || ''}
                                    className="flat-country"
                                    vectorEffect="non-scaling-stroke"
                                    fill={
                                        isActive
                                            ? 'rgba(255, 72, 72, 0.68)'
                                            : 'rgba(255, 255, 255, 0.30)'
                                    }
                                    stroke={
                                        isActive
                                            ? 'rgba(23, 28, 38, 0.85)'
                                            : 'rgba(23, 28, 38, 0.62)'
                                    }
                                    strokeWidth={isActive ? 1.15 : 0.9}
                                    onMouseMove={() => {
                                        setHoverD(feature);
                                        onCountryHover?.(
                                            feature?.properties?.name || null
                                        );
                                    }}
                                    onMouseLeave={() => {
                                        setHoverD(null);
                                        onCountryHover?.(null);
                                    }}
                                >
                                    <title>{feature?.properties?.name || 'Country'}</title>
                                </path>
                            );
                        })}
                    </g>
                </svg>
            )}
        </div>
    );
}
