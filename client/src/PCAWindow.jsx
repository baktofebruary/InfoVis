import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeCountry } from './lib/country';

const PADDING_RATIO = 0.12;

const buildPlotModel = (pcaData, plotSize) => {
    if (!pcaData || !plotSize.width || !plotSize.height) return null;

    const { x, y, countries, explained_variance: explainedVariance } = pcaData;
    if (!x?.length || !y?.length) {
        return {
            points: [],
            explainedVariance: explainedVariance || [0, 0],
            padding: 48,
            xTicks: [],
            yTicks: [],
            formatTick: (value) => String(value),
            plotWidth: plotSize.width,
            plotHeight: plotSize.height,
        };
    }

    const xMin = Math.min(...x);
    const xMax = Math.max(...x);
    const yMin = Math.min(...y);
    const yMax = Math.max(...y);
    const xSpan = xMax - xMin || 1;
    const ySpan = yMax - yMin || 1;
    const padding = Math.max(
        28,
        Math.min(72, Math.round(Math.min(plotSize.width, plotSize.height) * PADDING_RATIO))
    );
    const contentWidth = Math.max(1, plotSize.width - padding * 2);
    const contentHeight = Math.max(1, plotSize.height - padding * 2);

    const xScale = (value) => padding + ((value - xMin) / xSpan) * contentWidth;
    const yScale = (value) =>
        plotSize.height - padding - ((value - yMin) / ySpan) * contentHeight;

    const tickCount = 4;
    const xTicks = Array.from({ length: tickCount + 1 }, (_, index) => {
        const value = xMin + (xSpan * index) / tickCount;
        return { value, x: xScale(value) };
    });

    const yTicks = Array.from({ length: tickCount + 1 }, (_, index) => {
        const value = yMin + (ySpan * index) / tickCount;
        return { value, y: yScale(value) };
    });

    const formatTick = (value) => {
        const rounded = Math.abs(value) < 1e-4 ? 0 : value;
        const text = rounded.toFixed(2);
        return text.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    };

    const points = x.map((xValue, index) => ({
        cx: xScale(xValue),
        cy: yScale(y[index]),
        country: countries[index],
        key: `${countries[index]}-${index}`,
    }));

    return {
        points,
        explainedVariance: explainedVariance || [0, 0],
        padding,
        xTicks,
        yTicks,
        formatTick,
        plotWidth: plotSize.width,
        plotHeight: plotSize.height,
    };
};

export default function PCAWindow({
    pcaData,
    isLoadingPca,
    pcaLoadError,
    onCountryHover,
    mapHoveredCountry
}) {
    
    const panelRef = useRef(null);
    const plotRef = useRef(null);

    const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
    const [tooltip, setTooltip] = useState({
        visible: false,
        x: 0,
        y: 0,
        label: '',
    });

    useEffect(() => {
        if (!plotRef.current) return;

        const observer = new ResizeObserver(([entry]) => {
            setPlotSize({
                width: Math.floor(entry.contentRect.width),
                height: Math.floor(entry.contentRect.height),
            });
        });

        observer.observe(plotRef.current);
        return () => observer.disconnect();
    }, []);

    const plot = useMemo(() => buildPlotModel(pcaData, plotSize), [pcaData, plotSize]);

    const handlePointMove = (event, country) => {
        if (!panelRef.current) return;
        const bounds = panelRef.current.getBoundingClientRect();

        setTooltip({
            visible: true,
            x: event.clientX - bounds.left + 10,
            y: event.clientY - bounds.top + 10,
            label: country,
        });

        onCountryHover?.(country);
    };

    const hideTooltip = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
        onCountryHover?.(null);
    };

    const hoveredMapName = normalizeCountry(mapHoveredCountry);
    const isMapHoveredPoint = (country) =>
        hoveredMapName && normalizeCountry(country) === hoveredMapName;

    const hoveredPcaName = normalizeCountry(tooltip.visible ? tooltip.label : '');
    const isPcaHoveredPoint = (country) =>
        hoveredPcaName && normalizeCountry(country) === hoveredPcaName;

    return (
        <aside className="pca-window" ref={panelRef}>
            <div className="pca-window-header">
                <div className="pca-title">PCA Projection</div>
            </div>

            <div className="pca-body">
                <div ref={plotRef} className="pca-plot-shell">
                    {pcaLoadError && <div className="pca-error">{pcaLoadError}</div>}
                    {!pcaLoadError && isLoadingPca && (
                        <div className="pca-loading">Loading PCA data...</div>
                    )}
                    {!pcaLoadError && !isLoadingPca && !plot && (
                        <div className="pca-loading">No PCA data available.</div>
                    )}
                    {!pcaLoadError && plot && (
                    <svg
                        className="pca-plot"
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${plot.plotWidth} ${plot.plotHeight}`}
                        onMouseLeave={hideTooltip}
                    >
                        <defs>
                            <linearGradient id="pca-bg-gradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#f7f3ea" />
                                <stop offset="48%" stopColor="#eef4ff" />
                                <stop offset="100%" stopColor="#fff8ef" />
                            </linearGradient>
                            <radialGradient id="pca-glow" cx="50%" cy="35%" r="70%">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                            </radialGradient>
                            <filter id="pca-point-shadow" x="-40%" y="-40%" width="180%" height="180%">
                                <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#17315e" floodOpacity="0.18" />
                            </filter>
                        </defs>
                        <rect width={plot.plotWidth} height={plot.plotHeight} fill="url(#pca-bg-gradient)" rx="12" />
                        <rect width={plot.plotWidth} height={plot.plotHeight} fill="url(#pca-glow)" rx="12" opacity="0.85" />
                        <text x={20} y={26} className="pca-chart-caption">
                            {plot.points.length} countries
                        </text>
                        <text x={20} y={44} className="pca-chart-subcaption">
                            Hover over points to sync with the globe
                        </text>

                        {plot.xTicks.map((tick) => (
                            <line
                                key={`x-grid-${tick.x}`}
                                x1={tick.x}
                                y1={plot.padding}
                                x2={tick.x}
                                y2={plot.plotHeight - plot.padding}
                                className="pca-grid-line"
                            />
                        ))}

                        {plot.yTicks.map((tick) => (
                            <line
                                key={`y-grid-${tick.y}`}
                                x1={plot.padding}
                                y1={tick.y}
                                x2={plot.plotWidth - plot.padding}
                                y2={tick.y}
                                className="pca-grid-line"
                            />
                        ))}

                        <line
                            x1={plot.padding}
                            y1={plot.plotHeight - plot.padding}
                            x2={plot.plotWidth - plot.padding}
                            y2={plot.plotHeight - plot.padding}
                            className="pca-axis"
                        />
                        <line
                            x1={plot.padding}
                            y1={plot.padding}
                            x2={plot.padding}
                            y2={plot.plotHeight - plot.padding}
                            className="pca-axis"
                        />

                        {plot.xTicks.map((tick) => (
                            <g key={`x-tick-${tick.x}`}>
                                <line
                                    x1={tick.x}
                                    y1={plot.plotHeight - plot.padding}
                                    x2={tick.x}
                                    y2={plot.plotHeight - plot.padding + 6}
                                    className="pca-axis-tick"
                                />
                                <text
                                    x={tick.x}
                                    y={plot.plotHeight - 10}
                                    textAnchor="middle"
                                    className="pca-axis-tick-label"
                                >
                                    {plot.formatTick(tick.value)}
                                </text>
                            </g>
                        ))}

                        {plot.yTicks.map((tick) => (
                            <g key={`y-tick-${tick.y}`}>
                                <line
                                    x1={plot.padding - 6}
                                    y1={tick.y}
                                    x2={plot.padding}
                                    y2={tick.y}
                                    className="pca-axis-tick"
                                />
                                <text
                                    x={plot.padding - 10}
                                    y={tick.y + 4}
                                    textAnchor="end"
                                    className="pca-axis-tick-label"
                                >
                                    {plot.formatTick(tick.value)}
                                </text>
                            </g>
                        ))}

                        <text
                            x={plot.plotWidth / 2}
                            y={plot.plotHeight - 12}
                            textAnchor="middle"
                            className="pca-axis-label"
                        >
                            {`PC1 (${((plot.explainedVariance[0] || 0) * 100).toFixed(1)}%)`}
                        </text>
                        <text
                            x={14}
                            y={plot.plotHeight / 2}
                            transform={`rotate(-90 14 ${plot.plotHeight / 2})`}
                            textAnchor="middle"
                            className="pca-axis-label"
                        >
                            {`PC2 (${((plot.explainedVariance[1] || 0) * 100).toFixed(1)}%)`}
                        </text>
                        {plot.points.map((point) => (
                            <circle
                                key={point.key}
                                cx={point.cx}
                                cy={point.cy}
                                r={5}
                                className={`pca-point${
                                    isMapHoveredPoint(point.country)
                                        ? ' pca-point-map-hovered'
                                        : ''
                                }${
                                    isPcaHoveredPoint(point.country)
                                        ? ' pca-point-pca-hovered'
                                        : ''
                                }`}
                                filter="url(#pca-point-shadow)"
                                onMouseMove={(event) =>
                                    handlePointMove(event, point.country)
                                }
                                onMouseLeave={hideTooltip}
                            />
                        ))}
                    </svg>
                )}
                </div>
            </div>

            {tooltip.visible && (
                <div
                    className="pca-tooltip"
                    style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
                >
                    {tooltip.label}
                </div>
            )}
        </aside>
    );
}
