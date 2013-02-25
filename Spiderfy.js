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

    _2PI: Math.PI * 2,
    _circleFootSeparation: 25, //related to circumference of circle
    _circleStartAngle: Math.PI / 6,

    _spiralFootSeparation:  28, //related to size of spiral (experiment!)
    _spiralLengthStart: 11,
    _spiralLengthFactor: 5,

    _circleSpiralSwitchover: 9, //show spiral instead of circle from this marker count upwards.
                                // 0 -> always spiral; Infinity -> always circle
    //Increase to increase the distance away that spiderfied markers appear from the center
    _spiderfyDistanceMultiplier: 1,

    _spiderfyLayer: null,
    _spiderFeatures: [],
    
    /**
     * Escuchar eventos en selectFeature. 
     * También definir en las opciones del control qué eventos se van a escuchar
     */
    
    

    /**
     * Constructor: OpenLayers.Control.Spiderfy
     *
     * Parameters:
     * options - {Object} 
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);

        var layer = this.selectControl.layer;
        var layers = [];
        if (!layer) {
            layers = this.selectControl.layers;
        } else {
            layers = [layer];
        }

        //FIXME meter esto en otro sitio
        if (!this._spiderfyLayer) {
            this._spiderfyLayer = new OpenLayers.Layer.Vector("Spiderman",
                {
                    styleMap: new OpenLayers.StyleMap(
                          {
                            "default" : new OpenLayers.Style(OpenLayers.Util.applyDefaults({ 
                                              fillColor: "#E8C1D0",
                                              fillOpacity: "${opacity}",
                                              strokeWidth: 2,
                                              strokeColor: "#A34E70",
                                              strokeOpacity: "${opacity}",
                                              pointRadius: "${pointRadius}"
                                            }, OpenLayers.Feature.Vector.style["default"]), { 
                                              context: { 
                                                opacity: function(feature) {
                                                    console.log(feature.attributes.opacity);
                                                  return feature.attributes.opacity || 1;
                                                },
                                                pointRadius: function(feature) {
                                                    console.log(feature.attributes.pointRadius);
                                                  return feature.attributes.pointRadius || 1;
                                                }  
                                              }
                                            })
                          }
                        )
                });

            var map;
            for (var i = 0, len = layers.length; i<len; i++) {
                map = layers[i].map;
                layers[i].events.on({
                    scope: this,
                    "featureselected": this.onFeatureSelected
                });
            }
            map.addLayer(this._spiderfyLayer);
            this._spiderfyLayer.setZIndex(10000);
        }
    },

    onFeatureSelected: function(feature) {
        this.__spiderfy(feature.cluster, feature.geometry);
    },

    __spiderfy: function(features, point) {

        // if (this._spiderfied || this._inZoomAnimation) {
        //     return;
        // }

        var layer = this.layer,
            map = this.layer.map,
            center = point,
            positions;
        
        this.__unspiderfy();
        setTimeout((function(self) {
            self._spiderfied = true;

            //TODO Maybe: features order by distance to center

            if (features.length >= self._circleSpiralSwitchover) {
                positions = self.__generatePointsSpiral(features.length);
            } else {
                center.y += 10; //Otherwise circles look wrong
                positions = self.__generatePointsCircle(features.length);
            }

            self._animationSpiderfy(features, positions, center);
        })(this), 1000);
    },

    __unspiderfy: function() {
        if (this._inZoomAnimation) {
            return;
        }
        this._animationUnspiderfy();

        this._spiderfied = false;
    },

    _animationUnspiderfy: function() {
        if(this.animationTween) {
           this.animationTween.stop();
        }

        this._unspiderFeatures = this._spiderFeatures.slice(0);

        if(!this.animationTween2) {
            this.animationTween2 = new OpenLayers.Tween(this.animationMethod);
        }

        this.animationTween2.start({
            x: 0.0, 
            y: 0.0
        }, {
            x: 1.0, 
            y: 1.0
        }, 20, {
            callbacks: {
                eachStep: OpenLayers.Function.bind(this.__animateUnspiderfyStep, this),
                done: OpenLayers.Function.bind(function(delta){
                    this.__animateUnspiderfyStep(delta);
                    this._spiderfyLayer.removeFeatures(this._unspiderFeatures);
                    this._unspiderFeatures = [];
                }, this)                
            }
        });

        this._spiderfied = false;
    },

    __animateUnspiderfyStep: function(delta) {
        var clusters = this._unspiderFeatures;
        for(var i=0; i<clusters.length; i++) {
            if(!clusters[i]._geometry) continue;

            var dx = (clusters[i]._geometry.destx - clusters[i]._geometry.origx) * delta.x;
            var dy = (clusters[i]._geometry.desty - clusters[i]._geometry.origy) * delta.y;
                    
            clusters[i].geometry.x = clusters[i]._geometry.destx - dx;
            clusters[i].geometry.y = clusters[i]._geometry.desty - dy; 

            clusters[i].attributes.opacity = 1 - delta.x;
        }
        //TODO actualizar aquí un atributo de opacidad que lo pille un context del estilo y se ponga a tope cuando termine la animación
        this._spiderfyLayer.redraw();
    },

    //Non Animated versions of everything
    _animationSpiderfy: function (features, positions, center) {
        var layer = this._spiderfyLayer,
            map = this.layer.map,
            i, m, leg, newPos, f;

        this._spiderFeatures = [];

        for (i = features.length - 1; i >= 0; i--) {
            newPos = positions[i];
            m = features[i].clone();

            m._preSpiderfyGeometry = m.geometry.clone();
            m.geometry = center.clone();

            
            m.geometry.move(newPos.x, newPos.y);
            m.attributes.notCluster = true;

            f = new OpenLayers.Feature.Vector();
            //FIXME la línea hacerla desde el punto real o desde el centro del cluster???
            f.geometry = new OpenLayers.Geometry.LineString([center, m.geometry]);
            m._geometry = {};
            m._geometry.origx = f.geometry.components[0].x;
            m._geometry.origy = f.geometry.components[0].y;
            m._geometry.destx = f.geometry.components[1].x;
            m._geometry.desty = f.geometry.components[1].y;

            this._spiderFeatures.push(m);

            layer.addFeatures([m]);


            // leg = new L.Polyline([this._latlng, newPos], { weight: 1.5, color: '#222' });
            // map.addLayer(leg);
            // m._spiderLeg = leg;
        }

        if(this.animationTween) {
           this.animationTween.stop();
        }
        this.animationTween.start({
            x: 0.0, 
            y: 0.0
        }, {
            x: 1.0, 
            y: 1.0
        }, 30, {
            callbacks: {
                eachStep: OpenLayers.Function.bind(this.__animateSpiderfyStep, this),
                done: OpenLayers.Function.bind(function(delta){
                    this.__animateSpiderfyStep(delta);
                }, this)
            }
        });
    },

    __animateSpiderfyStep: function(delta) {
        var clusters = this._spiderFeatures;
        for(var i=0; i<clusters.length; i++) {
            if(!clusters[i]._geometry) continue;

            var dx = (clusters[i]._geometry.destx - clusters[i]._geometry.origx) * delta.x;
            var dy = (clusters[i]._geometry.desty - clusters[i]._geometry.origy) * delta.y;
                    
            clusters[i].geometry.x = clusters[i]._geometry.origx + dx;
            clusters[i].geometry.y = clusters[i]._geometry.origy + dy; 

            clusters[i].attributes.opacity = delta.x;
            clusters[i].attributes.pointRadius = delta.x * 15;
        }
        //TODO actualizar aquí un atributo de opacidad que lo pille un context del estilo y se ponga a tope cuando termine la animación
        this._spiderfyLayer.redraw();
    },

    __animationSpiderfy: function(features, positions) {

    },

    __generatePointsCircle: function (count) {
        var circumference = this._spiderfyDistanceMultiplier * this._circleFootSeparation * (Math.floor(this.layer.map.getResolution() / 0.6)) * (2 + count),
            legLength = circumference / this._2PI,  //radius from circumference
            angleStep = this._2PI / count,
            res = [],
            i, angle, p,
            map = this.layer.map;

        res.length = count;

        for (i = count - 1; i >= 0; i--) {
            angle = this._circleStartAngle + i * angleStep;
            res[i] = new OpenLayers.Pixel(legLength * Math.cos(angle), legLength * Math.sin(angle));
        }

        return res;
    },

    __generatePointsSpiral: function (count) {
        var legLength = this._spiderfyDistanceMultiplier * (Math.floor(this.layer.map.getResolution() / 0.6)) * this._spiralLengthStart,
            separation = this._spiderfyDistanceMultiplier * (Math.floor(this.layer.map.getResolution() / 0.6)) * this._spiralFootSeparation,
            lengthFactor = this._spiderfyDistanceMultiplier * (Math.floor(this.layer.map.getResolution() / 0.6)) * this._spiralLengthFactor,
            angle = 0,
            res = [],
            i, p,
            map = this.layer.map;

        res.length = count;

        for (i = count - 1; i >= 0; i--) {
            angle += separation / legLength + i * 0.0005;
            res[i] = new OpenLayers.Pixel(legLength * Math.cos(angle), legLength * Math.sin(angle));
            legLength += this._2PI * lengthFactor / angle;
        }
        return res;
    },
    
    CLASS_NAME: "OpenLayers.Control.Spiderfy"
});
