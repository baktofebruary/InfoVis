export const normalizeCountry = (value) =>
    String(value || '')
        .trim()
        .toLowerCase();

export const filterCountriesForPca = (countryFeatures, pcaCountrySet) => {
    if (!Array.isArray(countryFeatures) || !pcaCountrySet?.size) {
        return [];
    }

    return countryFeatures.filter((feature) => {
        const name = normalizeCountry(feature?.properties?.name);
        return Boolean(name) && name !== 'antarctica' && pcaCountrySet.has(name);
    });
};
