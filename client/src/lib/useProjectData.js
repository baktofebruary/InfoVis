import { useEffect, useMemo, useState } from 'react';
import { normalizeCountry } from './country';

const PCA_ENDPOINT = 'http://127.0.0.1:5000/pca';

export const useProjectData = () => {
    const [countryFeatures, setCountryFeatures] = useState([]);
    const [pcaData, setPcaData] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        const countriesUrl = new URL('../data/ne_110m_admin_0_countries.geojson', import.meta.url);

        const loadData = async () => {
            setIsLoadingData(true);
            setLoadError('');

            const [countriesResult, pcaResult] = await Promise.allSettled([
                fetch(countriesUrl, { signal: controller.signal }),
                fetch(PCA_ENDPOINT, { signal: controller.signal }),
            ]);

            let nextError = '';

            if (countriesResult.status === 'fulfilled' && countriesResult.value.ok) {
                const countries = await countriesResult.value.json();
                setCountryFeatures(countries.features || []);
            } else if (countriesResult.status === 'fulfilled') {
                nextError = `Country dataset request failed (${countriesResult.value.status})`;
            } else if (countriesResult.reason?.name !== 'AbortError') {
                nextError = 'Country dataset request failed';
            }

            if (pcaResult.status === 'fulfilled' && pcaResult.value.ok) {
                const pca = await pcaResult.value.json();
                setPcaData(pca);
            } else if (pcaResult.status === 'fulfilled') {
                nextError = nextError || `PCA request failed (${pcaResult.value.status})`;
            } else if (pcaResult.reason?.name !== 'AbortError') {
                nextError = nextError || 'PCA request failed';
            }

            setLoadError(nextError);
            setIsLoadingData(false);
        };

        loadData();

        return () => {
            controller.abort();
        };
    }, []);

    const pcaCountrySet = useMemo(() => {
        const countries = pcaData?.countries || [];
        return new Set(countries.map(normalizeCountry));
    }, [pcaData]);

    return {
        countryFeatures,
        pcaData,
        pcaCountrySet,
        isLoadingData,
        loadError,
    };
};
