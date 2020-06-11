/* global exports */
/* global XMLHttpRequest */
/* global module */
/* global process */
"use strict";

exports._ajax = function () {
  var platformSpecific = { };
  if (typeof module !== "undefined" && module.require && !(typeof process !== "undefined" && process.versions["electron"])) {
    // We are on node.js
    platformSpecific.newXHR = function () {
      var XHR = module.require("xhr2");
      return new XHR();
    };
  } else {
    // We are in the browser
    platformSpecific.newXHR = function () {
      return new XMLHttpRequest();
    };
  }

  return function (mkHeader, options) {
    return function (errback, callback) {
      var xhr = platformSpecific.newXHR();
      xhr.open(options.method || "GET", options.url, true, options.username, options.password);
      if (options.headers) {
        try {
          for (var i = 0, header; (header = options.headers[i]) != null; i++) {
            xhr.setRequestHeader(header.field, header.value);
          }
        } catch (e) {
          errback(e);
        }
      }
      xhr.onerror = function () {
        errback(new Error("AJAX request failed: " + options.method + " " + options.url));
      };
      xhr.onload = function () {
        callback({
          status: xhr.status,
          statusText: xhr.statusText,
          headers: xhr.getAllResponseHeaders().split("\r\n")
            .filter(function (header) {
              return header.length > 0;
            })
            .map(function (header) {
              var i = header.indexOf(":");
              return mkHeader(header.substring(0, i))(header.substring(i + 2));
            }),
          response: xhr.response
        });
      };
      xhr.responseType = options.responseType;
      xhr.withCredentials = options.withCredentials;
      xhr.send(options.content);

      return function (error, cancelErrback, cancelCallback) {
        try {
          xhr.abort();
        } catch (e) {
          return cancelErrback(e);
        }
        return cancelCallback();
      };
    };
  };
}();
