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

const collectLonLat = (coordinates, output) => {
    if (!Array.isArray(coordinates) || coordinates.length === 0) return;

    if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
        output.push([coordinates[0], coordinates[1]]);
        return;
    }

    coordinates.forEach((part) => collectLonLat(part, output));
};

export const getFeatureCenter = (feature) => {
    const points = [];
    collectLonLat(feature?.geometry?.coordinates, points);

    if (!points.length) return null;

    const sums = points.reduce(
        (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
        { lng: 0, lat: 0 }
    );

    return {
        lat: sums.lat / points.length,
        lng: sums.lng / points.length,
    };
};
