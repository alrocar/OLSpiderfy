/* Copyright (c) 2013 by Alberto Romeu (aromeu@prodevelop.es). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Control/SelectFeature.js
 */

/**
 * Class: OpenLayers.Control.SelectFeature
 * The SelectFeature control selects vector features from a given layer on 
 * click or hover. 
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Spiderfy = OpenLayers.Class(OpenLayers.Control, {

    /** 
     * APIProperty: events
     * {<OpenLayers.Events>} Events instance for listeners and triggering
     *     control specific events.
     *
     * Register a listener for a particular event with the following syntax:
     * (code)
     * control.events.register(type, obj, listener);
     * (end)
     *
     * Supported event types (in addition to those from <OpenLayers.Control.events>):
     * beforespiderfy - Triggered before a set of features are spiderfied
     * spiderfy - Triggered when a set of features have been spiderfied
     * unspiderfy - Triggered when a set of features have been unspiderfied
     * afterspiderfy - Triggered after a set of features have been spiderfied
     * beforeunspiderfy - Triggered before a set of features are unspiderfied
     * afterunspiderfy - Triggered after a set of features have been unspiderfied
     */
    
    /**
     * APIProperty: selectControl
     * {OpenLayers.Control.SelectFeature} A SelectFeature control to listen selection events
     */
    selectControl: null, 
    
    /**
     * Escuchar eventos en selectFeature. 
     * También definir en las opciones del control qué eventos se van a escuchar
     */
    
    

    /**
     * Constructor: OpenLayers.Control.SelectFeature
     * Create a new control for selecting features.
     *
     * Parameters:
     * layers - {<OpenLayers.Layer.Vector>}, or an array of vector layers. The
     *     layer(s) this control will select features from.
     * options - {Object} 
     */
    initialize: function(layers, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },
    
    CLASS_NAME: "OpenLayers.Control.Spiderfy"
});
