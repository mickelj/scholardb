"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var getDate = function getDate(_ref) {
  var _ref$dateParts = _slicedToArray(_ref['date-parts'], 1),
      date = _ref$dateParts[0];

  var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '-';
  var dateParts = date.map(function (part) {
    return part.toString();
  });

  switch (dateParts.length) {
    case 3:
      dateParts[2] = dateParts[2].padStart(2, '0');

    case 2:
      dateParts[1] = dateParts[1].padStart(2, '0');

    case 1:
      dateParts[0] = dateParts[0].padStart(4, '0');
      break;
  }

  return dateParts.join(delimiter);
};

var _default = getDate;
exports.default = _default;