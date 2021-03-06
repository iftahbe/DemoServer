// /// <reference path="knockout.d.ts" />
// /// <reference path="knockout.mapping.d.ts" />
// /// <reference path="require.d.ts" />
var DemoViewModel = (function () {
    function DemoViewModel() {
        var _this = this;
        this.isHtml = ko.observable(false);
        this.htmlView = ko.observable("");
        this.htmlExpl = ko.observable("");
        this.csharpCode = ko.observable("");
        this.javaCode = ko.observable("");
        this.pythonCode = ko.observable("");
        this.currentDemo = ko.observable();
        this.optionsText = ko.observable();
        this.urlstring = ko.observable();
        this.isSimpleJson = ko.observable(false);
        this.columns = ko.observableArray([]);
        this.rows = ko.observableArray([]);
        this.inProgress = ko.observable(false);
        this.currentClientTime = ko.observable("N/A");
        this.currentServerTime = ko.observable("N/A");
        this.query = ko.observable("");
        this.presenter = new DemoViewModelPresenter();
        this.currentDemoCategory = ko.observable();
        this.demoCategories = ko.observableArray(['']);
        this.isDemoCategorySelected = ko.computed(function () {
            var category = _this.currentDemoCategory();
            return category;
        });
        this.availableDemos = ko.observableArray();
        this.currentDemos = ko.computed(function () {
            var category = _this.currentDemoCategory();
            return _.filter(_this.availableDemos(), function (demo) { return demo.ControllerName === category; });
        });
        this.currentDemoParameters = ko.observableArray();
        this.currentDemo.subscribe(function (value) {
            _this.reset();
            _this.setDemoParameters(value);
        });
        $.ajax("/Menu/Index", "GET").done(function (data) {
            var demos = data["Demos"];
            demos.forEach(function (demo) {
                if (_.indexOf(_this.demoCategories(), demo.ControllerName) === -1) {
                    _this.demoCategories.push(demo.ControllerName);
                }
                _this.availableDemos.push(demo);
            });
        }).fail(function () {
            _this.availableDemos.push("Failed to retreive demos");
        });
    }
    DemoViewModel.prototype.runDemo = function () {
        var _this = this;
        this.presenter.showResults();
        var currentDemo = this.currentDemo();
        var url = this.getDemoUrl();
        url += this.getQueryString();
        this.isHtml(false);
        this.isSimpleJson(false);
        this.inProgress(true);
        $.ajax(url, "GET")
            .done(function (data) {
            _this.inProgress(false);
            //console.log(data);
            var jsonObj = data;
            if (currentDemo.DemoOutputType === 'String') {
                _this.htmlView(data);
                _this.inProgress(false);
                _this.isHtml(true);
                return;
            }
            if (data instanceof Array === false) {
                jsonObj = [data];
            }
            _this.columns([]);
            _this.rows([]);
            var newColumns = [];
            var newRows = [];
            for (var i = 0; i < jsonObj.length; i++) {
                var item = jsonObj[i];
                var newItem = {};
                for (var key in item) {
                    if (i === 0)
                        newColumns.push(key);
                    if (typeof item[key] !== "object") {
                        newItem[key] = item[key];
                    }
                    else {
                        if (currentDemo.DemoOutputType === 'Flatten') {
                            for (var deeperKey in item[key]) {
                                if (i === 0)
                                    newColumns.push(deeperKey);
                                if (typeof item[key][deeperKey] !== "object")
                                    newItem[deeperKey] = item[key][deeperKey];
                                else
                                    newItem[deeperKey] = JSON.stringify(item[key][deeperKey]);
                            }
                        }
                        else {
                            newItem[key] = JSON.stringify(item[key]);
                        }
                    }
                }
                newRows.push(newItem);
            }
            _this.inProgress(false);
            _this.isSimpleJson(true);
            _this.columns(newColumns);
            _this.rows(newRows);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
            _this.htmlView('Error Status : ' + jqXHR.status + '<br>' + jqXHR.responseText);
            _this.inProgress(false);
            _this.isHtml(true);
        })
            .always(function (a, b, request) {
            var clientTime = request.getResponseHeader('Client-Time');
            var serverTime = request.getResponseHeader('Server-Time');
            var query = request.getResponseHeader('Query');
            if (clientTime) {
                var clientTimeAsNumber = parseFloat(clientTime);
                var clientTimeString = clientTimeAsNumber.toString();
                if (clientTimeAsNumber <= 0) {
                    clientTimeString = " time<0.01";
                }
                _this.currentClientTime(clientTimeString + " seconds");
            }
            else
                _this.currentClientTime("N/A");
            if (serverTime) {
                var serverTimeAsNumber = parseFloat(serverTime);
                var serverTimeString = serverTimeAsNumber.toString();
                if (serverTimeAsNumber <= 0) {
                    serverTimeString = " time<0.01";
                }
                _this.currentServerTime(serverTimeString + " seconds");
            }
            else
                _this.currentServerTime("N/A");
            if (query) {
                try {
                    _this.query(JSON.stringify(JSON.parse(query), null, 2));
                } catch (e) {
                    _this.query(e);
                } 
            }
            else
                _this.query("");
        });
    };
    DemoViewModel.prototype.getCode = function () {
        var _this = this;
        this.presenter.showCode();
        var demoUrl = this.getDemoUrl();
        $.ajax("/Menu/LoadData?url=" + demoUrl, "GET").done(function (data) {
            console.log(data);
            _this.htmlExpl(data.HtmlExp);
            _this.javaCode(data.JavaCode);
            _this.csharpCode(data.CsharpCode);
            _this.pythonCode(data.PythonCode);
            Prism.highlightAll();
        });
    };
    DemoViewModel.prototype.genUrl = function () {
        var url = window.location.href.replace(/\/$/, "") + this.getDemoUrl();
        url += this.getQueryString();
        this.urlstring(url);
    };
    DemoViewModel.prototype.getQueryString = function () {
        var queryString = '';
        var parameters = this.currentDemoParameters();
        var firstParameter = true;
        parameters.forEach(function (parameter) {
            var value = parameter.ParameterValue();
            if (value) {
                var parameterQueryString = parameter.ParameterName + "=" + value;
                if (firstParameter) {
                    firstParameter = false;
                    queryString += "?" + parameterQueryString;
                }
                else {
                    queryString += "&" + parameterQueryString;
                }
            }
        });
        return queryString;
    };
    DemoViewModel.prototype.getDemoUrl = function () {
        var demo = this.currentDemo();
        return "/" + demo.ControllerName + "/" + demo.DemoName;
    };
    DemoViewModel.prototype.openNewTab = function () {
        window.open(this.urlstring(), '_blank');
    };
    DemoViewModel.prototype.reset = function () {
        this.genUrl();
        this.isHtml(false);
        this.isSimpleJson(false);
        this.getCode();
        this.currentClientTime("N/A");
        this.currentServerTime("N/A");
        this.query("");
    };
    DemoViewModel.prototype.setDemoParameters = function (demo) {
        var _this = this;
        this.currentDemoParameters([]);
        var parameters = demo.DemoParameters;
        parameters.forEach(function (parameter) {
            var demoParameter = {
                ParameterName: parameter.ParameterName,
                ParameterType: parameter.ParameterType,
                ParameterIsRequired: parameter.IsRequired,
                ParameterValue: ko.observable()
            };
            demoParameter.ParameterValue.subscribe(function () {
                _this.genUrl();
            });
            _this.currentDemoParameters.push(demoParameter);
        });
    };
    return DemoViewModel;
}());
//# sourceMappingURL=demoViewModel.js.map