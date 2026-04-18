export default function MapControls({
    onZoomIn,
    onZoomOut,
    onZoomReset,
    autoFocusOnPca,
    onAutoFocusOnPcaChange,
    className = '',
}) {
    const rootClassName = className
        ? `flat-map-controls ${className}`
        : 'flat-map-controls';

    return (
        <div className={rootClassName}>
            <button
                type="button"
                className="flat-map-control-btn"
                onClick={onZoomIn}
                aria-label="Zoom in"
            >
                +
            </button>
            <button
                type="button"
                className="flat-map-control-btn"
                onClick={onZoomOut}
                aria-label="Zoom out"
            >
                -
            </button>
            <button
                type="button"
                className="flat-map-control-btn flat-map-control-reset"
                onClick={onZoomReset}
                aria-label="Reset zoom"
            >
                Reset
            </button>
            <label className="map-hover-toggle flat-map-hover-toggle">
                <input
                    type="checkbox"
                    checked={autoFocusOnPca}
                    onChange={(event) => onAutoFocusOnPcaChange?.(event.target.checked)}
                />
                <span>Auto focus on PCA hover</span>
            </label>
        </div>
    );
}
