import { interpolateYlOrRd } from 'd3-scale-chromatic';

export const getCountryMetric = (pcaData, countryName, selectedVariable, selectedYear) => {
    const yearlyValues = pcaData?.country_values_by_year?.[selectedYear];
    const yearlyValue = yearlyValues?.[countryName]?.[selectedVariable];

    return yearlyValue ?? pcaData?.country_values?.[countryName]?.[selectedVariable] ?? null;
};

export const getVariableData = (pcaData, selectedVariable) => {
    return pcaData?.variables?.find((variable) => variable.key === selectedVariable) || null;
};

export const getCountryColorValue = (value, variableData) => {
    if (!variableData || value === null) {
        return 'rgba(255, 255, 255, 0.30)';
    }

    const min = variableData.min;
    const max = variableData.max;
    const ratio = (value - min) / (max - min || 1);
    const safeRatio = Math.max(0, Math.min(1, ratio));

    return interpolateYlOrRd(safeRatio);
};
