import { prefs as preferences } from '../../core/preferences';
import { modeBrowse } from '../../modes/browse';

// layer changes
export function toggleLayer(context, layerID) {
    setLayerVisibility(context, layerID, !isLayerShown(context, layerID));

    const dataLayerPreference = JSON.parse(preferences.get('dataLayers') || '{}');
    dataLayerPreference[layerID] = isLayerShown(context, layerID);
    preferences('dataLayers', JSON.stringify(dataLayerPreference));
}

export function isLayerShown(context, layerID) {
    const layer = context.layers().layer(layerID);
    if (layer) {
        return layer.enabled();
    }
    return false;
}

export function setLayerVisibility(context, layerID, enabled) {
    // Don't allow layer changes while drawing - #6584
    const mode = context.mode();
    if (mode && /^draw/.test(mode.id)) return;

    const layer = context.layers().layer(layerID);
    if (layer) {
        layer.enabled(enabled);

        if (!enabled && (layerID === 'osm' || layerID === 'notes')) {
            context.enter(modeBrowse(context));
        }
    }
}
