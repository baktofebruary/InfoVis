import { scaleLinear, max, min, line, format, scaleOrdinal, schemeTableau10 } from 'd3';

const width = 700;
const height = 400;
const margin = { top: 20, right: 20, bottom: 30, left: 60 };
const LEGEND_LIMIT = 5;
const SELECTED_VALUE_LIMIT = 5;

export default function LineChart({ pcaData, countries = [], variable, selectedYear }) {
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

    if (!selectedCountries.length) {
        return <div className="future-chart-panel">Click or brush countries</div>;
    }

    if (!seriesByCountry.length) {
        return <div className="future-chart-panel">No data</div>;
    }

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
                {hasSelectedYear && (
                    <line
                        x1={x(activeYear)}
                        y1={margin.top}
                        x2={x(activeYear)}
                        y2={bottomEdge}
                        className="line-chart-year-marker"
                    />
                )}

                <line
                    x1={margin.left}
                    y1={xAxisY}
                    x2={rightEdge}
                    y2={xAxisY}
                    className="line-chart-axis"
                />

                <line
                    x1={margin.left}
                    y1={margin.top}
                    x2={margin.left}
                    y2={bottomEdge}
                    className="line-chart-axis"
                />

                {xTicks.map((year) => (
                    <line
                        key={`x-tick-${year}`}
                        x1={x(year)}
                        y1={xAxisY}
                        x2={x(year)}
                        y2={xAxisY + 5}
                        className="line-chart-axis"
                    />
                ))}

                {xTicks.map((year) => (
                    <text
                        key={`x-label-${year}`}
                        x={x(year)}
                        y={height - 8}
                        textAnchor="middle"
                        className="line-chart-tick"
                    >
                        {year.toFixed(0)}
                    </text>
                ))}

                {yTicks.map((value) => (
                    <line
                        key={`y-tick-${value}`}
                        x1={margin.left - 5}
                        y1={y(value)}
                        x2={margin.left}
                        y2={y(value)}
                        className="line-chart-axis"
                    />
                ))}

                {yTicks.map((value) => (
                    <text
                        key={`y-label-${value}`}
                        x={margin.left - 8}
                        y={y(value) + 4}
                        textAnchor="end"
                        className="line-chart-tick"
                    >
                        {formatValue(value)}
                    </text>
                ))}

                {seriesByCountry.map(({ country, series }) => (
                    <g key={country}>
                        <path
                            className="line-chart-line"
                            d={linePath(series)}
                            style={{ stroke: color(country) }}
                        />
                        {series.filter((d) => d.year % 5 === 0).map((d) => (
                            <circle
                                key={`${country}-${d.year}`}
                                cx={x(d.year)}
                                cy={y(d.value)}
                                r="3"
                                className="line-chart-point"
                                style={{ fill: color(country) }}
                            />
                        ))}
                    </g>
                ))}

                {selectedYearPoints.map(({ country, point }) => (
                    <circle
                        key={`selected-${country}-${point.year}`}
                        cx={x(point.year)}
                        cy={y(point.value)}
                        r="5"
                        className="line-chart-selected-point"
                        style={{ fill: color(country) }}
                    />
                ))}
            </svg>
        </div>
    );
}
