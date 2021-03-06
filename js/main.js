// пожалуста не удаляей. это мне для статистики.
!function() {
    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * new Date();
        a = s.createElement(o),
            m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m)
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

    ga('create', 'UA-28343295-15', 'auto');
    ga('send', 'pageview');
}();

var settings = {
    // https://github.com/mbostock/d3/wiki/Time-Formatting
    dateFormat: d3.time.format("<strong>%H</strong>:<strong>%M</strong>:<strong>%S</strong> <strong>%d</strong>.<strong>%m</strong>.<strong>%Y</strong>")

    // шаг даты (текшее значение: 1 день каждую секунду)
    , stepDate : 24 * 60 * 60 * 1000

    // размер частиц (можно попробывать и другие d3.scale)
    , sizes : d3.scale.linear().range([1, 200])

    // цвета частиц (можно задать и вот так d3.scale.ordinal.domain(['pie', 'roll', ...]).range(['red', 'blue', ...]))
    // https://github.com/mbostock/d3/blob/master/src/scale/category.js
    , categoryColors : d3.scale.category20c()

    // пропускать пустые даты
    , skipEmptyDate : true

    // отвечает за появление частиц около стартовой точки
    , createNearParent : true

    // собствнно параметр отвечающий за продолжительность жизни частиц (Скорость растворения)
    // это параметр вступает в силу полсе того как частица перестает сиять
    // 0 — бессметртный
    , childLife : 0

    // при появлении увеличенный размер
    , increaseChildWhenCreated : true

    // при наложении частиц свечение
    , blendingLighter : true

    // частицы как плазма
    , drawAsPlasma : false

    // рисовать траекторию
    , drawTrack : true

    // максимальная скорость
    , maxSpeed : 10
};

!function () {
    var info = d3.select('#info').html()
        , tooltipParentTemplate = d3.select('#tooltipParentTemplate').html()
        , tooltipChildTemplate = d3.select('#tooltipChildTemplate').html()
        , tooltipCategoryTemplate = d3.select('#tooltipCategoryTemplate').html()
        , yearLabel = d3.select("#yearLabel")
        , moneyFormat = d3.format(",")
        , patternSetting = d3.select("#patternSetting").html()
        , logoBar
        ;

    var file = 'data.tsv';

    var map = L.mapbox.map('map')
        , visLayer = L.blackHoleLayer()
        , trendLayer = L.trendBar()
        , legend = L.categories()
        , markers = new L.MarkerClusterGroup({
            maxZoom: 18,
            maxClusterRadius: 1
        })
        , heat = L.heatLayer([], {
            max: 1,
            radius: 20,
            blur: 10,

            // цвета тепловой диаграммы для заказчиков
            gradient: {0.4: '#A5BAFF', 0.65: '#3F6CFF', 1: '#FF9A9A'},
            //#377CDC
            maxZoom: 18
        })
        , heatSupplier = L.heatLayer([], {
            max: 1,
            radius: 15,
            blur: 14,
            // цвета тепловой диаграммы для поставщиков
            gradient: {0.4: '#377CDC', 0.65: '#C3EF3C', 1: '#FF4041'},
            maxZoom: 18
        })

        , googleDark = new L.Google('ROADMAP', {
            attribution: "© Google",
            mapOptions: {
                backgroundColor: "#2B2B2B",
                styles : [
                    {
                        "stylers": [
                            {
                                "hue": "#ff1a00"
                            },
                            {
                                "invert_lightness": true
                            },
                            {
                                "saturation": -100
                            },
                            {
                                "lightness": 33
                            },
                            {
                                "gamma": 0.5
                            }
                        ]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#2D333C"
                            }
                        ]
                    }
                ]
            }
        })
        , googleDarkII = new L.Google('ROADMAP', {
            attribution: "© Google",
            mapOptions: {
                backgroundColor: "#2B2B2B",
                styles: [
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 17
                            }
                        ]
                    },
                    {
                        "featureType": "landscape",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 20
                            }
                        ]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry.fill",
                        "stylers": [
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 17
                            }
                        ]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry.stroke",
                        "stylers": [
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 29
                            },
                            {
                                "weight": 0.2
                            }
                        ]
                    },
                    {
                        "featureType": "road.arterial",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 18
                            }
                        ]
                    },
                    {
                        "featureType": "road.local",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 16
                            }
                        ]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 21
                            }
                        ]
                    },
                    {
                        "elementType": "labels.text.stroke",
                        "stylers": [
                            {
                                "visibility": "on"
                            },
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 16
                            }
                        ]
                    },
                    {
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "saturation": 36
                            },
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 40
                            }
                        ]
                    },
                    {
                        "elementType": "labels.icon",
                        "stylers": [
                            {
                                "visibility": "off"
                            }
                        ]
                    },
                    {
                        "featureType": "transit",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 19
                            }
                        ]
                    },
                    {
                        "featureType": "administrative",
                        "elementType": "geometry.fill",
                        "stylers": [
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 20
                            }
                        ]
                    },
                    {
                        "featureType": "administrative",
                        "elementType": "geometry.stroke",
                        "stylers": [
                            {
                                "color": "#000000"
                            },
                            {
                                "lightness": 17
                            },
                            {
                                "weight": 1.2
                            }
                        ]
                    }
                ]
            }
        })
        ;
    googleDark.addTo(map);

    map.setView([39.7718, -86.16123], 12).whenReady(handleReady);
    L.polyline([[0, 0]]).addTo(map);

    function onError(err) {
        console.error(err);
    }

    function fixInfo() {
        map.infoControl._info = {};
        map.infoControl.addInfo(info);
    }

    function handleReady() {

        map.removeControl(map.zoomControl);

        var range = L.control.rangeControl({
            position: 'bottomright',
            strings: {
                label: '<span class="oi" data-glyph="timer"></span>',
                title: 'Speed'
            },
            max : settings.maxSpeed,
            min : 0,
            step : 2,
            value : 0,
            action : {
                onChange : function () {
                    visLayer && visLayer._bh && visLayer._bh.speed(Math.abs(1000 / (this.value == 0 ? 1 : this.value)));
                },
                onGetValueText : function (value) {
                    value = value == 0 ? 1 : value;
                    return "<strong>" + value + "x</strong>"
                }
            }
        }).addTo(map);
        range.bar.hide();

        map.zoomControl = L.control.zoom({
            position: 'bottomright',
            zoomInTitle: 'Zoom In',
            zoomOutTitle: 'Zoom Out'
        }).addTo(map);

        L.control.resetZoom({
            position: 'bottomright',
            strings: {
                reset: 'Switch View'
            }
        }).addTo(map);

        map.on('moveend', fixInfo)
            .on('layeradd', fixInfo)
            .on('layerremove', fixInfo);

        var hashSuppliers = {}
            , hashCustomers = {}
            , data = []
            ;

        var stepDate = settings.stepDate
            , sizes = settings.sizes
            ;

        function calcRelation(obj) {
            return obj.key + ' (' + moneyFormat(obj.value) + ' US$.)';
        }

        function printRelations(rel) {
            return rel && rel.entries ? "<li>" + rel.entries().map(calcRelation).join('</li><li>') + "</li>" : "";
        }

        function applyParentTemplate(d) {
            return tooltipParentTemplate
                .replace('{{name}}', d.title)
                .replace('{{sum}}', moneyFormat(d.sum))
                .replace('{{count}}', d.orders);
        }

        function applyChildTemplate(d) {
            return d.type;
        }

        function applyCategoryTemplate(d) {
            var values = d3.map(d.values).values();

            return tooltipCategoryTemplate
                .replace('{{name}}', d.name)
                .replace('{{sum}}', moneyFormat(d3.sum(values)))
                .replace('{{count}}', values.length)
                ;
        }

        /* Preparing data */
        function makeParent(that, d) {
            that._id = d._id;
            that.latlng = new L.LatLng(d.latlng[0], d.latlng[1]);

            that.title = d.title;
            that.sum = 0;
            that.orders = 0;
            that.relations = d3.map({});

            that.x = {
                valueOf: function () {
                    var t = visLayer._map.latLngToLayerPoint(that.latlng);
                    return t.x;
                }
            };

            that.y = {
                valueOf: function () {
                    var t = visLayer._map.latLngToLayerPoint(that.latlng);
                    return t.y;
                }
            };

            return that;
        }

        function Customer(d) {
            var that = hashCustomers[d._id] = this;

            return makeParent(that, d);
        }

        function Supplier(d) {
            var that = hashSuppliers[d._id] = this;

            return makeParent(that, d);
        }

        function parseData(d) {
            var supp = [],
                cust = [];
            var parser = d3.time.format("%d.%m.%Y %H:%M").parse;

            d.forEach(function(k, index) {

                var s, c
                    , realDate = +(parser(k.datetime))
                    ;

                var startDate = realDate - stepDate;

                k.supplier = {
                    _id : 'from' + k.latitude_from + k.longitude_from,
                    latlng : [k.latitude_from, k.longitude_from],
                    title : k.label_from
                };

                k.customer = {
                    _id : 'to' + k.latitude_to + k.longitude_to,
                    latlng : [k.latitude_to, k.longitude_to]
                };

                s = hashSuppliers[k.supplier._id] || new Supplier(k.supplier);
                c = hashCustomers[k.customer._id] || new Customer(k.customer);

                k.price = parseFloat(k.price);

                function price() {
                    return k.price;
                }

                s.sum += k.price;
                s.orders++;

                c.sum += k.price;
                c.orders++;

                supp.push({
                    _id: index,
                    date: startDate,
                    parent : s,
                    type: k.type,
                    label : k.label_trend,
                    valueOf: price
                });

                cust.push({
                    _id: index,
                    date: realDate,
                    parent : c,
                    type: k.type,
                    label : k.label_trend,
                    valueOf: price
                });
            });

            supp.sort(function(a, b) {
                return a.date - b.date;
            });
            cust.sort(function(a, b) {
                return a.date - b.date;
            });
            return supp.concat(cust);
        }
        /* end preparing data */

        d3.tsv(file, function (err, rawData) {

            if (err) {
                console.error(err);
                return;
            }

            data = parseData(rawData);

            sizes.domain(d3.extent(data));

            var actions = L.control.actionConsole({
                keepOpen: true,
                position: 'topright',
                strings: {
                    play: 'Play',
                    stop: 'Stop',
                    pause: 'Pause',
                    repeat: 'Repeat'
                }
            }).addTo(map);

            visLayer.onHide = function () {
                actions.bar.hide();
            };

            visLayer.onShow = function () {
                actions.bar.show();
            };

            actions.buttons.pause.hide();
            actions.buttons.stop.hide();

            function stop() {
                actions.buttons.play.hide();
                actions.buttons.pause.hide();
                actions.buttons.stop.hide();
                actions.buttons.repeat.show();
            }

            var tooltip = d3.helper.tooltip()
                .padding(16)
                .text(function (d) {
                    var result = "";
                    if (d.type) {
                        result = applyChildTemplate(d.nodeValue);
                    }
                    else if (d.type === 0) {
                        result = applyParentTemplate(d.nodeValue);
                    }
                    else {
                        result = applyCategoryTemplate(d);
                    }
                    return result;
                });


            var panes = d3.select(map.getPanes().overlayPane);

            map.on('layeradd', function (e) {
                d3.selectAll(panes.node().children).datum(function () {
                    var t = d3.select(this);
                    return t.classed('leaflet-heatmap-layer')
                        ? 0
                        : t.classed('leaflet-blackhole-layer')
                        ? 2
                        : 1
                        ;
                }).sort();
            });

            legend.addTo(map);
            trendLayer.addTo(map).bar.hide();
            visLayer.addTo(map);

            L.control.layers({
                'GoogleMap Dark' : googleDark.addTo(map),
                'GoogleMap 2' : googleDarkII
            }, {
                'Legend': legend,
                'Heat Map (Agency)': heatSupplier.addTo(map),
                'Heat Map (Employee)': heat.addTo(map),
                'Tags': markers.addTo(map)
            }).addTo(map);

            L.control.fullscreen({position: 'bottomright'}).addTo(map);

            var hashDate = d3.set(data.map(function (d) {
                    return d.date;
                })).values()
                , leftHashBound = 0
                , parentMarker = {}
                , curPos = 0
                , categoryType = 0
                , dateFormat = settings.dateFormat
                ;

            visLayer._bh.setting.showTooltipOnContract = true;
            visLayer._bh.setting.showTooltipOnClient = true;
            visLayer._bh.setting.showTooltipOnLegend = false;

            legend.legend
                .on('mousemove', tooltip.mousemove)
                .on('mouseover', function (d) {
                    visLayer._bh.setting.showTooltipOnLegend
                    && tooltip.mouseover(d);
                    visLayer._bh.selectCategory(d);
                })
                .on('mouseout', function () {
                    tooltip.mouseout();
                    visLayer._bh.selectCategory(null);
                })
                .on('click', function (d) {
                    visLayer._bh.frozenCategory(d);
                });

            function legendResize() {
                var size = [map._size.x, map._size.y];

                tooltip.spaceWidth(size[0])
                    .spaceHeight(size[1]);

                renameCategories();
                legend.legend.size(370, size[1])
                    .categories(visLayer._bh.categories());
            }

            map.on('resize', legendResize)
                .on('viewreset', legendResize);

            visLayer._bh.setting.categoryColors = settings.categoryColors;
            visLayer._bh.setting.skipEmptyDate = settings.skipEmptyDate;
            visLayer._bh.setting.createNearParent = settings.createNearParent;
            visLayer._bh.setting.childLife = settings.childLife;
            visLayer._bh.setting.increaseChildWhenCreated = settings.increaseChildWhenCreated;
            visLayer._bh.setting.blendingLighter = settings.blendingLighter;
            visLayer._bh.setting.drawAsPlasma = settings.drawAsPlasma;
            visLayer._bh.setting.drawTrack = settings.drawTrack;

            visLayer._bh
                .on('getGroupBy', function (d) {
                    return d.date;
                })
                .on('getParentKey', function (d) {
                    return d._id;
                })
                .on('getChildKey', function (d) {
                    return d._id;
                })
                .on('getCategoryKey', function (d) {
                    return getCatKey(d);
                })
                .on('getCategoryName', function (d) {
                    return getCatName(d);
                })
                .on('getParentLabel', function (d) {
                    return d.name;
                })
                .on('getChildLabel', function (d) {
                    return d.nodeValue.label;
                })
                .on('calcRightBound', function (l) {
                    return l + stepDate;
                })
                .on('getVisibleByStep', function (d) {
                    return true;
                })
                .on('getCreateNearParent', function (d) {
                    return true; //d.parentNode.nodeValue instanceof Customer;
                })
                .on('getParentRadius', function (d) {
                    return 0;
                })
                .on('getChildRadius', function (d) {
                    return sizes(+d);
                })
                .on('getValue', function (d) {
                    return +d;
                })
                .on('getParentPosition', function (d) {
                    return [d.x, d.y];
                })
                .on('getParentFixed', function (d) {
                    return true;
                })
                .on('finished', function () {
                    stop();
                })
                .on('stopped', function () {
                    stop();
                })
                .on('starting', function () {
                })
                .on('started', function () {
                    legendResize();

                    trendLayer.bar.show();
                    legend.bar.show();
                    yearLabel.html('');
                    visLayer._reset();
                    yearLabel.classed('parsing', false);
                    waitParse.hide();
                    actions.buttons.play.hide();
                    actions.buttons.pause.show();
                    actions.buttons.stop.show();
                    actions.buttons.repeat.hide();
                    legend.bar.select('svg')
                        .style('background', 'rgba(255, 255, 255, .2)');
                })
                .on('processing', function (arr, l, r) {
                    renameCategories();
                    legend.legend
                        .categories(visLayer._bh.categories());

                    //legend.legend.update();

                    yearLabel.html(dateFormat(new Date(l)));
                    setTimeout(setMarkers(arr), 10);
                })
                .on('parsing', function () {
                    yearLabel.html([
                        "Analysis... <strong>",
                        Math.floor(curPos++ / 2),
                        "</strong>",
                        " of ",
                        data.length / 2
                    ].join(''));
                })
                .on('mouseovernode', function (d) {
                    if (d.type) {
                        legend.legend.selectCategory(d.category);
                        visLayer._bh.setting.showTooltipOnContract
                        && tooltip.mouseover(d);
                    }
                })
                .on('mouseoutnode', function () {
                    legend.legend
                        .selectCategory(null)
                    ;
                    tooltip.mouseout(null);
                })
                .on('mousemove', tooltip.mousemove)
                .sort(null /*function(a, b) {
                    return a.parent instanceof Customer && b.parent instanceof Customer
                        ? 0
                        : a.parent instanceof Supplier
                            ? 1
                            : -1;
                }*/)
            ;

            function onMouseMoveOnMarker(e) {
                tooltip.mousemove(this.__parentNode, 0, 0, e.originalEvent);
            }

            function onMouseOverToMarker(e) {
                visLayer._bh.setting.showTooltipOnClient
                && tooltip.mouseover(this.__parentNode, 0, 0, e.originalEvent);
                visLayer._bh.selectNode(this.__parentNode);
            }

            function onMouseOutFromMarker(e) {
                tooltip.mouseout();
                visLayer._bh.selectNode(null);
            }

            var commentLayer
                ;

            function keyForComment(d) {
                return d;
            }

            function getComment(d) {
                return d.label;
            }

            function updateComments(arr) {
                if (!arr || !arr.length)
                    return;

                commentLayer = commentLayer || d3.select(map._controlContainer)
                    .insert('div', 'firstChild')
                    .attr('class', 'commentLayer bottomleft')
                ;

                var ds = commentLayer.selectAll('h1')
                    .data(arr.map(getComment).filter(function(d) {
                            return !!d;
                        }), keyForComment)
                    ;

                ds.enter()
                    .insert('h1', ':first-child')
                    .text(keyForComment)
                    .style('height', 0)
                    .transition()
                    .duration(1500)
                    .style('height', '20px')
                ;

                ds.exit()
                    .style('opacity', 1)
                    .transition()
                    .duration(300)
                    .style('height', 0)
                    .style('opacity', 0)
                    .each('end', function() {
                        this && this.parentNode
                            && this.parentNode.removeChild(this);
                    });
            }

            function onlyCustomerFilter(d) {
                return d.parentNode.nodeValue instanceof Customer;
            }

            function setMarkers(arr) {
                return function() {
                    arr.forEach(function (d) {
                        var tp = d.parentNode.nodeValue;

                        if (!parentMarker[tp._id] && d.parentNode.nodeValue instanceof Supplier) {
                            var marker = parentMarker[tp._id] = L.marker(tp.latlng, {
                                icon: L.mapbox.marker.icon({
                                    'marker-symbol': tp instanceof Supplier ? 'Airline' : 'Hotel' ,
                                    'marker-color': '222234'
                                })
                            });

                            marker.__parentNode = d.parentNode;
                            marker.on('mouseover', onMouseOverToMarker)
                                .on('mousemove', onMouseMoveOnMarker)
                                .on('mouseout', onMouseOutFromMarker)
                                .bindPopup(applyParentTemplate(tp))
                            ;
                            markers.addLayer(marker);
                        }

                        (d.parentNode.nodeValue instanceof Supplier
                            ? heatSupplier : heat).addLatLng(tp.latlng);
                    });

                    var filtered = arr.filter(onlyCustomerFilter);

                    trendLayer.appendData(filtered);

                    updateComments(filtered);
                }
            }

            var allCounters
                , waitParse = actions.bar.append('a')
                .attr('class', 'wait')
                .on('click', function () {
                    if (d3.event) {
                        d3.event.stopPropagation();
                        d3.event.preventDefault();
                    }
                });

            waitParse.hide = actions.buttons.play.hide.bind(waitParse);
            waitParse.show = actions.buttons.play.show.bind(waitParse);
            waitParse.hide();

            actions.buttons.play.on('click', function () {
                if (visLayer._bh.IsPaused()) {
                    actions.buttons.pause.show();
                    actions.buttons.play.hide();
                    visLayer._bh.resume();
                }
                else {
                    actions.buttons.repeat.on('click')();
                }
            });

            actions.buttons.repeat.on('click', function () {
                curPos = 0;
                leftHashBound = 0;
                yearLabel.classed('parsing', true);
                waitParse.show();
                legend.bar.hide();
                actions.buttons.repeat.hide();
                actions.buttons.play.hide();
                range.bar.show();
                trendLayer.clearData();

                parentMarker = {};
                markers.clearLayers();
                heat.setLatLngs([]);
                heatSupplier.setLatLngs([]);

                visLayer.start(data);
            });

            actions.buttons.stop.on('click', function () {
                visLayer._bh.stop();
            });

            actions.buttons.pause.on('click', function () {
                actions.buttons.pause.hide();
                actions.buttons.play.show();
                visLayer._bh.pause();
            });

            actions.buttons.play.on('click')();

            d3.select(window).on("focus", function () {
                if (window.hasOwnProperty("needPlayShow")) {
                    if (window.needPlayShow)
                        actions.buttons.play.on('click')();
                    delete window.needPlayShow;
                }
            });

            d3.select(window).on("blur", function () {
                if (window.hasOwnProperty("needPlayShow"))
                    return;

                window.needPlayShow = visLayer._bh.IsRun() && !visLayer._bh.IsPaused();
                if (window.needPlayShow)
                    actions.buttons.pause.on('click')();
            });

            /IE/.test(window.navigator.userAgent)
            && legend.bar.insert('br', ':first-child');

            if (!logoBar) {
                logoBar = d3.select('#logoinfo')
                    .style({
                        width: null,
                        position: null,
                        "z-index": null,
                        color: null
                    });

                allCounters = legend.bar.insert('div', ':first-child')
                    .attr('class', 'allCounters');

                legend.bar.node().insertBefore(logoBar.node(), legend.bar.node().firstChild);
            }

            legend.bar.show();

            function renameCategories() {
                if (!visLayer._bh)
                    return;

                var cats = visLayer._bh.categories();

                allCounters.orders = 0;
                allCounters.summary = 0;
                cats.forEach(rename);
                allCounters.html([
                    'All Orders: ',
                    allCounters.orders,
                    '<br/>',
                    'Amount, $: ',
                    moneyFormat(allCounters.summary),
                    '<br/>'
                ].join(''));
            }

            function rename(key, value) {
                allCounters.orders += value.now.length;
                var sum = d3.sum(value.now, function(d) {
                    return +value.values['_1_' + d];
                });
                allCounters.summary += sum;
                value.name = [
                    value.key,
                    ' [',
                    'Orders: ',
                    value.now.length,
                    '; Amount, US$: ',
                    moneyFormat(sum),
                    '] '
                ].join('');
            }

            function getCatName(d) {
                return d.type;
            }

            function getCatKey(d) {
                return d.type;
            }
        });
    }
}();
