(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lesson = require('./template/lesson');

var _lesson2 = _interopRequireDefault(_lesson);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Filter = function () {
    function Filter(options) {
        _classCallCheck(this, Filter);

        this.lessons = options.lessons;
        this.table = options.table;
        this.initFilter(options.filter);
    }

    _createClass(Filter, [{
        key: 'initFilter',
        value: function initFilter(filterContainer) {
            var _this = this;

            this.inputSchool = filterContainer.querySelector('input[name="filter-school"]');
            this.inputLector = filterContainer.querySelector('input[name="filter-lector"]');
            this.inputDate = filterContainer.querySelector('input[name="filter-date"]');
            this.buttonSubmit = filterContainer.querySelector('[type="submit"]');

            this.buttonSubmit.style.display = 'none';

            filterContainer.addEventListener('submit', function (event) {
                event.preventDefault();
            });

            filterContainer.addEventListener('keyup', function (event) {
                var filter = _this.getFilterValue();
                var stringLessons = _this.getStringLessons(filter);

                _this.renderLessonDom(stringLessons);
            });

            document.addEventListener('DOMContentLoaded', function () {
                var stringLessons = _this.getStringLessons();

                _this.renderLessonDom(stringLessons);
            });
        }
    }, {
        key: 'getStringLessons',
        value: function getStringLessons() {
            var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            var lessons = void 0;
            var templateLesson = new _lesson2.default();

            if (!filter) {
                lessons = this.lessons;
            } else {
                lessons = this.filterLessons({
                    lessons: this.lessons,
                    filter: filter
                });
            }

            return templateLesson.compileLessons(lessons);
        }
    }, {
        key: 'renderLessonDom',
        value: function renderLessonDom(stringLessons) {
            var tbody = this.table.querySelector('tbody');

            tbody.innerHTML = stringLessons;
        }
    }, {
        key: 'filterLessons',
        value: function filterLessons(options) {
            var arLessons = options.lessons;
            var filter = options.filter;
            var result = [];

            for (var i = 0; i < arLessons.length; i++) {
                var lesson = arLessons[i];
                var isMatch = this.isMatchingLesson(filter, lesson);

                if (isMatch) {
                    result.push(lesson);
                }
            }

            return result;
        }
    }, {
        key: 'isMatchingLesson',
        value: function isMatchingLesson(filter, lesson) {
            var arFilter = Object.keys(filter);

            for (var j = 0; j < arFilter.length; j++) {
                var keyFilter = arFilter[j];
                var valueLesson = lesson[keyFilter];
                var valueFilter = filter[keyFilter];

                if ((typeof valueLesson === 'undefined' ? 'undefined' : _typeof(valueLesson)) === "object" && (typeof valueFilter === 'undefined' ? 'undefined' : _typeof(valueFilter)) === "object") {
                    if (!this.isMatching(valueLesson[valueFilter['key']], valueFilter['value'])) {
                        return false;
                    }
                } else if (Array.isArray(valueLesson)) {
                    var isMatch = false;

                    for (var i = 0; i < valueLesson.length; i++) {
                        var item = valueLesson[i];

                        if (this.isMatching(item, valueFilter)) {
                            isMatch = true;
                            break;
                        }
                    }

                    if (!isMatch) {
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
            val1 = val1.toLowerCase();
            val2 = val2.toLowerCase();

            return val1.indexOf(val2) == -1 ? false : true;
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
    }, {
        key: 'getFilterValue',
        value: function getFilterValue() {
            var result = {};
            var schoolValue = this.inputSchool.value;
            var lectorValue = this.inputLector.value;
            var dateValue = this.inputDate.value;
            var arValue = [schoolValue, lectorValue, dateValue];

            if (this.isEmptyInputs(arValue)) {
                return false;
            };

            if (schoolValue) {
                result.school = schoolValue;
            }

            if (lectorValue) {
                result.lector = {
                    key: 'name',
                    value: lectorValue
                };
            }

            if (dateValue) {
                result.date = dateValue;
            }

            return result;
        }
    }]);

    return Filter;
}();

exports.default = Filter;

},{"./template/lesson":6}],2:[function(require,module,exports){
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
            var window = document.querySelector('.popup__cnt');

            if (!window) {
                window = document.createElement('div');
                window.classList.add('popup__cnt');
                window.innerHTML = '<div class="popup__cnt--window"></div>';
                document.body.appendChild(window);
            }

            this.window = window;
        }
    }, {
        key: 'open',
        value: function open(content) {
            this.window.classList.add('active');
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
            this.window.classList.remove('active');
        }
    }, {
        key: 'setContent',
        value: function setContent(content) {
            var container = this.window.querySelector('.popup__cnt--window');

            container.innerHTML = content;
        }
    }]);

    return Popup;
}();

exports.default = Popup;

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _template = require("./template/template");

var _template2 = _interopRequireDefault(_template);

var _popup = require("./_popup");

var _popup2 = _interopRequireDefault(_popup);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Table = function () {
    function Table(options) {
        _classCallCheck(this, Table);

        this.table = options.table;
        this.lectors = {};
        this.material = {};
        this.data = options.data;

        this.initEvent();
    }

    _createClass(Table, [{
        key: "initEvent",
        value: function initEvent() {
            var _this = this;

            var table = this.table;

            table.addEventListener('click', function (event) {
                var target = event.target;
                var popup = new _popup2.default();

                if (target.tagName !== "A") {
                    return;
                }

                if (target.classList.contains('lesson__lector')) {
                    var lectors = _this.getLectors();
                    var id = target.dataset.id;
                    var lector = new _template2.default(lectors[id]);
                    var content = lector.getHTMLLector();

                    event.preventDefault();
                    popup.open(content);
                    popup.eventClose('.p_close');
                } else if (target.classList.contains('lesson__material')) {
                    var materials = _this.getMaterial();
                    var _id = target.dataset.id;
                    var material = new _template2.default(materials[_id]);
                    var _content = material.getHTMLMaterial();

                    event.preventDefault();
                    popup.open(_content);
                    popup.eventClose('.p_close');
                }
            });
        }
    }, {
        key: "getLectors",
        value: function getLectors() {
            var data = this.data;
            var lectors = this.lectors;

            if (Object.keys(lectors).length < 1) {
                for (var i = 0; i < data.length; i++) {
                    var element = data[i].lector;

                    lectors["" + element.id] = element;
                }
                return lectors;
            }

            return lectors;
        }
    }, {
        key: "getMaterial",
        value: function getMaterial() {
            var data = this.data;
            var material = this.material;

            if (Object.keys(material).length < 1) {
                for (var i = 0; i < data.length; i++) {
                    var element = data[i].material;

                    if (element) {
                        material["" + element.id] = element;
                    }
                }
                return material;
            }

            return material;
        }
    }]);

    return Table;
}();

exports.default = Table;

},{"./_popup":2,"./template/template":7}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var lessons = [{
    number: 1,
    school: 'Разработка интерфейсов',
    lecture: 'Адаптивная вёрстка',
    lector: {
        id: 1,
        name: 'Дмитрий Душкин',
        src: 'https://avatars.mds.yandex.net/get-yaevents/95043/0914ac42b6dc11e687ef002590c62a5c/big',
        description: 'Кандидат технических наук, научный сотрудник ИПУ РАН с 2008 по 2013. Пришёл в Яндекс.Картинки в 2014 году, отвечал за мобильную версию и рост производительности сервиса. В 2016 перешёл в Yandex Data Factory, где разрабатывает интерфейсы и дизайн веб-приложений для B2B.'
    },
    date: '01.07.2017',
    location: 'Аудитория 1',
    material: {
        id: 1,
        name: 'Материалы',
        src: 'https://events.yandex.ru/lib/talks/4162/'
    }
}, {
    number: 2,
    school: 'Разработка интерфейсов',
    lecture: 'Работа с сенсорным пользовательским вводом',
    lector: {
        id: 1,
        name: 'Дмитрий Душкин',
        src: 'https://avatars.mds.yandex.net/get-yaevents/95043/0914ac42b6dc11e687ef002590c62a5c/big',
        description: 'Кандидат технических наук, научный сотрудник ИПУ РАН с 2008 по 2013. Пришёл в Яндекс.Картинки в 2014 году, отвечал за мобильную версию и рост производительности сервиса. В 2016 перешёл в Yandex Data Factory, где разрабатывает интерфейсы и дизайн веб-приложений для B2B.'
    },
    date: '02.07.2017',
    location: 'Аудитория 1',
    material: ''
}, {
    number: 3,
    school: 'Разработка интерфейсов',
    lecture: 'Мультимедиа: возможности браузера',
    lector: {
        id: 2,
        name: 'Максим Васильев',
        src: 'https://avatars.mds.yandex.net/get-yaevents/194464/21e1dae2b6dc11e687ef002590c62a5c/big',
        description: 'Во фронтенд-разработке с 2007 года. До 2013-го, когда пришёл в Яндекс, работал технологом в студии Лебедева и других компаниях.'
    },
    date: '03.07.2017',
    location: 'Аудитория 2',
    material: ''
}, {
    number: 4,
    school: 'Мобильная разработка',
    lecture: 'Java Blitz (Часть 1)',
    lector: {
        id: 3,
        name: 'Эдуард Мацуков',
        src: 'https://avatars.mds.yandex.net/get-yaevents/198307/9d9a8672b6da11e687ef002590c62a5c/big',
        description: 'Разрабатываю приложения для Android с 2010 года. В 2014 делал высоконагруженное финансовое приложение. Тогда же начал осваивать АОП, внедряя язык в продакшн. В 2015 разрабатывал инструменты для Android Studio, позволяющие использовать aspectJ в своих проектах. В Яндексе занят на проекте Авто.ру.'
    },
    date: '01.07.2017',
    location: 'Аудитория 4',
    material: {
        id: 2,
        name: 'Материалы',
        src: 'https://events.yandex.ru/lib/talks/4162/'
    }
}, {
    number: 5,
    school: 'Мобильная разработка',
    lecture: 'Git & Workflow',
    lector: {
        id: 4,
        name: 'Дмитрий Складнов',
        src: 'https://avatars.mds.yandex.net/get-yaevents/197753/08c605ecb6dc11e687ef002590c62a5c/big',
        description: 'Окончил факультет ИТ Московского Технического Университета. В Яндексе с 2015 года, разрабатывает приложение Auto.ru для Android.'
    },
    date: '02.07.2017',
    location: 'Аудитория 4',
    material: ''
}, {
    number: 6,
    school: 'Мобильная разработка',
    lecture: 'Java Blitz (Часть 2)',
    lector: {
        id: 3,
        name: 'Эдуард Мацуков',
        src: 'https://avatars.mds.yandex.net/get-yaevents/198307/9d9a8672b6da11e687ef002590c62a5c/big',
        description: 'Разрабатываю приложения для Android с 2010 года. В 2014 делал высоконагруженное финансовое приложение. Тогда же начал осваивать АОП, внедряя язык в продакшн. В 2015 разрабатывал инструменты для Android Studio, позволяющие использовать aspectJ в своих проектах. В Яндексе занят на проекте Авто.ру.'
    },
    date: '03.07.2017',
    location: 'Аудитория 4',
    material: ''
}, {
    number: 7,
    school: 'Мобильный дизайн',
    lecture: 'Идея, исследование, концепт (Часть 1)',
    lector: {
        id: 5,
        name: 'Антон Тен',
        src: 'https://avatars.mds.yandex.net/get-yaevents/204268/07bb5f8ab6dc11e687ef002590c62a5c/big',
        description: 'В Яндексе с 2014 года. Ведущий дизайнер продукта в сервисах Переводчик, Расписания и Видео.'
    },
    date: '01.07.2017',
    location: 'Аудитория 7',
    material: {
        id: 3,
        name: 'Материалы',
        src: 'https://events.yandex.ru/lib/talks/4162/'
    }
}, {
    number: 8,
    school: 'Мобильный дизайн',
    lecture: 'Идея, исследование, концепт (Часть 2)',
    lector: {
        id: 5,
        name: 'Антон Тен',
        src: 'https://avatars.mds.yandex.net/get-yaevents/204268/07bb5f8ab6dc11e687ef002590c62a5c/big',
        description: 'В Яндексе с 2014 года. Ведущий дизайнер продукта в сервисах Переводчик, Расписания и Видео.'
    },
    date: '02.07.2017',
    location: 'Аудитория 7',
    material: ''
}, {
    number: 9,
    school: 'Мобильный дизайн',
    lecture: 'Особенности проектирования мобильных интерфейсов',
    lector: {
        id: 6,
        name: 'Васюнин Николай',
        src: 'https://avatars.mds.yandex.net/get-yaevents/194464/1c55b8d2b6dc11e687ef002590c62a5c/big',
        description: 'Пришёл в Яндекс в 2014 году. Дизайнер продукта в музыкальных сервисах компании, участник команды разработки Яндекс.Радио.'
    },
    date: '03.07.2017',
    location: 'Аудитория 8',
    material: ''
}, {
    number: 10,
    school: ['Разработка интерфейсов', 'Мобильная разработка', 'Мобильный дизайн'],
    lecture: 'Идея, исследование, концепт (Часть 2)',
    lector: {
        id: 5,
        name: 'Антон Тен',
        src: 'https://avatars.mds.yandex.net/get-yaevents/204268/07bb5f8ab6dc11e687ef002590c62a5c/big',
        description: 'В Яндексе с 2014 года. Ведущий дизайнер продукта в сервисах Переводчик, Расписания и Видео.'
    },
    date: '04.07.2017',
    location: 'Аудитория 7',
    material: ''
}, {
    number: 11,
    school: ['Разработка интерфейсов', 'Мобильная разработка', 'Мобильный дизайн'],
    lecture: 'Особенности проектирования мобильных интерфейсов',
    lector: {
        id: 6,
        name: 'Васюнин Николай',
        src: 'https://avatars.mds.yandex.net/get-yaevents/194464/1c55b8d2b6dc11e687ef002590c62a5c/big',
        description: 'Пришёл в Яндекс в 2014 году. Дизайнер продукта в музыкальных сервисах компании, участник команды разработки Яндекс.Радио.'
    },
    date: '05.07.2017',
    location: 'Аудитория 8',
    material: ''
}];

exports.lessons = lessons;

},{}],5:[function(require,module,exports){
'use strict';

var _lesson_data = require('./data/_lesson_data');

var _filter = require('./_filter');

var _filter2 = _interopRequireDefault(_filter);

var _table = require('./_table');

var _table2 = _interopRequireDefault(_table);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var filterContainer = document.querySelector('#filter');
var tableContainer = document.querySelector('.table');
var filter = new _filter2.default({
    lessons: _lesson_data.lessons,
    filter: filterContainer,
    table: tableContainer
});

new _table2.default({
    table: tableContainer,
    data: _lesson_data.lessons
});

},{"./_filter":1,"./_table":3,"./data/_lesson_data":4}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Template = function () {
    function Template() {
        _classCallCheck(this, Template);

        this.buffer = '';
    }

    _createClass(Template, [{
        key: 'compileLessons',
        value: function compileLessons(objects) {
            this.cacheClear();

            for (var i = 0; i < objects.length; i++) {
                this.cache = this.compileLesson(objects[i]);
            }

            return this.cache;
        }
    }, {
        key: 'compileLesson',
        value: function compileLesson(object) {
            var schema = this.getSchemaFieldsLesson();

            return '\n            <tr ' + (object.material ? 'class="lecture__ended"' : '') + '>\n                <td data-label = "' + schema.number + '"><span>' + object.number + '</span></td>\n                <td data-label = "' + schema.school + '"><span>' + object.school + '</span></td>\n                <td data-label = "' + schema.lecture + '"><span>' + object.lecture + '</span></td>\n                <td data-label = "' + schema.lector + '"><span><a href="' + object.lector.src + '" target="_blank" class="lesson__lector" data-id="' + object.lector.id + '">' + object.lector.name + '</a></span></td>\n                <td data-label = "' + schema.date + '"><span>' + object.date + '</span></td>\n                <td data-label = "' + schema.location + '"><span>' + object.location + '</span></td>\n                <td data-label = "' + schema.material + '">\n                    <span><a href="' + (object.material.src ? object.material.src : '') + '" class="lesson__material" target="_blank" data-id="' + object.material.id + '">' + (object.material.name ? object.material.name : '') + '</a></span>\n                </td>\n            </tr>';
        }
    }, {
        key: 'cacheClear',
        value: function cacheClear() {
            this.buffer = '';
        }
    }, {
        key: 'getSchemaFieldsLesson',
        value: function getSchemaFieldsLesson() {
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
    }, {
        key: 'cache',
        set: function set(lesson) {
            this.buffer = this.buffer + lesson;
        },
        get: function get() {
            return this.buffer;
        }
    }]);

    return Template;
}();

exports.default = Template;

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Template = function () {
    function Template(template) {
        _classCallCheck(this, Template);

        this.template = template;
    }

    _createClass(Template, [{
        key: "getHTMLLector",
        value: function getHTMLLector() {
            return this.compileLector(this.template);
        }
    }, {
        key: "compileLector",
        value: function compileLector(lector) {
            return "<div class=\"lector__popup\">\n            <div class=\"lector__popup-name\">" + lector.name + "</div>\n            <div class=\"lector__popup-img\">\n                <img src=\"" + lector.src + "\" alt=\"\">\n            </div>\n            <div class=\"lector__popup-text\">" + lector.description + "</div>\n            <a href=\"\" class=\"p_close\">x</a>\n            </div>";
        }
    }, {
        key: "getHTMLMaterial",
        value: function getHTMLMaterial() {
            return this.compileMaterial(this.template);
        }
    }, {
        key: "compileMaterial",
        value: function compileMaterial(material) {
            return "<div class=\"lector__popup\">\n            <div class=\"lector__popup-name\">" + material.name + "</div>\n            <div class=\"lector__popup-img\">\n                <a href=\"" + material.src + "\" alt=\"\" target=\"_blank\">\n                    \u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0443 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432\n                </a>\n            </div>\n            <a href=\"\" class=\"p_close\">x</a>\n            </div>";
        }
    }]);

    return Template;
}();

exports.default = Template;

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGpzXFxfZmlsdGVyLmpzIiwic3JjXFxqc1xcX3BvcHVwLmpzIiwic3JjXFxqc1xcX3RhYmxlLmpzIiwic3JjXFxqc1xcZGF0YVxcX2xlc3Nvbl9kYXRhLmpzIiwic3JjXFxqc1xcaW5kZXguanMiLCJzcmNcXGpzXFx0ZW1wbGF0ZVxcbGVzc29uLmpzIiwic3JjXFxqc1xcdGVtcGxhdGVcXHRlbXBsYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7OztJQUVxQixNO0FBQ2pCLG9CQUFZLE9BQVosRUFBb0I7QUFBQTs7QUFDaEIsYUFBSyxPQUFMLEdBQWUsUUFBUSxPQUF2QjtBQUNBLGFBQUssS0FBTCxHQUFhLFFBQVEsS0FBckI7QUFDQSxhQUFLLFVBQUwsQ0FBZ0IsUUFBUSxNQUF4QjtBQUNIOzs7O21DQUVXLGUsRUFBaUI7QUFBQTs7QUFDekIsaUJBQUssV0FBTCxHQUFtQixnQkFBZ0IsYUFBaEIsQ0FBOEIsNkJBQTlCLENBQW5CO0FBQ0EsaUJBQUssV0FBTCxHQUFtQixnQkFBZ0IsYUFBaEIsQ0FBOEIsNkJBQTlCLENBQW5CO0FBQ0EsaUJBQUssU0FBTCxHQUFpQixnQkFBZ0IsYUFBaEIsQ0FBOEIsMkJBQTlCLENBQWpCO0FBQ0EsaUJBQUssWUFBTCxHQUFvQixnQkFBZ0IsYUFBaEIsQ0FBOEIsaUJBQTlCLENBQXBCOztBQUVBLGlCQUFLLFlBQUwsQ0FBa0IsS0FBbEIsQ0FBd0IsT0FBeEIsR0FBa0MsTUFBbEM7O0FBRUEsNEJBQWdCLGdCQUFoQixDQUFpQyxRQUFqQyxFQUEyQyxVQUFDLEtBQUQsRUFBVztBQUNsRCxzQkFBTSxjQUFOO0FBQ0gsYUFGRDs7QUFJQSw0QkFBZ0IsZ0JBQWhCLENBQWlDLE9BQWpDLEVBQTBDLFVBQUMsS0FBRCxFQUFXO0FBQ2pELG9CQUFJLFNBQVMsTUFBSyxjQUFMLEVBQWI7QUFDQSxvQkFB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SDVCO0FBU0g7Ozs7OztrQkFsQ2dCLFEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHRlbXBsYXRlIGZyb20gJy4vdGVtcGxhdGUvbGVzc29uJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsdGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpe1xyXG4gICAgICAgIHRoaXMubGVzc29ucyA9IG9wdGlvbnMubGVzc29ucztcclxuICAgICAgICB0aGlzLnRhYmxlID0gb3B0aW9ucy50YWJsZTtcclxuICAgICAgICB0aGlzLmluaXRGaWx0ZXIob3B0aW9ucy5maWx0ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRGaWx0ZXIgKGZpbHRlckNvbnRhaW5lcikge1xyXG4gICAgICAgIHRoaXMuaW5wdXRTY2hvb2wgPSBmaWx0ZXJDb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cImZpbHRlci1zY2hvb2xcIl0nKTtcclxuICAgICAgICB0aGlzLmlucHV0TGVjdG9yID0gZmlsdGVyQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJmaWx0ZXItbGVjdG9yXCJdJyk7XHJcbiAgICAgICAgdGhpcy5pbnB1dERhdGUgPSBmaWx0ZXJDb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cImZpbHRlci1kYXRlXCJdJyk7XHJcbiAgICAgICAgdGhpcy5idXR0b25TdWJtaXQgPSBmaWx0ZXJDb250YWluZXIucXVlcnlTZWxlY3RvcignW3R5cGU9XCJzdWJtaXRcIl0nKTtcclxuXHJcbiAgICAgICAgdGhpcy5idXR0b25TdWJtaXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHJcbiAgICAgICAgZmlsdGVyQ29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmaWx0ZXJDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGZpbHRlciA9IHRoaXMuZ2V0RmlsdGVyVmFsdWUoKTtcclxuICAgICAgICAgICAgbGV0IHN0cmluZ0xlc3NvbnMgPSB0aGlzLmdldFN0cmluZ0xlc3NvbnMoZmlsdGVyKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTGVzc29uRG9tKHN0cmluZ0xlc3NvbnMpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgc3RyaW5nTGVzc29ucyA9IHRoaXMuZ2V0U3RyaW5nTGVzc29ucygpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJMZXNzb25Eb20oc3RyaW5nTGVzc29ucyk7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRTdHJpbmdMZXNzb25zKGZpbHRlciA9IGZhbHNlKSB7XHJcbiAgICAgICAgbGV0IGxlc3NvbnM7XHJcbiAgICAgICAgbGV0IHRlbXBsYXRlTGVzc29uID0gbmV3IHRlbXBsYXRlKCk7XHJcblxyXG4gICAgICAgIGlmICghZmlsdGVyKSB7XHJcbiAgICAgICAgICAgIGxlc3NvbnMgPSB0aGlzLmxlc3NvbnM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGVzc29ucyA9IHRoaXMuZmlsdGVyTGVzc29ucyh7XHJcbiAgICAgICAgICAgICAgICBsZXNzb25zOiB0aGlzLmxlc3NvbnMsXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IGZpbHRlclxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlTGVzc29uLmNvbXBpbGVMZXNzb25zKGxlc3NvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlckxlc3NvbkRvbSAoc3RyaW5nTGVzc29ucykge1xyXG4gICAgICAgIGxldCB0Ym9keSA9IHRoaXMudGFibGUucXVlcnlTZWxlY3RvcigndGJvZHknKTtcclxuXHJcbiAgICAgICAgdGJvZHkuaW5uZXJIVE1MID0gc3RyaW5nTGVzc29ucztcclxuICAgIH1cclxuXHJcbiAgICBmaWx0ZXJMZXNzb25zKG9wdGlvbnMpIHtcclxuICAgICAgICBsZXQgYXJMZXNzb25zID0gb3B0aW9ucy5sZXNzb25zO1xyXG4gICAgICAgIGxldCBmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJMZXNzb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBsZXNzb24gPSBhckxlc3NvbnNbaV07XHJcbiAgICAgICAgICAgIGxldCBpc01hdGNoID0gdGhpcy5pc01hdGNoaW5nTGVzc29uKGZpbHRlciwgbGVzc29uKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChsZXNzb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGlzTWF0Y2hpbmdMZXNzb24gKGZpbHRlciwgbGVzc29uKSB7XHJcbiAgICAgICAgbGV0IGFyRmlsdGVyID0gT2JqZWN0LmtleXMoZmlsdGVyKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhckZpbHRlci5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBsZXQga2V5RmlsdGVyID0gYXJGaWx0ZXJbal07XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZUxlc3NvbiA9IGxlc3NvbltrZXlGaWx0ZXJdO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWVGaWx0ZXIgPSBmaWx0ZXJba2V5RmlsdGVyXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWVMZXNzb24gPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHZhbHVlRmlsdGVyID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNNYXRjaGluZyh2YWx1ZUxlc3Nvblt2YWx1ZUZpbHRlclsna2V5J11dLCB2YWx1ZUZpbHRlclsndmFsdWUnXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZUxlc3NvbikpIHtcclxuICAgICAgICAgICAgICAgIGxldCBpc01hdGNoID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZUxlc3Nvbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBpdGVtID0gdmFsdWVMZXNzb25baV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTWF0Y2hpbmcoaXRlbSwgdmFsdWVGaWx0ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTWF0Y2ggPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICghaXNNYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNNYXRjaGluZyh2YWx1ZUxlc3NvbiwgdmFsdWVGaWx0ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpc01hdGNoaW5nICh2YWwxLCB2YWwyKSB7XHJcbiAgICAgICAgdmFsMSA9IHZhbDEudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICB2YWwyID0gdmFsMi50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdmFsMS5pbmRleE9mKHZhbDIpID09IC0xID8gZmFsc2UgOiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlzRW1wdHlJbnB1dHMgKGFyVmFsdWUpIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyVmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzRW1wdHkoYXJWYWx1ZVtpXSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaXNFbXB0eSAodmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUgPyBmYWxzZSA6IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RmlsdGVyVmFsdWUgKCkge1xyXG4gICAgICAgIGxldCByZXN1bHQgPSB7fTtcclxuICAgICAgICBsZXQgc2Nob29sVmFsdWUgPSB0aGlzLmlucHV0U2Nob29sLnZhbHVlO1xyXG4gICAgICAgIGxldCBsZWN0b3JWYWx1ZSA9IHRoaXMuaW5wdXRMZWN0b3IudmFsdWU7XHJcbiAgICAgICAgbGV0IGRhdGVWYWx1ZSA9IHRoaXMuaW5wdXREYXRlLnZhbHVlO1xyXG4gICAgICAgIGxldCBhclZhbHVlID0gW3NjaG9vbFZhbHVlLCBsZWN0b3JWYWx1ZSwgZGF0ZVZhbHVlXTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNFbXB0eUlucHV0cyhhclZhbHVlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHNjaG9vbFZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5zY2hvb2wgPSBzY2hvb2xWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChsZWN0b3JWYWx1ZSkge1xyXG4gICAgICAgICAgICByZXN1bHQubGVjdG9yID0ge1xyXG4gICAgICAgICAgICAgICAga2V5OiAnbmFtZScsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogbGVjdG9yVmFsdWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRhdGVWYWx1ZSkge1xyXG4gICAgICAgICAgICByZXN1bHQuZGF0ZSA9IGRhdGVWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBQb3B1cHtcclxuICAgIGNvbnN0cnVjdG9yKCl7XHJcbiAgICAgICAgdGhpcy5pbml0V2luZG93KCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdFdpbmRvdygpIHtcclxuICAgICAgICBsZXQgd2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBvcHVwX19jbnQnKTtcclxuXHJcbiAgICAgICAgaWYgKCF3aW5kb3cpIHtcclxuICAgICAgICAgICAgd2luZG93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5jbGFzc0xpc3QuYWRkKCdwb3B1cF9fY250Jyk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cInBvcHVwX19jbnQtLXdpbmRvd1wiPjwvZGl2PmA7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQod2luZG93KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMud2luZG93ID0gd2luZG93O1xyXG4gICAgfVxyXG5cclxuICAgIG9wZW4oY29udGVudCkge1xyXG4gICAgICAgIHRoaXMud2luZG93LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMuc2V0Q29udGVudChjb250ZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBldmVudENsb3NlKG5vZGVTdHJpbmcpIHtcclxuICAgICAgICBsZXQgbm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iobm9kZVN0cmluZyk7XHJcblxyXG4gICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgY2xvc2UoKSB7XHJcbiAgICAgICAgdGhpcy53aW5kb3cuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q29udGVudChjb250ZW50KSB7XHJcbiAgICAgICAgbGV0IGNvbnRhaW5lciA9IHRoaXMud2luZG93LnF1ZXJ5U2VsZWN0b3IoJy5wb3B1cF9fY250LS13aW5kb3cnKTtcclxuXHJcbiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGNvbnRlbnQ7XHJcbiAgICB9XHJcbn0gIiwiaW1wb3J0IHRlbXBsYXRlQ2xhc3MgZnJvbSBcIi4vdGVtcGxhdGUvdGVtcGxhdGVcIjtcclxuaW1wb3J0IHBvcHVwQ2xhc3MgZnJvbSBcIi4vX3BvcHVwXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUYWJsZSB7XHJcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy50YWJsZSA9IG9wdGlvbnMudGFibGU7XHJcbiAgICAgICAgdGhpcy5sZWN0b3JzID0ge307XHJcbiAgICAgICAgdGhpcy5tYXRlcmlhbCA9IHt9O1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IG9wdGlvbnMuZGF0YTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0RXZlbnQoKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0RXZlbnQoKSB7XHJcbiAgICAgICAgbGV0IHRhYmxlID0gdGhpcy50YWJsZTtcclxuXHJcbiAgICAgICAgdGFibGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcclxuICAgICAgICAgICAgbGV0IHBvcHVwID0gbmV3IHBvcHVwQ2xhc3MoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0YXJnZXQudGFnTmFtZSAhPT0gXCJBXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2xlc3Nvbl9fbGVjdG9yJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBsZWN0b3JzID0gdGhpcy5nZXRMZWN0b3JzKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQgPSB0YXJnZXQuZGF0YXNldC5pZDtcclxuICAgICAgICAgICAgICAgIGxldCBsZWN0b3IgPSBuZXcgdGVtcGxhdGVDbGFzcyhsZWN0b3JzW2lkXSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29udGVudCA9IGxlY3Rvci5nZXRIVE1MTGVjdG9yKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIHBvcHVwLm9wZW4oY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICBwb3B1cC5ldmVudENsb3NlKCcucF9jbG9zZScpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdsZXNzb25fX21hdGVyaWFsJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBtYXRlcmlhbHMgPSB0aGlzLmdldE1hdGVyaWFsKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQgPSB0YXJnZXQuZGF0YXNldC5pZDtcclxuICAgICAgICAgICAgICAgIGxldCBtYXRlcmlhbCA9IG5ldyB0ZW1wbGF0ZUNsYXNzKG1hdGVyaWFsc1tpZF0pO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBtYXRlcmlhbC5nZXRIVE1MTWF0ZXJpYWwoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgcG9wdXAub3Blbihjb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHBvcHVwLmV2ZW50Q2xvc2UoJy5wX2Nsb3NlJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TGVjdG9ycygpIHtcclxuICAgICAgICBsZXQgZGF0YSA9IHRoaXMuZGF0YTtcclxuICAgICAgICBsZXQgbGVjdG9ycyA9IHRoaXMubGVjdG9ycztcclxuICAgICAgICBcclxuICAgICAgICBpZiAoT2JqZWN0LmtleXMobGVjdG9ycykubGVuZ3RoIDwgMSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBlbGVtZW50ID0gZGF0YVtpXS5sZWN0b3I7XHJcblxyXG4gICAgICAgICAgICAgICAgbGVjdG9yc1tgJHtlbGVtZW50LmlkfWBdID0gZWxlbWVudDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbGVjdG9ycztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBsZWN0b3JzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1hdGVyaWFsKCkge1xyXG4gICAgICAgIGxldCBkYXRhID0gdGhpcy5kYXRhO1xyXG4gICAgICAgIGxldCBtYXRlcmlhbCA9IHRoaXMubWF0ZXJpYWw7XHJcblxyXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhtYXRlcmlhbCkubGVuZ3RoIDwgMSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBlbGVtZW50ID0gZGF0YVtpXS5tYXRlcmlhbDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1hdGVyaWFsW2Ake2VsZW1lbnQuaWR9YF0gPSBlbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBtYXRlcmlhbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtYXRlcmlhbDtcclxuICAgIH1cclxufSIsImxldCBsZXNzb25zID0gW1xyXG4gICAge1xyXG4gICAgICAgIG51bWJlcjogMSxcclxuICAgICAgICBzY2hvb2w6ICfQoNCw0LfRgNCw0LHQvtGC0LrQsCDQuNC90YLQtdGA0YTQtdC50YHQvtCyJyxcclxuICAgICAgICBsZWN0dXJlOiAn0JDQtNCw0L/RgtC40LLQvdCw0Y8g0LLRkdGA0YHRgtC60LAnLFxyXG4gICAgICAgIGxlY3Rvcjoge1xyXG4gICAgICAgICAgICBpZDogMSxcclxuICAgICAgICAgICAgbmFtZTogJ9CU0LzQuNGC0YDQuNC5INCU0YPRiNC60LjQvScsXHJcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vYXZhdGFycy5tZHMueWFuZGV4Lm5ldC9nZXQteWFldmVudHMvOTUwNDMvMDkxNGFjNDJiNmRjMTFlNjg3ZWYwMDI1OTBjNjJhNWMvYmlnJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICfQmtCw0L3QtNC40LTQsNGCINGC0LXRhdC90LjRh9C10YHQutC40YUg0L3QsNGD0LosINC90LDRg9GH0L3Ri9C5INGB0L7RgtGA0YPQtNC90LjQuiDQmNCf0KMg0KDQkNCdINGBIDIwMDgg0L/QviAyMDEzLiDQn9GA0LjRiNGR0Lsg0LIg0K/QvdC00LXQutGBLtCa0LDRgNGC0LjQvdC60Lgg0LIgMjAxNCDQs9C+0LTRgywg0L7RgtCy0LXRh9Cw0Lsg0LfQsCDQvNC+0LHQuNC70YzQvdGD0Y4g0LLQtdGA0YHQuNGOINC4INGA0L7RgdGCINC/0YDQvtC40LfQstC+0LTQuNGC0LXQu9GM0L3QvtGB0YLQuCDRgdC10YDQstC40YHQsC4g0JIgMjAxNiDQv9C10YDQtdGI0ZHQuyDQsiBZYW5kZXggRGF0YSBGYWN0b3J5LCDQs9C00LUg0YDQsNC30YDQsNCx0LDRgtGL0LLQsNC10YIg0LjQvdGC0LXRgNGE0LXQudGB0Ysg0Lgg0LTQuNC30LDQudC9INCy0LXQsS3Qv9GA0LjQu9C+0LbQtdC90LjQuSDQtNC70Y8gQjJCLidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRhdGU6ICcwMS4wNy4yMDE3JyxcclxuICAgICAgICBsb2NhdGlvbjogJ9CQ0YPQtNC40YLQvtGA0LjRjyAxJyxcclxuICAgICAgICBtYXRlcmlhbDoge1xyXG4gICAgICAgICAgICBpZDogMSxcclxuICAgICAgICAgICAgbmFtZTogJ9Cc0LDRgtC10YDQuNCw0LvRiycsXHJcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vZXZlbnRzLnlhbmRleC5ydS9saWIvdGFsa3MvNDE2Mi8nXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBudW1iZXI6IDIsXHJcbiAgICAgICAgc2Nob29sOiAn0KDQsNC30YDQsNCx0L7RgtC60LAg0LjQvdGC0LXRgNGE0LXQudGB0L7QsicsXHJcbiAgICAgICAgbGVjdHVyZTogJ9Cg0LDQsdC+0YLQsCDRgSDRgdC10L3RgdC+0YDQvdGL0Lwg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GM0YHQutC40Lwg0LLQstC+0LTQvtC8JyxcclxuICAgICAgICBsZWN0b3I6IHtcclxuICAgICAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgICAgIG5hbWU6ICfQlNC80LjRgtGA0LjQuSDQlNGD0YjQutC40L0nLFxyXG4gICAgICAgICAgICBzcmM6ICdodHRwczovL2F2YXRhcnMubWRzLnlhbmRleC5uZXQvZ2V0LXlhZXZlbnRzLzk1MDQzLzA5MTRhYzQyYjZkYzExZTY4N2VmMDAyNTkwYzYyYTVjL2JpZycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn0JrQsNC90LTQuNC00LDRgiDRgtC10YXQvdC40YfQtdGB0LrQuNGFINC90LDRg9C6LCDQvdCw0YPRh9C90YvQuSDRgdC+0YLRgNGD0LTQvdC40Log0JjQn9CjINCg0JDQnSDRgSAyMDA4INC/0L4gMjAxMy4g0J/RgNC40YjRkdC7INCyINCv0L3QtNC10LrRgS7QmtCw0YDRgtC40L3QutC4INCyIDIwMTQg0LPQvtC00YMsINC+0YLQstC10YfQsNC7INC30LAg0LzQvtCx0LjQu9GM0L3Rg9GOINCy0LXRgNGB0LjRjiDQuCDRgNC+0YHRgiDQv9GA0L7QuNC30LLQvtC00LjRgtC10LvRjNC90L7RgdGC0Lgg0YHQtdGA0LLQuNGB0LAuINCSIDIwMTYg0L/QtdGA0LXRiNGR0Lsg0LIgWWFuZGV4IERhdGEgRmFjdG9yeSwg0LPQtNC1INGA0LDQt9GA0LDQsdCw0YLRi9Cy0LDQtdGCINC40L3RgtC10YDRhNC10LnRgdGLINC4INC00LjQt9Cw0LnQvSDQstC10LEt0L/RgNC40LvQvtC20LXQvdC40Lkg0LTQu9GPIEIyQi4nXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkYXRlOiAnMDIuMDcuMjAxNycsXHJcbiAgICAgICAgbG9jYXRpb246ICfQkNGD0LTQuNGC0L7RgNC40Y8gMScsXHJcbiAgICAgICAgbWF0ZXJpYWw6ICcnXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG51bWJlcjogMyxcclxuICAgICAgICBzY2hvb2w6ICfQoNCw0LfRgNCw0LHQvtGC0LrQsCDQuNC90YLQtdGA0YTQtdC50YHQvtCyJyxcclxuICAgICAgICBsZWN0dXJlOiAn0JzRg9C70YzRgtC40LzQtdC00LjQsDog0LLQvtC30LzQvtC20L3QvtGB0YLQuCDQsdGA0LDRg9C30LXRgNCwJyxcclxuICAgICAgICBsZWN0b3I6IHtcclxuICAgICAgICAgICAgaWQ6IDIsXHJcbiAgICAgICAgICAgIG5hbWU6ICfQnNCw0LrRgdC40Lwg0JLQsNGB0LjQu9GM0LXQsicsXHJcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vYXZhdGFycy5tZHMueWFuZGV4Lm5ldC9nZXQteWFldmVudHMvMTk0NDY0LzIxZTFkYWUyYjZkYzExZTY4N2VmMDAyNTkwYzYyYTVjL2JpZycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn0JLQviDRhNGA0L7QvdGC0LXQvdC0LdGA0LDQt9GA0LDQsdC+0YLQutC1INGBIDIwMDcg0LPQvtC00LAuINCU0L4gMjAxMy3Qs9C+LCDQutC+0LPQtNCwINC/0YDQuNGI0ZHQuyDQsiDQr9C90LTQtdC60YEsINGA0LDQsdC+0YLQsNC7INGC0LXRhdC90L7Qu9C+0LPQvtC8INCyINGB0YLRg9C00LjQuCDQm9C10LHQtdC00LXQstCwINC4INC00YDRg9Cz0LjRhSDQutC+0LzQv9Cw0L3QuNGP0YUuJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGF0ZTogJzAzLjA3LjIwMTcnLFxyXG4gICAgICAgIGxvY2F0aW9uOiAn0JDRg9C00LjRgtC+0YDQuNGPIDInLFxyXG4gICAgICAgIG1hdGVyaWFsOiAnJ1xyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBudW1iZXI6IDQsXHJcbiAgICAgICAgc2Nob29sOiAn0JzQvtCx0LjQu9GM0L3QsNGPINGA0LDQt9GA0LDQsdC+0YLQutCwJyxcclxuICAgICAgICBsZWN0dXJlOiAnSmF2YSBCbGl0eiAo0KfQsNGB0YLRjCAxKScsXHJcbiAgICAgICAgbGVjdG9yOiB7XHJcbiAgICAgICAgICAgIGlkOiAzLFxyXG4gICAgICAgICAgICBuYW1lOiAn0K3QtNGD0LDRgNC0INCc0LDRhtGD0LrQvtCyJyxcclxuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9hdmF0YXJzLm1kcy55YW5kZXgubmV0L2dldC15YWV2ZW50cy8xOTgzMDcvOWQ5YTg2NzJiNmRhMTFlNjg3ZWYwMDI1OTBjNjJhNWMvYmlnJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICfQoNCw0LfRgNCw0LHQsNGC0YvQstCw0Y4g0L/RgNC40LvQvtC20LXQvdC40Y8g0LTQu9GPIEFuZHJvaWQg0YEgMjAxMCDQs9C+0LTQsC4g0JIgMjAxNCDQtNC10LvQsNC7INCy0YvRgdC+0LrQvtC90LDQs9GA0YPQttC10L3QvdC+0LUg0YTQuNC90LDQvdGB0L7QstC+0LUg0L/RgNC40LvQvtC20LXQvdC40LUuINCi0L7Qs9C00LAg0LbQtSDQvdCw0YfQsNC7INC+0YHQstCw0LjQstCw0YLRjCDQkNCe0J8sINCy0L3QtdC00YDRj9GPINGP0LfRi9C6INCyINC/0YDQvtC00LDQutGI0L0uINCSIDIwMTUg0YDQsNC30YDQsNCx0LDRgtGL0LLQsNC7INC40L3RgdGC0YDRg9C80LXQvdGC0Ysg0LTQu9GPIEFuZHJvaWQgU3R1ZGlvLCDQv9C+0LfQstC+0LvRj9GO0YnQuNC1INC40YHQv9C+0LvRjNC30L7QstCw0YLRjCBhc3BlY3RKINCyINGB0LLQvtC40YUg0L/RgNC+0LXQutGC0LDRhS4g0JIg0K/QvdC00LXQutGB0LUg0LfQsNC90Y/RgiDQvdCwINC/0YDQvtC10LrRgtC1INCQ0LLRgtC+LtGA0YMuJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGF0ZTogJzAxLjA3LjIwMTcnLFxyXG4gICAgICAgIGxvY2F0aW9uOiAn0JDRg9C00LjRgtC+0YDQuNGPIDQnLFxyXG4gICAgICAgIG1hdGVyaWFsOiB7XHJcbiAgICAgICAgICAgIGlkOiAyLFxyXG4gICAgICAgICAgICBuYW1lOiAn0JzQsNGC0LXRgNC40LDQu9GLJyxcclxuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9ldmVudHMueWFuZGV4LnJ1L2xpYi90YWxrcy80MTYyLydcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG51bWJlcjogNSxcclxuICAgICAgICBzY2hvb2w6ICfQnNC+0LHQuNC70YzQvdCw0Y8g0YDQsNC30YDQsNCx0L7RgtC60LAnLFxyXG4gICAgICAgIGxlY3R1cmU6ICdHaXQgJiBXb3JrZmxvdycsXHJcbiAgICAgICAgbGVjdG9yOiB7XHJcbiAgICAgICAgICAgIGlkOiA0LFxyXG4gICAgICAgICAgICBuYW1lOiAn0JTQvNC40YLRgNC40Lkg0KHQutC70LDQtNC90L7QsicsXHJcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vYXZhdGFycy5tZHMueWFuZGV4Lm5ldC9nZXQteWFldmVudHMvMTk3NzUzLzA4YzYwNWVjYjZkYzExZTY4N2VmMDAyNTkwYzYyYTVjL2JpZycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn0J7QutC+0L3Rh9C40Lsg0YTQsNC60YPQu9GM0YLQtdGCINCY0KIg0JzQvtGB0LrQvtCy0YHQutC+0LPQviDQotC10YXQvdC40YfQtdGB0LrQvtCz0L4g0KPQvdC40LLQtdGA0YHQuNGC0LXRgtCwLiDQkiDQr9C90LTQtdC60YHQtSDRgSAyMDE1INCz0L7QtNCwLCDRgNCw0LfRgNCw0LHQsNGC0YvQstCw0LXRgiDQv9GA0LjQu9C+0LbQtdC90LjQtSBBdXRvLnJ1INC00LvRjyBBbmRyb2lkLidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRhdGU6ICcwMi4wNy4yMDE3JyxcclxuICAgICAgICBsb2NhdGlvbjogJ9CQ0YPQtNC40YLQvtGA0LjRjyA0JyxcclxuICAgICAgICBtYXRlcmlhbDogJydcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbnVtYmVyOiA2LFxyXG4gICAgICAgIHNjaG9vbDogJ9Cc0L7QsdC40LvRjNC90LDRjyDRgNCw0LfRgNCw0LHQvtGC0LrQsCcsXHJcbiAgICAgICAgbGVjdHVyZTogJ0phdmEgQmxpdHogKNCn0LDRgdGC0YwgMiknLFxyXG4gICAgICAgIGxlY3Rvcjoge1xyXG4gICAgICAgICAgICBpZDogMyxcclxuICAgICAgICAgICAgbmFtZTogJ9Ct0LTRg9Cw0YDQtCDQnNCw0YbRg9C60L7QsicsXHJcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vYXZhdGFycy5tZHMueWFuZGV4Lm5ldC9nZXQteWFldmVudHMvMTk4MzA3LzlkOWE4NjcyYjZkYTExZTY4N2VmMDAyNTkwYzYyYTVjL2JpZycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn0KDQsNC30YDQsNCx0LDRgtGL0LLQsNGOINC/0YDQuNC70L7QttC10L3QuNGPINC00LvRjyBBbmRyb2lkINGBIDIwMTAg0LPQvtC00LAuINCSIDIwMTQg0LTQtdC70LDQuyDQstGL0YHQvtC60L7QvdCw0LPRgNGD0LbQtdC90L3QvtC1INGE0LjQvdCw0L3RgdC+0LLQvtC1INC/0YDQuNC70L7QttC10L3QuNC1LiDQotC+0LPQtNCwINC20LUg0L3QsNGH0LDQuyDQvtGB0LLQsNC40LLQsNGC0Ywg0JDQntCfLCDQstC90LXQtNGA0Y/RjyDRj9C30YvQuiDQsiDQv9GA0L7QtNCw0LrRiNC9LiDQkiAyMDE1INGA0LDQt9GA0LDQsdCw0YLRi9Cy0LDQuyDQuNC90YHRgtGA0YPQvNC10L3RgtGLINC00LvRjyBBbmRyb2lkIFN0dWRpbywg0L/QvtC30LLQvtC70Y/RjtGJ0LjQtSDQuNGB0L/QvtC70YzQt9C+0LLQsNGC0YwgYXNwZWN0SiDQsiDRgdCy0L7QuNGFINC/0YDQvtC10LrRgtCw0YUuINCSINCv0L3QtNC10LrRgdC1INC30LDQvdGP0YIg0L3QsCDQv9GA0L7QtdC60YLQtSDQkNCy0YLQvi7RgNGDLidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRhdGU6ICcwMy4wNy4yMDE3JyxcclxuICAgICAgICBsb2NhdGlvbjogJ9CQ0YPQtNC40YLQvtGA0LjRjyA0JyxcclxuICAgICAgICBtYXRlcmlhbDogJydcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbnVtYmVyOiA3LFxyXG4gICAgICAgIHNjaG9vbDogJ9Cc0L7QsdC40LvRjNC90YvQuSDQtNC40LfQsNC50L0nLFxyXG4gICAgICAgIGxlY3R1cmU6ICfQmNC00LXRjywg0LjRgdGB0LvQtdC00L7QstCw0L3QuNC1LCDQutC+0L3RhtC10L/RgiAo0KfQsNGB0YLRjCAxKScsXHJcbiAgICAgICAgbGVjdG9yOiB7XHJcbiAgICAgICAgICAgIGlkOiA1LFxyXG4gICAgICAgICAgICBuYW1lOiAn0JDQvdGC0L7QvSDQotC10L0nLFxyXG4gICAgICAgICAgICBzcmM6ICdodHRwczovL2F2YXRhcnMubWRzLnlhbmRleC5uZXQvZ2V0LXlhZXZlbnRzLzIwNDI2OC8wN2JiNWY4YWI2ZGMxMWU2ODdlZjAwMjU5MGM2MmE1Yy9iaWcnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ9CSINCv0L3QtNC10LrRgdC1INGBIDIwMTQg0LPQvtC00LAuINCS0LXQtNGD0YnQuNC5INC00LjQt9Cw0LnQvdC10YAg0L/RgNC+0LTRg9C60YLQsCDQsiDRgdC10YDQstC40YHQsNGFINCf0LXRgNC10LLQvtC00YfQuNC6LCDQoNCw0YHQv9C40YHQsNC90LjRjyDQuCDQktC40LTQtdC+LidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRhdGU6ICcwMS4wNy4yMDE3JyxcclxuICAgICAgICBsb2NhdGlvbjogJ9CQ0YPQtNC40YLQvtGA0LjRjyA3JyxcclxuICAgICAgICBtYXRlcmlhbDoge1xyXG4gICAgICAgICAgICBpZDogMyxcclxuICAgICAgICAgICAgbmFtZTogJ9Cc0LDRgtC10YDQuNCw0LvRiycsXHJcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vZXZlbnRzLnlhbmRleC5ydS9saWIvdGFsa3MvNDE2Mi8nXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBudW1iZXI6IDgsXHJcbiAgICAgICAgc2Nob29sOiAn0JzQvtCx0LjQu9GM0L3Ri9C5INC00LjQt9Cw0LnQvScsXHJcbiAgICAgICAgbGVjdHVyZTogJ9CY0LTQtdGPLCDQuNGB0YHQu9C10LTQvtCy0LDQvdC40LUsINC60L7QvdGG0LXQv9GCICjQp9Cw0YHRgtGMIDIpJyxcclxuICAgICAgICBsZWN0b3I6IHtcclxuICAgICAgICAgICAgaWQ6IDUsXHJcbiAgICAgICAgICAgIG5hbWU6ICfQkNC90YLQvtC9INCi0LXQvScsXHJcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vYXZhdGFycy5tZHMueWFuZGV4Lm5ldC9nZXQteWFldmVudHMvMjA0MjY4LzA3YmI1ZjhhYjZkYzExZTY4N2VmMDAyNTkwYzYyYTVjL2JpZycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn0JIg0K/QvdC00LXQutGB0LUg0YEgMjAxNCDQs9C+0LTQsC4g0JLQtdC00YPRidC40Lkg0LTQuNC30LDQudC90LXRgCDQv9GA0L7QtNGD0LrRgtCwINCyINGB0LXRgNCy0LjRgdCw0YUg0J/QtdGA0LXQstC+0LTRh9C40LosINCg0LDRgdC/0LjRgdCw0L3QuNGPINC4INCS0LjQtNC10L4uJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGF0ZTogJzAyLjA3LjIwMTcnLFxyXG4gICAgICAgIGxvY2F0aW9uOiAn0JDRg9C00LjRgtC+0YDQuNGPIDcnLFxyXG4gICAgICAgIG1hdGVyaWFsOiAnJ1xyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBudW1iZXI6IDksXHJcbiAgICAgICAgc2Nob29sOiAn0JzQvtCx0LjQu9GM0L3Ri9C5INC00LjQt9Cw0LnQvScsXHJcbiAgICAgICAgbGVjdHVyZTogJ9Ce0YHQvtCx0LXQvdC90L7RgdGC0Lgg0L/RgNC+0LXQutGC0LjRgNC+0LLQsNC90LjRjyDQvNC+0LHQuNC70YzQvdGL0YUg0LjQvdGC0LXRgNGE0LXQudGB0L7QsicsXHJcbiAgICAgICAgbGVjdG9yOiB7XHJcbiAgICAgICAgICAgIGlkOiA2LFxyXG4gICAgICAgICAgICBuYW1lOiAn0JLQsNGB0Y7QvdC40L0g0J3QuNC60L7Qu9Cw0LknLFxyXG4gICAgICAgICAgICBzcmM6ICdodHRwczovL2F2YXRhcnMubWRzLnlhbmRleC5uZXQvZ2V0LXlhZXZlbnRzLzE5NDQ2NC8xYzU1YjhkMmI2ZGMxMWU2ODdlZjAwMjU5MGM2MmE1Yy9iaWcnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ9Cf0YDQuNGI0ZHQuyDQsiDQr9C90LTQtdC60YEg0LIgMjAxNCDQs9C+0LTRgy4g0JTQuNC30LDQudC90LXRgCDQv9GA0L7QtNGD0LrRgtCwINCyINC80YPQt9GL0LrQsNC70YzQvdGL0YUg0YHQtdGA0LLQuNGB0LDRhSDQutC+0LzQv9Cw0L3QuNC4LCDRg9GH0LDRgdGC0L3QuNC6INC60L7QvNCw0L3QtNGLINGA0LDQt9GA0LDQsdC+0YLQutC4INCv0L3QtNC10LrRgS7QoNCw0LTQuNC+LidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRhdGU6ICcwMy4wNy4yMDE3JyxcclxuICAgICAgICBsb2NhdGlvbjogJ9CQ0YPQtNC40YLQvtGA0LjRjyA4JyxcclxuICAgICAgICBtYXRlcmlhbDogJydcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbnVtYmVyOiAxMCxcclxuICAgICAgICBzY2hvb2w6IFsn0KDQsNC30YDQsNCx0L7RgtC60LAg0LjQvdGC0LXRgNGE0LXQudGB0L7QsicsICfQnNC+0LHQuNC70YzQvdCw0Y8g0YDQsNC30YDQsNCx0L7RgtC60LAnLCAn0JzQvtCx0LjQu9GM0L3Ri9C5INC00LjQt9Cw0LnQvSddLFxyXG4gICAgICAgIGxlY3R1cmU6ICfQmNC00LXRjywg0LjRgdGB0LvQtdC00L7QstCw0L3QuNC1LCDQutC+0L3RhtC10L/RgiAo0KfQsNGB0YLRjCAyKScsXHJcbiAgICAgICAgbGVjdG9yOiB7XHJcbiAgICAgICAgICAgIGlkOiA1LFxyXG4gICAgICAgICAgICBuYW1lOiAn0JDQvdGC0L7QvSDQotC10L0nLFxyXG4gICAgICAgICAgICBzcmM6ICdodHRwczovL2F2YXRhcnMubWRzLnlhbmRleC5uZXQvZ2V0LXlhZXZlbnRzLzIwNDI2OC8wN2JiNWY4YWI2ZGMxMWU2ODdlZjAwMjU5MGM2MmE1Yy9iaWcnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ9CSINCv0L3QtNC10LrRgdC1INGBIDIwMTQg0LPQvtC00LAuINCS0LXQtNGD0YnQuNC5INC00LjQt9Cw0LnQvdC10YAg0L/RgNC+0LTRg9C60YLQsCDQsiDRgdC10YDQstC40YHQsNGFINCf0LXRgNC10LLQvtC00YfQuNC6LCDQoNCw0YHQv9C40YHQsNC90LjRjyDQuCDQktC40LTQtdC+LidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRhdGU6ICcwNC4wNy4yMDE3JyxcclxuICAgICAgICBsb2NhdGlvbjogJ9CQ0YPQtNC40YLQvtGA0LjRjyA3JyxcclxuICAgICAgICBtYXRlcmlhbDogJydcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbnVtYmVyOiAxMSxcclxuICAgICAgICBzY2hvb2w6IFsn0KDQsNC30YDQsNCx0L7RgtC60LAg0LjQvdGC0LXRgNGE0LXQudGB0L7QsicsICfQnNC+0LHQuNC70YzQvdCw0Y8g0YDQsNC30YDQsNCx0L7RgtC60LAnLCAn0JzQvtCx0LjQu9GM0L3Ri9C5INC00LjQt9Cw0LnQvSddLFxyXG4gICAgICAgIGxlY3R1cmU6ICfQntGB0L7QsdC10L3QvdC+0YHRgtC4INC/0YDQvtC10LrRgtC40YDQvtCy0LDQvdC40Y8g0LzQvtCx0LjQu9GM0L3Ri9GFINC40L3RgtC10YDRhNC10LnRgdC+0LInLFxyXG4gICAgICAgIGxlY3Rvcjoge1xyXG4gICAgICAgICAgICBpZDogNixcclxuICAgICAgICAgICAgbmFtZTogJ9CS0LDRgdGO0L3QuNC9INCd0LjQutC+0LvQsNC5JyxcclxuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9hdmF0YXJzLm1kcy55YW5kZXgubmV0L2dldC15YWV2ZW50cy8xOTQ0NjQvMWM1NWI4ZDJiNmRjMTFlNjg3ZWYwMDI1OTBjNjJhNWMvYmlnJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICfQn9GA0LjRiNGR0Lsg0LIg0K/QvdC00LXQutGBINCyIDIwMTQg0LPQvtC00YMuINCU0LjQt9Cw0LnQvdC10YAg0L/RgNC+0LTRg9C60YLQsCDQsiDQvNGD0LfRi9C60LDQu9GM0L3Ri9GFINGB0LXRgNCy0LjRgdCw0YUg0LrQvtC80L/QsNC90LjQuCwg0YPRh9Cw0YHRgtC90LjQuiDQutC+0LzQsNC90LTRiyDRgNCw0LfRgNCw0LHQvtGC0LrQuCDQr9C90LTQtdC60YEu0KDQsNC00LjQvi4nXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkYXRlOiAnMDUuMDcuMjAxNycsXHJcbiAgICAgICAgbG9jYXRpb246ICfQkNGD0LTQuNGC0L7RgNC40Y8gOCcsXHJcbiAgICAgICAgbWF0ZXJpYWw6ICcnXHJcbiAgICB9XHJcbl07XHJcblxyXG5leHBvcnQge1xyXG4gICAgbGVzc29uc1xyXG59O1xyXG5cclxuXHJcbiIsImltcG9ydCB7IGxlc3NvbnMgfSBmcm9tICcuL2RhdGEvX2xlc3Nvbl9kYXRhJztcclxuaW1wb3J0IGZpbHRlckNsYXNzIGZyb20gJy4vX2ZpbHRlcic7XHJcbmltcG9ydCB0YWJsZSBmcm9tICcuL190YWJsZSc7XHJcblxyXG5sZXQgZmlsdGVyQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZpbHRlcicpO1xyXG5sZXQgdGFibGVDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudGFibGUnKTtcclxubGV0IGZpbHRlciA9IG5ldyBmaWx0ZXJDbGFzcyh7XHJcbiAgICBsZXNzb25zOiBsZXNzb25zLFxyXG4gICAgZmlsdGVyOiBmaWx0ZXJDb250YWluZXIsXHJcbiAgICB0YWJsZTogdGFibGVDb250YWluZXJcclxufSk7XHJcblxyXG5uZXcgdGFibGUoe1xyXG4gICAgdGFibGU6IHRhYmxlQ29udGFpbmVyLFxyXG4gICAgZGF0YTogbGVzc29uc1xyXG59KTtcclxuIiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGVtcGxhdGUge1xyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbXBpbGVMZXNzb25zIChvYmplY3RzKSB7XHJcbiAgICAgICAgdGhpcy5jYWNoZUNsZWFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmplY3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FjaGUgPSB0aGlzLmNvbXBpbGVMZXNzb24ob2JqZWN0c1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbXBpbGVMZXNzb24ob2JqZWN0KXtcclxuICAgICAgICBsZXQgc2NoZW1hID0gdGhpcy5nZXRTY2hlbWFGaWVsZHNMZXNzb24oKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGBcclxuICAgICAgICAgICAgPHRyICR7b2JqZWN0Lm1hdGVyaWFsID8gJ2NsYXNzPVwibGVjdHVyZV9fZW5kZWRcIicgOiAnJ30+XHJcbiAgICAgICAgICAgICAgICA8dGQgZGF0YS1sYWJlbCA9IFwiJHtzY2hlbWEubnVtYmVyfVwiPjxzcGFuPiR7b2JqZWN0Lm51bWJlcn08L3NwYW4+PC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsID0gXCIke3NjaGVtYS5zY2hvb2x9XCI+PHNwYW4+JHtvYmplY3Quc2Nob29sfTwvc3Bhbj48L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGRhdGEtbGFiZWwgPSBcIiR7c2NoZW1hLmxlY3R1cmV9XCI+PHNwYW4+JHtvYmplY3QubGVjdHVyZX08L3NwYW4+PC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsID0gXCIke3NjaGVtYS5sZWN0b3J9XCI+PHNwYW4+PGEgaHJlZj1cIiR7b2JqZWN0LmxlY3Rvci5zcmN9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgY2xhc3M9XCJsZXNzb25fX2xlY3RvclwiIGRhdGEtaWQ9XCIke29iamVjdC5sZWN0b3IuaWR9XCI+JHtvYmplY3QubGVjdG9yLm5hbWV9PC9hPjwvc3Bhbj48L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGRhdGEtbGFiZWwgPSBcIiR7c2NoZW1hLmRhdGV9XCI+PHNwYW4+JHtvYmplY3QuZGF0ZX08L3NwYW4+PC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsID0gXCIke3NjaGVtYS5sb2NhdGlvbn1cIj48c3Bhbj4ke29iamVjdC5sb2NhdGlvbn08L3NwYW4+PC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsID0gXCIke3NjaGVtYS5tYXRlcmlhbH1cIj5cclxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj48YSBocmVmPVwiJHtvYmplY3QubWF0ZXJpYWwuc3JjID8gb2JqZWN0Lm1hdGVyaWFsLnNyYyA6ICcnfVwiIGNsYXNzPVwibGVzc29uX19tYXRlcmlhbFwiIHRhcmdldD1cIl9ibGFua1wiIGRhdGEtaWQ9XCIke29iamVjdC5tYXRlcmlhbC5pZH1cIj4ke29iamVjdC5tYXRlcmlhbC5uYW1lID8gb2JqZWN0Lm1hdGVyaWFsLm5hbWUgOiAnJ308L2E+PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgPC90cj5gXHJcbiAgICB9XHJcblxyXG4gICAgc2V0IGNhY2hlKGxlc3Nvbikge1xyXG4gICAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5idWZmZXIgKyBsZXNzb247XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGNhY2hlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJ1ZmZlcjtcclxuICAgIH1cclxuXHJcbiAgICBjYWNoZUNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMuYnVmZmVyID0gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0U2NoZW1hRmllbGRzTGVzc29uKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG51bWJlcjogJ+KElicsXHJcbiAgICAgICAgICAgIHNjaG9vbDogJ9Co0LrQvtC70LAnLFxyXG4gICAgICAgICAgICBsZWN0dXJlOiAn0KLQtdC80LAg0LvQtdC60YbQuNC4JyxcclxuICAgICAgICAgICAgbGVjdG9yOiAn0JjQvNGPINC70LXQutGC0L7RgNCwJyxcclxuICAgICAgICAgICAgZGF0ZTogJ9CU0LDRgtCwJyxcclxuICAgICAgICAgICAgbG9jYXRpb246ICfQnNC10YHRgtC+INC/0YDQvtCy0LXQtNC10L3QuNGPJyxcclxuICAgICAgICAgICAgbWF0ZXJpYWw6ICfQnNCw0YLQtdGA0LjQsNC70YsnXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGVtcGxhdGUge1xyXG4gICAgY29uc3RydWN0b3IodGVtcGxhdGUpe1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRIVE1MTGVjdG9yICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21waWxlTGVjdG9yKHRoaXMudGVtcGxhdGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbXBpbGVMZWN0b3IobGVjdG9yKXtcclxuICAgICAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJsZWN0b3JfX3BvcHVwXCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJsZWN0b3JfX3BvcHVwLW5hbWVcIj4ke2xlY3Rvci5uYW1lfTwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGVjdG9yX19wb3B1cC1pbWdcIj5cclxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHtsZWN0b3Iuc3JjfVwiIGFsdD1cIlwiPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxlY3Rvcl9fcG9wdXAtdGV4dFwiPiR7bGVjdG9yLmRlc2NyaXB0aW9ufTwvZGl2PlxyXG4gICAgICAgICAgICA8YSBocmVmPVwiXCIgY2xhc3M9XCJwX2Nsb3NlXCI+eDwvYT5cclxuICAgICAgICAgICAgPC9kaXY+YDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRIVE1MTWF0ZXJpYWwgKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBpbGVNYXRlcmlhbCh0aGlzLnRlbXBsYXRlKTtcclxuICAgIH1cclxuXHJcbiAgICBjb21waWxlTWF0ZXJpYWwobWF0ZXJpYWwpe1xyXG4gICAgICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImxlY3Rvcl9fcG9wdXBcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxlY3Rvcl9fcG9wdXAtbmFtZVwiPiR7bWF0ZXJpYWwubmFtZX08L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxlY3Rvcl9fcG9wdXAtaW1nXCI+XHJcbiAgICAgICAgICAgICAgICA8YSBocmVmPVwiJHttYXRlcmlhbC5zcmN9XCIgYWx0PVwiXCIgdGFyZ2V0PVwiX2JsYW5rXCI+XHJcbiAgICAgICAgICAgICAgICAgICAg0J/QtdGA0LXQudGC0Lgg0Log0L/RgNC+0YHQvNC+0YLRgNGDINC80LDRgtC10YDQuNCw0LvQvtCyXHJcbiAgICAgICAgICAgICAgICA8L2E+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8YSBocmVmPVwiXCIgY2xhc3M9XCJwX2Nsb3NlXCI+eDwvYT5cclxuICAgICAgICAgICAgPC9kaXY+YDtcclxuICAgIH1cclxufSJdfQ==

//# sourceMappingURL=index.js.map
