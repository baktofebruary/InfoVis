import { useEffect, useMemo, useRef, useState } from 'react';
import {
    axisBottom,
    axisLeft,
    brush,
    extent,
    format,
    scaleLinear,
    select,
} from 'd3';
import { normalizeCountry } from './lib/country';
import { getCountryColorValue, getCountryMetric, getVariableData } from './lib/mapColor';

const PADDING_RATIO = 0.12;

const getExpandedDomain = (values) => {
    const [min, max] = extent(values);

    if (min === undefined || max === undefined) {
        return [0, 1];
    }

    if (min === max) {
        const offset = Math.abs(min) > 1 ? Math.abs(min) * 0.1 : 0.5;
        return [min - offset, max + offset];
    }

    return [min, max];
};

const buildPlotModel = (pcaData, plotSize) => {
    if (!pcaData || !plotSize.width || !plotSize.height) return null;

    const { x, y, countries, explained_variance: explainedVariance } = pcaData;
    const padding = Math.max(
        28,
        Math.min(72, Math.round(Math.min(plotSize.width, plotSize.height) * PADDING_RATIO))
    );

    const xValues = x || [];
    const yValues = y || [];
    const countryValues = countries || [];
    const pointCount = Math.min(xValues.length, yValues.length, countryValues.length);

    const xScale = scaleLinear()
        .domain(getExpandedDomain(xValues))
        .range([padding, plotSize.width - padding])
        .nice();
    const yScale = scaleLinear()
        .domain(getExpandedDomain(yValues))
        .range([plotSize.height - padding, padding])
        .nice();

    const points = Array.from({ length: pointCount }, (_, index) => ({
        cx: xScale(xValues[index]),
        cy: yScale(yValues[index]),
        country: countryValues[index],
        key: `${countryValues[index]}-${index}`,
    }));

    return {
        points,
        explainedVariance: explainedVariance || [0, 0],
        padding,
        xScale,
        yScale,
        xTicks: xScale.ticks(4),
        yTicks: yScale.ticks(4),
        plotWidth: plotSize.width,
        plotHeight: plotSize.height,
    };
};

export default function PCAWindow({
    pcaData,
    isLoadingPca,
    pcaLoadError,
    onCountryHover,
    mapHoveredCountry,
    brushedCountrySet,
    onBrushedCountriesChange,
    selectedVariable,
    selectedYear
}) {
    const panelRef = useRef(null);
    const plotRef = useRef(null);
    const svgRef = useRef(null);
    const captionRef = useRef(null);
    const gridRef = useRef(null);
    const axisRef = useRef(null);
    const axisLabelRef = useRef(null);
    const brushRef = useRef(null);
    const pointsRef = useRef(null);

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
    const selectedVariableData = useMemo(
        () => getVariableData(pcaData, selectedVariable),
        [pcaData, selectedVariable]
    );

    useEffect(() => {
        if (!svgRef.current || !plot || !captionRef.current) return;

        const svg = select(svgRef.current);
        svg.attr('viewBox', `0 0 ${plot.plotWidth} ${plot.plotHeight}`);

        select(captionRef.current)
            .selectAll('text')
            .data([
                {
                    key: 'caption',
                    x: 20,
                    y: 26,
                    className: 'pca-chart-caption',
                    text: `${plot.points.length} countries`,
                },
                {
                    key: 'subcaption',
                    x: 20,
                    y: 44,
                    className: 'pca-chart-subcaption',
                    text: 'Hover over points to sync with the globe',
                },
            ], (d) => d.key)
            .join('text')
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('class', (d) => d.className)
            .text((d) => d.text);

        const tickFormat = format('.2~f');
        const gridData = [
            ...plot.xTicks.map((tick) => ({ key: `x-${tick}`, axis: 'x', tick })),
            ...plot.yTicks.map((tick) => ({ key: `y-${tick}`, axis: 'y', tick })),
        ];

        select(gridRef.current)
            .selectAll('line')
            .data(gridData, (d) => d.key)
            .join('line')
            .attr('class', 'pca-grid-line')
            .attr('x1', (d) => d.axis === 'x' ? plot.xScale(d.tick) : plot.padding)
            .attr('y1', (d) => d.axis === 'x' ? plot.padding : plot.yScale(d.tick))
            .attr('x2', (d) => d.axis === 'x' ? plot.xScale(d.tick) : plot.plotWidth - plot.padding)
            .attr('y2', (d) => d.axis === 'x' ? plot.plotHeight - plot.padding : plot.yScale(d.tick));

        const axisGroups = select(axisRef.current)
            .selectAll('g.pca-axis-layer')
            .data(['x', 'y'], (axis) => axis)
            .join('g')
            .attr('class', (axis) => `pca-axis-layer pca-axis-${axis}`)
            .attr('transform', (axis) =>
                axis === 'x'
                    ? `translate(0, ${plot.plotHeight - plot.padding})`
                    : `translate(${plot.padding}, 0)`
            );

        axisGroups.each(function updateAxis(axis) {
            const scale = axis === 'x' ? plot.xScale : plot.yScale;
            const ticks = axis === 'x' ? plot.xTicks : plot.yTicks;

            select(this).call(
                (axis === 'x' ? axisBottom : axisLeft)(scale)
                    .tickValues(ticks)
                    .tickSize(6)
                    .tickFormat(tickFormat)
            );
        });

        axisGroups.selectAll('.domain').attr('stroke', 'none');
        axisGroups.selectAll('.tick line').attr('class', 'pca-axis-tick');
        axisGroups.selectAll('.tick text').attr('class', 'pca-axis-tick-label');

        select(axisLabelRef.current)
            .selectAll('text')
            .data([
                {
                    key: 'pc1',
                    x: plot.plotWidth / 2,
                    y: plot.plotHeight - 12,
                    transform: null,
                    text: `PC1 (${((plot.explainedVariance[0] || 0) * 100).toFixed(1)}%)`,
                },
                {
                    key: 'pc2',
                    x: 14,
                    y: plot.plotHeight / 2,
                    transform: `rotate(-90 14 ${plot.plotHeight / 2})`,
                    text: `PC2 (${((plot.explainedVariance[1] || 0) * 100).toFixed(1)}%)`,
                },
            ], (d) => d.key)
            .join('text')
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('transform', (d) => d.transform)
            .attr('text-anchor', 'middle')
            .attr('class', 'pca-axis-label')
            .text((d) => d.text);
    }, [plot]);

    useEffect(() => {
        if (!brushRef.current || !plot) return;

        const brushBehavior = brush()
            .extent([
                [plot.padding, plot.padding],
                [plot.plotWidth - plot.padding, plot.plotHeight - plot.padding],
            ])
            .on('brush end', (event) => {
                const selection = event.selection;

                if (!selection) {
                    onBrushedCountriesChange?.([]);
                    return;
                }

                const [[x0, y0], [x1, y1]] = selection;
                const selectedCountries = Array.from(
                    new Set(
                        plot.points
                            .filter(
                                (point) =>
                                    point.cx >= x0 &&
                                    point.cx <= x1 &&
                                    point.cy >= y0 &&
                                    point.cy <= y1
                            )
                            .map((point) => point.country)
                    )
                );

                onBrushedCountriesChange?.(selectedCountries);
            });

        const brushLayer = select(brushRef.current);
        brushLayer.call(brushBehavior);

        return () => {
            brushLayer.on('.brush', null);
        };
    }, [plot, onBrushedCountriesChange]);

    useEffect(() => {
        if (!pointsRef.current || !plot) return;

        const hoveredMapName = normalizeCountry(mapHoveredCountry);
        const hoveredPcaName = normalizeCountry(tooltip.visible ? tooltip.label : '');
        const brushedNames = brushedCountrySet || new Set();

        select(pointsRef.current)
            .selectAll('circle.pca-point')
            .data(plot.points, (point) => point.key)
            .join('circle')
            .attr('class', 'pca-point')
            .attr('cx', (point) => point.cx)
            .attr('cy', (point) => point.cy)
            .attr('r', (point) => {
                const isActive =
                    Boolean(hoveredMapName && normalizeCountry(point.country) === hoveredMapName) ||
                    Boolean(hoveredPcaName && normalizeCountry(point.country) === hoveredPcaName) ||
                    brushedNames.has(normalizeCountry(point.country));

                return isActive ? 6 : 5;
            })
            .attr('fill', (point) => {
                const value = getCountryMetric(
                    pcaData,
                    point.country,
                    selectedVariable,
                    selectedYear
                );

                return getCountryColorValue(value, selectedVariableData);
            })
            .attr('filter', 'url(#pca-point-shadow)')
            .classed('pca-point-map-hovered', (point) =>
                Boolean(hoveredMapName && normalizeCountry(point.country) === hoveredMapName)
            )
            .classed('pca-point-pca-hovered', (point) =>
                Boolean(hoveredPcaName && normalizeCountry(point.country) === hoveredPcaName)
            )
            .classed('pca-point-brushed', (point) =>
                brushedNames.has(normalizeCountry(point.country))
            )
            .on('mousemove', (event, point) => {
                if (!panelRef.current) return;
                const bounds = panelRef.current.getBoundingClientRect();

                setTooltip({
                    visible: true,
                    x: event.clientX - bounds.left + 10,
                    y: event.clientY - bounds.top + 10,
                    label: point.country,
                });

                onCountryHover?.(point.country);
            })
            .on('mouseleave', () => {
                setTooltip((prev) => ({ ...prev, visible: false }));
                onCountryHover?.(null);
            });
    }, [
        plot,
        pcaData,
        selectedVariable,
        selectedYear,
        selectedVariableData,
        mapHoveredCountry,
        brushedCountrySet,
        tooltip.label,
        tooltip.visible,
        onCountryHover,
    ]);

    const hideTooltip = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
        onCountryHover?.(null);
    };

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
                            ref={svgRef}
                            className="pca-plot"
                            width="100%"
                            height="100%"
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
                                <filter
                                    id="pca-point-shadow"
                                    x="-40%"
                                    y="-40%"
                                    width="180%"
                                    height="180%"
                                >
                                    <feDropShadow
                                        dx="0"
                                        dy="2"
                                        stdDeviation="2.2"
                                        floodColor="#17315e"
                                        floodOpacity="0.18"
                                    />
                                </filter>
                            </defs>
                            <rect
                                width={plot.plotWidth}
                                height={plot.plotHeight}
                                fill="url(#pca-bg-gradient)"
                                rx="12"
                            />
                            <rect
                                width={plot.plotWidth}
                                height={plot.plotHeight}
                                fill="url(#pca-glow)"
                                rx="12"
                                opacity="0.85"
                            />
                            <g ref={captionRef} />
                            <g ref={gridRef} className="pca-grid" />
                            <g ref={axisRef} />
                            <g ref={axisLabelRef} />
                            <g ref={brushRef} className="pca-brush" />
                            <g ref={pointsRef} className="pca-points" />
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
