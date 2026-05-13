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
    onBrushedCountriesChange
}) {
    const panelRef = useRef(null);
    const plotRef = useRef(null);
    const svgRef = useRef(null);

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

    useEffect(() => {
        if (!svgRef.current || !plot) return;

        const svg = select(svgRef.current);
        svg.selectAll('*').remove();
        svg.attr('viewBox', `0 0 ${plot.plotWidth} ${plot.plotHeight}`);

        const defs = svg.append('defs');

        [
            ['linearGradient', 'pca-bg-gradient', { x1: '0', y1: '0', x2: '1', y2: '1' }, [
                ['0%', '#f7f3ea'],
                ['48%', '#eef4ff'],
                ['100%', '#fff8ef'],
            ]],
            ['radialGradient', 'pca-glow', { cx: '50%', cy: '35%', r: '70%' }, [
                ['0%', 'rgba(255,255,255,0.85)'],
                ['100%', 'rgba(255,255,255,0)'],
            ]],
        ].forEach(([tag, id, attrs, stops]) => {
            const gradient = defs.append(tag).attr('id', id);
            Object.entries(attrs).forEach(([key, value]) => gradient.attr(key, value));
            stops.forEach(([offset, color]) =>
                gradient.append('stop').attr('offset', offset).attr('stop-color', color)
            );
        });

        const pointShadow = defs
            .append('filter')
            .attr('id', 'pca-point-shadow')
            .attr('x', '-40%')
            .attr('y', '-40%')
            .attr('width', '180%')
            .attr('height', '180%');

        pointShadow
            .append('feDropShadow')
            .attr('dx', 0)
            .attr('dy', 2)
            .attr('stdDeviation', 2.2)
            .attr('flood-color', '#17315e')
            .attr('flood-opacity', 0.18);

        svg.append('rect')
            .attr('width', plot.plotWidth)
            .attr('height', plot.plotHeight)
            .attr('fill', 'url(#pca-bg-gradient)')
            .attr('rx', 12);

        svg.append('rect')
            .attr('width', plot.plotWidth)
            .attr('height', plot.plotHeight)
            .attr('fill', 'url(#pca-glow)')
            .attr('rx', 12)
            .attr('opacity', 0.85);

        svg.append('text')
            .attr('x', 20)
            .attr('y', 26)
            .attr('class', 'pca-chart-caption')
            .text(`${plot.points.length} countries`);

        svg.append('text')
            .attr('x', 20)
            .attr('y', 44)
            .attr('class', 'pca-chart-subcaption')
            .text('Hover over points to sync with the globe');

        const tickFormat = format('.2~f');

        [
            ['x', plot.xTicks, plot.xScale],
            ['y', plot.yTicks, plot.yScale],
        ].forEach(([axis, ticks, scale]) => {
            const layer = svg.append('g').attr('class', 'pca-grid');
            layer
                .selectAll('line')
                .data(ticks)
                .join('line')
                .attr('class', 'pca-grid-line')
                .attr('x1', axis === 'x' ? (tick) => scale(tick) : plot.padding)
                .attr('y1', axis === 'x' ? plot.padding : (tick) => scale(tick))
                .attr('x2', axis === 'x' ? (tick) => scale(tick) : plot.plotWidth - plot.padding)
                .attr('y2', axis === 'x' ? plot.plotHeight - plot.padding : (tick) => scale(tick));

            const axisGroup = svg
                .append('g')
                .attr('transform', axis === 'x' ? `translate(0, ${plot.plotHeight - plot.padding})` : `translate(${plot.padding}, 0)`)
                .call(
                    (axis === 'x' ? axisBottom : axisLeft)(scale)
                        .tickValues(ticks)
                        .tickSize(6)
                        .tickFormat(tickFormat)
                );

            axisGroup.selectAll('path').remove();
            axisGroup.selectAll('.tick line').attr('class', 'pca-axis-tick');
            axisGroup.selectAll('.tick text').attr('class', 'pca-axis-tick-label');
        });

        [
            ['PC1', plot.plotWidth / 2, plot.plotHeight - 12, null, `PC1 (${((plot.explainedVariance[0] || 0) * 100).toFixed(1)}%)`],
            ['PC2', 14, plot.plotHeight / 2, `rotate(-90 14 ${plot.plotHeight / 2})`, `PC2 (${((plot.explainedVariance[1] || 0) * 100).toFixed(1)}%)`],
        ].forEach(([, x, y, transform, text]) => {
            svg.append('text')
                .attr('x', x)
                .attr('y', y)
                .attr('transform', transform)
                .attr('text-anchor', 'middle')
                .attr('class', 'pca-axis-label')
                .text(text);
        });

        const brushLayer = svg.append('g').attr('class', 'pca-brush');

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

        brushLayer.call(brushBehavior);

        const pointLayer = svg.append('g').attr('class', 'pca-points');
        pointLayer
            .selectAll('circle')
            .data(plot.points, (point) => point.key)
            .join('circle')
            .attr('cx', (point) => point.cx)
            .attr('cy', (point) => point.cy)
            .attr('r', 5)
            .attr('class', 'pca-point')
            .attr('filter', 'url(#pca-point-shadow)')
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

        return () => {
            brushLayer.on('.brush', null);
            svg.selectAll('*').remove();
        };
    }, [plot, onBrushedCountriesChange, onCountryHover]);

    useEffect(() => {
        if (!svgRef.current || !plot) return;

        const svg = select(svgRef.current);
        const hoveredMapName = normalizeCountry(mapHoveredCountry);
        const hoveredPcaName = normalizeCountry(tooltip.visible ? tooltip.label : '');
        const brushedNames = brushedCountrySet || new Set();

        svg.selectAll('circle.pca-point')
            .classed('pca-point-map-hovered', (point) =>
                Boolean(hoveredMapName && normalizeCountry(point.country) === hoveredMapName)
            )
            .classed('pca-point-pca-hovered', (point) =>
                Boolean(hoveredPcaName && normalizeCountry(point.country) === hoveredPcaName)
            )
            .classed('pca-point-brushed', (point) =>
                brushedNames.has(normalizeCountry(point.country))
            );
    }, [plot, mapHoveredCountry, brushedCountrySet, tooltip.label, tooltip.visible]);

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
                        />
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
