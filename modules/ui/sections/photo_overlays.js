import _debounce from 'lodash-es/debounce';
import { select as d3_select } from 'd3-selection';

import { localizer, t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';
import { utilGetSetValue, utilNoAuto } from '../../util';
import { uiSettingsLocalPhotos } from '../settings/local_photos';
import { svgIcon } from '../../svg';
import { toggleLayer } from './map_data_helper';
import { prefs as preferences } from '../../core/preferences';

export function getPhotoLayers(context) {
    const layers = context.layers();
    const photoKeys = context.photos().overlayLayerIDs();
    const photoLayers = layers.all().filter((layer) => photoKeys.indexOf(layer.id) !== -1);

    return photoLayers;
}

export function uiSectionPhotoOverlays(context) {
    const settingsLocalPhotos = uiSettingsLocalPhotos(context)
        .on('change', localPhotosChanged);

    // photo overlays container
    const section = uiSection('photo-overlays', context)
        .label(() => t.append('photo_overlays.title'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    // render the content of the photo overlays container
    function renderDisclosureContent(selection) {
        // apparently this captures the card part of the photo overlays container
        var container = selection.selectAll('.photo-overlay-container')
            .data([0]);

        // add a div to the card and start drawing all the photo overlays
        container.enter()
            .append('div')
            .attr('class', 'photo-overlay-container')
            .merge(container)
            .call(drawPhotoSources)
            .call(drawPhotoTypeFilter)
            .call(drawDateFilter)
            .call(drawUsernameFilter)
            .call(drawLocalPhotos);
    }

    // draw the photo layers selectors and filters

    function drawPhotoSources(selection) {
        // filter out all non-photo layers
        const photoLayers = getPhotoLayers(context);
        const availablePhotoLayers = photoLayers.filter((layerObj) => {
            // is the service online
            if (!layerObj.layer.supported()) return false;
            // is the service enabled
            if (isLayerEnabled(layerObj)) return true;
            // is the service available at the current location and zoom level
            if (typeof layerObj.layer.validHere === 'function') {
                return layerObj.layer.validHere(context.map().extent(), context.map().zoom());
            }
            return true;
        });

        // local helper functions
        function isLayerSupported(layerObj) {
            return layerObj.layer && layerObj.layer.supported();
        }
        function isLayerEnabled(layerObj) {
            return isLayerSupported(layerObj) && layerObj.layer.enabled();
        }
        function isLayerRendered(layer) {
            return layer.rendered?.(context.map().zoom()) ?? true;
        }

        let ul = selection
            .selectAll('.layer-list-photos')
            .data([0]);

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-photos')
            .merge(ul);

        const li = ul.selectAll('.list-item-photos')
            .data(availablePhotoLayers);

        li.exit()
            .remove();

        const liEnter = li.enter()
            .append('li')
            .attr('class', function(d) {
                var classes = 'list-item-photos list-item-' + d.id;
                if (d.id === 'mapillary-signs' || d.id === 'mapillary-map-features') {
                    classes += ' indented';
                }
                return classes;
            });

        // create a label for each photo layer
        function getTooltipText(layerID) {
            if (layerID === 'mapillary-signs') return 'mapillary.signs.tooltip';
            if (layerID === 'mapillary') return 'mapillary_images.tooltip';
            if (layerID === 'kartaview') return 'kartaview_images.tooltip';
            return layerID.replace(/-/g, '_') + '.tooltip';
        }

        const labelEnter = liEnter
            .append('label')
            .each(function (d) {
                const titleID = getTooltipText(d.id);

                d3_select(this)
                    .call(
                        uiTooltip()
                            .title(() => {
                                if (!isLayerRendered(d)) {
                                    return t.append('street_side.minzoom_tooltip');
                                }
                                return t.append(titleID);
                            })
                            .placement('top')
                    );
            });

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event, d) { toggleLayer(d.id); });

        labelEnter
            .append('span')
            .html(function(d) {
                var id = d.id;
                if (id === 'mapillary-signs') id = 'photo_overlays.traffic_signs';
                return t.html(id.replace(/-/g, '_') + '.title');
            });

        // Update
        li
            .merge(liEnter)
            .classed('active', isLayerEnabled)
            .selectAll('input')
            .property('disabled', (d) => !isLayerRendered(d))
            .property('checked', isLayerEnabled);
    }

    // select what photos you want to see. flat or 360
    function drawPhotoTypeFilter(selection) {
        const data = context.photos().allPhotoTypes();

        var ul = selection
            .selectAll('.layer-list-photo-types')
            .data([0]);

        ul.exit()
            .remove();

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-photo-types')
            .merge(ul);

        var li = ul.selectAll('.list-item-photo-types')
            .data(context.photos().shouldFilterByPhotoType() ? data : []);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', function(d) {
                return 'list-item-photo-types list-item-' + d;
            });

        const labelEnter = liEnter
            .append('label')
            .each(function (d) {
                d3_select(this)
                    .call(
                        uiTooltip()
                            .title(() => t.append('photo_overlays.photo_type.' + d + '.tooltip'))
                            .placement('top')
                    );
            });

        function setPhotoTypePreference(d3_event, d) {
            context.photos().togglePhotoType(d);

            const photoTypePreference = JSON.parse(preferences.get('photoTypesFilter') || '{}');
            photoTypePreference[d] = context.photos().showsPhotoType(d);
            preferences.set('photoTypesFilter', JSON.stringify(photoTypePreference));
        }

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', setPhotoTypePreference);

        labelEnter
            .append('span')
            .html((d) => t.html('photo_overlays.photo_type.' + d + '.title'));

        // Update
        function typeEnabled(type) {
            return context.photos().showsPhotoType(type);
        }

        li
            .merge(liEnter)
            .classed('active', typeEnabled)
            .selectAll('input')
            .property('checked', typeEnabled);
    }

    // select what date range you want to see photos from
    function drawDateFilter(selection) {
        var data = context.photos().dateFilters();

        var ul = selection
            .selectAll('.layer-list-date-filter')
            .data([0]);

        ul.exit()
            .remove();

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-date-filter')
            .merge(ul);

        var li = ul.selectAll('.list-item-date-filter')
            .data(context.photos().shouldFilterByDate() ? data : []);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', 'list-item-date-filter');

        var labelEnter = liEnter
            .append('label')
            .each(function(d) {
                d3_select(this)
                    .call(uiTooltip()
                        .title(() => t.append('photo_overlays.date_filter.' + d + '.tooltip'))
                        .placement('top')
                    );
            });

        labelEnter
            .append('span')
            .each(function(d) {
                t.append('photo_overlays.date_filter.' + d + '.title')(d3_select(this));
            });

        labelEnter
            .append('input')
            .attr('type', 'date')
            .attr('class', 'list-item-input')
            .attr('placeholder', t('units.year_month_day'))
            .call(utilNoAuto)
            .each(function(d) {
                utilGetSetValue(d3_select(this), context.photos().dateFilterValue(d) || '');
            })
            .on('change', function (d3_event, d) {
                const value = utilGetSetValue(d3_select(this)).trim();
                context.photos().setDateFilter(d, value, true);
                // reload the displayed dates
                li.selectAll('input')
                    .each(function (d) {
                        utilGetSetValue(d3_select(this), context.photos().dateFilterValue(d) || '');
                    });
            });

        // Update
        function filterEnabled(date) {
            return context.photos().dateFilterValue(date);
        }

        li = li
            .merge(liEnter)
            .classed('active', filterEnabled);
    }

    // select what usernames you want to see photos from
    function drawUsernameFilter(selection) {
        var ul = selection
            .selectAll('.layer-list-username-filter')
            .data([0]);

        ul.exit()
            .remove();

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-username-filter')
            .merge(ul);

        var li = ul.selectAll('.list-item-username-filter')
            .data(context.photos().shouldFilterByUsername() ? ['username-filter'] : []);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', 'list-item-username-filter');

        var labelEnter = liEnter
            .append('label')
            .each(function() {
                d3_select(this)
                    .call(uiTooltip()
                        .title(() => t.append('photo_overlays.username_filter.tooltip'))
                        .placement('top')
                    );
            });

        labelEnter
            .append('span')
            .call(t.append('photo_overlays.username_filter.title'));

        function usernameValue() {
            const usernames = context.photos().usernames();
            if (usernames) return usernames.join('; ');
            return usernames;
        }

        labelEnter
            .append('input')
            .attr('type', 'text')
            .attr('class', 'list-item-input')
            .call(utilNoAuto)
            .property('value', usernameValue)
            .on('change', function() {
                var value = d3_select(this).property('value');
                context.photos().setUsernameFilter(value, true);
                d3_select(this).property('value', usernameValue);
            });

        // Update
        function filterEnabled() {
            return context.photos().usernames();
        }

        li
            .merge(liEnter)
            .classed('active', filterEnabled);
    }



    // draw the local photos layer
    function drawLocalPhotos(selection) {
        const photoLayer = context.layers().layer('local-photos');
        const hasData = photoLayer && photoLayer.hasData();
        const showsData = hasData && photoLayer.enabled();

        var ul = selection
            .selectAll('.layer-list-local-photos')
            .data(photoLayer ? [0] : []);

        // Exit
        ul.exit()
            .remove();

        // Enter
        var ulEnter = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-local-photos');

        var localPhotosEnter = ulEnter
            .append('li')
            .attr('class', 'list-item-local-photos');

        var localPhotosLabelEnter = localPhotosEnter
            .append('label')
            .call(uiTooltip().title(() => t.append('local_photos.tooltip')));

        localPhotosLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() { toggleLayer('local-photos'); });

        localPhotosLabelEnter
            .call(t.append('local_photos.header'));

        localPhotosEnter
            .append('button')
            .attr('class', 'open-data-options')
            .call(uiTooltip()
                .title(() => t.append('local_photos.tooltip_edit'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                editLocalPhotos();
            })
            .call(svgIcon('#iD-icon-more'));

        localPhotosEnter
            .append('button')
            .attr('class', 'zoom-to-data')
            .call(uiTooltip()
                .title(() => t.append('local_photos.zoom'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                if (d3_select(this).classed('disabled')) return;

                d3_event.preventDefault();
                d3_event.stopPropagation();
                photoLayer.fitZoom();
            })
            .call(svgIcon('#iD-icon-framed-dot', 'monochrome'));

        // Update
        ul = ul
            .merge(ulEnter);

        ul.selectAll('.list-item-local-photos')
            .classed('active', showsData)
            .selectAll('label')
            .classed('deemphasize', !hasData)
            .selectAll('input')
            .property('disabled', !hasData)
            .property('checked', showsData);

        ul.selectAll('button.zoom-to-data')
            .classed('disabled', !hasData);
    }

    function editLocalPhotos() {
        context.container()
            .call(settingsLocalPhotos);
    }

    function localPhotosChanged(d) {
        const localPhotosLayer = context.layers().layer('local-photos');
        localPhotosLayer.fileList(d);
    }

    // lifecycle

    context.layers().on('change.uiSectionPhotoOverlays', section.reRender);
    context.photos().on('change.uiSectionPhotoOverlays', section.reRender);

    context.map().on(
            'move.photo_overlays',
            _debounce(() => {
                // layers in-view may have changed due to map move
                window.requestIdleCallback(section.reRender);
            }, 1000)
        );

    return section;
}
