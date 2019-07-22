"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _lodash = _interopRequireDefault(require("lodash.get"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _default = function _default(callback) {
  var overlay;
  var overlayContext;
  var chartInstance;
  var parentElement;
  var state = {
    position: [],
    trailingEdge: null,
    width: 0
  };
  var cache = {};

  var setState = function setState(nextState) {
    state = _objectSpread({}, state, {}, nextState);
  };

  var getState = function getState() {
    return state;
  };

  var clear = function clear() {
    overlayContext.clearRect(0, 0, overlay.width, overlay.height);
  };

  var getLeadingEdge = function getLeadingEdge(evt) {
    var elems = chartInstance.getElementsAtXAxis(evt);

    if (!elems.length) {
      return -1;
    }

    var label = (0, _lodash["default"])(elems, [0, '_view', 'label'], null);
    var index = (0, _lodash["default"])(elems, [0, '_index'], null);
    return index;
  };

  var onMouseDown = function onMouseDown(evt) {
    clear();
    var index = getLeadingEdge(evt);
    if (index < 0) return;
    var rect = overlay.getBoundingClientRect();
    var clientX = evt.clientX,
        clientY = evt.clientY;
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    setState({
      position: [x, y],
      trailingEdge: {
        index: index
      }
    });
  };

  var onMouseUp = function onMouseUp(evt) {
    var _getState = getState(),
        trailingEdge = _getState.trailingEdge;

    if (!trailingEdge) return;
    var leadingEdge = getLeadingEdge(evt);
    setState({
      trailingEdge: null
    });

    if (leadingEdge === trailingEdge) {
      return;
    }

    clear();
    Object.values(cache).forEach(function (_ref) {
      var index = _ref.index,
          datasetIndex = _ref.datasetIndex,
          color = _ref.color,
          key = _ref.key;
      chartInstance.data.datasets[datasetIndex].backgroundColor[index] = color;
    });
    chartInstance.update();
    callback(evt, {
      leadingEdge: leadingEdge,
      trailingEdge: trailingEdge
    });
  };

  function drawOverlay(evt) {
    clear();
    var clientX = evt.clientX;
    var state = getState();

    var _state$position = _slicedToArray(state.position, 1),
        x = _state$position[0];

    var rect = overlay.getBoundingClientRect();
    var width = Math.floor(clientX - rect.left - x);
    var chartArea = chartInstance.chartArea;
    setState({
      width: width
    });
    overlayContext.fillRect(x, chartArea.top, width, chartArea.bottom - chartArea.top);
  }

  function getElements(evt) {
    return chartInstance.getElementsAtXAxis(evt).map(function (elem) {
      return {
        key: "".concat(elem._datasetIndex, "-").concat(elem._index),
        index: elem._index,
        datasetIndex: elem._datasetIndex,
        color: elem._model.backgroundColor
      };
    });
  }

  function setCache(elem) {
    if (cache[elem.key]) {
      return;
    }

    cache[elem.key] = elem;
  }

  function modifyColorInPlace(datasetIndex, trailingEdge, leadingEdge) {
    return function (color, index) {
      var key = "".concat(datasetIndex, "-").concat(index);
      var elem = cache[key];
      var isBackward = trailingEdge.index > leadingEdge.index;

      if (index >= (isBackward ? leadingEdge.index : trailingEdge.index) && index <= (isBackward ? trailingEdge.index : leadingEdge.index)) {
        this[index] = '#7CF261';
        return;
      }

      if (elem) {
        this[index] = elem.color;
      }
    };
  }

  var onMouseMove = function onMouseMove(evt) {
    var clientX = evt.clientX;

    var _getState2 = getState(),
        trailingEdge = _getState2.trailingEdge;

    if (trailingEdge) {
      drawOverlay(evt);
      var elems = getElements(evt);
      elems.forEach(setCache);

      if (elems.length) {
        var leadingEdge = {
          index: elems[0].index
        };
        chartInstance.data.datasets.forEach(function (dataset, index) {
          dataset.backgroundColor.forEach(modifyColorInPlace(index, trailingEdge, leadingEdge), dataset.backgroundColor);
        });
      }

      chartInstance.update();
    }
  };

  var plugin = {
    afterInit: function afterInit(chart, options) {
      chartInstance = chart;
      parentElement = chart.canvas.parentElement;
      overlay = document.createElement('canvas');
      overlay.style.background = 'transparent';
      overlay.style.position = 'absolute';
      overlay.style.cursor = 'crosshair';
      overlay.style.zIndex = 2;
      overlay.style.opacity = 0.2;
      overlay.style.pointerEvents = 'none';
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = "".concat(chart.canvas.offsetWidth, "px");
      overlay.style.height = "".concat(chart.canvas.offsetHeight, "px");
      overlay.width = chart.canvas.offsetWidth;
      overlay.height = chart.canvas.offsetHeight;
      parentElement.appendChild(overlay);
      chart.canvas.onmousedown = onMouseDown;
      chart.canvas.onmouseup = onMouseUp;
      chart.canvas.onmousemove = onMouseMove;
      overlayContext = overlay.getContext('2d');
    },
    destroy: function destroy(chart, options) {
      if (parentElement) {
        parentElement.removeChild(overlay);
      }
    }
  };
  return plugin;
};

exports["default"] = _default;