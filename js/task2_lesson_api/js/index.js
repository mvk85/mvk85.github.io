(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Filter = function () {
    function Filter() {
        _classCallCheck(this, Filter);
    }

    _createClass(Filter, [{
        key: 'filter',
        value: function filter(params, table) {
            var arElements = void 0;
            var filter = params.filter;
            var result = [];

            if (table) {
                arElements = params.data[table];
            } else {
                arElements = params.data;
            }

            for (var i = 0; i < arElements.length; i++) {
                var lesson = arElements[i];
                var isMatch = this._isMatchingEntry(filter, lesson);

                if (isMatch) {
                    result.push(lesson);
                }
            }

            return result;
        }

        /**
         * @param filter
         * @param lesson
         * @returns {boolean}
         * @private
         *
         * @example filter
         * { id: 1 }
         * { name: 'Адаптивная вёрстка' }
         * { school: { key: 'id', value: 1 } }
         */

    }, {
        key: '_isMatchingEntry',
        value: function _isMatchingEntry(filter, lesson) {
            var arFilter = Object.keys(filter);

            for (var j = 0; j < arFilter.length; j++) {
                var keyFilter = arFilter[j];
                var valueLesson = lesson[keyFilter];
                var valueFilter = filter[keyFilter];

                if (keyFilter === 'date') {
                    var fromLesson = valueLesson.from;
                    var toLesson = valueLesson.to;
                    var fromFilter = valueFilter.from;
                    var toFilter = valueFilter.to;

                    if (!(fromFilter <= fromLesson && toFilter > fromLesson || fromFilter > fromLesson && fromFilter < toLesson)) {
                        return false;
                    }
                } else if (Array.isArray(valueLesson)) {
                    var isMatch = false;

                    for (var i = 0; i < valueLesson.length; i++) {
                        var item = valueLesson[i];

                        if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object') {
                            if (this.isMatching(item[valueFilter["key"]], valueFilter["value"])) {
                                isMatch = true;
                                break;
                            }
                        } else {
                            if (this.isMatching(item, valueFilter)) {
                                isMatch = true;
                                break;
                            }
                        }
                    }

                    if (!isMatch) {
                        return false;
                    }
                } else if ((typeof valueLesson === 'undefined' ? 'undefined' : _typeof(valueLesson)) === 'object' && (typeof valueFilter === 'undefined' ? 'undefined' : _typeof(valueFilter)) === 'object') {

                    if (!this.isMatching(valueLesson[valueFilter["key"]], valueFilter["value"])) {
                        return false;
                    }
                } else {

                    if (!this.isMatching(valueLesson, valueFilter)) {
                        return false;
                    }
                }
            }

            return true;
        }
    }, {
        key: 'isMatching',
        value: function isMatching(val1, val2) {
            if (typeof val1 === 'string' && typeof val2 === 'string') {
                val1 = val1.toLowerCase();
                val2 = val2.toLowerCase();

                return val1.indexOf(val2) == -1 ? false : true;
            } else if (typeof val1 === 'number' && typeof val2 === 'number') {

                return val1 === val2 ? true : false;
            }

            throw new TypeError('Type is undefined, it\'s not string or number. Function isMatching');
        }
    }, {
        key: 'isEmptyInputs',
        value: function isEmptyInputs(arValue) {
            for (var i = 0; i < arValue.length; i++) {
                if (!this.isEmpty(arValue[i])) {
                    return false;
                }
            }

            return true;
        }
    }, {
        key: 'isEmpty',
        value: function isEmpty(value) {
            return value ? false : true;
        }
    }]);

    return Filter;
}();

exports.default = Filter;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _db = require('./data/db');

var _db2 = _interopRequireDefault(_db);

var _table = require('./_table');

var _table2 = _interopRequireDefault(_table);

var _template = require('./template/template');

var _template2 = _interopRequireDefault(_template);

var _popup = require('./_popup');

var _popup2 = _interopRequireDefault(_popup);

var _filter2 = require('./_filter');

var _filter3 = _interopRequireDefault(_filter2);

var _date = require('./assets/date');

var _date2 = _interopRequireDefault(_date);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Mediator = function () {
    function Mediator(options) {
        _classCallCheck(this, Mediator);

        this.db = new _db2.default();
        this.templates = new _template2.default();
        this.popup = new _popup2.default();
        this.table = new _table2.default({
            table: options.table,
            template: this.templates,
            popup: this.popup,
            data: this.db.getData()
        });
        this.filters = new _filter3.default();
        this.date = new _date2.default();
        this.const = {
            TEMPLATE_LESSONS: 'lessons'
        };
    }

    _createClass(Mediator, [{
        key: 'add',
        value: function add(data) {
            var result = this.db.add(data);

            if (!result.error) {
                this.tableRender();
            }

            return result;
        }
    }, {
        key: 'update',
        value: function update(data) {
            var result = this.db.update(data);

            if (!result.error) {
                this.tableRender();
            }

            return result;
        }
    }, {
        key: 'filter',
        value: function filter(_filter) {
            var params = {};
            var arLessons = void 0;
            var lessons = void 0;

            params.filter = _filter;
            params.data = this.db.getData().data;
            arLessons = this.filters.filter(params);
            lessons = this.templates.template(this.const.TEMPLATE_LESSONS, arLessons);

            if (_typeof(this.table) == 'object') {
                this.table.tableRender(lessons);
            }

            return arLessons;
        }
    }, {
        key: 'getEntry',
        value: function getEntry(params, table) {
            var entry = void 0;

            if (!table) {
                entry = this.filters.filter({
                    filter: params,
                    data: this.db.getData().data
                });
            } else {
                entry = this.filters.filter({
                    filter: params,
                    data: this.db.getData().dataRaw
                }, table);
            }

            return entry[0];
        }
    }, {
        key: 'getEntries',
        value: function getEntries(table) {
            if (table) {
                return this.db.dataRaw[table];
            }

            return this.db.data;
        }
    }, {
        key: 'tableRender',
        value: function tableRender() {
            var data = this.db.getData().data;
            var lessons = this.templates.template(this.const.TEMPLATE_LESSONS, data);

            this.table.tableRender(lessons);
        }
    }]);

    return Mediator;
}();

exports.default = Mediator;

},{"./_filter":1,"./_popup":3,"./_table":4,"./assets/date":5,"./data/db":8,"./template/template":11}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Popup = function () {
    function Popup() {
        _classCallCheck(this, Popup);

        this.initWindow();
    }

    _createClass(Popup, [{
        key: 'initWindow',
        value: function initWindow() {
            var win = document.querySelector('.popup__cnt');

            if (!win) {
                win = document.createElement('div');
                win.classList.add('popup__cnt');
                win.innerHTML = '<div class="popup__cnt--window"></div>';
                document.body.appendChild(win);
            }

            this.win = win;
        }
    }, {
        key: 'open',
        value: function open(content) {
            this.win.classList.add('active');
            this.setContent(content);
        }
    }, {
        key: 'eventClose',
        value: function eventClose(nodeString) {
            var _this = this;

            var node = document.querySelector(nodeString);

            node.addEventListener('click', function (event) {
                _this.close();
                event.preventDefault();
            });
        }
    }, {
        key: 'close',
        value: function close() {
            this.win.classList.remove('active');
        }
    }, {
        key: 'setContent',
        value: function setContent(content) {
            var container = this.win.querySelector('.popup__cnt--window');

            container.innerHTML = content;
        }
    }]);

    return Popup;
}();

exports.default = Popup;

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Table = function () {
    function Table(options) {
        _classCallCheck(this, Table);

        this.table = document.querySelector(options.table);
        this.popup = options.popup;
        this.templates = options.template;
        this.dataRaw = options.data.dataRaw;
        this._initEvent();
    }

    _createClass(Table, [{
        key: 'tableRender',
        value: function tableRender(content) {
            var tbody = this.table.querySelector('tbody');

            tbody.innerHTML = content;
        }
    }, {
        key: '_initEvent',
        value: function _initEvent() {
            var _this = this;

            var table = this.table;

            table.addEventListener('click', function (event) {
                var target = event.target;

                if (target.tagName !== 'A') {
                    return;
                }

                if (target.classList.contains('lesson__lector')) {
                    var id = target.dataset.id;

                    _this._renderPopup('lector', id);
                } else if (target.classList.contains('lesson__material')) {
                    var _id = target.dataset.id;

                    _this._renderPopup('material', _id);
                }
            });
        }
    }, {
        key: '_renderPopup',
        value: function _renderPopup(key, id) {
            var fields = this._getFields(this.dataRaw[key]);
            var content = this.templates.template(key, fields[id]);

            event.preventDefault();
            this.popup.open(content);
            this.popup.eventClose('.p_close');
        }
    }, {
        key: '_getFields',
        value: function _getFields(data) {
            var result = {};

            for (var i = 0; i < data.length; i++) {
                var element = data[i];

                if (element) {
                    result['' + element.id] = element;
                }
            }

            return result;
        }
    }]);

    return Table;
}();

exports.default = Table;

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ODate = function () {
    function ODate() {
        _classCallCheck(this, ODate);

        this.date = new Date();
    }

    _createClass(ODate, [{
        key: 'getDate',
        value: function getDate(mounth) {
            return new Date(2017, +mounth + 1, 0).getDate();
        }
    }, {
        key: 'getDateDetail',
        value: function getDateDetail(date) {
            return this._formatDateField(date);
        }
    }, {
        key: '_formatDateField',
        value: function _formatDateField(date) {
            var from = new Date(date.from);
            var to = new Date(date.to);

            var yearFrom = from.getFullYear();
            var monthFrom = from.getMonth();
            var dateFrom = from.getDate();
            var hourFrom = from.getHours();
            var minFrom = from.getMinutes();

            var yearTo = to.getFullYear();
            var monthTo = to.getMonth();
            var dateTo = to.getDate();
            var hourTo = to.getHours();
            var minTo = to.getMinutes();

            return {
                from: {
                    year: yearFrom,
                    month: monthFrom,
                    date: dateFrom,
                    hour: hourFrom,
                    min: minFrom
                },
                to: {
                    year: yearTo,
                    month: monthTo,
                    date: dateTo,
                    hour: hourTo,
                    min: minTo
                }
            };
        }
    }, {
        key: '_formatDateAddNull',
        value: function _formatDateAddNull(number) {
            if (number < 10) {
                return '0' + number;
            }

            return number;
        }
    }]);

    return ODate;
}();

exports.default = ODate;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _date = require('./date');

var _date2 = _interopRequireDefault(_date);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Start = function () {
    function Start(mediator) {
        _classCallCheck(this, Start);

        this.mediator = mediator;
        this.plaginContainers = document.querySelectorAll('.plagin__container');
        this.editForm = document.querySelector('form[name="form_edit_fields"]');
        this.tabContainer = document.querySelector('#plagin__scheduler--edit');
        this.date = new _date2.default();
        this._init();
        this.updateSelectTab();
        this.watchSelectTab();
    }

    _createClass(Start, [{
        key: 'updateSelectTab',
        value: function updateSelectTab() {
            var tabContainer = this.tabContainer;
            var selects = tabContainer.querySelectorAll('select[data-selected]');

            for (var i = 0; i < selects.length; i++) {
                var select = selects[i];
                var table = select.dataset.selected;
                var lessons = this.mediator.getEntries(table);

                this._fillSelectOptions(lessons, select);
                this._updateContentTab(table, select);
            }
        }
    }, {
        key: 'watchSelectTab',
        value: function watchSelectTab() {
            var _this = this;

            var tabContainer = this.tabContainer;

            tabContainer.addEventListener('change', function (event) {
                var target = event.target;

                if (target.tagName == 'SELECT' && target.dataset.selected) {
                    var table = target.dataset.selected;

                    _this._updateContentTab(table, target);
                }
            });
        }
    }, {
        key: '_updateContentTab',
        value: function _updateContentTab(table, target) {
            var id = target.value;
            var params = { id: +id };
            var entry = this.mediator.getEntry(params, table);

            if (table == 'lessons') {
                this._updateTabLessons(target, entry);
            } else if (table == 'school') {
                this._updateTabSchool(target, entry);
            } else if (table == 'classroom') {
                this._updateTabClassroom(target, entry);
            }
        }
    }, {
        key: '_fillSelectOptions',
        value: function _fillSelectOptions(elements, select) {
            var options = '';

            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                options += '<option value = "' + element.id + '">' + element.name + '</option>';
            }

            select.innerHTML = options;
        }
    }, {
        key: '_updateTabClassroom',
        value: function _updateTabClassroom(target, entry) {
            var container = target.closest('.plagin__body-tab-cont');
            var name = container.querySelector('input[name="classroom_name"]');
            var location = container.querySelector('input[name="location"]');
            var capacity = container.querySelector('input[name="capacity"]');

            name.value = entry.name;
            location.value = entry.location;
            capacity.value = entry.capacity;
        }
    }, {
        key: '_updateTabSchool',
        value: function _updateTabSchool(target, entry) {
            var container = target.closest('.plagin__body-tab-cont');
            var name = container.querySelector('input[name="school_name"]');
            var quantity = container.querySelector('input[name="student_quantity"]');

            name.value = entry.name;
            quantity.value = entry.students;
        }
    }, {
        key: '_updateTabLessons',
        value: function _updateTabLessons(target, entry) {
            var container = target.closest('.plagin__body-tab-cont');
            var name = container.querySelector('input[name="lesson_name"]');
            var school = container.querySelector('select[name="school"]');
            var lector = container.querySelector('select[name="lector"]');
            var classroom = container.querySelector('select[name="classroom"]');
            var date = container.querySelector('.date');
            var tableSchool = this.mediator.db.dataRaw.school;

            this._fillSelectOptions(tableSchool, school);
            name.value = entry.name;
            lector.value = entry.lector.id;
            classroom.value = entry.classroom.id;
            this._setDateField(entry.date, date);
            this._setOptions(entry.school, school);
        }
    }, {
        key: '_setDateField',
        value: function _setDateField(date, dateContainer) {
            var dateFields = this.mediator.date.getDateDetail(date);

            this._setDateFromTo(dateContainer, dateFields);
        }
    }, {
        key: '_setDateFromTo',
        value: function _setDateFromTo(container, dateFields) {
            var rowContainers = container.querySelectorAll('.date__rows');
            var rows = this._getRowContainers(rowContainers);
            var linkDateField = {
                from: this._getDateField(rows.from),
                to: this._getDateField(rows.to)
            };

            var keys = Object.keys(linkDateField.from);

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];

                this._setOptionsDate(dateFields.from[key], linkDateField.from[key]);
                this._setOptionsDate(dateFields.to[key], linkDateField.to[key]);
            }
        }
    }, {
        key: '_getRowContainers',
        value: function _getRowContainers(rowContainers) {
            var rows = {};

            for (var i = 0; i < rowContainers.length; i++) {
                var row = rowContainers[i];
                var data = row.dataset.date;

                rows[data] = row;
            }

            return rows;
        }
    }, {
        key: '_getDateField',
        value: function _getDateField(row) {
            var month = row.querySelector('select[name="month"]');
            var date = row.querySelector('select[name="day"]');
            var hour = row.querySelector('select[name="hour"]');
            var min = row.querySelector('select[name="minut"]');

            return {
                month: month,
                date: date,
                hour: hour,
                min: min
            };
        }
    }, {
        key: '_setOptionsDate',
        value: function _setOptionsDate(valueOption, select) {
            var options = select.options;

            if (!options) {
                return '';
            }

            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                var value = valueOption;

                if (option.value == value) {
                    option.selected = true;
                } else {
                    option.selected = false;
                }
            }
        }
    }, {
        key: '_setOptions',
        value: function _setOptions(valueOptions, select) {
            var options = select.options;

            if (!options) {
                return '';
            }

            if (Array.isArray(valueOptions)) {
                for (var i = 0; i < options.length; i++) {
                    var option = options[i];

                    for (var j = 0; j < valueOptions.length; j++) {
                        var value = valueOptions[j].id;

                        if (option.value == value) {
                            option.selected = true;
                            break;
                        } else {
                            option.selected = false;
                        }
                    }
                }
            } else {
                for (var _i = 0; _i < options.length; _i++) {
                    var _option = options[_i];

                    var _value = valueOptions.id;

                    if (_option.value == _value) {
                        _option.selected = true;
                    } else {
                        _option.selected = false;
                    }
                }
            }
        }
    }, {
        key: '_init',
        value: function _init() {
            var _this2 = this;

            var containers = this.plaginContainers;

            var _loop = function _loop(i) {
                var container = containers[i];
                var title = container.querySelector('.plagin__title');
                var body = container.querySelector('.plagin__body');

                body.classList.toggle('active');
                title.addEventListener('click', function () {
                    body.classList.toggle('active');
                });

                body.addEventListener('change', function (event) {
                    var target = event.target;

                    if (target.tagName === 'SELECT' && target.getAttribute('name') === 'month') {
                        var month = +target.value;
                        var date = _this2.date.getDate(month);
                        var options = _this2._compileDate(date);
                        var dateSelect = target.closest('.date__rows').querySelector('select[name="day"]');

                        dateSelect.innerHTML = options;
                    }
                });

                body.addEventListener('click', function (event) {
                    var target = event.target;

                    if (target.closest('.radio') && target.tagName === 'INPUT') {
                        var value = target.value;
                        var tabContainers = body.querySelectorAll('.plagin__body-tab-cont');
                        var tabCont = void 0;

                        for (var _i2 = 0; _i2 < tabContainers.length; _i2++) {
                            var tabContainer = tabContainers[_i2];

                            tabContainer.classList.remove('active');

                            if (tabContainer.dataset.tab == value) {
                                tabCont = tabContainer;
                            }
                        }

                        tabCont.classList.add('active');
                    }
                });
            };

            for (var i = 0; i < containers.length; i++) {
                _loop(i);
            }

            this.editForm.addEventListener('submit', function (event) {
                event.preventDefault();
            });
        }
    }, {
        key: '_compileDate',
        value: function _compileDate(date) {
            var length = date + 1;
            var options = [];

            for (var i = 1; i < length; i++) {
                var option = '<option value = "' + i + '">' + i + '</option>';

                options.push(option);
            }

            return options.join('');
        }
    }]);

    return Start;
}();

exports.default = Start;

},{"./date":5}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var dataRaw = {
    lessons: [{
        id: 1,
        school: { id: 1 },
        name: 'Адаптивная вёрстка',
        lector: { id: 1 },
        date: { from: 1498926600000, to: 1498930200000 }, // 1.07 19:30-20:30
        classroom: { id: 1 },
        material: { id: 1 }
    }, {
        id: 2,
        school: { id: 1 },
        name: 'Работа с сенсорным пользовательским вводом',
        lector: { id: 1 },
        date: { from: 1499013000000, to: 1499020200000 }, // 2.07 19:30-21:30
        classroom: { id: 1 }
    }, {
        id: 3,
        school: { id: 1 },
        name: 'Мультимедиа: возможности браузера',
        lector: { id: 2 },
        date: { from: 1499099400000, to: 1499106600000 }, // 3.07 19:30-21:30
        classroom: { id: 2 }
    }, {
        id: 4,
        school: { id: 2 },
        name: 'Java Blitz (Часть 1)',
        lector: { id: 3 },
        date: { from: 1498924860000, to: 1498932060000 }, // 1.07 19:00-21:00
        classroom: { id: 3 },
        material: { id: 2 }
    }, {
        id: 5,
        school: { id: 2 },
        name: 'Git & Workflow',
        lector: { id: 4 },
        date: { from: 1499013000000, to: 1499016600000 }, // 2.07 19:30-20:30
        classroom: { id: 4 }
    }, {
        id: 6,
        school: { id: 2 },
        name: 'Java Blitz (Часть 2)',
        lector: { id: 3 },
        date: { from: 1499099400000, to: 1499104860000 }, // 3.07 19:30-21:00
        classroom: { id: 3 }
    }, {
        id: 7,
        school: { id: 3 },
        name: 'Идея, исследование, концепт (Часть 1)',
        lector: { id: 5 },
        date: { from: 1498926600000, to: 1498932060000 }, // 1.07 19:30-21:00
        classroom: { id: 4 },
        material: { id: 3 }
    }, {
        id: 8,
        school: { id: 3 },
        name: 'Идея, исследование, концепт (Часть 2)',
        lector: { id: 5 },
        date: { from: 1499011260000, to: 1499018460000 }, // 2.07 19:00-21:00
        classroom: { id: 2 }
    }, {
        id: 9,
        school: { id: 3 },
        name: 'Особенности проектирования мобильных интерфейсов',
        lector: { id: 6 },
        date: { from: 1499097660000, to: 1499104860000 }, // 3.07 19:00-21:00
        classroom: { id: 1 }
    }, {
        id: 10,
        school: [{ id: 1 }, { id: 2 }, { id: 3 }],
        name: 'Идея, исследование, концепт (Часть 2)',
        lector: { id: 5 },
        date: { from: 1499184060000, to: 1499191260000 }, // 4.07 19:00-21:00
        classroom: { id: 2 }
    }, {
        id: 11,
        school: [{ id: 1 }, { id: 2 }, { id: 3 }],
        name: 'Особенности проектирования мобильных интерфейсов',
        lector: { id: 6 },
        date: { from: 1499270460000, to: 1499277660000 }, // 5.07 19:00-21:00
        classroom: { id: 5 }
    }],
    material: [{
        id: 1,
        name: 'Материалы',
        src: 'https://events.yandex.ru/lib/talks/4162/'
    }, {
        id: 2,
        name: 'Материалы',
        src: 'https://events.yandex.ru/lib/talks/4162/'
    }, {
        id: 3,
        name: 'Материалы',
        src: 'https://events.yandex.ru/lib/talks/4162/'
    }],
    lector: [{
        id: 1,
        name: 'Дмитрий Душкин',
        src: 'https://avatars.mds.yandex.net/get-yaevents/95043/0914ac42b6dc11e687ef002590c62a5c/big',
        description: 'Кандидат технических наук, научный сотрудник ИПУ РАН с 2008 по 2013. Пришёл в Яндекс.Картинки в 2014 году, отвечал за мобильную версию и рост производительности сервиса. В 2016 перешёл в Yandex Data Factory, где разрабатывает интерфейсы и дизайн веб-приложений для B2B.'
    }, {
        id: 2,
        name: 'Максим Васильев',
        src: 'https://avatars.mds.yandex.net/get-yaevents/194464/21e1dae2b6dc11e687ef002590c62a5c/big',
        description: 'Во фронтенд-разработке с 2007 года. До 2013-го, когда пришёл в Яндекс, работал технологом в студии Лебедева и других компаниях.'
    }, {
        id: 3,
        name: 'Эдуард Мацуков',
        src: 'https://avatars.mds.yandex.net/get-yaevents/198307/9d9a8672b6da11e687ef002590c62a5c/big',
        description: 'Разрабатываю приложения для Android с 2010 года. В 2014 делал высоконагруженное финансовое приложение. Тогда же начал осваивать АОП, внедряя язык в продакшн. В 2015 разрабатывал инструменты для Android Studio, позволяющие использовать aspectJ в своих проектах. В Яндексе занят на проекте Авто.ру.'
    }, {
        id: 4,
        name: 'Дмитрий Складнов',
        src: 'https://avatars.mds.yandex.net/get-yaevents/197753/08c605ecb6dc11e687ef002590c62a5c/big',
        description: 'Окончил факультет ИТ Московского Технического Университета. В Яндексе с 2015 года, разрабатывает приложение Auto.ru для Android.'
    }, {
        id: 5,
        name: 'Антон Тен',
        src: 'https://avatars.mds.yandex.net/get-yaevents/204268/07bb5f8ab6dc11e687ef002590c62a5c/big',
        description: 'В Яндексе с 2014 года. Ведущий дизайнер продукта в сервисах Переводчик, Расписания и Видео.'
    }, {
        id: 6,
        name: 'Васюнин Николай',
        src: 'https://avatars.mds.yandex.net/get-yaevents/194464/1c55b8d2b6dc11e687ef002590c62a5c/big',
        description: 'Пришёл в Яндекс в 2014 году. Дизайнер продукта в музыкальных сервисах компании, участник команды разработки Яндекс.Радио.'
    }],
    school: [{
        id: 1,
        name: 'Разработка интерфейсов',
        students: 20
    }, {
        id: 2,
        name: 'Мобильная разработка',
        students: 30
    }, {
        id: 3,
        name: 'Мобильный дизайн',
        students: 25
    }],
    classroom: [{
        id: 1,
        name: 'Аудитория 1',
        capacity: 60,
        location: 'корпус 1, 3 этаж'
    }, {
        id: 2,
        name: 'Аудитория 2',
        capacity: 100,
        location: 'корпус 1, 3 этаж'
    }, {
        id: 3,
        name: 'Аудитория 3',
        capacity: 40,
        location: 'корпус 2, 1 этаж'
    }, {
        id: 4,
        name: 'Аудитория 4',
        capacity: 70,
        location: 'корпус 3, 4 этаж'
    }, {
        id: 5,
        name: 'Аудитория 5',
        capacity: 80,
        location: 'корпус 3, 4 этаж'
    }]
};

exports.dataRaw = dataRaw;

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lesson_data = require('./_lesson_data');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DB = function () {
    function DB() {
        _classCallCheck(this, DB);

        if ((typeof localStorage === 'undefined' ? 'undefined' : _typeof(localStorage)) == 'object') {
            this.ls = localStorage;
            this.isLs = true;
        } else {
            this.isLs = false;
        }

        if (this.isLs && !this.ls.data) {
            this.dataRaw = _lesson_data.dataRaw;
            this.data = this._compileData(this.dataRaw);
            this._writeData(this.dataRaw);
        } else if (!this.isLs) {
            this.dataRaw = _lesson_data.dataRaw;
            this.data = this._compileData(this.dataRaw);
        } else {
            this.dataRaw = this._readData();
            this.data = this._compileData(this.dataRaw);
        }
    }

    _createClass(DB, [{
        key: 'getData',
        value: function getData() {
            return {
                data: this.data,
                dataRaw: this.dataRaw
            };
        }
    }, {
        key: 'add',
        value: function add(args) {
            var entryAdd = args.entry;
            var tableData = this.dataRaw[args.table];
            var result = { error: '', ok: false };
            var check = '';
            var idNewLesson = void 0;
            var idNewSchool = void 0;
            var idNewClassroom = void 0;

            if (args.table == 'lessons') {
                // test field new lesson
                check += this._checkNameUniq({
                    entry: entryAdd,
                    table: tableData
                }, true);

                // test classroom is busy
                check += this._checkLessonsClassroom({
                    entryUpdate: entryAdd,
                    tableData: tableData
                }, true);

                // test capacity
                check += this._checkLessonsCapacity({
                    entryUpdate: entryAdd
                });

                // test busy lector
                check += this._checkLessonsLector({
                    entryUpdate: entryAdd
                }, true);

                // test busy school
                check += this._checkLessonsSchool({
                    entryUpdate: entryAdd
                }, true);

                // test date
                check += this._checkCorrectDate({
                    entry: entryAdd
                });

                if (check) {
                    result.error = check;

                    return result;
                }

                // add new entry lessons:

                idNewLesson = this._getNewId('lessons');
                entryAdd.id = idNewLesson;
                tableData.push(entryAdd);
            } else if (args.table == 'school') {

                // Verification of a name:
                check += this._checkNameUniq({
                    entry: entryAdd,
                    table: tableData
                }, true);

                // Verification count students
                if (entryAdd.students < 1 || entryAdd.students > 300) {
                    check += 'Ошибка: некорректное количество учащихся.<br>';
                }

                if (check) {
                    result.error = check;

                    return result;
                }

                // add new entry school
                idNewSchool = this._getNewId('school');
                entryAdd.id = idNewSchool;
                tableData.push(entryAdd);
            } else if (args.table == 'classroom') {
                // Verification of a name:
                check += this._checkNameUniq({
                    entry: entryAdd,
                    table: tableData
                }, true);

                // Verification capacity
                if (entryAdd.capacity < 1 || entryAdd.capacity > 400) {
                    check += 'Ошибка: некорректное вместимость аудитории.<br>';
                }

                if (check) {
                    result.error = check;

                    return result;
                }

                // add entry classroom
                idNewClassroom = this._getNewId('classroom');
                entryAdd.id = idNewClassroom;
                tableData.push(entryAdd);
            }

            // update data
            this._writeData(this.dataRaw);
            this.data = this._compileData(this.dataRaw);

            result.ok = true;

            return result;
        }
    }, {
        key: '_getNewId',
        value: function _getNewId(tableName) {
            var table = this.dataRaw[tableName];

            return table.length + 1;
        }
    }, {
        key: 'update',
        value: function update(args) {
            var entryUpdate = args.entry;
            var id = entryUpdate.id;
            var tableData = this.dataRaw[args.table];
            var entryOrigin = this._getEntry(id, tableData);
            var result = { error: '', ok: false };
            var check = '';

            if (!entryOrigin) {
                return result.error = 'Error update, entry not found to DB';
            }

            if (args.table == 'lessons') {
                // test field new lesson
                check += this._checkNameUniq({
                    entry: entryUpdate,
                    table: tableData
                });

                // test classroom is busy
                check += this._checkLessonsClassroom({
                    entryUpdate: entryUpdate,
                    tableData: tableData
                });

                // test capacity
                check += this._checkLessonsCapacity({
                    entryUpdate: entryUpdate
                });

                // test busy lector
                check += this._checkLessonsLector({
                    entryUpdate: entryUpdate
                });

                // test busy school
                check += this._checkLessonsSchool({
                    entryUpdate: entryUpdate
                });

                // test date
                check += this._checkCorrectDate({
                    entry: entryUpdate
                });

                if (check) {
                    result.error = check;

                    return result;
                }

                // update entry lesson:

                if (Array.isArray(entryUpdate.school)) {
                    entryOrigin.school = entryUpdate.school;
                } else if (Array.isArray(entryOrigin.school)) {
                    entryOrigin.school = { id: entryUpdate.school.id };
                } else {
                    if (entryOrigin.school.id != entryUpdate.school.id) {
                        entryOrigin.school.id = entryUpdate.school.id;
                    }
                }

                if (entryOrigin.lector.id != entryUpdate.lector.id) {
                    entryOrigin.lector.id = entryUpdate.lector.id;
                }

                if (entryOrigin.classroom.id != entryUpdate.classroom.id) {
                    entryOrigin.classroom.id = entryUpdate.classroom.id;
                }

                if (entryOrigin.name != entryUpdate.name) {
                    entryOrigin.name = entryUpdate.name;
                }

                if (entryOrigin.date.from != entryUpdate.date.from) {
                    entryOrigin.date.from = entryUpdate.date.from;
                }

                if (entryOrigin.date.to != entryUpdate.date.to) {
                    entryOrigin.date.to = entryUpdate.date.to;
                }
            } else if (args.table == 'school') {

                // Verification of employment of a name:
                check += this._checkSchoolName({
                    entryUpdate: entryUpdate,
                    tableData: tableData
                });

                // Verification count students
                if (entryOrigin.students < entryUpdate.students) {
                    check += this._checkSchoolCountStudents({
                        entryUpdate: entryUpdate
                    });
                }

                if (check) {
                    result.error = check;

                    return result;
                }

                // update entry school
                entryOrigin.name = entryUpdate.name;
                entryOrigin.students = entryUpdate.students;
            } else if (args.table == 'classroom') {

                // Verification capacity classroom
                if (entryOrigin.capacity > entryUpdate.capacity) {
                    check += this._checkClassroomCapacity({
                        entryUpdate: entryUpdate
                    });
                }

                // Verification of employment of a name:
                check += this._checkClassroomName({
                    entryUpdate: entryUpdate
                });

                if (check) {
                    result.error = check; // error.join('');

                    return result;
                }

                // update entry classroom
                entryOrigin.name = entryUpdate.name;
                entryOrigin.capacity = entryUpdate.capacity;
                entryOrigin.location = entryUpdate.location;
            }

            // update data
            this._writeData(this.dataRaw);
            this.data = this._compileData(this.dataRaw);

            result.ok = true;

            return result;
        }

        /**
         * Проверка даты начала и окончания лекции на корректность
         * @param params
         * @returns {string}
         * @private
         */

    }, {
        key: '_checkCorrectDate',
        value: function _checkCorrectDate(params) {
            var from = params.entry.date.from;
            var dateFrom = new Date(from);
            var dateNumberFrom = dateFrom.getDate();
            var to = params.entry.date.to;
            var dateTo = new Date(to);
            var dateNumberTo = dateTo.getDate();
            var error = '';

            if (to < from) {
                error = 'Ошибка: время окончания лекции не может быть меньше времени начала.<br>';
            }

            if (dateNumberTo - dateNumberFrom > 0) {
                error = 'Ошибка: лекция начинается и оканчивается в один и тот же день.<br>';
            }

            return error;
        }

        /**
         * Проверка на пустоту и уникальность поля "name"
         * @param params
         * @returns {string}
         * @private
         */

    }, {
        key: '_checkNameUniq',
        value: function _checkNameUniq(params, add) {
            var table = params.table;
            var nameNew = params.entry.name;
            var entry = params.entry;
            var error = '';

            if (!nameNew || nameNew.length < 3) {
                return error = 'Ошибка: поле "Имя" не заполнено или меньше трех символов<br>';
            }

            for (var i = 0; i < table.length; i++) {
                var element = table[i];
                var nameOld = element.name;
                var testId = add ? true : element.id != entry.id;

                if (nameNew == nameOld && testId) {
                    error += 'Ошибка: имя не уникально. <br>';
                    break;
                }
            }

            return error;
        }

        /**
         * Проверка имени аудитории на уникальность.
         * @param params
         * @returns {string} error || ''
         * @private
         */

    }, {
        key: '_checkClassroomName',
        value: function _checkClassroomName(params) {
            var error = '';
            var entryUpdate = params.entryUpdate;
            var tableClassroom = this.dataRaw.classroom;
            var idUpdate = entryUpdate.id;

            for (var i = 0; i < tableClassroom.length; i++) {
                var classroom = tableClassroom[i];

                if (classroom.id != idUpdate) {
                    if (classroom.name === entryUpdate.name) {
                        error += 'Ошибка: школа с таким именем уже существует.';
                    }
                }
            }

            return error;
        }

        /**
         * Проверка вместимости аудитории. Хватит ли вместимости аудитории для проведения лекции,
         * если ее уменьшить при редактировании аудитории.
         * @param params
         * @returns {string} error || ''
         * @private
         */

    }, {
        key: '_checkClassroomCapacity',
        value: function _checkClassroomCapacity(params) {
            var error = '';
            var entryUpdate = params.entryUpdate;
            var capacityClassroomUpdate = entryUpdate.capacity;
            var tableLessons = this.dataRaw.lessons;
            var idClassroomUpdate = entryUpdate.id;
            var capacityStudentsSchools = 0;

            for (var i = 0; i < tableLessons.length; i++) {
                var lesson = tableLessons[i];
                var idClassroomOrigin = lesson.classroom.id;

                if (idClassroomOrigin == idClassroomUpdate) {
                    if (Array.isArray(lesson.school)) {
                        var schools = lesson.school;

                        for (var _i = 0; _i < schools.length; _i++) {
                            var school = schools[_i];

                            capacityStudentsSchools += this._getSchool(school.id).students;
                        }

                        if (capacityClassroomUpdate < capacityStudentsSchools) {
                            error += '\u041E\u0448\u0438\u0431\u043A\u0430: \u0434\u043B\u044F \u043B\u0435\u043A\u0446\u0438\u0438 "' + lesson.name + '" \u043D\u0435 \u0431\u0443\u0434\u0435\u0442 \u0445\u0432\u0430\u0442\u0430\u0442\u044C\n                    \u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u0438 \u0438\u0437\u043C\u0435\u043D\u044F\u0435\u043C\u043E\u0439 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438<br>';
                        }
                    } else {
                        capacityStudentsSchools = this._getSchool(lesson.school.id).students;

                        if (capacityClassroomUpdate < capacityStudentsSchools) {
                            error += '\u041E\u0448\u0438\u0431\u043A\u0430: \u0434\u043B\u044F \u043B\u0435\u043A\u0446\u0438\u0438 "' + lesson.name + '" \u043D\u0435 \u0431\u0443\u0434\u0435\u0442 \u0445\u0432\u0430\u0442\u0430\u0442\u044C\n                    \u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u0438 \u0438\u0437\u043C\u0435\u043D\u044F\u0435\u043C\u043E\u0439 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438<br>';
                        }
                    }
                }
            }

            return error;
        }

        /**
         * Проверка, хватит ли вместимости в аудиториях при увеличении количества студентов на лекции
         * @param params
         * @returns {string} error || ''
         * @private
         */

    }, {
        key: '_checkSchoolCountStudents',
        value: function _checkSchoolCountStudents(params) {
            var error = '';
            var entryUpdate = params.entryUpdate;
            var idSchoolUpdata = entryUpdate.id;
            var tableLessons = this.dataRaw.lessons;
            var capacityClassroomVer = 0;
            var capacityStudents = entryUpdate.students;
            var capacityStudentsSchools = 0;
            var idClassroomVer = void 0;

            for (var i = 0; i < tableLessons.length; i++) {
                var lesson = tableLessons[i];

                if (Array.isArray(lesson.school)) {
                    var schools = lesson.school;
                    var isContain = false;

                    for (var _i2 = 0; _i2 < schools.length; _i2++) {
                        var school = schools[_i2];

                        capacityStudentsSchools += this._getSchool(school.id).students;

                        if (school.id == idSchoolUpdata) {
                            isContain = true;
                        }
                    }

                    if (isContain) {
                        idClassroomVer = lesson.classroom.id;
                        capacityClassroomVer = this._getClassroom(idClassroomVer).capacity;

                        if (capacityClassroomVer < capacityStudentsSchools) {
                            error += '\u041E\u0448\u0438\u0431\u043A\u0430: \u0434\u043B\u044F \u043B\u0435\u043A\u0446\u0438\u0438 "' + lesson.name + '" \u043D\u0435 \u0431\u0443\u0434\u0435\u0442 \u0445\u0432\u0430\u0442\u0430\u0442\u044C\n                        \u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u0438 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438<br>';
                        }
                    }
                } else if (lesson.school.id == idSchoolUpdata) {
                    idClassroomVer = lesson.classroom.id;

                    var _capacityClassroomVer = this._getClassroom(idClassroomVer).capacity;

                    if (_capacityClassroomVer < capacityStudents) {
                        error += '\u041E\u0448\u0438\u0431\u043A\u0430: \u0434\u043B\u044F \u043B\u0435\u043A\u0446\u0438\u0438 "' + lesson.name + '" \u043D\u0435 \u0431\u0443\u0434\u0435\u0442 \u0445\u0432\u0430\u0442\u0430\u0442\u044C\n                        \u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u0438 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438<br>';
                    }
                }
            }

            return error;
        }

        /**
         * Проверка уникальности названия школы
         * @param params
         * @returns {string} error || ''
         * @private
         */

    }, {
        key: '_checkSchoolName',
        value: function _checkSchoolName(params) {
            var error = '';
            var entryUpdate = params.entryUpdate;
            var tableSchool = params.tableData;
            var idUpdate = entryUpdate.id;
            var testAdd = void 0;

            for (var i = 0; i < tableSchool.length; i++) {
                var school = tableSchool[i];

                testAdd = idUpdate ? school.id != idUpdate : true;

                if (testAdd) {
                    if (school.name === entryUpdate.name) {
                        error += 'Ошибка: школа с таким именем уже существует.';
                    }
                }
            }

            return error;
        }

        /**
         * Проверка. Не может быть двух лекций в одно и тоже время для одной и той же школы
         * @param params
         * @returns {string} error || ''
         * @private
         */

    }, {
        key: '_checkLessonsSchool',
        value: function _checkLessonsSchool(params, add) {
            var error = '';
            var entryUpdate = params.entryUpdate;
            var idSchoolUpdata = entryUpdate.school.id;
            var tableLessons = this.dataRaw.lessons;
            var fromUpdate = entryUpdate.date.from;
            var toUpdate = entryUpdate.date.to;
            var testUpdate = void 0;

            for (var i = 0; i < tableLessons.length; i++) {
                var lesson = tableLessons[i];

                testUpdate = add ? true : lesson.id != entryUpdate.id;

                if (lesson.school.id == idSchoolUpdata && testUpdate /* lesson.id != entryUpdate.id */) {
                        var fromOrigin = lesson.date.from;
                        var toOrigin = lesson.date.to;

                        if (fromUpdate >= fromOrigin && fromUpdate < toOrigin || fromUpdate < fromOrigin && toUpdate > fromOrigin) {
                            error += '\u041E\u0448\u0438\u0431\u043A\u0430: \u0434\u043B\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439 \u0448\u043A\u043E\u043B\u044B \u0432 \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F \u0443\u0436\u0435 \u0437\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0430\n                            \u043B\u0435\u043A\u0446\u0438\u044F.<br>';
                            break;
                        }
                    }
            }

            return error;
        }

        /**
         * Проверка занятости лектора в указанное время
         * @param params
         * @returns {string} error || ''
         * @private
         */

    }, {
        key: '_checkLessonsLector',
        value: function _checkLessonsLector(params, add) {
            var error = '';
            var entryUpdate = params.entryUpdate;
            var idLectorUpdata = entryUpdate.lector.id;
            var tableLessons = this.dataRaw.lessons;
            var tableCommon = this.data;
            var fromUpdate = entryUpdate.date.from;
            var toUpdate = entryUpdate.date.to;
            var testUpdate = void 0;

            for (var i = 0; i < tableLessons.length; i++) {
                var lesson = tableLessons[i];

                testUpdate = add ? true : lesson.id != entryUpdate.id;

                if (lesson.lector.id == idLectorUpdata && testUpdate /* lesson.id != entryUpdate.id */) {
                        var fromOrigin = lesson.date.from;
                        var toOrigin = lesson.date.to;

                        if (fromUpdate >= fromOrigin && fromUpdate < toOrigin || fromUpdate < fromOrigin && toUpdate > fromOrigin) {
                            error += '\u041E\u0448\u0438\u0431\u043A\u0430: \u043B\u0435\u043A\u0442\u043E\u0440 \u0437\u0430\u043D\u044F\u0442 \u0432 \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F.\n                            \u0423 \u043D\u0435\u0433\u043E \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442 \u0437\u0430\u043D\u044F\u0442\u0438\u0435 \u0432 "' + tableCommon[lesson.id - 1].classroom.name + '"\n                            \u0432 \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F<br>';
                            break;
                        }
                    }
            }

            return error;
        }

        /**
         * Проверка вместимости. Поместятся ли студенты в выбранной аудитории.
         * @param params
         * @returns {string} error or ''
         * @private
         */

    }, {
        key: '_checkLessonsCapacity',
        value: function _checkLessonsCapacity(params) {
            var error = '';
            var entryUpdate = params.entryUpdate;
            var capacityClassroomUpdate = void 0;
            var idClassroomUpdate = entryUpdate.classroom.id;
            var tableClassroom = this.dataRaw.classroom;
            var countPeopleUpdate = 0;
            var tableSchool = this.dataRaw.school;

            for (var i = 0; i < tableClassroom.length; i++) {
                var classroom = tableClassroom[i];

                if (classroom.id == idClassroomUpdate) {
                    capacityClassroomUpdate = classroom.capacity;
                    break;
                }
            }

            if (Array.isArray(entryUpdate.school)) {

                var arSchoolUpdate = entryUpdate.school;

                for (var _i3 = 0; _i3 < tableSchool.length; _i3++) {
                    var school = tableSchool[_i3];

                    for (var j = 0; j < arSchoolUpdate.length; j++) {
                        var schoolUpdate = arSchoolUpdate[j];

                        if (school.id == schoolUpdate.id) {
                            countPeopleUpdate += +school.students;
                            break;
                        }
                    }
                }
            } else {
                var idSchoolUpdate = entryUpdate.school.id;

                for (var _i4 = 0; _i4 < tableSchool.length; _i4++) {
                    var _school = tableSchool[_i4];

                    if (_school.id == idSchoolUpdate) {
                        countPeopleUpdate += +_school.students;
                        break;
                    }
                }
            }

            if (countPeopleUpdate > capacityClassroomUpdate) {
                error += 'Ошибка: вместимость выбранной аудитории меньше количества студентов.<br>';
            }

            return error;
        }

        /**
         * Проверка занятости аудитории в указанный временной промежуток.
         * @param params
         * @returns {string} error or ''
         * @private
         */

    }, {
        key: '_checkLessonsClassroom',
        value: function _checkLessonsClassroom(params, add) {
            var entryUpdate = params.entryUpdate;
            var tableData = params.tableData;
            var idClassroomUpdate = entryUpdate.classroom.id;
            var fromUpdate = entryUpdate.date.from;
            var toUpdate = entryUpdate.date.to;
            var error = '';
            var testUpdate = void 0;
            var lesson = void 0;

            for (var i = 0; i < tableData.length; i++) {
                lesson = tableData[i];
                testUpdate = add ? true : lesson.id != entryUpdate.id;

                if (lesson.classroom.id == idClassroomUpdate && testUpdate) {
                    var fromOrigin = lesson.date.from;
                    var toOrigin = lesson.date.to;

                    if (fromUpdate >= fromOrigin && fromUpdate < toOrigin || fromUpdate < fromOrigin && toUpdate > fromOrigin) {
                        error += 'Ошибка: конфликт в расписании выбранной аудитории.\n' + 'Выберете либо другую аудиторию, либо другое время проведения лекции.<br>';
                        break;
                    }
                }
            }

            return error;
        }
    }, {
        key: '_getSchool',
        value: function _getSchool(id) {
            var tableSchool = this.dataRaw.school;
            var school = void 0;
            var result = void 0;

            for (var i = 0; i < tableSchool.length; i++) {
                school = tableSchool[i];

                if (school.id == id) {
                    result = school;
                    break;
                }
            }

            return result;
        }
    }, {
        key: '_getClassroom',
        value: function _getClassroom(id) {
            var tableClassroom = this.dataRaw.classroom;
            var classroom = void 0;
            var result = void 0;

            for (var i = 0; i < tableClassroom.length; i++) {
                classroom = tableClassroom[i];

                if (classroom.id == id) {
                    result = classroom;
                    break;
                }
            }

            return result;
        }
    }, {
        key: '_getEntry',
        value: function _getEntry(id, table) {
            for (var i = 0; i < table.length; i++) {
                var entry = table[i];

                if (entry.id == id) {
                    return entry;
                }
            }

            return false;
        }
    }, {
        key: '_writeData',
        value: function _writeData(data) {
            if (this.isLs) {
                try {
                    this.ls.data = JSON.stringify(data);
                } catch (e) {
                    if (e == QUOTA_EXCEEDED_ERR) {
                        alert('Запись невозможна, localStorage не доступен. Проверьте свободное место');
                    }
                }
            }
        }
    }, {
        key: '_readData',
        value: function _readData() {
            return JSON.parse(this.ls.data);
        }
    }, {
        key: '_compileData',
        value: function _compileData(data) {
            var result = [];
            var lessons = data.lessons;

            for (var i = 0; i < lessons.length; i++) {
                var lesson = lessons[i];
                var lessonCompile = this._compileLesson(lesson);

                result.push(lessonCompile);
            }

            return result;
        }
    }, {
        key: '_clearData',
        value: function _clearData() {
            // delete this.ls.data;
            this.ls.data = '';
        }
    }, {
        key: '_compileLesson',
        value: function _compileLesson(lesson) {
            var result = {};
            var keys = Object.keys(lesson);

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = lesson[key];

                if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.id) {
                    var valueOrigin = this._getValueOriginData(key, value.id);

                    if (!valueOrigin) {
                        throw new Error('Don\'t found element ' + key + ', id = ' + value.id);
                    }

                    result[key] = valueOrigin;
                } else if (Array.isArray(value)) {
                    var arr = value;
                    var res = [];

                    for (var _i5 = 0; _i5 < arr.length; _i5++) {
                        var id = arr[_i5].id;

                        if (id) {
                            res.push(this._getValueOriginData(key, id));
                        }
                    }

                    result[key] = res;
                } else {
                    result[key] = value;
                }
            }

            return result;
        }
    }, {
        key: '_getValueOriginData',
        value: function _getValueOriginData(key, id) {
            var objects = this.dataRaw[key];

            for (var i = 0; i < objects.length; i++) {
                var object = objects[i];

                if (object.id == id) {
                    return object;
                }
            }

            return false;
        }
    }]);

    return DB;
}();

exports.default = DB;

},{"./_lesson_data":7}],9:[function(require,module,exports){
'use strict';

var _main = require('./main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var main = new _main2.default('.table');

main.filter('#plagin__scheduler--school', 'school');
main.filter('#plagin__scheduler--classroom', 'classroom');
main.editLessons('.plagin__body-tab-cont[data-tab="lessons"]');
main.editSchool('.plagin__body-tab-cont[data-tab="school"]');
main.editClassroom('.plagin__body-tab-cont[data-tab="classroom"]');
main.add('#plagin__scheduler--add');

},{"./main":10}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _start = require('./assets/start');

var _start2 = _interopRequireDefault(_start);

var _mediator = require('./_mediator');

var _mediator2 = _interopRequireDefault(_mediator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Main = function () {
    function Main(table) {
        _classCallCheck(this, Main);

        this.table = table;
        this.mediator = new _mediator2.default({ table: table });
        this.mediator.tableRender();
        new _start2.default(this.mediator);
    }

    _createClass(Main, [{
        key: 'filter',
        value: function filter(node, param) {
            var _this = this;

            var container = document.querySelector(node);
            var btn = container.querySelector('button[type="submit"]');
            var btnCancel = container.querySelector('button[type="reset"]');

            btn.addEventListener('click', function (event) {
                var filter = _this._getDataFilter(container, param);

                event.preventDefault();

                _this.mediator.filter(filter);
                window.scrollTo(0, 0);
            });

            btnCancel.addEventListener('click', function () {
                _this.mediator.tableRender();
            });
        }
    }, {
        key: 'add',
        value: function add(node) {
            var _this2 = this;

            var container = document.querySelector(node);

            container.addEventListener('click', function (event) {
                var target = event.target;

                if (target.tagName == 'BUTTON' && target.getAttribute('type') == 'submit') {
                    event.preventDefault();

                    var data = void 0;
                    var result = void 0;
                    var tab = target.closest('.plagin__body-tab-cont');
                    var dataTab = tab.dataset.tab;
                    var error = tab.querySelector('.plagin_result .plagin_result-error');
                    var success = tab.querySelector('.plagin_result .plagin_result-success');

                    if (dataTab == 'lessons') {

                        data = _this2._getDataLesson(tab, true);
                        result = _this2.mediator.add(data);
                    } else if (dataTab == 'school') {

                        data = _this2._getDataSchool(tab, true);
                        result = _this2.mediator.add(data);
                    } else if (dataTab == 'classroom') {

                        data = _this2._getDataClassroom(tab, true);
                        result = _this2.mediator.add(data);
                    }

                    _this2._viewResultEditEntry({
                        result: result,
                        errorContainer: error,
                        successContainer: success
                    });
                }
            });
        }
    }, {
        key: 'editClassroom',
        value: function editClassroom(node) {
            var _this3 = this;

            var container = document.querySelector(node);
            var btn = container.querySelector('button[type="submit"]');

            btn.addEventListener('click', function (event) {
                var data = void 0;
                var result = void 0;
                var error = container.querySelector('.plagin_result .plagin_result-error');
                var success = container.querySelector('.plagin_result .plagin_result-success');

                event.preventDefault();

                data = _this3._getDataClassroom(container);
                result = _this3.mediator.update(data);

                _this3._viewResultEditEntry({
                    result: result,
                    errorContainer: error,
                    successContainer: success
                });
            });
        }
    }, {
        key: 'editLessons',
        value: function editLessons(node) {
            var _this4 = this;

            var container = document.querySelector(node);
            var btn = container.querySelector('button[type="submit"]');

            btn.addEventListener('click', function (event) {
                var data = void 0;
                var result = void 0;
                var error = container.querySelector('.plagin_result .plagin_result-error');
                var success = container.querySelector('.plagin_result .plagin_result-success');

                event.preventDefault();

                data = _this4._getDataLesson(container);
                result = _this4.mediator.update(data);

                _this4._viewResultEditEntry({
                    result: result,
                    errorContainer: error,
                    successContainer: success
                });
            });
        }
    }, {
        key: 'editSchool',
        value: function editSchool(node) {
            var _this5 = this;

            var container = document.querySelector(node);
            var btn = container.querySelector('button[type="submit"]');

            btn.addEventListener('click', function (event) {
                var data = void 0;
                var result = void 0;
                var error = container.querySelector('.plagin_result .plagin_result-error');
                var success = container.querySelector('.plagin_result .plagin_result-success');

                event.preventDefault();

                data = _this5._getDataSchool(container);
                result = _this5.mediator.update(data);

                _this5._viewResultEditEntry({
                    result: result,
                    errorContainer: error,
                    successContainer: success
                });
            });
        }
    }, {
        key: '_getDataClassroom',
        value: function _getDataClassroom(container, add) {
            var name = container.querySelector('input[name="classroom_name"]').value;
            var location = container.querySelector('input[name="location"]').value;
            var capacity = +container.querySelector('input[name="capacity"]').value;
            var result = void 0;
            var id = void 0;

            result = {
                table: 'classroom',
                entry: {
                    name: name.trim(),
                    capacity: capacity,
                    location: location
                }
            };

            if (!add) {
                id = +container.querySelector('select[name="classroom"]').value;
                result.entry.id = id;
            }

            return result;
        }
    }, {
        key: '_getDataSchool',
        value: function _getDataSchool(container, add) {
            var name = container.querySelector('input[name="school_name"]').value;
            var students = +container.querySelector('input[name="student_quantity"]').value;
            var result = void 0;
            var id = void 0;

            result = {
                table: 'school',
                entry: {
                    name: name.trim(),
                    students: students
                }
            };

            if (!add) {
                id = +container.querySelector('select[name="school"]').value;
                result.entry.id = id;
            }

            return result;
        }
    }, {
        key: '_viewResultEditEntry',
        value: function _viewResultEditEntry(params) {
            var node = void 0;

            params.errorContainer.innerHTML = '';
            params.errorContainer.classList.remove('active');

            if (params.result.error) {
                node = params.errorContainer;
                node.innerHTML = params.result.error;
                node.classList.add('active');
            } else if (params.result.ok) {
                node = params.successContainer;
                node.innerHTML = 'Сохранено';
                node.classList.add('active');
                setTimeout(function () {
                    node.classList.remove('active');
                    node.innerHTML = '';
                }, 2500);
            }
        }
    }, {
        key: '_getDataLesson',
        value: function _getDataLesson(container, add) {
            var date = this._getDateFromTo(container);
            var nameLesson = container.querySelector('input[name="lesson_name"]').value;
            var school = container.querySelector('select[name="school"]');
            var lector = +container.querySelector('select[name="lector"]').value;
            var classroom = +container.querySelector('select[name="classroom"]').value;
            var schoolSelected = this._getOptionsSelected(school);
            var idLesson = void 0;
            var result = void 0;

            result = {
                table: 'lessons',
                entry: {
                    // id: idLesson,
                    name: nameLesson,
                    school: schoolSelected,
                    lector: { id: lector },
                    classroom: { id: classroom },
                    date: date
                }
            };

            if (!add) {
                idLesson = +container.querySelector('select[name="lessons"]').value;
                result.entry.id = idLesson;
            }

            return result;
        }
    }, {
        key: '_getOptionsSelected',
        value: function _getOptionsSelected(select) {
            var options = select.options;
            var result = [];

            if (!options) {
                return '';
            }

            for (var i = 0; i < options.length; i++) {
                var option = options[i];

                if (option.selected) {
                    result.push({ id: +option.value });
                }
            }

            return result.length == 1 ? result[0] : result; // single value = {}, multiply = [{},[{}]]
        }
    }, {
        key: '_getDataFilter',
        value: function _getDataFilter(container, param) {
            var result = {};

            result.date = this._getDateFromTo(container);
            result[param] = {
                key: 'id',
                value: +container.querySelector('select[name="' + param + '"]').value
            };

            return result;
        }
    }, {
        key: '_getDateFromTo',
        value: function _getDateFromTo(container) {
            var rowContainers = container.querySelectorAll('.date__rows');
            var rows = this._getRowContainers(rowContainers);

            return {
                from: +this._getDateRow(rows.from), // нужны числовые значения для filter
                to: +this._getDateRow(rows.to)
            };
        }
    }, {
        key: '_getRowContainers',
        value: function _getRowContainers(rowContainers) {
            var rows = {};

            for (var i = 0; i < rowContainers.length; i++) {
                var row = rowContainers[i];
                var data = row.dataset.date;

                rows[data] = row;
            }

            return rows;
        }
    }, {
        key: '_getDateRow',
        value: function _getDateRow(row) {
            var year = 2017;
            var month = row.querySelector('select[name="month"]').value;
            var date = row.querySelector('select[name="day"]').value;
            var hour = row.querySelector('select[name="hour"]').value;
            var minut = row.querySelector('select[name="minut"]').value;

            return new Date(year, month, date, hour, minut);
        }
    }]);

    return Main;
}();

exports.default = Main;

},{"./_mediator":2,"./assets/start":6}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Template = function () {
    function Template() {
        _classCallCheck(this, Template);
    }

    _createClass(Template, [{
        key: 'template',
        value: function template(key, fields) {
            if (key === 'lessons') {
                return this._getLessonsTemplate(fields);
            } else if (key === 'lector') {
                return this._getLectorTemplate(fields);
            } else if (key === 'material') {
                return this._getMaterialTemplate(fields);
            }
        }
    }, {
        key: '_getLessonsTemplate',
        value: function _getLessonsTemplate(fields) {
            var cache = [];

            for (var i = 0; i < fields.length; i++) {
                cache.push(this._getLessonTemplate(fields[i]));
            }

            return cache.join('');
        }
    }, {
        key: '_getLectorTemplate',
        value: function _getLectorTemplate(field) {
            return '<div class="lector__popup">\n            <div class="lector__popup-name">' + field.name + '</div>\n            <div class="lector__popup-img">\n                <img src="' + field.src + '" alt="">\n            </div>\n            <div class="lector__popup-text">' + field.description + '</div>\n            <a href="" class="p_close">x</a>\n            </div>';
        }
    }, {
        key: '_getMaterialTemplate',
        value: function _getMaterialTemplate(field) {
            return '<div class="lector__popup">\n            <div class="lector__popup-name">' + field.name + '</div>\n            <div class="lector__popup-img">\n                <a href="' + field.src + '" alt="" target="_blank">\n                    \u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0443 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432\n                </a>\n            </div>\n            <a href="" class="p_close">x</a>\n            </div>';
        }
    }, {
        key: '_getLessonTemplate',
        value: function _getLessonTemplate(field) {
            var schema = this._getSchemaFieldsLesson();

            return '\n            <tr ' + (field.material ? 'class="lecture__ended"' : '') + '>\n                <td data-label = "' + schema.number + '"><span>' + field.id + '</span></td>\n                <td data-label = "' + schema.school + '"><span>' + this._formatSchoolField(field.school) + '</span></td>\n                <td data-label = "' + schema.lecture + '"><span>' + field.name + '</span></td>\n                <td data-label = "' + schema.lector + '">\n                    <span><a href="' + field.lector.src + '" target="_blank" class="lesson__lector" data-id="' + field.lector.id + '">' + field.lector.name + '</a></span>\n                </td>\n                <td data-label = "' + schema.date + '"><span>' + this._formatDateField(field.date) + '</span></td>\n                <td data-label = "' + schema.location + '"><span>' + field.classroom.name + ' (' + field.classroom.location + ', \u0434\u043E ' + field.classroom.capacity + ' \u0447\u0435\u043B.)</span></td>\n                <td data-label = "' + schema.material + '">\n                    <span><a href="' + (field.material ? field.material.src : '') + '" class="lesson__material" target="_blank" data-id="' + (field.material ? field.material.id : '') + '">' + (field.material ? field.material.name : '') + '</a></span>\n                </td>\n            </tr>';
        }
    }, {
        key: '_formatSchoolField',
        value: function _formatSchoolField(school) {
            var result = {
                names: [],
                count: 0
            };

            if (Array.isArray(school)) {
                for (var i = 0; i < school.length; i++) {
                    result.names.push(school[i].name);
                    result.count += school[i].students;
                }
            } else {
                result.names.push(school.name);
                result.count += school.students;
            }

            return result.names.join(', ') + ' (' + result.count + ' \u0447\u0435\u043B.)';
        }
    }, {
        key: '_formatDateField',
        value: function _formatDateField(date) {
            var from = new Date(date.from);
            var to = new Date(date.to);

            var mm = this._formatDateAddNull(from.getMonth() + 1);
            var dd = this._formatDateAddNull(from.getDate());
            var hourFrom = this._formatDateAddNull(from.getHours());
            var hourTo = this._formatDateAddNull(to.getHours());
            var MMFrom = this._formatDateAddNull(from.getMinutes());
            var MMTo = this._formatDateAddNull(to.getMinutes());

            return dd + '.' + mm + ' ' + hourFrom + ':' + MMFrom + '-' + hourTo + ':' + MMTo;
        }
    }, {
        key: '_formatDateAddNull',
        value: function _formatDateAddNull(number) {
            if (number < 10) {
                return '0' + number;
            }

            return number;
        }
    }, {
        key: '_getSchemaFieldsLesson',
        value: function _getSchemaFieldsLesson() {
            return {
                number: '№',
                school: 'Школа',
                lecture: 'Тема лекции',
                lector: 'Имя лектора',
                date: 'Дата',
                location: 'Место проведения',
                material: 'Материалы'
            };
        }
    }]);

    return Template;
}();

exports.default = Template;

},{}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFxfZmlsdGVyLmpzIiwic3JjXFxqc1xcX21lZGlhdG9yLmpzIiwic3JjXFxqc1xcX3BvcHVwLmpzIiwic3JjXFxqc1xcX3RhYmxlLmpzIiwic3JjXFxqc1xcYXNzZXRzXFxkYXRlLmpzIiwic3JjXFxqc1xcYXNzZXRzXFxzdGFydC5qcyIsInNyY1xcanNcXGRhdGFcXF9sZXNzb25fZGF0YS5qcyIsInNyY1xcanNcXGRhdGFcXGRiLmpzIiwic3JjXFxqc1xcaW5kZXguanMiLCJzcmNcXGpzXFxtYWluLmpzIiwic3JjXFxqc1xcdGVtcGxhdGVcXHRlbXBsYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O0lDQXFCLE07Ozs7Ozs7K0JBRVYsTSxFQUFRLEssRUFBTztBQUNsQixnQkFBSSxtQkFBSjtBQUNBLGdCQUFJLFNBQVMsT0FBTyxNQUFwQjtBQUNBLGdCQUFJLFNBQVMsRUFBYjs7QUFFQSxnQkFBSSxLQUFKLEVBQVc7QUFDUCw2QkFBYSxPQUFPLElBQVAsQ0FBWSxLQUFaLENBQWI7QUFDSCxhQUZELE1BRU87QUFDSCw2QkFBYSxPQUFPLElBQXBCO0FBQ0g7O0FBRUQsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxXQUFXLE1BQS9CLEVBQXVDLEdBQXZDLEVBQTRDO0FBQ3hDLG9CQUFJLFNBQVMsV0FBVyxDQUFYLENBQWI7QUFDQSxvQkFBSSxVQUFVLEtBQUssZ0JBQUwsQ0FBc0IsTUFBdEIsRUFBOEIsTUFBOUIsQ0FBZDs7QUFFQSxvQkFBSSxPQUFKLEVBQWE7QUFDVCwyQkFBTyxJQUFQLENBQVksTUFBWjtBQUNIO0FBQ0o7O0FBRUQsbUJBQU8sTUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7Ozt5Q0FZa0IsTSxFQUFRLE0sRUFBUTtBQUM5QixnQkFBSSxXQUFXLE9BQU8sSUFBUCxDQUFZLE1BQVosQ0FBZjs7QUFFQSxp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QixDQUFiO0FBQ0EsZ0JBQUksT0FBTyxLQUFLLGtCQUFMLENBQXdCLEdBQUcsVUFBSCxFQUF4QixDQUFYOztBQUVBLG1CQUFVLEVBQVYsU0FBZ0IsRUFBaEIsU0FBc0IsUUFBdEIsU0FBa0MsTUFBbEMsU0FBNEMsTUFBNUMsU0FBc0QsSUFBdEQ7QUFDSDs7OzJDQUVrQixNLEVBQVE7QUFDdkIsZ0JBQUksU0FBUyxFQUFiLEVBQWlCO0FBQ2IsdUJBQU8sTUFBTSxNQUFiO0FBQ0g7O0FBRUQsbUJBQU8sTUFBUDtBQUNIOzs7aURBRXdCO0FBQ3JCLG1CQUFPO0FBQ0gsd0JBQVEsR0FETDtBQUVILHdCQUFRLE9BRkw7QUFHSCx5QkFBUyxhQUhOO0FBSUgsd0JBQVEsYUFKTDtBQUtILHNCQUFNLE1BTEg7QUFNSCwwQkFBVSxrQkFOUDtBQU9ILDBCQUFVO0FBUFAsYUFBUDtBQVNIOzs7Ozs7a0JBbkhnQixRIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbHRlciB7XHJcblxyXG4gICAgZmlsdGVyKHBhcmFtcywgdGFibGUpIHtcclxuICAgICAgICBsZXQgYXJFbGVtZW50cztcclxuICAgICAgICBsZXQgZmlsdGVyID0gcGFyYW1zLmZpbHRlcjtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gW107XHJcblxyXG4gICAgICAgIGlmICh0YWJsZSkge1xyXG4gICAgICAgICAgICBhckVsZW1lbnRzID0gcGFyYW1zLmRhdGFbdGFibGVdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFyRWxlbWVudHMgPSBwYXJhbXMuZGF0YTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJFbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgbGVzc29uID0gYXJFbGVtZW50c1tpXTtcclxuICAgICAgICAgICAgbGV0IGlzTWF0Y2ggPSB0aGlzLl9pc01hdGNoaW5nRW50cnkoZmlsdGVyLCBsZXNzb24pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGxlc3Nvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0gZmlsdGVyXHJcbiAgICAgKiBAcGFyYW0gbGVzc29uXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGUgZmlsdGVyXHJcbiAgICAgKiB7IGlkOiAxIH1cclxuICAgICAqIHsgbmFtZTogJ9CQ0LTQsNC/0YLQuNCy0L3QsNGPINCy0ZHRgNGB0YLQutCwJyB9XHJcbiAgICAgKiB7IHNjaG9vbDogeyBrZXk6ICdpZCcsIHZhbHVlOiAxIH0gfVxyXG4gICAgICovXHJcblxyXG4gICAgX2lzTWF0Y2hpbmdFbnRyeSAoZmlsdGVyLCBsZXNzb24pIHtcclxuICAgICAgICBsZXQgYXJGaWx0ZXIgPSBPYmplY3Qua2V5cyhmaWx0ZXIpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFyRmlsdGVyLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIGxldCBrZXlGaWx0ZXIgPSBhckZpbHRlcltqXTtcclxuICAgICAgICAgICAgbGV0IHZhbHVlTGVzc29uID0gbGVzc29uW2tleUZpbHRlcl07XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZUZpbHRlciA9IGZpbHRlcltrZXlGaWx0ZXJdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGtleUZpbHRlciA9PT0gJ2RhdGUnKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZnJvbUxlc3NvbiA9IHZhbHVlTGVzc29uLmZyb207XHJcbiAgICAgICAgICAgICAgICBsZXQgdG9MZXNzb24gPSB2YWx1ZUxlc3Nvbi50bztcclxuICAgICAgICAgICAgICAgIGxldCBmcm9tRmlsdGVyID0gdmFsdWVGaWx0ZXIuZnJvbTtcclxuICAgICAgICAgICAgICAgIGxldCB0b0ZpbHRlciA9IHZhbHVlRmlsdGVyLnRvXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCEoKGZyb21GaWx0ZXIgPD0gZnJvbUxlc3NvbiAmJiB0b0ZpbHRlciA+IGZyb21MZXNzb24pXHJcbiAgICAgICAgICAgICAgICAgICAgfHwgKGZyb21GaWx0ZXIgPiBmcm9tTGVzc29uICYmIGZyb21GaWx0ZXIgPCB0b0xlc3NvbikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlTGVzc29uKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGlzTWF0Y2ggPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlTGVzc29uLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGl0ZW0gPSB2YWx1ZUxlc3NvbltpXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pc01hdGNoaW5nKGl0ZW1bdmFsdWVGaWx0ZXJbXCJrZXlcIl1dLCB2YWx1ZUZpbHRlcltcInZhbHVlXCJdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNNYXRjaCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTWF0Y2hpbmcoaXRlbSwgdmFsdWVGaWx0ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc01hdGNoID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWVMZXNzb24gPT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZUZpbHRlciA9PT0gJ29iamVjdCcpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNNYXRjaGluZyh2YWx1ZUxlc3Nvblt2YWx1ZUZpbHRlcltcImtleVwiXV0sIHZhbHVlRmlsdGVyW1widmFsdWVcIl0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzTWF0Y2hpbmcodmFsdWVMZXNzb24sIHZhbHVlRmlsdGVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpc01hdGNoaW5nICh2YWwxLCB2YWwyKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwxID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgdmFsMiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdmFsMSA9IHZhbDEudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgdmFsMiA9IHZhbDIudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWwxLmluZGV4T2YodmFsMikgPT0gLTEgPyBmYWxzZSA6IHRydWU7XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbDEgPT09ICdudW1iZXInICYmIHR5cGVvZiB2YWwyID09PSAnbnVtYmVyJykge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbDEgPT09IHZhbDIgPyB0cnVlIDogZmFsc2U7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVHlwZSBpcyB1bmRlZmluZWQsIGl0XFwncyBub3Qgc3RyaW5nIG9yIG51bWJlci4gRnVuY3Rpb24gaXNNYXRjaGluZycpO1xyXG4gICAgfVxyXG5cclxuICAgIGlzRW1wdHlJbnB1dHMgKGFyVmFsdWUpIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyVmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzRW1wdHkoYXJWYWx1ZVtpXSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaXNFbXB0eSAodmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUgPyBmYWxzZSA6IHRydWU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgZGJDbGFzcyBmcm9tICcuL2RhdGEvZGInO1xyXG5pbXBvcnQgdGFibGVDbGFzcyBmcm9tICcuL190YWJsZSc7XHJcbmltcG9ydCB0ZW1wbGF0ZUNsYXNzIGZyb20gJy4vdGVtcGxhdGUvdGVtcGxhdGUnO1xyXG5pbXBvcnQgcG9wdXBDbGFzcyBmcm9tICcuL19wb3B1cCc7XHJcbmltcG9ydCBmaWx0ZXJDbGFzcyBmcm9tICcuL19maWx0ZXInO1xyXG5pbXBvcnQgZGF0ZUNsYXNzIGZyb20gJy4vYXNzZXRzL2RhdGUnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWVkaWF0b3Ige1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgZGJDbGFzcygpO1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGVzID0gbmV3IHRlbXBsYXRlQ2xhc3MoKTtcclxuICAgICAgICB0aGlzLnBvcHVwID0gbmV3IHBvcHVwQ2xhc3MoKTtcclxuICAgICAgICB0aGlzLnRhYmxlID0gbmV3IHRhYmxlQ2xhc3Moe1xyXG4gICAgICAgICAgICB0YWJsZTogb3B0aW9ucy50YWJsZSxcclxuICAgICAgICAgICAgdGVtcGxhdGU6IHRoaXMudGVtcGxhdGVzLFxyXG4gICAgICAgICAgICBwb3B1cDogdGhpcy5wb3B1cCxcclxuICAgICAgICAgICAgZGF0YTogdGhpcy5kYi5nZXREYXRhKClcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmZpbHRlcnMgPSBuZXcgZmlsdGVyQ2xhc3MoKTtcclxuICAgICAgICB0aGlzLmRhdGUgPSBuZXcgZGF0ZUNsYXNzKCk7XHJcbiAgICAgICAgdGhpcy5jb25zdCA9IHtcclxuICAgICAgICAgICAgVEVNUExBVEVfTEVTU09OUzogJ2xlc3NvbnMnXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgYWRkKGRhdGEpIHtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5kYi5hZGQoZGF0YSk7XHJcblxyXG4gICAgICAgIGlmICghcmVzdWx0LmVycm9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGFibGVSZW5kZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKGRhdGEpIHtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5kYi51cGRhdGUoZGF0YSk7ICAgICAgXHJcblxyXG4gICAgICAgIGlmICghcmVzdWx0LmVycm9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGFibGVSZW5kZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGZpbHRlcihmaWx0ZXIpIHtcclxuICAgICAgICBsZXQgcGFyYW1zID0ge307XHJcbiAgICAgICAgbGV0IGFyTGVzc29ucztcclxuICAgICAgICBsZXQgbGVzc29ucztcclxuXHJcbiAgICAgICAgcGFyYW1zLmZpbHRlciA9IGZpbHRlcjtcclxuICAgICAgICBwYXJhbXMuZGF0YSA9IHRoaXMuZGIuZ2V0RGF0YSgpLmRhdGE7XHJcbiAgICAgICAgYXJMZXNzb25zID0gdGhpcy5maWx0ZXJzLmZpbHRlcihwYXJhbXMpO1xyXG4gICAgICAgIGxlc3NvbnMgPSB0aGlzLnRlbXBsYXRlcy50ZW1wbGF0ZSh0aGlzLmNvbnN0LlRFTVBMQVRFX0xFU1NPTlMsIGFyTGVzc29ucyk7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy50YWJsZSA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLnRhYmxlLnRhYmxlUmVuZGVyKGxlc3NvbnMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFyTGVzc29ucztcclxuICAgIH1cclxuXHJcbiAgICBnZXRFbnRyeShwYXJhbXMsIHRhYmxlKSB7XHJcbiAgICAgICAgbGV0IGVudHJ5O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghdGFibGUpIHtcclxuICAgICAgICAgICAgZW50cnkgPSB0aGlzLmZpbHRlcnMuZmlsdGVyKCB7XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHBhcmFtcyxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHRoaXMuZGIuZ2V0RGF0YSgpLmRhdGFcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZW50cnkgPSB0aGlzLmZpbHRlcnMuZmlsdGVyKCBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IHBhcmFtcyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0aGlzLmRiLmdldERhdGEoKS5kYXRhUmF3XHJcbiAgICAgICAgICAgICAgICB9LCBcclxuICAgICAgICAgICAgICAgIHRhYmxlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGVudHJ5WzBdO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEVudHJpZXModGFibGUpIHtcclxuICAgICAgICBpZiAodGFibGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGIuZGF0YVJhd1t0YWJsZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmRiLmRhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgdGFibGVSZW5kZXIoKSB7XHJcbiAgICAgICAgbGV0IGRhdGEgPSB0aGlzLmRiLmdldERhdGEoKS5kYXRhO1xyXG4gICAgICAgIGxldCBsZXNzb25zID0gdGhpcy50ZW1wbGF0ZXMudGVtcGxhdGUodGhpcy5jb25zdC5URU1QTEFURV9MRVNTT05TLCBkYXRhKTtcclxuXHJcbiAgICAgICAgdGhpcy50YWJsZS50YWJsZVJlbmRlcihsZXNzb25zKTtcclxuICAgIH1cclxufSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFBvcHVwIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdFdpbmRvdygpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRXaW5kb3coKSB7XHJcbiAgICAgICAgbGV0IHdpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wb3B1cF9fY250Jyk7XHJcblxyXG4gICAgICAgIGlmICghd2luKSB7XHJcbiAgICAgICAgICAgIHdpbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICB3aW4uY2xhc3NMaXN0LmFkZCgncG9wdXBfX2NudCcpO1xyXG4gICAgICAgICAgICB3aW4uaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJwb3B1cF9fY250LS13aW5kb3dcIj48L2Rpdj4nO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHdpbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLndpbiA9IHdpbjtcclxuICAgIH1cclxuXHJcbiAgICBvcGVuKGNvbnRlbnQpIHtcclxuICAgICAgICB0aGlzLndpbi5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgICB0aGlzLnNldENvbnRlbnQoY29udGVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgZXZlbnRDbG9zZShub2RlU3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG5vZGVTdHJpbmcpO1xyXG5cclxuICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGNsb3NlKCkge1xyXG4gICAgICAgIHRoaXMud2luLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldENvbnRlbnQoY29udGVudCkge1xyXG4gICAgICAgIGxldCBjb250YWluZXIgPSB0aGlzLndpbi5xdWVyeVNlbGVjdG9yKCcucG9wdXBfX2NudC0td2luZG93Jyk7XHJcblxyXG4gICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBjb250ZW50O1xyXG4gICAgfVxyXG59ICIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFRhYmxlIHtcclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcclxuICAgICAgICB0aGlzLnRhYmxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvcHRpb25zLnRhYmxlKTtcclxuICAgICAgICB0aGlzLnBvcHVwID0gb3B0aW9ucy5wb3B1cDtcclxuICAgICAgICB0aGlzLnRlbXBsYXRlcyA9IG9wdGlvbnMudGVtcGxhdGU7XHJcbiAgICAgICAgdGhpcy5kYXRhUmF3ID0gb3B0aW9ucy5kYXRhLmRhdGFSYXc7XHJcbiAgICAgICAgdGhpcy5faW5pdEV2ZW50KCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGFibGVSZW5kZXIoY29udGVudCkge1xyXG4gICAgICAgIGxldCB0Ym9keSA9IHRoaXMudGFibGUucXVlcnlTZWxlY3RvcigndGJvZHknKTtcclxuXHJcbiAgICAgICAgdGJvZHkuaW5uZXJIVE1MID0gY29udGVudDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgX2luaXRFdmVudCgpIHtcclxuICAgICAgICBsZXQgdGFibGUgPSB0aGlzLnRhYmxlO1xyXG5cclxuICAgICAgICB0YWJsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xyXG5cclxuICAgICAgICAgICAgaWYgKHRhcmdldC50YWdOYW1lICE9PSAnQScpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2xlc3Nvbl9fbGVjdG9yJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBpZCA9IHRhcmdldC5kYXRhc2V0LmlkO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclBvcHVwKCdsZWN0b3InLCBpZCk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2xlc3Nvbl9fbWF0ZXJpYWwnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGlkID0gdGFyZ2V0LmRhdGFzZXQuaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyUG9wdXAoJ21hdGVyaWFsJywgaWQpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIF9yZW5kZXJQb3B1cChrZXksIGlkKSB7XHJcbiAgICAgICAgbGV0IGZpZWxkcyA9IHRoaXMuX2dldEZpZWxkcyh0aGlzLmRhdGFSYXdba2V5XSk7XHJcbiAgICAgICAgbGV0IGNvbnRlbnQgPSB0aGlzLnRlbXBsYXRlcy50ZW1wbGF0ZShrZXksIGZpZWxkc1tpZF0pO1xyXG5cclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMucG9wdXAub3Blbihjb250ZW50KTtcclxuICAgICAgICB0aGlzLnBvcHVwLmV2ZW50Q2xvc2UoJy5wX2Nsb3NlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgX2dldEZpZWxkcyhkYXRhKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IHt9O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGVsZW1lbnQgPSBkYXRhW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtgJHtlbGVtZW50LmlkfWBdID0gZWxlbWVudDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBPRGF0ZSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldERhdGUobW91bnRoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKDIwMTcsICttb3VudGggKyAxLCAwKS5nZXREYXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RGF0ZURldGFpbChkYXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Zvcm1hdERhdGVGaWVsZChkYXRlKTtcclxuICAgIH1cclxuXHJcbiAgICBfZm9ybWF0RGF0ZUZpZWxkKGRhdGUpIHtcclxuICAgICAgICBsZXQgZnJvbSA9IG5ldyBEYXRlKGRhdGUuZnJvbSk7XHJcbiAgICAgICAgbGV0IHRvID0gbmV3IERhdGUoZGF0ZS50byk7XHJcblxyXG4gICAgICAgIGxldCB5ZWFyRnJvbSA9IGZyb20uZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICBsZXQgbW9udGhGcm9tID0gZnJvbS5nZXRNb250aCgpO1xyXG4gICAgICAgIGxldCBkYXRlRnJvbSA9IGZyb20uZ2V0RGF0ZSgpO1xyXG4gICAgICAgIGxldCBob3VyRnJvbSA9IGZyb20uZ2V0SG91cnMoKTtcclxuICAgICAgICBsZXQgbWluRnJvbSA9IGZyb20uZ2V0TWludXRlcygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCB5ZWFyVG8gPSB0by5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgIGxldCBtb250aFRvID0gdG8uZ2V0TW9udGgoKTtcclxuICAgICAgICBsZXQgZGF0ZVRvID0gdG8uZ2V0RGF0ZSgpO1xyXG4gICAgICAgIGxldCBob3VyVG8gPSB0by5nZXRIb3VycygpO1xyXG4gICAgICAgIGxldCBtaW5UbyA9IHRvLmdldE1pbnV0ZXMoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZnJvbToge1xyXG4gICAgICAgICAgICAgICAgeWVhcjogeWVhckZyb20sXHJcbiAgICAgICAgICAgICAgICBtb250aDogbW9udGhGcm9tLFxyXG4gICAgICAgICAgICAgICAgZGF0ZTogZGF0ZUZyb20sXHJcbiAgICAgICAgICAgICAgICBob3VyOiBob3VyRnJvbSxcclxuICAgICAgICAgICAgICAgIG1pbjogbWluRnJvbVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0bzoge1xyXG4gICAgICAgICAgICAgICAgeWVhcjogeWVhclRvLFxyXG4gICAgICAgICAgICAgICAgbW9udGg6IG1vbnRoVG8sXHJcbiAgICAgICAgICAgICAgICBkYXRlOiBkYXRlVG8sXHJcbiAgICAgICAgICAgICAgICBob3VyOiBob3VyVG8sXHJcbiAgICAgICAgICAgICAgICBtaW46IG1pblRvXHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICBcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIF9mb3JtYXREYXRlQWRkTnVsbChudW1iZXIpIHtcclxuICAgICAgICBpZiAobnVtYmVyIDwgMTApIHtcclxuICAgICAgICAgICAgcmV0dXJuICcwJyArIG51bWJlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudW1iZXI7XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IGRhdGVDbGFzcyBmcm9tICcuL2RhdGUnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3RhcnQge1xyXG4gICAgY29uc3RydWN0b3IobWVkaWF0b3IpIHtcclxuICAgICAgICB0aGlzLm1lZGlhdG9yID0gbWVkaWF0b3I7XHJcbiAgICAgICAgdGhpcy5wbGFnaW5Db250YWluZXJzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBsYWdpbl9fY29udGFpbmVyJyk7XHJcbiAgICAgICAgdGhpcy5lZGl0Rm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm1bbmFtZT1cImZvcm1fZWRpdF9maWVsZHNcIl0nKTtcclxuICAgICAgICB0aGlzLnRhYkNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwbGFnaW5fX3NjaGVkdWxlci0tZWRpdCcpO1xyXG4gICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBkYXRlQ2xhc3MoKTtcclxuICAgICAgICB0aGlzLl9pbml0KCk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RUYWIoKTtcclxuICAgICAgICB0aGlzLndhdGNoU2VsZWN0VGFiKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlU2VsZWN0VGFiKCkge1xyXG4gICAgICAgIGxldCB0YWJDb250YWluZXIgPSB0aGlzLnRhYkNvbnRhaW5lcjtcclxuICAgICAgICBsZXQgc2VsZWN0cyA9IHRhYkNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdzZWxlY3RbZGF0YS1zZWxlY3RlZF0nKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBzZWxlY3QgPSBzZWxlY3RzW2ldO1xyXG4gICAgICAgICAgICBsZXQgdGFibGUgPSBzZWxlY3QuZGF0YXNldC5zZWxlY3RlZDtcclxuICAgICAgICAgICAgbGV0IGxlc3NvbnMgPSB0aGlzLm1lZGlhdG9yLmdldEVudHJpZXModGFibGUpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fZmlsbFNlbGVjdE9wdGlvbnMobGVzc29ucywgc2VsZWN0KTtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlQ29udGVudFRhYih0YWJsZSwgc2VsZWN0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgd2F0Y2hTZWxlY3RUYWIoKSB7XHJcbiAgICAgICAgbGV0IHRhYkNvbnRhaW5lciA9IHRoaXMudGFiQ29udGFpbmVyO1xyXG5cclxuICAgICAgICB0YWJDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0YXJnZXQgPSBldmVudC50YXJnZXQ7XHJcblxyXG4gICAgICAgICAgICBpZiAodGFyZ2V0LnRhZ05hbWUgPT0gJ1NFTEVDVCcgJiYgdGFyZ2V0LmRhdGFzZXQuc2VsZWN0ZWQpIHsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBsZXQgdGFibGUgPSB0YXJnZXQuZGF0YXNldC5zZWxlY3RlZDtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVDb250ZW50VGFiKHRhYmxlLCB0YXJnZXQpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgX3VwZGF0ZUNvbnRlbnRUYWIodGFibGUsIHRhcmdldCkge1xyXG4gICAgICAgIGxldCBpZCA9IHRhcmdldC52YWx1ZTtcclxuICAgICAgICBsZXQgcGFyYW1zID0geyBpZDogK2lkIH07XHJcbiAgICAgICAgbGV0IGVudHJ5ID0gdGhpcy5tZWRpYXRvci5nZXRFbnRyeShwYXJhbXMsIHRhYmxlKTtcclxuXHJcbiAgICAgICAgaWYgKHRhYmxlID09ICdsZXNzb25zJykge1xyXG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUYWJMZXNzb25zKHRhcmdldCwgZW50cnkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGFibGUgPT0gJ3NjaG9vbCcpIHtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVGFiU2Nob29sKHRhcmdldCwgZW50cnkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGFibGUgPT0gJ2NsYXNzcm9vbScpIHtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVGFiQ2xhc3Nyb29tKHRhcmdldCwgZW50cnkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfZmlsbFNlbGVjdE9wdGlvbnMoZWxlbWVudHMsIHNlbGVjdCkge1xyXG4gICAgICAgIGxldCBvcHRpb25zID0gJyc7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGVsZW1lbnQgPSBlbGVtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICAgIG9wdGlvbnMgKz0gYDxvcHRpb24gdmFsdWUgPSBcIiR7ZWxlbWVudC5pZH1cIj4ke2VsZW1lbnQubmFtZX08L29wdGlvbj5gO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VsZWN0LmlubmVySFRNTCA9IG9wdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgX3VwZGF0ZVRhYkNsYXNzcm9vbSh0YXJnZXQsIGVudHJ5KSB7XHJcbiAgICAgICAgbGV0IGNvbnRhaW5lciA9IHRhcmdldC5jbG9zZXN0KCcucGxhZ2luX19ib2R5LXRhYi1jb250Jyk7XHJcbiAgICAgICAgbGV0IG5hbWUgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cImNsYXNzcm9vbV9uYW1lXCJdJyk7XHJcbiAgICAgICAgbGV0IGxvY2F0aW9uID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJsb2NhdGlvblwiXScpO1xyXG4gICAgICAgIGxldCBjYXBhY2l0eSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiY2FwYWNpdHlcIl0nKTtcclxuXHJcbiAgICAgICAgbmFtZS52YWx1ZSA9IGVudHJ5Lm5hbWU7XHJcbiAgICAgICAgbG9jYXRpb24udmFsdWUgPSBlbnRyeS5sb2NhdGlvbjtcclxuICAgICAgICBjYXBhY2l0eS52YWx1ZSA9IGVudHJ5LmNhcGFjaXR5O1xyXG4gICAgfVxyXG5cclxuICAgIF91cGRhdGVUYWJTY2hvb2wodGFyZ2V0LCBlbnRyeSkge1xyXG4gICAgICAgIGxldCBjb250YWluZXIgPSB0YXJnZXQuY2xvc2VzdCgnLnBsYWdpbl9fYm9keS10YWItY29udCcpO1xyXG4gICAgICAgIGxldCBuYW1lID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJzY2hvb2xfbmFtZVwiXScpO1xyXG4gICAgICAgIGxldCBxdWFudGl0eSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwic3R1ZGVudF9xdWFudGl0eVwiXScpO1xyXG5cclxuICAgICAgICBuYW1lLnZhbHVlID0gZW50cnkubmFtZTtcclxuICAgICAgICBxdWFudGl0eS52YWx1ZSA9IGVudHJ5LnN0dWRlbnRzO1xyXG4gICAgfVxyXG5cclxuICAgIF91cGRhdGVUYWJMZXNzb25zKHRhcmdldCwgZW50cnkpIHtcclxuICAgICAgICBsZXQgY29udGFpbmVyID0gdGFyZ2V0LmNsb3Nlc3QoJy5wbGFnaW5fX2JvZHktdGFiLWNvbnQnKTtcclxuICAgICAgICBsZXQgbmFtZSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwibGVzc29uX25hbWVcIl0nKTtcclxuICAgICAgICBsZXQgc2Nob29sID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdFtuYW1lPVwic2Nob29sXCJdJyk7XHJcbiAgICAgICAgbGV0IGxlY3RvciA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdzZWxlY3RbbmFtZT1cImxlY3RvclwiXScpO1xyXG4gICAgICAgIGxldCBjbGFzc3Jvb20gPSBjb250YWluZXIucXVlcnlTZWxlY3Rvcignc2VsZWN0W25hbWU9XCJjbGFzc3Jvb21cIl0nKTtcclxuICAgICAgICBsZXQgZGF0ZSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcuZGF0ZScpO1xyXG4gICAgICAgIGxldCB0YWJsZVNjaG9vbCA9IHRoaXMubWVkaWF0b3IuZGIuZGF0YVJhdy5zY2hvb2w7XHJcblxyXG4gICAgICAgIHRoaXMuX2ZpbGxTZWxlY3RPcHRpb25zKHRhYmxlU2Nob29sLCBzY2hvb2wpO1xyXG4gICAgICAgIG5hbWUudmFsdWUgPSBlbnRyeS5uYW1lO1xyXG4gICAgICAgIGxlY3Rvci52YWx1ZSA9IGVudHJ5LmxlY3Rvci5pZDtcclxuICAgICAgICBjbGFzc3Jvb20udmFsdWUgPSBlbnRyeS5jbGFzc3Jvb20uaWQ7XHJcbiAgICAgICAgdGhpcy5fc2V0RGF0ZUZpZWxkKGVudHJ5LmRhdGUsIGRhdGUpO1xyXG4gICAgICAgIHRoaXMuX3NldE9wdGlvbnMoZW50cnkuc2Nob29sLCBzY2hvb2wpO1xyXG4gICAgfVxyXG5cclxuICAgIF9zZXREYXRlRmllbGQoZGF0ZSwgZGF0ZUNvbnRhaW5lcikge1xyXG4gICAgICAgIGxldCBkYXRlRmllbGRzID0gdGhpcy5tZWRpYXRvci5kYXRlLmdldERhdGVEZXRhaWwoZGF0ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NldERhdGVGcm9tVG8oZGF0ZUNvbnRhaW5lciwgZGF0ZUZpZWxkcyk7XHJcbiAgICB9XHJcblxyXG4gICAgX3NldERhdGVGcm9tVG8oY29udGFpbmVyLCBkYXRlRmllbGRzKSB7XHJcbiAgICAgICAgbGV0IHJvd0NvbnRhaW5lcnMgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLmRhdGVfX3Jvd3MnKTtcclxuICAgICAgICBsZXQgcm93cyA9IHRoaXMuX2dldFJvd0NvbnRhaW5lcnMocm93Q29udGFpbmVycyk7XHJcbiAgICAgICAgbGV0IGxpbmtEYXRlRmllbGQgPSB7XHJcbiAgICAgICAgICAgIGZyb206IHRoaXMuX2dldERhdGVGaWVsZChyb3dzLmZyb20pLFxyXG4gICAgICAgICAgICB0bzogdGhpcy5fZ2V0RGF0ZUZpZWxkKHJvd3MudG8pXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhsaW5rRGF0ZUZpZWxkLmZyb20pO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGtleSA9IGtleXNbaV07XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9zZXRPcHRpb25zRGF0ZShkYXRlRmllbGRzLmZyb21ba2V5XSwgbGlua0RhdGVGaWVsZC5mcm9tW2tleV0pO1xyXG4gICAgICAgICAgICB0aGlzLl9zZXRPcHRpb25zRGF0ZShkYXRlRmllbGRzLnRvW2tleV0sIGxpbmtEYXRlRmllbGQudG9ba2V5XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9nZXRSb3dDb250YWluZXJzKHJvd0NvbnRhaW5lcnMpIHtcclxuICAgICAgICBsZXQgcm93cyA9IHt9O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvd0NvbnRhaW5lcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IHJvdyA9IHJvd0NvbnRhaW5lcnNbaV07XHJcbiAgICAgICAgICAgIGxldCBkYXRhID0gcm93LmRhdGFzZXQuZGF0ZTtcclxuXHJcbiAgICAgICAgICAgIHJvd3NbZGF0YV0gPSByb3c7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcm93cztcclxuICAgIH1cclxuXHJcbiAgICBfZ2V0RGF0ZUZpZWxkKHJvdykge1xyXG4gICAgICAgIGxldCBtb250aCA9IHJvdy5xdWVyeVNlbGVjdG9yKCdzZWxlY3RbbmFtZT1cIm1vbnRoXCJdJyk7XHJcbiAgICAgICAgbGV0IGRhdGUgPSByb3cucXVlcnlTZWxlY3Rvcignc2VsZWN0W25hbWU9XCJkYXlcIl0nKTtcclxuICAgICAgICBsZXQgaG91ciA9IHJvdy5xdWVyeVNlbGVjdG9yKCdzZWxlY3RbbmFtZT1cImhvdXJcIl0nKTtcclxuICAgICAgICBsZXQgbWluID0gcm93LnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdFtuYW1lPVwibWludXRcIl0nKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbW9udGg6IG1vbnRoLFxyXG4gICAgICAgICAgICBkYXRlOiBkYXRlLFxyXG4gICAgICAgICAgICBob3VyOiBob3VyLFxyXG4gICAgICAgICAgICBtaW46IG1pblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfc2V0T3B0aW9uc0RhdGUodmFsdWVPcHRpb24sIHNlbGVjdCkge1xyXG4gICAgICAgIGxldCBvcHRpb25zID0gc2VsZWN0Lm9wdGlvbnM7XHJcblxyXG4gICAgICAgIGlmICghb3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IG9wdGlvbiA9IG9wdGlvbnNbaV07XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlT3B0aW9uO1xyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbi52YWx1ZSA9PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9zZXRPcHRpb25zKHZhbHVlT3B0aW9ucywgc2VsZWN0KSB7XHJcbiAgICAgICAgbGV0IG9wdGlvbnMgPSBzZWxlY3Qub3B0aW9ucztcclxuXHJcbiAgICAgICAgaWYgKCFvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlT3B0aW9ucykpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgb3B0aW9uID0gb3B0aW9uc1tpXTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlT3B0aW9ucy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlT3B0aW9uc1tqXS5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbi52YWx1ZSA9PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBvcHRpb24gPSBvcHRpb25zW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlT3B0aW9ucy5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9uLnZhbHVlID09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2luaXQoKSB7XHJcbiAgICAgICAgbGV0IGNvbnRhaW5lcnMgPSB0aGlzLnBsYWdpbkNvbnRhaW5lcnM7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgY29udGFpbmVyID0gY29udGFpbmVyc1tpXTtcclxuICAgICAgICAgICAgbGV0IHRpdGxlID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5wbGFnaW5fX3RpdGxlJyk7XHJcbiAgICAgICAgICAgIGxldCBib2R5ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5wbGFnaW5fX2JvZHknKTtcclxuXHJcbiAgICAgICAgICAgIGJvZHkuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XHJcbiAgICAgICAgICAgIHRpdGxlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYm9keS5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LnRhZ05hbWUgPT09ICdTRUxFQ1QnICYmIHRhcmdldC5nZXRBdHRyaWJ1dGUoJ25hbWUnKSA9PT0gJ21vbnRoJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtb250aCA9ICt0YXJnZXQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRhdGUgPSB0aGlzLmRhdGUuZ2V0RGF0ZShtb250aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9wdGlvbnMgPSB0aGlzLl9jb21waWxlRGF0ZShkYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZGF0ZVNlbGVjdCA9IHRhcmdldC5jbG9zZXN0KCcuZGF0ZV9fcm93cycpLnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdFtuYW1lPVwiZGF5XCJdJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGVTZWxlY3QuaW5uZXJIVE1MID0gb3B0aW9ucztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY2xvc2VzdCgnLnJhZGlvJykgJiYgdGFyZ2V0LnRhZ05hbWUgPT09ICdJTlBVVCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSB0YXJnZXQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhYkNvbnRhaW5lcnMgPSBib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wbGFnaW5fX2JvZHktdGFiLWNvbnQnKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdGFiQ29udDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YWJDb250YWluZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0YWJDb250YWluZXIgPSB0YWJDb250YWluZXJzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhYkNvbnRhaW5lci5kYXRhc2V0LnRhYiA9PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFiQ29udCA9IHRhYkNvbnRhaW5lcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGFiQ29udC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdEZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBfY29tcGlsZURhdGUoZGF0ZSkge1xyXG4gICAgICAgIGxldCBsZW5ndGggPSBkYXRlICsgMTtcclxuICAgICAgICBsZXQgb3B0aW9ucyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBvcHRpb24gPSBgPG9wdGlvbiB2YWx1ZSA9IFwiJHtpfVwiPiR7aX08L29wdGlvbj5gO1xyXG5cclxuICAgICAgICAgICAgb3B0aW9ucy5wdXNoKG9wdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3B0aW9ucy5qb2luKCcnKTtcclxuICAgIH1cclxufSIsImxldCBkYXRhUmF3ID0ge1xyXG4gICAgbGVzc29uczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgICAgIHNjaG9vbDogeyBpZDogMSB9LFxyXG4gICAgICAgICAgICBuYW1lOiAn0JDQtNCw0L/RgtC40LLQvdCw0Y8g0LLRkdGA0YHRgtC60LAnLFxyXG4gICAgICAgICAgICBsZWN0b3I6IHsgaWQ6IDEgfSxcclxuICAgICAgICAgICAgZGF0ZTogeyBmcm9tOiAxNDk4OTI2NjAwMDAwLCB0bzogMTQ5ODkzMDIwMDAwMCB9LCAvLyAxLjA3IDE5OjMwLTIwOjMwXHJcbiAgICAgICAgICAgIGNsYXNzcm9vbTogeyBpZDogMSB9LFxyXG4gICAgICAgICAgICBtYXRlcmlhbDogeyBpZDogMSB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAyLFxyXG4gICAgICAgICAgICBzY2hvb2w6IHsgaWQ6IDEgfSxcclxuICAgICAgICAgICAgbmFtZTogJ9Cg0LDQsdC+0YLQsCDRgSDRgdC10L3RgdC+0YDQvdGL0Lwg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GM0YHQutC40Lwg0LLQstC+0LTQvtC8JyxcclxuICAgICAgICAgICAgbGVjdG9yOiB7IGlkOiAxIH0sXHJcbiAgICAgICAgICAgIGRhdGU6IHsgZnJvbTogMTQ5OTAxMzAwMDAwMCwgdG86IDE0OTkwMjAyMDAwMDAgfSwgICAvLyAyLjA3IDE5OjMwLTIxOjMwXHJcbiAgICAgICAgICAgIGNsYXNzcm9vbTogeyBpZDogMSB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogMyxcclxuICAgICAgICAgICAgc2Nob29sOiB7IGlkOiAxIH0sXHJcbiAgICAgICAgICAgIG5hbWU6ICfQnNGD0LvRjNGC0LjQvNC10LTQuNCwOiDQstC+0LfQvNC+0LbQvdC+0YHRgtC4INCx0YDQsNGD0LfQtdGA0LAnLFxyXG4gICAgICAgICAgICBsZWN0b3I6IHsgaWQ6IDIgfSxcclxuICAgICAgICAgICAgZGF0ZTogeyBmcm9tOiAxNDk5MDk5NDAwMDAwLCB0bzogMTQ5OTEwNjYwMDAwMCB9LCAgIC8vIDMuMDcgMTk6MzAtMjE6MzBcclxuICAgICAgICAgICAgY2xhc3Nyb29tOiB7IGlkOiAyIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiA0LFxyXG4gICAgICAgICAgICBzY2hvb2w6IHsgaWQ6IDIgfSxcclxuICAgICAgICAgICAgbmFtZTogJ0phdmEgQmxpdHogKNCn0LDRgdGC0YwgMSknLFxyXG4gICAgICAgICAgICBsZWN0b3I6IHsgaWQ6IDMgfSxcclxuICAgICAgICAgICAgZGF0ZTogeyBmcm9tOiAxNDk4OTI0ODYwMDAwLCB0bzogMTQ5ODkzMjA2MDAwMCB9LCAgIC8vIDEuMDcgMTk6MDAtMjE6MDBcclxuICAgICAgICAgICAgY2xhc3Nyb29tOiB7IGlkOiAzIH0sXHJcbiAgICAgICAgICAgIG1hdGVyaWFsOiB7IGlkOiAyIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6IDUsXHJcbiAgICAgICAgICAgIHNjaG9vbDogeyBpZDogMiB9LFxyXG4gICAgICAgICAgICBuYW1lOiAnR2l0ICYgV29ya2Zsb3cnLFxyXG4gICAgICAgICAgICBsZWN0b3I6IHsgaWQ6IDQgfSxcclxuICAgICAgICAgICAgZGF0ZTogeyBmcm9tOiAxNDk5MDEzMDAwMDAwLCB0bzogMTQ5OTAxNjYwMDAwMCB9LCAgIC8vIDIuMDcgMTk6MzAtMjA6MzBcclxuICAgICAgICAgICAgY2xhc3Nyb29tOiB7IGlkOiA0IH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiA2LFxyXG4gICAgICAgICAgICBzY2hvb2w6IHsgaWQ6IDIgfSxcclxuICAgICAgICAgICAgbmFtZTogJ0phdmEgQmxpdHogKNCn0LDRgdGC0YwgMiknLFxyXG4gICAgICAgICAgICBsZWN0b3I6IHsgaWQ6IDMgfSxcclxuICAgICAgICAgICAgZGF0ZTogeyBmcm9tOiAxNDk5MDk5NDAwMDAwLCB0bzogMTQ5OTEwNDg2MDAwMCB9LCAgIC8vIDMuMDcgMTk6MzAtMjE6MDBcclxuICAgICAgICAgICAgY2xhc3Nyb29tOiB7IGlkOiAzIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiA3LFxyXG4gICAgICAgICAgICBzY2hvb2w6IHsgaWQ6IDMgfSxcclxuICAgICAgICAgICAgbmFtZTogJ9CY0LTQtdGPLCDQuNGB0YHQu9C10LTQvtCy0LDQvdC40LUsINC60L7QvdGG0LXQv9GCICjQp9Cw0YHRgtGMIDEpJyxcclxuICAgICAgICAgICAgbGVjdG9yOiB7IGlkOiA1IH0sXHJcbiAgICAgICAgICAgIGRhdGU6IHsgZnJvbTogMTQ5ODkyNjYwMDAwMCwgdG86IDE0OTg5MzIwNjAwMDAgfSwgICAvLyAxLjA3IDE5OjMwLTIxOjAwXHJcbiAgICAgICAgICAgIGNsYXNzcm9vbTogeyBpZDogNCB9LFxyXG4gICAgICAgICAgICBtYXRlcmlhbDogeyBpZDogMyB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiA4LFxyXG4gICAgICAgICAgICBzY2hvb2w6IHsgaWQ6IDMgfSxcclxuICAgICAgICAgICAgbmFtZTogJ9CY0LTQtdGPLCDQuNGB0YHQu9C10LTQvtCy0LDQvdC40LUsINC60L7QvdGG0LXQv9GCICjQp9Cw0YHRgtGMIDIpJyxcclxuICAgICAgICAgICAgbGVjdG9yOiB7IGlkOiA1IH0sXHJcbiAgICAgICAgICAgIGRhdGU6IHsgZnJvbTogMTQ5OTAxMTI2MDAwMCwgdG86IDE0OTkwMTg0NjAwMDAgfSwgICAvLyAyLjA3IDE5OjAwLTIxOjAwXHJcbiAgICAgICAgICAgIGNsYXNzcm9vbTogeyBpZDogMiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogOSxcclxuICAgICAgICAgICAgc2Nob29sOiB7IGlkOiAzIH0sXHJcbiAgICAgICAgICAgIG5hbWU6ICfQntGB0L7QsdC10L3QvdC+0YHRgtC4INC/0YDQvtC10LrRgtC40YDQvtCy0LDQvdC40Y8g0LzQvtCx0LjQu9GM0L3Ri9GFINC40L3RgtC10YDRhNC10LnRgdC+0LInLFxyXG4gICAgICAgICAgICBsZWN0b3I6IHsgaWQ6IDYgfSxcclxuICAgICAgICAgICAgZGF0ZTogeyBmcm9tOiAxNDk5MDk3NjYwMDAwLCB0bzogMTQ5OTEwNDg2MDAwMCB9LCAgIC8vIDMuMDcgMTk6MDAtMjE6MDBcclxuICAgICAgICAgICAgY2xhc3Nyb29tOiB7IGlkOiAxIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAxMCxcclxuICAgICAgICAgICAgc2Nob29sOiBbeyBpZDogMSB9LCB7IGlkOiAyIH0sIHsgaWQ6IDMgfV0sXHJcbiAgICAgICAgICAgIG5hbWU6ICfQmNC00LXRjywg0LjRgdGB0LvQtdC00L7QstCw0L3QuNC1LCDQutC+0L3RhtC10L/RgiAo0KfQsNGB0YLRjCAyKScsXHJcbiAgICAgICAgICAgIGxlY3RvcjogeyBpZDogNSB9LFxyXG4gICAgICAgICAgICBkYXRlOiB7IGZyb206IDE0OTkxODQwNjAwMDAsIHRvOiAxNDk5MTkxMjYwMDAwIH0sICAgLy8gNC4wNyAxOTowMC0yMTowMFxyXG4gICAgICAgICAgICBjbGFzc3Jvb206IHsgaWQ6IDIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6IDExLFxyXG4gICAgICAgICAgICBzY2hvb2w6IFt7IGlkOiAxIH0sIHsgaWQ6IDIgfSwgeyBpZDogMyB9XSxcclxuICAgICAgICAgICAgbmFtZTogJ9Ce0YHQvtCx0LXQvdC90L7RgdGC0Lgg0L/RgNC+0LXQutGC0LjRgNC+0LLQsNC90LjRjyDQvNC+0LHQuNC70YzQvdGL0YUg0LjQvdGC0LXRgNGE0LXQudGB0L7QsicsXHJcbiAgICAgICAgICAgIGxlY3RvcjogeyBpZDogNiB9LFxyXG4gICAgICAgICAgICBkYXRlOiB7IGZyb206IDE0OTkyNzA0NjAwMDAsIHRvOiAxNDk5Mjc3NjYwMDAwIH0sICAgLy8gNS4wNyAxOTowMC0yMTowMFxyXG4gICAgICAgICAgICBjbGFzc3Jvb206IHsgaWQ6IDUgfSxcclxuICAgICAgICB9XHJcbiAgICBdLFxyXG4gICAgbWF0ZXJpYWw6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAxLFxyXG4gICAgICAgICAgICBuYW1lOiAn0JzQsNGC0LXRgNC40LDQu9GLJyxcclxuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9ldmVudHMueWFuZGV4LnJ1L2xpYi90YWxrcy80MTYyLydcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6IDIsXHJcbiAgICAgICAgICAgIG5hbWU6ICfQnNCw0YLQtdGA0LjQsNC70YsnLFxyXG4gICAgICAgICAgICBzcmM6ICdodHRwczovL2V2ZW50cy55YW5kZXgucnUvbGliL3RhbGtzLzQxNjIvJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogMyxcclxuICAgICAgICAgICAgbmFtZTogJ9Cc0LDRgtC10YDQuNCw0LvRiycsXHJcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vZXZlbnRzLnlhbmRleC5ydS9saWIvdGFsa3MvNDE2Mi8nXHJcbiAgICAgICAgfVxyXG4gICAgXSxcclxuICAgIGxlY3RvcjogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgICAgIG5hbWU6ICfQlNC80LjRgtGA0LjQuSDQlNGD0YjQutC40L0nLFxyXG4gICAgICAgICAgICBzcmM6ICdodHRwczovL2F2YXRhcnMubWRzLnlhbmRleC5uZXQvZ2V0LXlhZXZlbnRzLzk1MDQzLzA5MTRhYzQyYjZkYzExZTY4N2VmMDAyNTkwYzYyYTVjL2JpZycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn0JrQsNC90LTQuNC00LDRgiDRgtC10YXQvdC40YfQtdGB0LrQuNGFINC90LDRg9C6LCDQvdCw0YPRh9C90YvQuSDRgdC+0YLRgNGD0LTQvdC40Log0JjQn9CjINCg0JDQnSDRgSAyMDA4INC/0L4gMjAxMy4g0J/RgNC40YjRkdC7INCyINCv0L3QtNC10LrRgS7QmtCw0YDRgtC40L3QutC4INCyIDIwMTQg0LPQvtC00YMsINC+0YLQstC10YfQsNC7INC30LAg0LzQvtCx0LjQu9GM0L3Rg9GOINCy0LXRgNGB0LjRjiDQuCDRgNC+0YHRgiDQv9GA0L7QuNC30LLQvtC00LjRgtC10LvRjNC90L7RgdGC0Lgg0YHQtdGA0LLQuNGB0LAuINCSIDIwMTYg0L/QtdGA0LXRiNGR0Lsg0LIgWWFuZGV4IERhdGEgRmFjdG9yeSwg0LPQtNC1INGA0LDQt9GA0LDQsdCw0YLRi9Cy0LDQtdGCINC40L3RgtC10YDRhNC10LnRgdGLINC4INC00LjQt9Cw0LnQvSDQstC10LEt0L/RgNC40LvQvtC20LXQvdC40Lkg0LTQu9GPIEIyQi4nXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAyLFxyXG4gICAgICAgICAgICBuYW1lOiAn0JzQsNC60YHQuNC8INCS0LDRgdC40LvRjNC10LInLFxyXG4gICAgICAgICAgICBzcmM6ICdodHRwczovL2F2YXRhcnMubWRzLnlhbmRleC5uZXQvZ2V0LXlhZXZlbnRzLzE5NDQ2NC8yMWUxZGFlMmI2ZGMxMWU2ODdlZjAwMjU5MGM2MmE1Yy9iaWcnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ9CS0L4g0YTRgNC+0L3RgtC10L3QtC3RgNCw0LfRgNCw0LHQvtGC0LrQtSDRgSAyMDA3INCz0L7QtNCwLiDQlNC+IDIwMTMt0LPQviwg0LrQvtCz0LTQsCDQv9GA0LjRiNGR0Lsg0LIg0K/QvdC00LXQutGBLCDRgNCw0LHQvtGC0LDQuyDRgtC10YXQvdC+0LvQvtCz0L7QvCDQsiDRgdGC0YPQtNC40Lgg0JvQtdCx0LXQtNC10LLQsCDQuCDQtNGA0YPQs9C40YUg0LrQvtC80L/QsNC90LjRj9GFLidcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgICAgIG5hbWU6ICfQrdC00YPQsNGA0LQg0JzQsNGG0YPQutC+0LInLFxyXG4gICAgICAgICAgICBzcmM6ICdodHRwczovL2F2YXRhcnMubWRzLnlhbmRleC5uZXQvZ2V0LXlhZXZlbnRzLzE5ODMwNy85ZDlhODY3MmI2ZGExMWU2ODdlZjAwMjU5MGM2MmE1Yy9iaWcnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ9Cg0LDQt9GA0LDQsdCw0YLRi9Cy0LDRjiDQv9GA0LjQu9C+0LbQtdC90LjRjyDQtNC70Y8gQW5kcm9pZCDRgSAyMDEwINCz0L7QtNCwLiDQkiAyMDE0INC00LXQu9Cw0Lsg0LLRi9GB0L7QutC+0L3QsNCz0YDRg9C20LXQvdC90L7QtSDRhNC40L3QsNC90YHQvtCy0L7QtSDQv9GA0LjQu9C+0LbQtdC90LjQtS4g0KLQvtCz0LTQsCDQttC1INC90LDRh9Cw0Lsg0L7RgdCy0LDQuNCy0LDRgtGMINCQ0J7Qnywg0LLQvdC10LTRgNGP0Y8g0Y/Qt9GL0Log0LIg0L/RgNC+0LTQsNC60YjQvS4g0JIgMjAxNSDRgNCw0LfRgNCw0LHQsNGC0YvQstCw0Lsg0LjQvdGB0YLRgNGD0LzQtdC90YLRiyDQtNC70Y8gQW5kcm9pZCBTdHVkaW8sINC/0L7Qt9Cy0L7Qu9GP0Y7RidC40LUg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMIGFzcGVjdEog0LIg0YHQstC+0LjRhSDQv9GA0L7QtdC60YLQsNGFLiDQkiDQr9C90LTQtdC60YHQtSDQt9Cw0L3Rj9GCINC90LAg0L/RgNC+0LXQutGC0LUg0JDQstGC0L4u0YDRgy4nXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiA0LFxyXG4gICAgICAgICAgICBuYW1lOiAn0JTQvNC40YLRgNC40Lkg0KHQutC70LDQtNC90L7QsicsXHJcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vYXZhdGFycy5tZHMueWFuZGV4Lm5ldC9nZXQteWFldmVudHMvMTk3NzUzLzA4YzYwNWVjYjZkYzExZTY4N2VmMDAyNTkwYzYyYTVjL2JpZycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn0J7QutC+0L3Rh9C40Lsg0YTQsNC60YPQu9GM0YLQtdGCINCY0KIg0JzQvtGB0LrQvtCy0YHQutC+0LPQviDQotC10YXQvdC40YfQtdGB0LrQvtCz0L4g0KPQvdC40LLQtdGA0YHQuNGC0LXRgtCwLiDQkiDQr9C90LTQtdC60YHQtSDRgSAyMDE1INCz0L7QtNCwLCDRgNCw0LfRgNCw0LHQsNGC0YvQstCw0LXRgiDQv9GA0LjQu9C+0LbQtdC90LjQtSBBdXRvLnJ1INC00LvRjyBBbmRyb2lkLidcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6IDUsXHJcbiAgICAgICAgICAgIG5hbWU6ICfQkNC90YLQvtC9INCi0LXQvScsXHJcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vYXZhdGFycy5tZHMueWFuZGV4Lm5ldC9nZXQteWFldmVudHMvMjA0MjY4LzA3YmI1ZjhhYjZkYzExZTY4N2VmMDAyNTkwYzYyYTVjL2JpZycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn0JIg0K/QvdC00LXQutGB0LUg0YEgMjAxNCDQs9C+0LTQsC4g0JLQtdC00YPRidC40Lkg0LTQuNC30LDQudC90LXRgCDQv9GA0L7QtNGD0LrRgtCwINCyINGB0LXRgNCy0LjRgdCw0YUg0J/QtdGA0LXQstC+0LTRh9C40LosINCg0LDRgdC/0LjRgdCw0L3QuNGPINC4INCS0LjQtNC10L4uJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogNixcclxuICAgICAgICAgICAgbmFtZTogJ9CS0LDRgdGO0L3QuNC9INCd0LjQutC+0LvQsNC5JyxcclxuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9hdmF0YXJzLm1kcy55YW5kZXgubmV0L2dldC15YWV2ZW50cy8xOTQ0NjQvMWM1NWI4ZDJiNmRjMTFlNjg3ZWYwMDI1OTBjNjJhNWMvYmlnJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICfQn9GA0LjRiNGR0Lsg0LIg0K/QvdC00LXQutGBINCyIDIwMTQg0LPQvtC00YMuINCU0LjQt9Cw0LnQvdC10YAg0L/RgNC+0LTRg9C60YLQsCDQsiDQvNGD0LfRi9C60LDQu9GM0L3Ri9GFINGB0LXRgNCy0LjRgdCw0YUg0LrQvtC80L/QsNC90LjQuCwg0YPRh9Cw0YHRgtC90LjQuiDQutC+0LzQsNC90LTRiyDRgNCw0LfRgNCw0LHQvtGC0LrQuCDQr9C90LTQtdC60YEu0KDQsNC00LjQvi4nXHJcbiAgICAgICAgfVxyXG4gICAgXSxcclxuICAgIHNjaG9vbDogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgICAgIG5hbWU6ICfQoNCw0LfRgNCw0LHQvtGC0LrQsCDQuNC90YLQtdGA0YTQtdC50YHQvtCyJyxcclxuICAgICAgICAgICAgc3R1ZGVudHM6IDIwXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAyLFxyXG4gICAgICAgICAgICBuYW1lOiAn0JzQvtCx0LjQu9GM0L3QsNGPINGA0LDQt9GA0LDQsdC+0YLQutCwJyxcclxuICAgICAgICAgICAgc3R1ZGVudHM6IDMwXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAzLFxyXG4gICAgICAgICAgICBuYW1lOiAn0JzQvtCx0LjQu9GM0L3Ri9C5INC00LjQt9Cw0LnQvScsXHJcbiAgICAgICAgICAgIHN0dWRlbnRzOiAyNVxyXG4gICAgICAgIH1cclxuICAgIF0sXHJcbiAgICBjbGFzc3Jvb206IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAxLFxyXG4gICAgICAgICAgICBuYW1lOiAn0JDRg9C00LjRgtC+0YDQuNGPIDEnLFxyXG4gICAgICAgICAgICBjYXBhY2l0eTogNjAsXHJcbiAgICAgICAgICAgIGxvY2F0aW9uOiAn0LrQvtGA0L/Rg9GBIDEsIDMg0Y3RgtCw0LYnXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAyLFxyXG4gICAgICAgICAgICBuYW1lOiAn0JDRg9C00LjRgtC+0YDQuNGPIDInLFxyXG4gICAgICAgICAgICBjYXBhY2l0eTogMTAwLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogJ9C60L7RgNC/0YPRgSAxLCAzINGN0YLQsNC2J1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogMyxcclxuICAgICAgICAgICAgbmFtZTogJ9CQ0YPQtNC40YLQvtGA0LjRjyAzJyxcclxuICAgICAgICAgICAgY2FwYWNpdHk6IDQwLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogJ9C60L7RgNC/0YPRgSAyLCAxINGN0YLQsNC2J1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogNCxcclxuICAgICAgICAgICAgbmFtZTogJ9CQ0YPQtNC40YLQvtGA0LjRjyA0JyxcclxuICAgICAgICAgICAgY2FwYWNpdHk6IDcwLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogJ9C60L7RgNC/0YPRgSAzLCA0INGN0YLQsNC2J1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogNSxcclxuICAgICAgICAgICAgbmFtZTogJ9CQ0YPQtNC40YLQvtGA0LjRjyA1JyxcclxuICAgICAgICAgICAgY2FwYWNpdHk6IDgwLFxyXG4gICAgICAgICAgICBsb2NhdGlvbjogJ9C60L7RgNC/0YPRgSAzLCA0INGN0YLQsNC2J1xyXG4gICAgICAgIH1cclxuICAgIF1cclxufTtcclxuXHJcbmV4cG9ydCB7XHJcbiAgICBkYXRhUmF3XHJcbn07IiwiaW1wb3J0IHsgZGF0YVJhdyB9IGZyb20gJy4vX2xlc3Nvbl9kYXRhJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERCIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbG9jYWxTdG9yYWdlID09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRoaXMubHMgPSBsb2NhbFN0b3JhZ2U7XHJcbiAgICAgICAgICAgIHRoaXMuaXNMcyA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5pc0xzID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5pc0xzICYmICF0aGlzLmxzLmRhdGEpIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhUmF3ID0gZGF0YVJhdztcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gdGhpcy5fY29tcGlsZURhdGEodGhpcy5kYXRhUmF3KTtcclxuICAgICAgICAgICAgdGhpcy5fd3JpdGVEYXRhKHRoaXMuZGF0YVJhdyk7XHJcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5pc0xzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YVJhdyA9IGRhdGFSYXc7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IHRoaXMuX2NvbXBpbGVEYXRhKHRoaXMuZGF0YVJhdyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhUmF3ID0gdGhpcy5fcmVhZERhdGEoKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gdGhpcy5fY29tcGlsZURhdGEodGhpcy5kYXRhUmF3KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RGF0YSgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBkYXRhOiB0aGlzLmRhdGEsXHJcbiAgICAgICAgICAgIGRhdGFSYXc6IHRoaXMuZGF0YVJhd1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhZGQoYXJncykge1xyXG4gICAgICAgIGxldCBlbnRyeUFkZCA9IGFyZ3MuZW50cnk7XHJcbiAgICAgICAgbGV0IHRhYmxlRGF0YSA9IHRoaXMuZGF0YVJhd1thcmdzLnRhYmxlXTtcclxuICAgICAgICBsZXQgcmVzdWx0ID0geyBlcnJvcjogJycsIG9rOiBmYWxzZSB9O1xyXG4gICAgICAgIGxldCBjaGVjayA9ICcnO1xyXG4gICAgICAgIGxldCBpZE5ld0xlc3NvbjtcclxuICAgICAgICBsZXQgaWROZXdTY2hvb2w7XHJcbiAgICAgICAgbGV0IGlkTmV3Q2xhc3Nyb29tO1xyXG5cclxuICAgICAgICBpZiAoYXJncy50YWJsZSA9PSAnbGVzc29ucycpIHtcclxuICAgICAgICAgICAgLy8gdGVzdCBmaWVsZCBuZXcgbGVzc29uXHJcbiAgICAgICAgICAgIGNoZWNrICs9IHRoaXMuX2NoZWNrTmFtZVVuaXEoe1xyXG4gICAgICAgICAgICAgICAgZW50cnk6IGVudHJ5QWRkLFxyXG4gICAgICAgICAgICAgICAgdGFibGU6IHRhYmxlRGF0YVxyXG4gICAgICAgICAgICB9LCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHRlc3QgY2xhc3Nyb29tIGlzIGJ1c3lcclxuICAgICAgICAgICAgY2hlY2sgKz0gdGhpcy5fY2hlY2tMZXNzb25zQ2xhc3Nyb29tKHtcclxuICAgICAgICAgICAgICAgIGVudHJ5VXBkYXRlOiBlbnRyeUFkZCxcclxuICAgICAgICAgICAgICAgIHRhYmxlRGF0YTogdGFibGVEYXRhXHJcbiAgICAgICAgICAgIH0sIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgLy8gdGVzdCBjYXBhY2l0eVxyXG4gICAgICAgICAgICBjaGVjayArPSB0aGlzLl9jaGVja0xlc3NvbnNDYXBhY2l0eSh7XHJcbiAgICAgICAgICAgICAgICBlbnRyeVVwZGF0ZTogZW50cnlBZGRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyB0ZXN0IGJ1c3kgbGVjdG9yXHJcbiAgICAgICAgICAgIGNoZWNrICs9IHRoaXMuX2NoZWNrTGVzc29uc0xlY3Rvcih7XHJcbiAgICAgICAgICAgICAgICBlbnRyeVVwZGF0ZTogZW50cnlBZGRcclxuICAgICAgICAgICAgfSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAvLyB0ZXN0IGJ1c3kgc2Nob29sXHJcbiAgICAgICAgICAgIGNoZWNrICs9IHRoaXMuX2NoZWNrTGVzc29uc1NjaG9vbCh7XHJcbiAgICAgICAgICAgICAgICBlbnRyeVVwZGF0ZTogZW50cnlBZGRcclxuICAgICAgICAgICAgfSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAvLyB0ZXN0IGRhdGVcclxuICAgICAgICAgICAgY2hlY2sgKz0gdGhpcy5fY2hlY2tDb3JyZWN0RGF0ZSh7XHJcbiAgICAgICAgICAgICAgICBlbnRyeTogZW50cnlBZGRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoY2hlY2spIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5lcnJvciA9IGNoZWNrO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGFkZCBuZXcgZW50cnkgbGVzc29uczpcclxuXHJcbiAgICAgICAgICAgIGlkTmV3TGVzc29uID0gdGhpcy5fZ2V0TmV3SWQoJ2xlc3NvbnMnKTtcclxuICAgICAgICAgICAgZW50cnlBZGQuaWQgPSBpZE5ld0xlc3NvbjtcclxuICAgICAgICAgICAgdGFibGVEYXRhLnB1c2goZW50cnlBZGQpO1xyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGFyZ3MudGFibGUgPT0gJ3NjaG9vbCcpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFZlcmlmaWNhdGlvbiBvZiBhIG5hbWU6XHJcbiAgICAgICAgICAgIGNoZWNrICs9IHRoaXMuX2NoZWNrTmFtZVVuaXEoe1xyXG4gICAgICAgICAgICAgICAgZW50cnk6IGVudHJ5QWRkLFxyXG4gICAgICAgICAgICAgICAgdGFibGU6IHRhYmxlRGF0YVxyXG4gICAgICAgICAgICB9LCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFZlcmlmaWNhdGlvbiBjb3VudCBzdHVkZW50c1xyXG4gICAgICAgICAgICBpZiAoZW50cnlBZGQuc3R1ZGVudHMgPCAxIHx8IGVudHJ5QWRkLnN0dWRlbnRzID4gMzAwKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjayArPSAn0J7RiNC40LHQutCwOiDQvdC10LrQvtGA0YDQtdC60YLQvdC+0LUg0LrQvtC70LjRh9C10YHRgtCy0L4g0YPRh9Cw0YnQuNGF0YHRjy48YnI+J1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoY2hlY2spIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5lcnJvciA9IGNoZWNrO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGFkZCBuZXcgZW50cnkgc2Nob29sXHJcbiAgICAgICAgICAgIGlkTmV3U2Nob29sID0gdGhpcy5fZ2V0TmV3SWQoJ3NjaG9vbCcpO1xyXG4gICAgICAgICAgICBlbnRyeUFkZC5pZCA9IGlkTmV3U2Nob29sO1xyXG4gICAgICAgICAgICB0YWJsZURhdGEucHVzaChlbnRyeUFkZCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0gZWxzZSBpZiAoYXJncy50YWJsZSA9PSAnY2xhc3Nyb29tJykge1xyXG4gICAgICAgICAgICAvLyBWZXJpZmljYXRpb24gb2YgYSBuYW1lOlxyXG4gICAgICAgICAgICBjaGVjayArPSB0aGlzLl9jaGVja05hbWVVbmlxKHtcclxuICAgICAgICAgICAgICAgIGVudHJ5OiBlbnRyeUFkZCxcclxuICAgICAgICAgICAgICAgIHRhYmxlOiB0YWJsZURhdGFcclxuICAgICAgICAgICAgfSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBWZXJpZmljYXRpb24gY2FwYWNpdHlcclxuICAgICAgICAgICAgaWYgKGVudHJ5QWRkLmNhcGFjaXR5IDwgMSB8fCBlbnRyeUFkZC5jYXBhY2l0eSA+IDQwMCkge1xyXG4gICAgICAgICAgICAgICAgY2hlY2sgKz0gJ9Ce0YjQuNCx0LrQsDog0L3QtdC60L7RgNGA0LXQutGC0L3QvtC1INCy0LzQtdGB0YLQuNC80L7RgdGC0Ywg0LDRg9C00LjRgtC+0YDQuNC4Ljxicj4nXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjaGVjaykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmVycm9yID0gY2hlY2s7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYWRkIGVudHJ5IGNsYXNzcm9vbVxyXG4gICAgICAgICAgICBpZE5ld0NsYXNzcm9vbSA9IHRoaXMuX2dldE5ld0lkKCdjbGFzc3Jvb20nKTtcclxuICAgICAgICAgICAgZW50cnlBZGQuaWQgPSBpZE5ld0NsYXNzcm9vbTtcclxuICAgICAgICAgICAgdGFibGVEYXRhLnB1c2goZW50cnlBZGQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdXBkYXRlIGRhdGFcclxuICAgICAgICB0aGlzLl93cml0ZURhdGEodGhpcy5kYXRhUmF3KTtcclxuICAgICAgICB0aGlzLmRhdGEgPSB0aGlzLl9jb21waWxlRGF0YSh0aGlzLmRhdGFSYXcpO1xyXG5cclxuICAgICAgICByZXN1bHQub2sgPSB0cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgX2dldE5ld0lkKHRhYmxlTmFtZSkge1xyXG4gICAgICAgIGxldCB0YWJsZSA9IHRoaXMuZGF0YVJhd1t0YWJsZU5hbWVdO1xyXG5cclxuICAgICAgICByZXR1cm4gdGFibGUubGVuZ3RoICsgMTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdXBkYXRlKGFyZ3MpIHtcclxuICAgICAgICBsZXQgZW50cnlVcGRhdGUgPSBhcmdzLmVudHJ5O1xyXG4gICAgICAgIGxldCBpZCA9IGVudHJ5VXBkYXRlLmlkO1xyXG4gICAgICAgIGxldCB0YWJsZURhdGEgPSB0aGlzLmRhdGFSYXdbYXJncy50YWJsZV07XHJcbiAgICAgICAgbGV0IGVudHJ5T3JpZ2luID0gdGhpcy5fZ2V0RW50cnkoaWQsIHRhYmxlRGF0YSk7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IHsgZXJyb3I6ICcnLCBvazogZmFsc2UgfTtcclxuICAgICAgICBsZXQgY2hlY2sgPSAnJztcclxuXHJcbiAgICAgICAgaWYgKCFlbnRyeU9yaWdpbikge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LmVycm9yID0gJ0Vycm9yIHVwZGF0ZSwgZW50cnkgbm90IGZvdW5kIHRvIERCJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmdzLnRhYmxlID09ICdsZXNzb25zJykge1xyXG4gICAgICAgICAgICAvLyB0ZXN0IGZpZWxkIG5ldyBsZXNzb25cclxuICAgICAgICAgICAgY2hlY2sgKz0gdGhpcy5fY2hlY2tOYW1lVW5pcSh7XHJcbiAgICAgICAgICAgICAgICBlbnRyeTogZW50cnlVcGRhdGUsXHJcbiAgICAgICAgICAgICAgICB0YWJsZTogdGFibGVEYXRhXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gdGVzdCBjbGFzc3Jvb20gaXMgYnVzeVxyXG4gICAgICAgICAgICBjaGVjayArPSB0aGlzLl9jaGVja0xlc3NvbnNDbGFzc3Jvb20oe1xyXG4gICAgICAgICAgICAgICAgZW50cnlVcGRhdGU6IGVudHJ5VXBkYXRlLFxyXG4gICAgICAgICAgICAgICAgdGFibGVEYXRhOiB0YWJsZURhdGFcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyB0ZXN0IGNhcGFjaXR5XHJcbiAgICAgICAgICAgIGNoZWNrICs9IHRoaXMuX2NoZWNrTGVzc29uc0NhcGFjaXR5KHtcclxuICAgICAgICAgICAgICAgIGVudHJ5VXBkYXRlOiBlbnRyeVVwZGF0ZVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIHRlc3QgYnVzeSBsZWN0b3JcclxuICAgICAgICAgICAgY2hlY2sgKz0gdGhpcy5fY2hlY2tMZXNzb25zTGVjdG9yKHtcclxuICAgICAgICAgICAgICAgIGVudHJ5VXBkYXRlOiBlbnRyeVVwZGF0ZVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIHRlc3QgYnVzeSBzY2hvb2xcclxuICAgICAgICAgICAgY2hlY2sgKz0gdGhpcy5fY2hlY2tMZXNzb25zU2Nob29sKHtcclxuICAgICAgICAgICAgICAgIGVudHJ5VXBkYXRlOiBlbnRyeVVwZGF0ZVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIHRlc3QgZGF0ZVxyXG4gICAgICAgICAgICBjaGVjayArPSB0aGlzLl9jaGVja0NvcnJlY3REYXRlKHtcclxuICAgICAgICAgICAgICAgIGVudHJ5OiBlbnRyeVVwZGF0ZVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGVjaykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmVycm9yID0gY2hlY2s7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gdXBkYXRlIGVudHJ5IGxlc3NvbjpcclxuXHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGVudHJ5VXBkYXRlLnNjaG9vbCkpIHtcclxuICAgICAgICAgICAgICAgIGVudHJ5T3JpZ2luLnNjaG9vbCA9IGVudHJ5VXBkYXRlLnNjaG9vbDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGVudHJ5T3JpZ2luLnNjaG9vbCkpIHtcclxuICAgICAgICAgICAgICAgIGVudHJ5T3JpZ2luLnNjaG9vbCA9IHsgaWQ6IGVudHJ5VXBkYXRlLnNjaG9vbC5pZCB9O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5T3JpZ2luLnNjaG9vbC5pZCAhPSBlbnRyeVVwZGF0ZS5zY2hvb2wuaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbnRyeU9yaWdpbi5zY2hvb2wuaWQgPSBlbnRyeVVwZGF0ZS5zY2hvb2wuaWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbnRyeU9yaWdpbi5sZWN0b3IuaWQgIT0gZW50cnlVcGRhdGUubGVjdG9yLmlkKSB7XHJcbiAgICAgICAgICAgICAgICBlbnRyeU9yaWdpbi5sZWN0b3IuaWQgPSBlbnRyeVVwZGF0ZS5sZWN0b3IuaWQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbnRyeU9yaWdpbi5jbGFzc3Jvb20uaWQgIT0gZW50cnlVcGRhdGUuY2xhc3Nyb29tLmlkKSB7XHJcbiAgICAgICAgICAgICAgICBlbnRyeU9yaWdpbi5jbGFzc3Jvb20uaWQgPSBlbnRyeVVwZGF0ZS5jbGFzc3Jvb20uaWQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbnRyeU9yaWdpbi5uYW1lICE9IGVudHJ5VXBkYXRlLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGVudHJ5T3JpZ2luLm5hbWUgPSBlbnRyeVVwZGF0ZS5uYW1lO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZW50cnlPcmlnaW4uZGF0ZS5mcm9tICE9IGVudHJ5VXBkYXRlLmRhdGUuZnJvbSkge1xyXG4gICAgICAgICAgICAgICAgZW50cnlPcmlnaW4uZGF0ZS5mcm9tID0gZW50cnlVcGRhdGUuZGF0ZS5mcm9tO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZW50cnlPcmlnaW4uZGF0ZS50byAhPSBlbnRyeVVwZGF0ZS5kYXRlLnRvKSB7XHJcbiAgICAgICAgICAgICAgICBlbnRyeU9yaWdpbi5kYXRlLnRvID0gZW50cnlVcGRhdGUuZGF0ZS50bztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGFyZ3MudGFibGUgPT0gJ3NjaG9vbCcpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFZlcmlmaWNhdGlvbiBvZiBlbXBsb3ltZW50IG9mIGEgbmFtZTpcclxuICAgICAgICAgICAgY2hlY2sgKz0gdGhpcy5fY2hlY2tTY2hvb2xOYW1lKHtcclxuICAgICAgICAgICAgICAgIGVudHJ5VXBkYXRlOiBlbnRyeVVwZGF0ZSxcclxuICAgICAgICAgICAgICAgIHRhYmxlRGF0YTogdGFibGVEYXRhXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVmVyaWZpY2F0aW9uIGNvdW50IHN0dWRlbnRzXHJcbiAgICAgICAgICAgIGlmIChlbnRyeU9yaWdpbi5zdHVkZW50cyA8IGVudHJ5VXBkYXRlLnN0dWRlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjayArPSB0aGlzLl9jaGVja1NjaG9vbENvdW50U3R1ZGVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5VXBkYXRlOiBlbnRyeVVwZGF0ZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjaGVjaykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmVycm9yID0gY2hlY2s7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gdXBkYXRlIGVudHJ5IHNjaG9vbFxyXG4gICAgICAgICAgICBlbnRyeU9yaWdpbi5uYW1lID0gZW50cnlVcGRhdGUubmFtZTtcclxuICAgICAgICAgICAgZW50cnlPcmlnaW4uc3R1ZGVudHMgPSBlbnRyeVVwZGF0ZS5zdHVkZW50cztcclxuXHJcbiAgICAgICAgfSBlbHNlIGlmIChhcmdzLnRhYmxlID09ICdjbGFzc3Jvb20nKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBWZXJpZmljYXRpb24gY2FwYWNpdHkgY2xhc3Nyb29tXHJcbiAgICAgICAgICAgIGlmIChlbnRyeU9yaWdpbi5jYXBhY2l0eSA+IGVudHJ5VXBkYXRlLmNhcGFjaXR5KSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjayArPSB0aGlzLl9jaGVja0NsYXNzcm9vbUNhcGFjaXR5KHtcclxuICAgICAgICAgICAgICAgICAgICBlbnRyeVVwZGF0ZTogZW50cnlVcGRhdGVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBWZXJpZmljYXRpb24gb2YgZW1wbG95bWVudCBvZiBhIG5hbWU6XHJcbiAgICAgICAgICAgIGNoZWNrICs9IHRoaXMuX2NoZWNrQ2xhc3Nyb29tTmFtZSh7XHJcbiAgICAgICAgICAgICAgICBlbnRyeVVwZGF0ZTogZW50cnlVcGRhdGVcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoY2hlY2spIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5lcnJvciA9IGNoZWNrOyAvLyBlcnJvci5qb2luKCcnKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyB1cGRhdGUgZW50cnkgY2xhc3Nyb29tXHJcbiAgICAgICAgICAgIGVudHJ5T3JpZ2luLm5hbWUgPSBlbnRyeVVwZGF0ZS5uYW1lO1xyXG4gICAgICAgICAgICBlbnRyeU9yaWdpbi5jYXBhY2l0eSA9IGVudHJ5VXBkYXRlLmNhcGFjaXR5O1xyXG4gICAgICAgICAgICBlbnRyeU9yaWdpbi5sb2NhdGlvbiA9IGVudHJ5VXBkYXRlLmxvY2F0aW9uO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHVwZGF0ZSBkYXRhXHJcbiAgICAgICAgdGhpcy5fd3JpdGVEYXRhKHRoaXMuZGF0YVJhdyk7XHJcbiAgICAgICAgdGhpcy5kYXRhID0gdGhpcy5fY29tcGlsZURhdGEodGhpcy5kYXRhUmF3KTtcclxuXHJcbiAgICAgICAgcmVzdWx0Lm9rID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqINCf0YDQvtCy0LXRgNC60LAg0LTQsNGC0Ysg0L3QsNGH0LDQu9CwINC4INC+0LrQvtC90YfQsNC90LjRjyDQu9C10LrRhtC40Lgg0L3QsCDQutC+0YDRgNC10LrRgtC90L7RgdGC0YxcclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfY2hlY2tDb3JyZWN0RGF0ZShwYXJhbXMpIHtcclxuICAgICAgICBsZXQgZnJvbSA9IHBhcmFtcy5lbnRyeS5kYXRlLmZyb207XHJcbiAgICAgICAgbGV0IGRhdGVGcm9tID0gbmV3IERhdGUoZnJvbSk7XHJcbiAgICAgICAgbGV0IGRhdGVOdW1iZXJGcm9tID0gZGF0ZUZyb20uZ2V0RGF0ZSgpO1xyXG4gICAgICAgIGxldCB0byA9IHBhcmFtcy5lbnRyeS5kYXRlLnRvO1xyXG4gICAgICAgIGxldCBkYXRlVG8gPSBuZXcgRGF0ZSh0byk7XHJcbiAgICAgICAgbGV0IGRhdGVOdW1iZXJUbyA9IGRhdGVUby5nZXREYXRlKCk7XHJcbiAgICAgICAgbGV0IGVycm9yID0gJyc7XHJcblxyXG4gICAgICAgIGlmICh0byA8IGZyb20pIHtcclxuICAgICAgICAgICAgZXJyb3IgPSAn0J7RiNC40LHQutCwOiDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDQu9C10LrRhtC40Lgg0L3QtSDQvNC+0LbQtdGCINCx0YvRgtGMINC80LXQvdGM0YjQtSDQstGA0LXQvNC10L3QuCDQvdCw0YfQsNC70LAuPGJyPic7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGF0ZU51bWJlclRvIC0gZGF0ZU51bWJlckZyb20gPiAwKSB7XHJcbiAgICAgICAgICAgIGVycm9yID0gJ9Ce0YjQuNCx0LrQsDog0LvQtdC60YbQuNGPINC90LDRh9C40L3QsNC10YLRgdGPINC4INC+0LrQsNC90YfQuNCy0LDQtdGC0YHRjyDQsiDQvtC00LjQvSDQuCDRgtC+0YIg0LbQtSDQtNC10L3RjC48YnI+JztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlcnJvcjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqINCf0YDQvtCy0LXRgNC60LAg0L3QsCDQv9GD0YHRgtC+0YLRgyDQuCDRg9C90LjQutCw0LvRjNC90L7RgdGC0Ywg0L/QvtC70Y8gXCJuYW1lXCJcclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfY2hlY2tOYW1lVW5pcShwYXJhbXMsIGFkZCkge1xyXG4gICAgICAgIGxldCB0YWJsZSA9IHBhcmFtcy50YWJsZVxyXG4gICAgICAgIGxldCBuYW1lTmV3ID0gcGFyYW1zLmVudHJ5Lm5hbWU7XHJcbiAgICAgICAgbGV0IGVudHJ5ID0gcGFyYW1zLmVudHJ5O1xyXG4gICAgICAgIGxldCBlcnJvciA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoIW5hbWVOZXcgfHwgbmFtZU5ldy5sZW5ndGggPCAzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnJvciA9ICfQntGI0LjQsdC60LA6INC/0L7Qu9C1IFwi0JjQvNGPXCIg0L3QtSDQt9Cw0L/QvtC70L3QtdC90L4g0LjQu9C4INC80LXQvdGM0YjQtSDRgtGA0LXRhSDRgdC40LzQstC+0LvQvtCyPGJyPic7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhYmxlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBlbGVtZW50ID0gdGFibGVbaV07XHJcbiAgICAgICAgICAgIGxldCBuYW1lT2xkID0gZWxlbWVudC5uYW1lO1xyXG4gICAgICAgICAgICBsZXQgdGVzdElkID0gYWRkID8gdHJ1ZSA6IGVsZW1lbnQuaWQgIT0gZW50cnkuaWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG5hbWVOZXcgPT0gbmFtZU9sZCAmJiB0ZXN0SWQpIHtcclxuICAgICAgICAgICAgICAgIGVycm9yICs9ICfQntGI0LjQsdC60LA6INC40LzRjyDQvdC1INGD0L3QuNC60LDQu9GM0L3Qvi4gPGJyPic7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVycm9yO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog0J/RgNC+0LLQtdGA0LrQsCDQuNC80LXQvdC4INCw0YPQtNC40YLQvtGA0LjQuCDQvdCwINGD0L3QuNC60LDQu9GM0L3QvtGB0YLRjC5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGVycm9yIHx8ICcnXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfY2hlY2tDbGFzc3Jvb21OYW1lKHBhcmFtcykge1xyXG4gICAgICAgIGxldCBlcnJvciA9ICcnO1xyXG4gICAgICAgIGxldCBlbnRyeVVwZGF0ZSA9IHBhcmFtcy5lbnRyeVVwZGF0ZTtcclxuICAgICAgICBsZXQgdGFibGVDbGFzc3Jvb20gPSB0aGlzLmRhdGFSYXcuY2xhc3Nyb29tO1xyXG4gICAgICAgIGxldCBpZFVwZGF0ZSA9IGVudHJ5VXBkYXRlLmlkO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhYmxlQ2xhc3Nyb29tLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBjbGFzc3Jvb20gPSB0YWJsZUNsYXNzcm9vbVtpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjbGFzc3Jvb20uaWQgIT0gaWRVcGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjbGFzc3Jvb20ubmFtZSA9PT0gZW50cnlVcGRhdGUubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yICs9ICfQntGI0LjQsdC60LA6INGI0LrQvtC70LAg0YEg0YLQsNC60LjQvCDQuNC80LXQvdC10Lwg0YPQttC1INGB0YPRidC10YHRgtCy0YPQtdGCLidcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVycm9yO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog0J/RgNC+0LLQtdGA0LrQsCDQstC80LXRgdGC0LjQvNC+0YHRgtC4INCw0YPQtNC40YLQvtGA0LjQuC4g0KXQstCw0YLQuNGCINC70Lgg0LLQvNC10YHRgtC40LzQvtGB0YLQuCDQsNGD0LTQuNGC0L7RgNC40Lgg0LTQu9GPINC/0YDQvtCy0LXQtNC10L3QuNGPINC70LXQutGG0LjQuCxcclxuICAgICAqINC10YHQu9C4INC10LUg0YPQvNC10L3RjNGI0LjRgtGMINC/0YDQuCDRgNC10LTQsNC60YLQuNGA0L7QstCw0L3QuNC4INCw0YPQtNC40YLQvtGA0LjQuC5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGVycm9yIHx8ICcnXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfY2hlY2tDbGFzc3Jvb21DYXBhY2l0eShwYXJhbXMpIHtcclxuICAgICAgICBsZXQgZXJyb3IgPSAnJztcclxuICAgICAgICBsZXQgZW50cnlVcGRhdGUgPSBwYXJhbXMuZW50cnlVcGRhdGU7XHJcbiAgICAgICAgbGV0IGNhcGFjaXR5Q2xhc3Nyb29tVXBkYXRlID0gZW50cnlVcGRhdGUuY2FwYWNpdHk7XHJcbiAgICAgICAgbGV0IHRhYmxlTGVzc29ucyA9IHRoaXMuZGF0YVJhdy5sZXNzb25zO1xyXG4gICAgICAgIGxldCBpZENsYXNzcm9vbVVwZGF0ZSA9IGVudHJ5VXBkYXRlLmlkO1xyXG4gICAgICAgIGxldCBjYXBhY2l0eVN0dWRlbnRzU2Nob29scyA9IDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFibGVMZXNzb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBsZXNzb24gPSB0YWJsZUxlc3NvbnNbaV07XHJcbiAgICAgICAgICAgIGxldCBpZENsYXNzcm9vbU9yaWdpbiA9IGxlc3Nvbi5jbGFzc3Jvb20uaWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoaWRDbGFzc3Jvb21PcmlnaW4gPT0gaWRDbGFzc3Jvb21VcGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGxlc3Nvbi5zY2hvb2wpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjaG9vbHMgPSBsZXNzb24uc2Nob29sO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjaG9vbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNjaG9vbCA9IHNjaG9vbHNbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXBhY2l0eVN0dWRlbnRzU2Nob29scyArPSB0aGlzLl9nZXRTY2hvb2woc2Nob29sLmlkKS5zdHVkZW50cztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXBhY2l0eUNsYXNzcm9vbVVwZGF0ZSA8IGNhcGFjaXR5U3R1ZGVudHNTY2hvb2xzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yICs9IGDQntGI0LjQsdC60LA6INC00LvRjyDQu9C10LrRhtC40LggXCIke2xlc3Nvbi5uYW1lfVwiINC90LUg0LHRg9C00LXRgiDRhdCy0LDRgtCw0YLRjFxyXG4gICAgICAgICAgICAgICAgICAgINCy0LzQtdGB0YLQuNC80L7RgdGC0Lgg0LjQt9C80LXQvdGP0LXQvNC+0Lkg0LDRg9C00LjRgtC+0YDQuNC4PGJyPmA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FwYWNpdHlTdHVkZW50c1NjaG9vbHMgPSB0aGlzLl9nZXRTY2hvb2wobGVzc29uLnNjaG9vbC5pZCkuc3R1ZGVudHM7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXBhY2l0eUNsYXNzcm9vbVVwZGF0ZSA8IGNhcGFjaXR5U3R1ZGVudHNTY2hvb2xzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yICs9IGDQntGI0LjQsdC60LA6INC00LvRjyDQu9C10LrRhtC40LggXCIke2xlc3Nvbi5uYW1lfVwiINC90LUg0LHRg9C00LXRgiDRhdCy0LDRgtCw0YLRjFxyXG4gICAgICAgICAgICAgICAgICAgINCy0LzQtdGB0YLQuNC80L7RgdGC0Lgg0LjQt9C80LXQvdGP0LXQvNC+0Lkg0LDRg9C00LjRgtC+0YDQuNC4PGJyPmA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlcnJvcjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqINCf0YDQvtCy0LXRgNC60LAsINGF0LLQsNGC0LjRgiDQu9C4INCy0LzQtdGB0YLQuNC80L7RgdGC0Lgg0LIg0LDRg9C00LjRgtC+0YDQuNGP0YUg0L/RgNC4INGD0LLQtdC70LjRh9C10L3QuNC4INC60L7Qu9C40YfQtdGB0YLQstCwINGB0YLRg9C00LXQvdGC0L7QsiDQvdCwINC70LXQutGG0LjQuFxyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gZXJyb3IgfHwgJydcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9jaGVja1NjaG9vbENvdW50U3R1ZGVudHMocGFyYW1zKSB7XHJcbiAgICAgICAgbGV0IGVycm9yID0gJyc7XHJcbiAgICAgICAgbGV0IGVudHJ5VXBkYXRlID0gcGFyYW1zLmVudHJ5VXBkYXRlO1xyXG4gICAgICAgIGxldCBpZFNjaG9vbFVwZGF0YSA9IGVudHJ5VXBkYXRlLmlkO1xyXG4gICAgICAgIGxldCB0YWJsZUxlc3NvbnMgPSB0aGlzLmRhdGFSYXcubGVzc29ucztcclxuICAgICAgICBsZXQgY2FwYWNpdHlDbGFzc3Jvb21WZXIgPSAwO1xyXG4gICAgICAgIGxldCBjYXBhY2l0eVN0dWRlbnRzID0gZW50cnlVcGRhdGUuc3R1ZGVudHM7XHJcbiAgICAgICAgbGV0IGNhcGFjaXR5U3R1ZGVudHNTY2hvb2xzID0gMDtcclxuICAgICAgICBsZXQgaWRDbGFzc3Jvb21WZXI7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFibGVMZXNzb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBsZXNzb24gPSB0YWJsZUxlc3NvbnNbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShsZXNzb24uc2Nob29sKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHNjaG9vbHMgPSBsZXNzb24uc2Nob29sO1xyXG4gICAgICAgICAgICAgICAgbGV0IGlzQ29udGFpbiA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2Nob29scy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzY2hvb2wgPSBzY2hvb2xzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXBhY2l0eVN0dWRlbnRzU2Nob29scyArPSB0aGlzLl9nZXRTY2hvb2woc2Nob29sLmlkKS5zdHVkZW50cztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjaG9vbC5pZCA9PSBpZFNjaG9vbFVwZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0NvbnRhaW4gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNDb250YWluKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWRDbGFzc3Jvb21WZXIgPSBsZXNzb24uY2xhc3Nyb29tLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhcGFjaXR5Q2xhc3Nyb29tVmVyID0gdGhpcy5fZ2V0Q2xhc3Nyb29tKGlkQ2xhc3Nyb29tVmVyKS5jYXBhY2l0eTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhcGFjaXR5Q2xhc3Nyb29tVmVyIDwgY2FwYWNpdHlTdHVkZW50c1NjaG9vbHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IgKz0gYNCe0YjQuNCx0LrQsDog0LTQu9GPINC70LXQutGG0LjQuCBcIiR7bGVzc29uLm5hbWV9XCIg0L3QtSDQsdGD0LTQtdGCINGF0LLQsNGC0LDRgtGMXHJcbiAgICAgICAgICAgICAgICAgICAgICAgINCy0LzQtdGB0YLQuNC80L7RgdGC0Lgg0LDRg9C00LjRgtC+0YDQuNC4PGJyPmA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChsZXNzb24uc2Nob29sLmlkID09IGlkU2Nob29sVXBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZENsYXNzcm9vbVZlciA9IGxlc3Nvbi5jbGFzc3Jvb20uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNhcGFjaXR5Q2xhc3Nyb29tVmVyID0gdGhpcy5fZ2V0Q2xhc3Nyb29tKGlkQ2xhc3Nyb29tVmVyKS5jYXBhY2l0eTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2FwYWNpdHlDbGFzc3Jvb21WZXIgPCBjYXBhY2l0eVN0dWRlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IgKz0gYNCe0YjQuNCx0LrQsDog0LTQu9GPINC70LXQutGG0LjQuCBcIiR7bGVzc29uLm5hbWV9XCIg0L3QtSDQsdGD0LTQtdGCINGF0LLQsNGC0LDRgtGMXHJcbiAgICAgICAgICAgICAgICAgICAgICAgINCy0LzQtdGB0YLQuNC80L7RgdGC0Lgg0LDRg9C00LjRgtC+0YDQuNC4PGJyPmA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZXJyb3I7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDQn9GA0L7QstC10YDQutCwINGD0L3QuNC60LDQu9GM0L3QvtGB0YLQuCDQvdCw0LfQstCw0L3QuNGPINGI0LrQvtC70YtcclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGVycm9yIHx8ICcnXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfY2hlY2tTY2hvb2xOYW1lKHBhcmFtcykge1xyXG4gICAgICAgIGxldCBlcnJvciA9ICcnO1xyXG4gICAgICAgIGxldCBlbnRyeVVwZGF0ZSA9IHBhcmFtcy5lbnRyeVVwZGF0ZTtcclxuICAgICAgICBsZXQgdGFibGVTY2hvb2wgPSBwYXJhbXMudGFibGVEYXRhO1xyXG4gICAgICAgIGxldCBpZFVwZGF0ZSA9IGVudHJ5VXBkYXRlLmlkO1xyXG4gICAgICAgIGxldCB0ZXN0QWRkO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhYmxlU2Nob29sLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBzY2hvb2wgPSB0YWJsZVNjaG9vbFtpXTtcclxuXHJcbiAgICAgICAgICAgIHRlc3RBZGQgPSBpZFVwZGF0ZSA/IHNjaG9vbC5pZCAhPSBpZFVwZGF0ZSA6IHRydWU7XHJcblxyXG4gICAgICAgICAgICBpZiAodGVzdEFkZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNjaG9vbC5uYW1lID09PSBlbnRyeVVwZGF0ZS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IgKz0gJ9Ce0YjQuNCx0LrQsDog0YjQutC+0LvQsCDRgSDRgtCw0LrQuNC8INC40LzQtdC90LXQvCDRg9C20LUg0YHRg9GJ0LXRgdGC0LLRg9C10YIuJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZXJyb3I7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDQn9GA0L7QstC10YDQutCwLiDQndC1INC80L7QttC10YIg0LHRi9GC0Ywg0LTQstGD0YUg0LvQtdC60YbQuNC5INCyINC+0LTQvdC+INC4INGC0L7QttC1INCy0YDQtdC80Y8g0LTQu9GPINC+0LTQvdC+0Lkg0Lgg0YLQvtC5INC20LUg0YjQutC+0LvRi1xyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gZXJyb3IgfHwgJydcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9jaGVja0xlc3NvbnNTY2hvb2wocGFyYW1zLCBhZGQpIHtcclxuICAgICAgICBsZXQgZXJyb3IgPSAnJztcclxuICAgICAgICBsZXQgZW50cnlVcGRhdGUgPSBwYXJhbXMuZW50cnlVcGRhdGU7XHJcbiAgICAgICAgbGV0IGlkU2Nob29sVXBkYXRhID0gZW50cnlVcGRhdGUuc2Nob29sLmlkO1xyXG4gICAgICAgIGxldCB0YWJsZUxlc3NvbnMgPSB0aGlzLmRhdGFSYXcubGVzc29ucztcclxuICAgICAgICBsZXQgZnJvbVVwZGF0ZSA9IGVudHJ5VXBkYXRlLmRhdGUuZnJvbTtcclxuICAgICAgICBsZXQgdG9VcGRhdGUgPSBlbnRyeVVwZGF0ZS5kYXRlLnRvO1xyXG4gICAgICAgIGxldCB0ZXN0VXBkYXRlO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhYmxlTGVzc29ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgbGVzc29uID0gdGFibGVMZXNzb25zW2ldO1xyXG5cclxuICAgICAgICAgICAgdGVzdFVwZGF0ZSA9IGFkZCA/IHRydWUgOiBsZXNzb24uaWQgIT0gZW50cnlVcGRhdGUuaWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAobGVzc29uLnNjaG9vbC5pZCA9PSBpZFNjaG9vbFVwZGF0YSAmJiB0ZXN0VXBkYXRlIC8qIGxlc3Nvbi5pZCAhPSBlbnRyeVVwZGF0ZS5pZCAqLyApIHtcclxuICAgICAgICAgICAgICAgIGxldCBmcm9tT3JpZ2luID0gbGVzc29uLmRhdGUuZnJvbTtcclxuICAgICAgICAgICAgICAgIGxldCB0b09yaWdpbiA9IGxlc3Nvbi5kYXRlLnRvO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmcm9tVXBkYXRlID49IGZyb21PcmlnaW4gJiYgZnJvbVVwZGF0ZSA8IHRvT3JpZ2luXHJcbiAgICAgICAgICAgICAgICAgICAgfHwgZnJvbVVwZGF0ZSA8IGZyb21PcmlnaW4gJiYgdG9VcGRhdGUgPiBmcm9tT3JpZ2luKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IgKz0gYNCe0YjQuNCx0LrQsDog0LTQu9GPINCy0YvQsdGA0LDQvdC90L7QuSDRiNC60L7Qu9GLINCyINGD0LrQsNC30LDQvdC90L7QtSDQstGA0LXQvNGPINGD0LbQtSDQt9Cw0L/Qu9Cw0L3QuNGA0L7QstCw0L3QsFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAg0LvQtdC60YbQuNGPLjxicj5gO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZXJyb3I7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDQn9GA0L7QstC10YDQutCwINC30LDQvdGP0YLQvtGB0YLQuCDQu9C10LrRgtC+0YDQsCDQsiDRg9C60LDQt9Cw0L3QvdC+0LUg0LLRgNC10LzRj1xyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICogQHJldHVybnMge3N0cmluZ30gZXJyb3IgfHwgJydcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9jaGVja0xlc3NvbnNMZWN0b3IocGFyYW1zLCBhZGQpIHtcclxuICAgICAgICBsZXQgZXJyb3IgPSAnJztcclxuICAgICAgICBsZXQgZW50cnlVcGRhdGUgPSBwYXJhbXMuZW50cnlVcGRhdGU7XHJcbiAgICAgICAgbGV0IGlkTGVjdG9yVXBkYXRhID0gZW50cnlVcGRhdGUubGVjdG9yLmlkO1xyXG4gICAgICAgIGxldCB0YWJsZUxlc3NvbnMgPSB0aGlzLmRhdGFSYXcubGVzc29ucztcclxuICAgICAgICBsZXQgdGFibGVDb21tb24gPSB0aGlzLmRhdGE7XHJcbiAgICAgICAgbGV0IGZyb21VcGRhdGUgPSBlbnRyeVVwZGF0ZS5kYXRlLmZyb207XHJcbiAgICAgICAgbGV0IHRvVXBkYXRlID0gZW50cnlVcGRhdGUuZGF0ZS50bztcclxuICAgICAgICBsZXQgdGVzdFVwZGF0ZTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YWJsZUxlc3NvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGxlc3NvbiA9IHRhYmxlTGVzc29uc1tpXTtcclxuXHJcbiAgICAgICAgICAgIHRlc3RVcGRhdGUgPSBhZGQgPyB0cnVlIDogbGVzc29uLmlkICE9IGVudHJ5VXBkYXRlLmlkO1xyXG5cclxuICAgICAgICAgICAgaWYgKGxlc3Nvbi5sZWN0b3IuaWQgPT0gaWRMZWN0b3JVcGRhdGEgJiYgdGVzdFVwZGF0ZSAvKiBsZXNzb24uaWQgIT0gZW50cnlVcGRhdGUuaWQgKi8pIHtcclxuICAgICAgICAgICAgICAgIGxldCBmcm9tT3JpZ2luID0gbGVzc29uLmRhdGUuZnJvbTtcclxuICAgICAgICAgICAgICAgIGxldCB0b09yaWdpbiA9IGxlc3Nvbi5kYXRlLnRvO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmcm9tVXBkYXRlID49IGZyb21PcmlnaW4gJiYgZnJvbVVwZGF0ZSA8IHRvT3JpZ2luXHJcbiAgICAgICAgICAgICAgICAgICAgfHwgZnJvbVVwZGF0ZSA8IGZyb21PcmlnaW4gJiYgdG9VcGRhdGUgPiBmcm9tT3JpZ2luKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IgKz0gYNCe0YjQuNCx0LrQsDog0LvQtdC60YLQvtGAINC30LDQvdGP0YIg0LIg0YPQutCw0LfQsNC90L3QvtC1INCy0YDQtdC80Y8uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICDQoyDQvdC10LPQviDQv9GA0L7RhdC+0LTQuNGCINC30LDQvdGP0YLQuNC1INCyIFwiJHt0YWJsZUNvbW1vbltsZXNzb24uaWQgLSAxXS5jbGFzc3Jvb20ubmFtZX1cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAg0LIg0YPQutCw0LfQsNC90L3QvtC1INCy0YDQtdC80Y88YnI+YDtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVycm9yO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog0J/RgNC+0LLQtdGA0LrQsCDQstC80LXRgdGC0LjQvNC+0YHRgtC4LiDQn9C+0LzQtdGB0YLRj9GC0YHRjyDQu9C4INGB0YLRg9C00LXQvdGC0Ysg0LIg0LLRi9Cx0YDQsNC90L3QvtC5INCw0YPQtNC40YLQvtGA0LjQuC5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGVycm9yIG9yICcnXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfY2hlY2tMZXNzb25zQ2FwYWNpdHkocGFyYW1zKSB7XHJcbiAgICAgICAgbGV0IGVycm9yID0gJyc7XHJcbiAgICAgICAgbGV0IGVudHJ5VXBkYXRlID0gcGFyYW1zLmVudHJ5VXBkYXRlO1xyXG4gICAgICAgIGxldCBjYXBhY2l0eUNsYXNzcm9vbVVwZGF0ZTtcclxuICAgICAgICBsZXQgaWRDbGFzc3Jvb21VcGRhdGUgPSBlbnRyeVVwZGF0ZS5jbGFzc3Jvb20uaWQ7XHJcbiAgICAgICAgbGV0IHRhYmxlQ2xhc3Nyb29tID0gdGhpcy5kYXRhUmF3LmNsYXNzcm9vbTtcclxuICAgICAgICBsZXQgY291bnRQZW9wbGVVcGRhdGUgPSAwO1xyXG4gICAgICAgIGxldCB0YWJsZVNjaG9vbCA9IHRoaXMuZGF0YVJhdy5zY2hvb2w7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFibGVDbGFzc3Jvb20ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGNsYXNzcm9vbSA9IHRhYmxlQ2xhc3Nyb29tW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNsYXNzcm9vbS5pZCA9PSBpZENsYXNzcm9vbVVwZGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgY2FwYWNpdHlDbGFzc3Jvb21VcGRhdGUgPSBjbGFzc3Jvb20uY2FwYWNpdHk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZW50cnlVcGRhdGUuc2Nob29sKSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IGFyU2Nob29sVXBkYXRlID0gZW50cnlVcGRhdGUuc2Nob29sO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YWJsZVNjaG9vbC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IHNjaG9vbCA9IHRhYmxlU2Nob29sW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXJTY2hvb2xVcGRhdGUubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2Nob29sVXBkYXRlID0gYXJTY2hvb2xVcGRhdGVbal07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2hvb2wuaWQgPT0gc2Nob29sVXBkYXRlLmlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50UGVvcGxlVXBkYXRlICs9ICtzY2hvb2wuc3R1ZGVudHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgaWRTY2hvb2xVcGRhdGUgPSBlbnRyeVVwZGF0ZS5zY2hvb2wuaWQ7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhYmxlU2Nob29sLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2Nob29sID0gdGFibGVTY2hvb2xbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNjaG9vbC5pZCA9PSBpZFNjaG9vbFVwZGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvdW50UGVvcGxlVXBkYXRlICs9ICtzY2hvb2wuc3R1ZGVudHM7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjb3VudFBlb3BsZVVwZGF0ZSA+IGNhcGFjaXR5Q2xhc3Nyb29tVXBkYXRlKSB7XHJcbiAgICAgICAgICAgIGVycm9yICs9ICfQntGI0LjQsdC60LA6INCy0LzQtdGB0YLQuNC80L7RgdGC0Ywg0LLRi9Cx0YDQsNC90L3QvtC5INCw0YPQtNC40YLQvtGA0LjQuCDQvNC10L3RjNGI0LUg0LrQvtC70LjRh9C10YHRgtCy0LAg0YHRgtGD0LTQtdC90YLQvtCyLjxicj4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVycm9yO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog0J/RgNC+0LLQtdGA0LrQsCDQt9Cw0L3Rj9GC0L7RgdGC0Lgg0LDRg9C00LjRgtC+0YDQuNC4INCyINGD0LrQsNC30LDQvdC90YvQuSDQstGA0LXQvNC10L3QvdC+0Lkg0L/RgNC+0LzQtdC20YPRgtC+0LouXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBlcnJvciBvciAnJ1xyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2NoZWNrTGVzc29uc0NsYXNzcm9vbShwYXJhbXMsIGFkZCkge1xyXG4gICAgICAgIGxldCBlbnRyeVVwZGF0ZSA9IHBhcmFtcy5lbnRyeVVwZGF0ZTtcclxuICAgICAgICBsZXQgdGFibGVEYXRhID0gcGFyYW1zLnRhYmxlRGF0YTtcclxuICAgICAgICBsZXQgaWRDbGFzc3Jvb21VcGRhdGUgPSBlbnRyeVVwZGF0ZS5jbGFzc3Jvb20uaWQ7XHJcbiAgICAgICAgbGV0IGZyb21VcGRhdGUgPSBlbnRyeVVwZGF0ZS5kYXRlLmZyb207XHJcbiAgICAgICAgbGV0IHRvVXBkYXRlID0gZW50cnlVcGRhdGUuZGF0ZS50bztcclxuICAgICAgICBsZXQgZXJyb3IgPSAnJztcclxuICAgICAgICBsZXQgdGVzdFVwZGF0ZTtcclxuICAgICAgICBsZXQgbGVzc29uO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhYmxlRGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXNzb24gPSB0YWJsZURhdGFbaV07XHJcbiAgICAgICAgICAgIHRlc3RVcGRhdGUgPSBhZGQgPyB0cnVlIDogbGVzc29uLmlkICE9IGVudHJ5VXBkYXRlLmlkO1xyXG5cclxuICAgICAgICAgICAgaWYgKGxlc3Nvbi5jbGFzc3Jvb20uaWQgPT0gaWRDbGFzc3Jvb21VcGRhdGUgJiYgdGVzdFVwZGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGZyb21PcmlnaW4gPSBsZXNzb24uZGF0ZS5mcm9tO1xyXG4gICAgICAgICAgICAgICAgbGV0IHRvT3JpZ2luID0gbGVzc29uLmRhdGUudG87XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGZyb21VcGRhdGUgPj0gZnJvbU9yaWdpbiAmJiBmcm9tVXBkYXRlIDwgdG9PcmlnaW5cclxuICAgICAgICAgICAgICAgICAgICB8fCBmcm9tVXBkYXRlIDwgZnJvbU9yaWdpbiAmJiB0b1VwZGF0ZSA+IGZyb21PcmlnaW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBlcnJvciArPSAn0J7RiNC40LHQutCwOiDQutC+0L3RhNC70LjQutGCINCyINGA0LDRgdC/0LjRgdCw0L3QuNC4INCy0YvQsdGA0LDQvdC90L7QuSDQsNGD0LTQuNGC0L7RgNC40LguXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICfQktGL0LHQtdGA0LXRgtC1INC70LjQsdC+INC00YDRg9Cz0YPRjiDQsNGD0LTQuNGC0L7RgNC40Y4sINC70LjQsdC+INC00YDRg9Cz0L7QtSDQstGA0LXQvNGPINC/0YDQvtCy0LXQtNC10L3QuNGPINC70LXQutGG0LjQuC48YnI+JztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVycm9yO1xyXG4gICAgfVxyXG5cclxuICAgIF9nZXRTY2hvb2woaWQpIHtcclxuICAgICAgICBsZXQgdGFibGVTY2hvb2wgPSB0aGlzLmRhdGFSYXcuc2Nob29sO1xyXG4gICAgICAgIGxldCBzY2hvb2w7XHJcbiAgICAgICAgbGV0IHJlc3VsdDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YWJsZVNjaG9vbC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBzY2hvb2wgPSB0YWJsZVNjaG9vbFtpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzY2hvb2wuaWQgPT0gaWQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHNjaG9vbDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIF9nZXRDbGFzc3Jvb20oaWQpIHtcclxuICAgICAgICBsZXQgdGFibGVDbGFzc3Jvb20gPSB0aGlzLmRhdGFSYXcuY2xhc3Nyb29tO1xyXG4gICAgICAgIGxldCBjbGFzc3Jvb207XHJcbiAgICAgICAgbGV0IHJlc3VsdDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YWJsZUNsYXNzcm9vbS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjbGFzc3Jvb20gPSB0YWJsZUNsYXNzcm9vbVtpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjbGFzc3Jvb20uaWQgPT0gaWQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGNsYXNzcm9vbTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIF9nZXRFbnRyeShpZCwgdGFibGUpIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhYmxlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBlbnRyeSA9IHRhYmxlW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGVudHJ5LmlkID09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW50cnk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBfd3JpdGVEYXRhKGRhdGEpIHtcclxuICAgICAgICBpZiAodGhpcy5pc0xzKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxzLmRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUgPT0gUVVPVEFfRVhDRUVERURfRVJSKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ9CX0LDQv9C40YHRjCDQvdC10LLQvtC30LzQvtC20L3QsCwgbG9jYWxTdG9yYWdlINC90LUg0LTQvtGB0YLRg9C/0LXQvS4g0J/RgNC+0LLQtdGA0YzRgtC1INGB0LLQvtCx0L7QtNC90L7QtSDQvNC10YHRgtC+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IFxyXG4gICAgfVxyXG5cclxuICAgIF9yZWFkRGF0YSgpIHtcclxuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh0aGlzLmxzLmRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIF9jb21waWxlRGF0YShkYXRhKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGxldCBsZXNzb25zID0gZGF0YS5sZXNzb25zO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlc3NvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGxlc3NvbiA9IGxlc3NvbnNbaV07XHJcbiAgICAgICAgICAgIGxldCBsZXNzb25Db21waWxlID0gdGhpcy5fY29tcGlsZUxlc3NvbihsZXNzb24pO1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gobGVzc29uQ29tcGlsZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIF9jbGVhckRhdGEoKSB7XHJcbiAgICAgICAgLy8gZGVsZXRlIHRoaXMubHMuZGF0YTtcclxuICAgICAgICB0aGlzLmxzLmRhdGEgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBfY29tcGlsZUxlc3NvbihsZXNzb24pIHtcclxuICAgICAgICBsZXQgcmVzdWx0ID0ge307XHJcbiAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhsZXNzb24pO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGtleSA9IGtleXNbaV07XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IGxlc3NvbltrZXldO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUuaWQpIHtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZU9yaWdpbiA9IHRoaXMuX2dldFZhbHVlT3JpZ2luRGF0YShrZXksIHZhbHVlLmlkKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXZhbHVlT3JpZ2luKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb24ndCBmb3VuZCBlbGVtZW50ICR7a2V5fSwgaWQgPSAke3ZhbHVlLmlkfWApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWVPcmlnaW47XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYXJyID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgaWQgPSBhcnJbaV0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXMucHVzaCh0aGlzLl9nZXRWYWx1ZU9yaWdpbkRhdGEoa2V5LCBpZCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHJlcztcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIF9nZXRWYWx1ZU9yaWdpbkRhdGEoa2V5LCBpZCkge1xyXG4gICAgICAgIGxldCBvYmplY3RzID0gdGhpcy5kYXRhUmF3W2tleV07XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgb2JqZWN0ID0gb2JqZWN0c1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvYmplY3QuaWQgPT0gaWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufSIsImltcG9ydCBtYWluQ2xhc3MgZnJvbSAnLi9tYWluJztcclxuXHJcbmxldCBtYWluID0gbmV3IG1haW5DbGFzcygnLnRhYmxlJyk7XHJcblxyXG5tYWluLmZpbHRlcignI3BsYWdpbl9fc2NoZWR1bGVyLS1zY2hvb2wnLCAnc2Nob29sJyk7XHJcbm1haW4uZmlsdGVyKCcjcGxhZ2luX19zY2hlZHVsZXItLWNsYXNzcm9vbScsICdjbGFzc3Jvb20nKTtcclxubWFpbi5lZGl0TGVzc29ucygnLnBsYWdpbl9fYm9keS10YWItY29udFtkYXRhLXRhYj1cImxlc3NvbnNcIl0nKTtcclxubWFpbi5lZGl0U2Nob29sKCcucGxhZ2luX19ib2R5LXRhYi1jb250W2RhdGEtdGFiPVwic2Nob29sXCJdJyk7XHJcbm1haW4uZWRpdENsYXNzcm9vbSgnLnBsYWdpbl9fYm9keS10YWItY29udFtkYXRhLXRhYj1cImNsYXNzcm9vbVwiXScpO1xyXG5tYWluLmFkZCgnI3BsYWdpbl9fc2NoZWR1bGVyLS1hZGQnKTsiLCJpbXBvcnQgc3RhcnRDbGFzcyBmcm9tICcuL2Fzc2V0cy9zdGFydCc7XHJcbmltcG9ydCBtZWRpYXRvckNsYXNzIGZyb20gJy4vX21lZGlhdG9yJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1haW4ge1xyXG4gICAgY29uc3RydWN0b3IodGFibGUpIHtcclxuICAgICAgICB0aGlzLnRhYmxlID0gdGFibGU7XHJcbiAgICAgICAgdGhpcy5tZWRpYXRvciA9IG5ldyBtZWRpYXRvckNsYXNzKCB7IHRhYmxlOiB0YWJsZSB9ICk7XHJcbiAgICAgICAgdGhpcy5tZWRpYXRvci50YWJsZVJlbmRlcigpO1xyXG4gICAgICAgIG5ldyBzdGFydENsYXNzKHRoaXMubWVkaWF0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIGZpbHRlcihub2RlLCBwYXJhbSkge1xyXG4gICAgICAgIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG5vZGUpO1xyXG4gICAgICAgIGxldCBidG4gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignYnV0dG9uW3R5cGU9XCJzdWJtaXRcIl0nKTtcclxuICAgICAgICBsZXQgYnRuQ2FuY2VsID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvblt0eXBlPVwicmVzZXRcIl0nKTtcclxuXHJcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBmaWx0ZXIgPSB0aGlzLl9nZXREYXRhRmlsdGVyKGNvbnRhaW5lciwgcGFyYW0pO1xyXG5cclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubWVkaWF0b3IuZmlsdGVyKGZpbHRlcik7XHJcbiAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYnRuQ2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm1lZGlhdG9yLnRhYmxlUmVuZGVyKCk7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBhZGQobm9kZSkge1xyXG4gICAgICAgIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG5vZGUpO1xyXG5cclxuICAgICAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0YXJnZXQudGFnTmFtZSA9PSAnQlVUVE9OJyAmJiB0YXJnZXQuZ2V0QXR0cmlidXRlKCd0eXBlJykgPT0gJ3N1Ym1pdCcpIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGRhdGE7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgbGV0IHRhYiA9IHRhcmdldC5jbG9zZXN0KCcucGxhZ2luX19ib2R5LXRhYi1jb250Jyk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGF0YVRhYiA9IHRhYi5kYXRhc2V0LnRhYjtcclxuICAgICAgICAgICAgICAgIGxldCBlcnJvciA9IHRhYi5xdWVyeVNlbGVjdG9yKCcucGxhZ2luX3Jlc3VsdCAucGxhZ2luX3Jlc3VsdC1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHN1Y2Nlc3MgPSB0YWIucXVlcnlTZWxlY3RvcignLnBsYWdpbl9yZXN1bHQgLnBsYWdpbl9yZXN1bHQtc3VjY2VzcycpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkYXRhVGFiID09ICdsZXNzb25zJykge1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSB0aGlzLl9nZXREYXRhTGVzc29uKHRhYiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5tZWRpYXRvci5hZGQoZGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhVGFiID09ICdzY2hvb2wnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHRoaXMuX2dldERhdGFTY2hvb2wodGFiLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLm1lZGlhdG9yLmFkZChkYXRhKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGFUYWIgPT0gJ2NsYXNzcm9vbScpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHRoaXMuX2dldERhdGFDbGFzc3Jvb20odGFiLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLm1lZGlhdG9yLmFkZChkYXRhKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fdmlld1Jlc3VsdEVkaXRFbnRyeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiByZXN1bHQsXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDb250YWluZXI6IGVycm9yLFxyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDb250YWluZXI6IHN1Y2Nlc3NcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGVkaXRDbGFzc3Jvb20obm9kZSkge1xyXG4gICAgICAgIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG5vZGUpO1xyXG4gICAgICAgIGxldCBidG4gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignYnV0dG9uW3R5cGU9XCJzdWJtaXRcIl0nKTtcclxuXHJcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBkYXRhO1xyXG4gICAgICAgICAgICBsZXQgcmVzdWx0O1xyXG4gICAgICAgICAgICBsZXQgZXJyb3IgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnBsYWdpbl9yZXN1bHQgLnBsYWdpbl9yZXN1bHQtZXJyb3InKTtcclxuICAgICAgICAgICAgbGV0IHN1Y2Nlc3MgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnBsYWdpbl9yZXN1bHQgLnBsYWdpbl9yZXN1bHQtc3VjY2VzcycpO1xyXG5cclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLl9nZXREYXRhQ2xhc3Nyb29tKGNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMubWVkaWF0b3IudXBkYXRlKGRhdGEpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fdmlld1Jlc3VsdEVkaXRFbnRyeSh7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQ6IHJlc3VsdCxcclxuICAgICAgICAgICAgICAgIGVycm9yQ29udGFpbmVyOiBlcnJvcixcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3NDb250YWluZXI6IHN1Y2Nlc3NcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBlZGl0TGVzc29ucyhub2RlKSB7XHJcbiAgICAgICAgbGV0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iobm9kZSk7XHJcbiAgICAgICAgbGV0IGJ0biA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdidXR0b25bdHlwZT1cInN1Ym1pdFwiXScpO1xyXG5cclxuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGRhdGE7XHJcbiAgICAgICAgICAgIGxldCByZXN1bHQ7XHJcbiAgICAgICAgICAgIGxldCBlcnJvciA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcucGxhZ2luX3Jlc3VsdCAucGxhZ2luX3Jlc3VsdC1lcnJvcicpO1xyXG4gICAgICAgICAgICBsZXQgc3VjY2VzcyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcucGxhZ2luX3Jlc3VsdCAucGxhZ2luX3Jlc3VsdC1zdWNjZXNzJyk7XHJcblxyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgZGF0YSA9IHRoaXMuX2dldERhdGFMZXNzb24oY29udGFpbmVyKTtcclxuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5tZWRpYXRvci51cGRhdGUoZGF0YSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl92aWV3UmVzdWx0RWRpdEVudHJ5KHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgZXJyb3JDb250YWluZXI6IGVycm9yLFxyXG4gICAgICAgICAgICAgICAgc3VjY2Vzc0NvbnRhaW5lcjogc3VjY2Vzc1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGVkaXRTY2hvb2wobm9kZSkge1xyXG4gICAgICAgIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG5vZGUpO1xyXG4gICAgICAgIGxldCBidG4gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignYnV0dG9uW3R5cGU9XCJzdWJtaXRcIl0nKTtcclxuXHJcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBkYXRhO1xyXG4gICAgICAgICAgICBsZXQgcmVzdWx0O1xyXG4gICAgICAgICAgICBsZXQgZXJyb3IgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnBsYWdpbl9yZXN1bHQgLnBsYWdpbl9yZXN1bHQtZXJyb3InKTtcclxuICAgICAgICAgICAgbGV0IHN1Y2Nlc3MgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnBsYWdpbl9yZXN1bHQgLnBsYWdpbl9yZXN1bHQtc3VjY2VzcycpO1xyXG5cclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLl9nZXREYXRhU2Nob29sKGNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMubWVkaWF0b3IudXBkYXRlKGRhdGEpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fdmlld1Jlc3VsdEVkaXRFbnRyeSh7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQ6IHJlc3VsdCxcclxuICAgICAgICAgICAgICAgIGVycm9yQ29udGFpbmVyOiBlcnJvcixcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3NDb250YWluZXI6IHN1Y2Nlc3NcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgX2dldERhdGFDbGFzc3Jvb20oY29udGFpbmVyLCBhZGQpIHtcclxuICAgICAgICBsZXQgbmFtZSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiY2xhc3Nyb29tX25hbWVcIl0nKS52YWx1ZTtcclxuICAgICAgICBsZXQgbG9jYXRpb24gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cImxvY2F0aW9uXCJdJykudmFsdWU7XHJcbiAgICAgICAgbGV0IGNhcGFjaXR5ID0gK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiY2FwYWNpdHlcIl0nKS52YWx1ZTtcclxuICAgICAgICBsZXQgcmVzdWx0O1xyXG4gICAgICAgIGxldCBpZDtcclxuXHJcbiAgICAgICAgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICB0YWJsZTogJ2NsYXNzcm9vbScsXHJcbiAgICAgICAgICAgIGVudHJ5OiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLnRyaW0oKSxcclxuICAgICAgICAgICAgICAgIGNhcGFjaXR5OiBjYXBhY2l0eSxcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCFhZGQpIHtcclxuICAgICAgICAgICAgaWQgPSArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdFtuYW1lPVwiY2xhc3Nyb29tXCJdJykudmFsdWU7XHJcbiAgICAgICAgICAgIHJlc3VsdC5lbnRyeS5pZCA9IGlkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBfZ2V0RGF0YVNjaG9vbChjb250YWluZXIsIGFkZCkge1xyXG4gICAgICAgIGxldCBuYW1lID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJzY2hvb2xfbmFtZVwiXScpLnZhbHVlO1xyXG4gICAgICAgIGxldCBzdHVkZW50cyA9ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInN0dWRlbnRfcXVhbnRpdHlcIl0nKS52YWx1ZTtcclxuICAgICAgICBsZXQgcmVzdWx0O1xyXG4gICAgICAgIGxldCBpZDtcclxuXHJcbiAgICAgICAgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICB0YWJsZTogJ3NjaG9vbCcsXHJcbiAgICAgICAgICAgIGVudHJ5OiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLnRyaW0oKSxcclxuICAgICAgICAgICAgICAgIHN0dWRlbnRzOiBzdHVkZW50c1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCFhZGQpIHtcclxuICAgICAgICAgICAgaWQgPSArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdFtuYW1lPVwic2Nob29sXCJdJykudmFsdWU7XHJcbiAgICAgICAgICAgIHJlc3VsdC5lbnRyeS5pZCA9IGlkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBfdmlld1Jlc3VsdEVkaXRFbnRyeShwYXJhbXMpIHtcclxuICAgICAgICBsZXQgbm9kZTtcclxuXHJcbiAgICAgICAgcGFyYW1zLmVycm9yQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIHBhcmFtcy5lcnJvckNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuXHJcbiAgICAgICAgaWYgKHBhcmFtcy5yZXN1bHQuZXJyb3IpIHtcclxuICAgICAgICAgICAgbm9kZSA9IHBhcmFtcy5lcnJvckNvbnRhaW5lcjtcclxuICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSBwYXJhbXMucmVzdWx0LmVycm9yO1xyXG4gICAgICAgICAgICBub2RlLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocGFyYW1zLnJlc3VsdC5vaykge1xyXG4gICAgICAgICAgICBub2RlID0gcGFyYW1zLnN1Y2Nlc3NDb250YWluZXI7XHJcbiAgICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gJ9Ch0L7RhdGA0LDQvdC10L3Qvic7XHJcbiAgICAgICAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgICAgIH0sIDI1MDApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfZ2V0RGF0YUxlc3Nvbihjb250YWluZXIsIGFkZCkge1xyXG4gICAgICAgIGxldCBkYXRlID0gdGhpcy5fZ2V0RGF0ZUZyb21Ubyhjb250YWluZXIpO1xyXG4gICAgICAgIGxldCBuYW1lTGVzc29uID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJsZXNzb25fbmFtZVwiXScpLnZhbHVlO1xyXG4gICAgICAgIGxldCBzY2hvb2wgPSBjb250YWluZXIucXVlcnlTZWxlY3Rvcignc2VsZWN0W25hbWU9XCJzY2hvb2xcIl0nKTtcclxuICAgICAgICBsZXQgbGVjdG9yID0gK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdzZWxlY3RbbmFtZT1cImxlY3RvclwiXScpLnZhbHVlO1xyXG4gICAgICAgIGxldCBjbGFzc3Jvb20gPSArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdFtuYW1lPVwiY2xhc3Nyb29tXCJdJykudmFsdWU7XHJcbiAgICAgICAgbGV0IHNjaG9vbFNlbGVjdGVkID0gdGhpcy5fZ2V0T3B0aW9uc1NlbGVjdGVkKHNjaG9vbCk7XHJcbiAgICAgICAgbGV0IGlkTGVzc29uO1xyXG4gICAgICAgIGxldCByZXN1bHQ7XHJcblxyXG4gICAgICAgIHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgdGFibGU6ICdsZXNzb25zJyxcclxuICAgICAgICAgICAgZW50cnk6IHtcclxuICAgICAgICAgICAgICAgIC8vIGlkOiBpZExlc3NvbixcclxuICAgICAgICAgICAgICAgIG5hbWU6IG5hbWVMZXNzb24sXHJcbiAgICAgICAgICAgICAgICBzY2hvb2w6IHNjaG9vbFNlbGVjdGVkLFxyXG4gICAgICAgICAgICAgICAgbGVjdG9yOiB7IGlkOiBsZWN0b3IgfSxcclxuICAgICAgICAgICAgICAgIGNsYXNzcm9vbTogeyBpZDogY2xhc3Nyb29tIH0sXHJcbiAgICAgICAgICAgICAgICBkYXRlOiBkYXRlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIWFkZCkge1xyXG4gICAgICAgICAgICBpZExlc3NvbiA9ICtjb250YWluZXIucXVlcnlTZWxlY3Rvcignc2VsZWN0W25hbWU9XCJsZXNzb25zXCJdJykudmFsdWU7XHJcbiAgICAgICAgICAgIHJlc3VsdC5lbnRyeS5pZCA9IGlkTGVzc29uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBfZ2V0T3B0aW9uc1NlbGVjdGVkKHNlbGVjdCkge1xyXG4gICAgICAgIGxldCBvcHRpb25zID0gc2VsZWN0Lm9wdGlvbnM7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBvcHRpb24gPSBvcHRpb25zW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbi5zZWxlY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goeyBpZDogK29wdGlvbi52YWx1ZSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5sZW5ndGggPT0gMSA/IHJlc3VsdFswXSA6IHJlc3VsdDsgLy8gc2luZ2xlIHZhbHVlID0ge30sIG11bHRpcGx5ID0gW3t9LFt7fV1dXHJcbiAgICB9XHJcblxyXG4gICAgX2dldERhdGFGaWx0ZXIoY29udGFpbmVyLCBwYXJhbSkge1xyXG4gICAgICAgIGxldCByZXN1bHQgPSB7fTtcclxuXHJcbiAgICAgICAgcmVzdWx0LmRhdGUgPSB0aGlzLl9nZXREYXRlRnJvbVRvKGNvbnRhaW5lcik7XHJcbiAgICAgICAgcmVzdWx0W3BhcmFtXSA9IHtcclxuICAgICAgICAgICAga2V5OiAnaWQnLFxyXG4gICAgICAgICAgICB2YWx1ZTogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGBzZWxlY3RbbmFtZT1cIiR7cGFyYW19XCJdYCkudmFsdWVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIF9nZXREYXRlRnJvbVRvKGNvbnRhaW5lcikge1xyXG4gICAgICAgIGxldCByb3dDb250YWluZXJzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJy5kYXRlX19yb3dzJyk7XHJcbiAgICAgICAgbGV0IHJvd3MgPSB0aGlzLl9nZXRSb3dDb250YWluZXJzKHJvd0NvbnRhaW5lcnMpO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBmcm9tOiArdGhpcy5fZ2V0RGF0ZVJvdyhyb3dzLmZyb20pLCAvLyDQvdGD0LbQvdGLINGH0LjRgdC70L7QstGL0LUg0LfQvdCw0YfQtdC90LjRjyDQtNC70Y8gZmlsdGVyXHJcbiAgICAgICAgICAgIHRvOiArdGhpcy5fZ2V0RGF0ZVJvdyhyb3dzLnRvKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfZ2V0Um93Q29udGFpbmVycyhyb3dDb250YWluZXJzKSB7XHJcbiAgICAgICAgbGV0IHJvd3MgPSB7fTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3dDb250YWluZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCByb3cgPSByb3dDb250YWluZXJzW2ldO1xyXG4gICAgICAgICAgICBsZXQgZGF0YSA9IHJvdy5kYXRhc2V0LmRhdGU7XHJcblxyXG4gICAgICAgICAgICByb3dzW2RhdGFdID0gcm93O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJvd3M7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIF9nZXREYXRlUm93KHJvdykge1xyXG4gICAgICAgIGxldCB5ZWFyID0gMjAxNztcclxuICAgICAgICBsZXQgbW9udGggPSByb3cucXVlcnlTZWxlY3Rvcignc2VsZWN0W25hbWU9XCJtb250aFwiXScpLnZhbHVlO1xyXG4gICAgICAgIGxldCBkYXRlID0gcm93LnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdFtuYW1lPVwiZGF5XCJdJykudmFsdWU7XHJcbiAgICAgICAgbGV0IGhvdXIgPSByb3cucXVlcnlTZWxlY3Rvcignc2VsZWN0W25hbWU9XCJob3VyXCJdJykudmFsdWU7XHJcbiAgICAgICAgbGV0IG1pbnV0ID0gcm93LnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdFtuYW1lPVwibWludXRcIl0nKS52YWx1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXRlLCBob3VyLCBtaW51dCk7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBUZW1wbGF0ZSB7XHJcblxyXG4gICAgdGVtcGxhdGUoa2V5LCBmaWVsZHMpIHtcclxuICAgICAgICBpZiAoa2V5ID09PSAnbGVzc29ucycpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldExlc3NvbnNUZW1wbGF0ZSAoZmllbGRzKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2xlY3RvcicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldExlY3RvclRlbXBsYXRlIChmaWVsZHMpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnbWF0ZXJpYWwnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nZXRNYXRlcmlhbFRlbXBsYXRlKGZpZWxkcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9nZXRMZXNzb25zVGVtcGxhdGUoZmllbGRzKSB7XHJcbiAgICAgICAgbGV0IGNhY2hlID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNhY2hlLnB1c2godGhpcy5fZ2V0TGVzc29uVGVtcGxhdGUoZmllbGRzW2ldKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY2FjaGUuam9pbignJyk7XHJcbiAgICB9XHJcblxyXG4gICAgX2dldExlY3RvclRlbXBsYXRlKGZpZWxkKSB7XHJcbiAgICAgICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwibGVjdG9yX19wb3B1cFwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGVjdG9yX19wb3B1cC1uYW1lXCI+JHtmaWVsZC5uYW1lfTwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGVjdG9yX19wb3B1cC1pbWdcIj5cclxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHtmaWVsZC5zcmN9XCIgYWx0PVwiXCI+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGVjdG9yX19wb3B1cC10ZXh0XCI+JHtmaWVsZC5kZXNjcmlwdGlvbn08L2Rpdj5cclxuICAgICAgICAgICAgPGEgaHJlZj1cIlwiIGNsYXNzPVwicF9jbG9zZVwiPng8L2E+XHJcbiAgICAgICAgICAgIDwvZGl2PmA7XHJcbiAgICB9XHJcblxyXG4gICAgX2dldE1hdGVyaWFsVGVtcGxhdGUoZmllbGQpIHtcclxuICAgICAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJsZWN0b3JfX3BvcHVwXCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJsZWN0b3JfX3BvcHVwLW5hbWVcIj4ke2ZpZWxkLm5hbWV9PC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJsZWN0b3JfX3BvcHVwLWltZ1wiPlxyXG4gICAgICAgICAgICAgICAgPGEgaHJlZj1cIiR7ZmllbGQuc3JjfVwiIGFsdD1cIlwiIHRhcmdldD1cIl9ibGFua1wiPlxyXG4gICAgICAgICAgICAgICAgICAgINCf0LXRgNC10LnRgtC4INC6INC/0YDQvtGB0LzQvtGC0YDRgyDQvNCw0YLQtdGA0LjQsNC70L7QslxyXG4gICAgICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGEgaHJlZj1cIlwiIGNsYXNzPVwicF9jbG9zZVwiPng8L2E+XHJcbiAgICAgICAgICAgIDwvZGl2PmA7XHJcbiAgICB9XHJcblxyXG4gICAgX2dldExlc3NvblRlbXBsYXRlKGZpZWxkKSB7XHJcbiAgICAgICAgbGV0IHNjaGVtYSA9IHRoaXMuX2dldFNjaGVtYUZpZWxkc0xlc3NvbigpO1xyXG5cclxuICAgICAgICByZXR1cm4gYFxyXG4gICAgICAgICAgICA8dHIgJHtmaWVsZC5tYXRlcmlhbCA/ICdjbGFzcz1cImxlY3R1cmVfX2VuZGVkXCInIDogJyd9PlxyXG4gICAgICAgICAgICAgICAgPHRkIGRhdGEtbGFiZWwgPSBcIiR7c2NoZW1hLm51bWJlcn1cIj48c3Bhbj4ke2ZpZWxkLmlkfTwvc3Bhbj48L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGRhdGEtbGFiZWwgPSBcIiR7c2NoZW1hLnNjaG9vbH1cIj48c3Bhbj4ke3RoaXMuX2Zvcm1hdFNjaG9vbEZpZWxkKGZpZWxkLnNjaG9vbCl9PC9zcGFuPjwvdGQ+XHJcbiAgICAgICAgICAgICAgICA8dGQgZGF0YS1sYWJlbCA9IFwiJHtzY2hlbWEubGVjdHVyZX1cIj48c3Bhbj4ke2ZpZWxkLm5hbWV9PC9zcGFuPjwvdGQ+XHJcbiAgICAgICAgICAgICAgICA8dGQgZGF0YS1sYWJlbCA9IFwiJHtzY2hlbWEubGVjdG9yfVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPjxhIGhyZWY9XCIke2ZpZWxkLmxlY3Rvci5zcmN9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgY2xhc3M9XCJsZXNzb25fX2xlY3RvclwiIGRhdGEtaWQ9XCIke2ZpZWxkLmxlY3Rvci5pZH1cIj4ke2ZpZWxkLmxlY3Rvci5uYW1lfTwvYT48L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGRhdGEtbGFiZWwgPSBcIiR7c2NoZW1hLmRhdGV9XCI+PHNwYW4+JHt0aGlzLl9mb3JtYXREYXRlRmllbGQoZmllbGQuZGF0ZSl9PC9zcGFuPjwvdGQ+XHJcbiAgICAgICAgICAgICAgICA8dGQgZGF0YS1sYWJlbCA9IFwiJHtzY2hlbWEubG9jYXRpb259XCI+PHNwYW4+JHtmaWVsZC5jbGFzc3Jvb20ubmFtZX0gKCR7ZmllbGQuY2xhc3Nyb29tLmxvY2F0aW9ufSwg0LTQviAke2ZpZWxkLmNsYXNzcm9vbS5jYXBhY2l0eX0g0YfQtdC7Lik8L3NwYW4+PC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsID0gXCIke3NjaGVtYS5tYXRlcmlhbH1cIj5cclxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj48YSBocmVmPVwiJHtmaWVsZC5tYXRlcmlhbCA/IGZpZWxkLm1hdGVyaWFsLnNyYyA6ICcnfVwiIGNsYXNzPVwibGVzc29uX19tYXRlcmlhbFwiIHRhcmdldD1cIl9ibGFua1wiIGRhdGEtaWQ9XCIke2ZpZWxkLm1hdGVyaWFsID8gZmllbGQubWF0ZXJpYWwuaWQgOiAnJ31cIj4ke2ZpZWxkLm1hdGVyaWFsID8gZmllbGQubWF0ZXJpYWwubmFtZSA6ICcnfTwvYT48L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICA8L3RyPmBcclxuICAgIH1cclxuXHJcbiAgICBfZm9ybWF0U2Nob29sRmllbGQoc2Nob29sKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgbmFtZXM6IFtdLFxyXG4gICAgICAgICAgICBjb3VudDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaG9vbCkpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hvb2wubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5uYW1lcy5wdXNoKHNjaG9vbFtpXS5uYW1lKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5jb3VudCArPSBzY2hvb2xbaV0uc3R1ZGVudHM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXN1bHQubmFtZXMucHVzaChzY2hvb2wubmFtZSk7XHJcbiAgICAgICAgICAgIHJlc3VsdC5jb3VudCArPSBzY2hvb2wuc3R1ZGVudHM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYCR7cmVzdWx0Lm5hbWVzLmpvaW4oJywgJyl9ICgke3Jlc3VsdC5jb3VudH0g0YfQtdC7LilgO1xyXG4gICAgfVxyXG5cclxuICAgIF9mb3JtYXREYXRlRmllbGQoZGF0ZSkge1xyXG4gICAgICAgIGxldCBmcm9tID0gbmV3IERhdGUoZGF0ZS5mcm9tKTtcclxuICAgICAgICBsZXQgdG8gPSBuZXcgRGF0ZShkYXRlLnRvKTtcclxuXHJcbiAgICAgICAgbGV0IG1tID0gdGhpcy5fZm9ybWF0RGF0ZUFkZE51bGwoZnJvbS5nZXRNb250aCgpICsgMSk7XHJcbiAgICAgICAgbGV0IGRkID0gdGhpcy5fZm9ybWF0RGF0ZUFkZE51bGwoZnJvbS5nZXREYXRlKCkpO1xyXG4gICAgICAgIGxldCBob3VyRnJvbSA9IHRoaXMuX2Zvcm1hdERhdGVBZGROdWxsKGZyb20uZ2V0SG91cnMoKSk7XHJcbiAgICAgICAgbGV0IGhvdXJUbyA9IHRoaXMuX2Zvcm1hdERhdGVBZGROdWxsKHRvLmdldEhvdXJzKCkpO1xyXG4gICAgICAgIGxldCBNTUZyb20gPSB0aGlzLl9mb3JtYXREYXRlQWRkTnVsbChmcm9tLmdldE1pbnV0ZXMoKSk7XHJcbiAgICAgICAgbGV0IE1NVG8gPSB0aGlzLl9mb3JtYXREYXRlQWRkTnVsbCh0by5nZXRNaW51dGVzKCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gYCR7ZGR9LiR7bW19ICR7aG91ckZyb219OiR7TU1Gcm9tfS0ke2hvdXJUb306JHtNTVRvfWA7XHJcbiAgICB9XHJcblxyXG4gICAgX2Zvcm1hdERhdGVBZGROdWxsKG51bWJlcikge1xyXG4gICAgICAgIGlmIChudW1iZXIgPCAxMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJzAnICsgbnVtYmVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bWJlcjtcclxuICAgIH1cclxuXHJcbiAgICBfZ2V0U2NoZW1hRmllbGRzTGVzc29uKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG51bWJlcjogJ+KElicsXHJcbiAgICAgICAgICAgIHNjaG9vbDogJ9Co0LrQvtC70LAnLFxyXG4gICAgICAgICAgICBsZWN0dXJlOiAn0KLQtdC80LAg0LvQtdC60YbQuNC4JyxcclxuICAgICAgICAgICAgbGVjdG9yOiAn0JjQvNGPINC70LXQutGC0L7RgNCwJyxcclxuICAgICAgICAgICAgZGF0ZTogJ9CU0LDRgtCwJyxcclxuICAgICAgICAgICAgbG9jYXRpb246ICfQnNC10YHRgtC+INC/0YDQvtCy0LXQtNC10L3QuNGPJyxcclxuICAgICAgICAgICAgbWF0ZXJpYWw6ICfQnNCw0YLQtdGA0LjQsNC70YsnXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59Il19

//# sourceMappingURL=index.js.map
