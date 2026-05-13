import { useEffect, useRef } from 'react';
import { scaleLinear, max, min, line, format, scaleOrdinal, schemeTableau10, select } from 'd3';

const width = 700;
const height = 400;
const margin = { top: 20, right: 20, bottom: 30, left: 60 };
const LEGEND_LIMIT = 5;
const SELECTED_VALUE_LIMIT = 5;

export default function LineChart({ pcaData, countries = [], variable, selectedYear }) {
    const axisLinesRef = useRef(null);
    const axisLabelsRef = useRef(null);
    const linesRef = useRef(null);
    const pointsRef = useRef(null);
    const yearMarkerRef = useRef(null);
    const selectedPointsRef = useRef(null);

    const selectedCountries = countries.filter(Boolean);
    const seriesByCountry = selectedCountries
        .map((country) => ({
            country,
            series: (pcaData?.country_series?.[country]?.[variable] || [])
                .filter((d) => d.value !== null && d.value !== undefined)
                .sort((a, b) => a.year - b.year),
        }))
        .filter((entry) => entry.series.length);
    const allPoints = seriesByCountry.flatMap((entry) => entry.series);
    const activeYear = Number(selectedYear);
    const emptyMessage = !selectedCountries.length
        ? 'Click or brush countries'
        : !seriesByCountry.length
            ? 'No data'
            : '';

    const rightEdge = width - margin.right;
    const bottomEdge = height - margin.bottom;
    const minYear = min(allPoints, (d) => d.year) || 1960;
    const maxYear = max(allPoints, (d) => d.year) || 2020;
    const minValue = min(allPoints, (d) => d.value) || 0;
    const maxValue = max(allPoints, (d) => d.value) || 0;
    const color = scaleOrdinal(schemeTableau10).domain(selectedCountries);

    const x = scaleLinear()
        .domain([minYear, maxYear])
        .range([margin.left, rightEdge]);

    const y = scaleLinear()
        .domain([Math.min(0, minValue), Math.max(0, maxValue)])
        .nice()
        .range([bottomEdge, margin.top]);

    const yTicks = y.ticks(5);
    const xTicks = x.ticks(5);
    const zeroY = y(0);
    const xAxisY = Math.max(margin.top, Math.min(bottomEdge, zeroY));
    const formatValue = (value) => {
        if (Math.abs(value) < 1000) {
            return value.toFixed(1);
        }

        if (Math.abs(value) >= 1000000000) {
            return `${(value / 1000000000).toFixed(1)}B`;
        }

        return format('.2s')(value);
    };

    const linePath = line()
        .x((d) => x(d.year))
        .y((d) => y(d.value));
    const hasSelectedYear = Number.isFinite(activeYear) &&
        activeYear >= minYear &&
        activeYear <= maxYear;
    const selectedYearPoints = hasSelectedYear
        ? seriesByCountry
            .map(({ country, series }) => ({
                country,
                point: series.find((d) => d.year === activeYear),
            }))
            .filter((entry) => entry.point)
        : [];
    const visibleLegendCountries = selectedCountries.slice(0, LEGEND_LIMIT);
    const hiddenLegendCount = Math.max(0, selectedCountries.length - LEGEND_LIMIT);
    const visibleSelectedYearPoints = selectedYearPoints.slice(0, SELECTED_VALUE_LIMIT);
    const hiddenSelectedValueCount = Math.max(
        0,
        selectedYearPoints.length - SELECTED_VALUE_LIMIT
    );
    const axisLines = [
        {
            key: 'x-axis',
            x1: margin.left,
            y1: xAxisY,
            x2: rightEdge,
            y2: xAxisY,
        },
        {
            key: 'y-axis',
            x1: margin.left,
            y1: margin.top,
            x2: margin.left,
            y2: bottomEdge,
        },
        ...xTicks.map((year) => ({
            key: `x-tick-${year}`,
            x1: x(year),
            y1: xAxisY,
            x2: x(year),
            y2: xAxisY + 5,
        })),
        ...yTicks.map((value) => ({
            key: `y-tick-${value}`,
            x1: margin.left - 5,
            y1: y(value),
            x2: margin.left,
            y2: y(value),
        })),
    ];
    const axisLabels = [
        ...xTicks.map((year) => ({
            key: `x-label-${year}`,
            x: x(year),
            y: height - 8,
            textAnchor: 'middle',
            text: year.toFixed(0),
        })),
        ...yTicks.map((value) => ({
            key: `y-label-${value}`,
            x: margin.left - 8,
            y: y(value) + 4,
            textAnchor: 'end',
            text: formatValue(value),
        })),
    ];
    const periodicPoints = seriesByCountry.flatMap(({ country, series }) =>
        series
            .filter((d) => d.year % 5 === 0)
            .map((point) => ({
                country,
                point,
            }))
    );
    const yearMarkerData = hasSelectedYear ? [{ key: 'selected-year', year: activeYear }] : [];

    useEffect(() => {
        if (
            !axisLinesRef.current ||
            !axisLabelsRef.current ||
            !linesRef.current ||
            !pointsRef.current ||
            !yearMarkerRef.current ||
            !selectedPointsRef.current
        ) {
            return;
        }

        select(axisLinesRef.current)
            .selectAll('line')
            .data(axisLines, (d) => d.key)
            .join('line')
            .attr('class', 'line-chart-axis')
            .attr('x1', (d) => d.x1)
            .attr('y1', (d) => d.y1)
            .attr('x2', (d) => d.x2)
            .attr('y2', (d) => d.y2);

        select(axisLabelsRef.current)
            .selectAll('text')
            .data(axisLabels, (d) => d.key)
            .join('text')
            .attr('class', 'line-chart-tick')
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('text-anchor', (d) => d.textAnchor)
            .text((d) => d.text);

        select(yearMarkerRef.current)
            .selectAll('line')
            .data(yearMarkerData, (d) => d.key)
            .join('line')
            .attr('class', 'line-chart-year-marker')
            .attr('x1', (d) => x(d.year))
            .attr('y1', margin.top)
            .attr('x2', (d) => x(d.year))
            .attr('y2', bottomEdge);

        select(linesRef.current)
            .selectAll('path.line-chart-line')
            .data(seriesByCountry, (d) => d.country)
            .join('path')
            .attr('class', 'line-chart-line')
            .attr('d', (d) => linePath(d.series))
            .style('stroke', (d) => color(d.country));

        select(pointsRef.current)
            .selectAll('circle.line-chart-point')
            .data(periodicPoints, (d) => `${d.country}-${d.point.year}`)
            .join('circle')
            .attr('class', 'line-chart-point')
            .attr('cx', (d) => x(d.point.year))
            .attr('cy', (d) => y(d.point.value))
            .attr('r', 3)
            .style('fill', (d) => color(d.country));

        select(selectedPointsRef.current)
            .selectAll('circle.line-chart-selected-point')
            .data(selectedYearPoints, (d) => `${d.country}-${d.point.year}`)
            .join('circle')
            .attr('class', 'line-chart-selected-point')
            .attr('cx', (d) => x(d.point.year))
            .attr('cy', (d) => y(d.point.value))
            .attr('r', 5)
            .style('fill', (d) => color(d.country));
    });

    if (emptyMessage) {
        return <div className="future-chart-panel">{emptyMessage}</div>;
    }

    return (
        <div className="line-chart-panel">
            <h3 className="line-chart-title">
                {selectedCountries.length === 1
                    ? selectedCountries[0]
                    : `${selectedCountries.length} countries`}
            </h3>
            <div className="line-chart-subtitle">{variable}</div>

            <div className="line-chart-legend">
                {visibleLegendCountries.map((country) => (
                    <span key={country} className="line-chart-legend-item">
                        <span
                            className="line-chart-legend-swatch"
                            style={{ background: color(country) }}
                        />
                        {country}
                    </span>
                ))}
                {hiddenLegendCount > 0 && (
                    <span className="line-chart-legend-more">
                        +{hiddenLegendCount} more
                    </span>
                )}
            </div>
            {hasSelectedYear && (
                <div className="line-chart-selected-values">
                    <span className="line-chart-selected-year">{activeYear}</span>
                    {visibleSelectedYearPoints.map(({ country, point }) => (
                        <span key={country} className="line-chart-selected-value">
                            <span
                                className="line-chart-legend-swatch"
                                style={{ background: color(country) }}
                            />
                            {formatValue(point.value)}
                        </span>
                    ))}
                    {hiddenSelectedValueCount > 0 && (
                        <span className="line-chart-legend-more">
                            +{hiddenSelectedValueCount} more
                        </span>
                    )}
                </div>
            )}

            <svg className="line-chart" viewBox={`0 0 ${width} ${height}`}>
                <g ref={axisLinesRef} />
                <g ref={axisLabelsRef} />
                <g ref={yearMarkerRef} />
                <g ref={linesRef} />
                <g ref={pointsRef} />
                <g ref={selectedPointsRef} />
            </svg>
        </div>
    );
}
