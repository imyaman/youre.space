(function() {
	var root = this;
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	
	if(typeof(exports) !== "undefined" && exports._) {
		Baas._ = exports._.noConflict();
		Baas.localStorage = require("localStorage");
		Baas.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
		exports.Baas = Baas;
	} else {
		Baas._ = _.noConflict();
		if(typeof(localStorage) !== "undefined") {
			Baas.localStorage = localStorage;
		}
		if(typeof(XMLHttpRequest) !== "undefined") {
			Baas.XMLHttpRequest = XMLHttpRequest;
		}
	}

	// FileUpload 위한 추가. -- Test
	if (!Baas.XMLHttpRequest.prototype.sendAsBinary) {
		Baas.XMLHttpRequest.prototype.sendAsBinary = function(sData) {
			// Baas._log("Baas.XMLHttpRequest.prototype.sendAsBinary >> sData", sData);
			var nBytes = sData.length, ui8Data = new Uint8Array(nBytes);
			for (var nIdx = 0; nIdx < nBytes; nIdx++) {
				ui8Data[nIdx] = sData.charCodeAt(nIdx) & 0xff;
			}
			this.send(ui8Data);
		};
	}

	var EmptyConstructor = function() {};
	var inherits = function(parent, protoProps, staticProps) {
		// Baas._log("var inherits = function(parent, protoProps, staticProps) { arguments", arguments);
		var child;
		if (protoProps && protoProps.hasOwnProperty('constructor')) {
			child = protoProps.constructor;
		} else {
			child = function(){ parent.apply(this, arguments); };
		}
		Baas._.extend(child, parent);
		EmptyConstructor.prototype = parent.prototype;
		child.prototype = new EmptyConstructor();
		if (protoProps) {
			Baas._.extend(child.prototype, protoProps);
		}
		if (staticProps) {
			Baas._.extend(child, staticProps);
		}
		child.prototype.constructor = child;
		child.__super__ = parent.prototype;
		return child;
	};
	
	Baas.serverURL = "https://apis.sktelecom.com";
	
	Baas.initialize = function(javascriptKey) {
		// Baas._log("Baas.initialize = function(javascriptKey) { arguments", arguments);
		Baas.javascriptKey = javascriptKey;
	};

	Baas._getBaasPath = function(path) {
		// Baas._log("Baas._getBaasPath = function(path) { arguments", arguments);
		if (!Baas.javascriptKey) {
			throw "Baas 초기화가 필요합니다.";
		}
		if (!path) {
			path = "";
		}
		if (!Baas._.isString(path)) {
			throw "localStorage 경로가 유효하지 않습니다.";
		}
		if (path[0] === "/") {
			path = path.substring(1);
		}
		return "Baas/" + Baas.javascriptKey + "/" + path;
	};
	
	Baas._parseDate = function(iso8601) {
		// Baas._log("Baas._parseDate = function(iso8601) { arguments", arguments);
		var regexp = new RegExp(
			"^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})" + "T" +
			"([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" +
			"(.([0-9]+))?" + "Z$");
		var match = regexp.exec(iso8601);
		if (!match) {
			return null;
		}
		var year = match[1] || 0;
		var month = (match[2] || 1) - 1;
		var day = match[3] || 0;
		var hour = match[4] || 0;
		var minute = match[5] || 0;
		var second = match[6] || 0;
		var milli = match[8] || 0;
		return new Date(Date.UTC(year, month, day, hour, minute, second, milli));
	};
	
	Baas._ajaxIE8 = function(method, url, data, headers) {
		// Baas._log("Baas._ajaxIE8 = function(method, url, data) { arguments", arguments);
		var promise = new Baas.Promise();
		var xdr = new XDomainRequest();
		xdr.onload = function() {
			// Baas._log("Baas._ajaxIE8 xdr.onload = function() { arguments", arguments);
			var response;
			try {
				response = JSON.parse(xdr.responseText);
			} catch(e) {
				promise.reject(e);
			}
			if(response) {
				promise.resolve(response);
			}
		};
		xdr.onerror = xdr.ontimeout = function() {
			// Baas._log("Baas._ajaxIE8 xdr.onerror = xdr.ontimeout = function() { arguments", arguments);
			promise.reject(xdr);
		};
		xdr.onprogress = function() {};
		xdr.open(method, url);
		Baas._.map(headers, function(val, key) {
			// xdr.setRequestHeader(key, val);
			xdr[key] = val;
		});
		xdr.send(data);
		return promise;
	};

	Baas._ajax = function(method, url, data, headers, success, error) {
		// Baas._log("Baas._ajax = function(method, url, data, headers, success, error) { arguments", arguments);
		var options = {
			success: success,
			error: error
		};

		if(typeof(XDomainRequest) !== "undefined") {
			return Baas._ajaxIE8(method, url, data, headers)._thenRunCallbacks(options);
		}

		var promise = new Baas.Promise();
		var handled = false;
		var xhr = new Baas.XMLHttpRequest();
		xhr.onreadystatechange = function() {
			// Baas._log("Baas._ajax xhr.onreadystatechange arguments", arguments);
			if(xhr.readyState === 4) {
				if(handled) {
					return;
				}
				handled = true;

				if(xhr.status >= 200 && xhr.status < 300) {
					var response;
					try {
						response = JSON.parse(xhr.responseText);
						// Baas._log("Baas._ajax obj response :: ", response);
					} catch(e) {
						promise.reject(e);
					}
					if(response) {
						promise.resolve(response, xhr.status, xhr);
					}
				} else {
					promise.reject(xhr);
				}
			}
		};
		xhr.open(method, url, true);
		Baas._.map(headers, function(val, key) {
			xhr.setRequestHeader(key, val);
		});
		xhr.send(data);
		// Baas._log("Baas._ajax xhr", xhr)
		// xhr.sendAsBinary( data );
		return promise._thenRunCallbacks(options);
	};

	Baas._extend = function(protoProps, dataProps) {
		// Baas._log("Baas._extend = function(protoProps, dataProps) { arguments", arguments);
		var child = inherits(this, protoProps, dataProps);
		child.extend = this.extend;
		return child;
	};

	Baas._request = function(options) {
		// Baas._log("Baas._request = function(options) { arguments", arguments);
		var route = options.route;
		var dataName = options.dataName;
		var objectId = options.objectId;
		var method = options.method;
		var sessionToken = options.sessionToken;
		var dataObject = options.data;
		var fileName = options.fileName;
		var contentType = options.contentType || "application/json";
		var headers = {};

		if(!Baas.javascriptKey) {
			throw "javascriptKey가 없습니다.";
		}

		// Todo - SessionToken 처리. 사용자 처리.

		if(	route !== "batches" &&
			route !== "data" &&
			route !== "login" &&
			route !== "users" &&
			route !== "roles" &&
			route !== "files" &&
			route !== "verifyemail" &&
			route !== "resetpassword") {
			throw "없는 경로입니다.";
		}

		var url = Baas.serverURL;
		if(url.charAt(url.length - 1) !== "/") {
			url += "/";
		}
		url += "v1/baas/" + route;
		if(dataName) {
			url += "/" + dataName;
		}
		if(objectId) {
			url += "/" + objectId;
		}
		if(fileName) {
			url += "?fileName=" + fileName;
		}

		dataObject = Baas._.clone(dataObject || {});
		if(method !== "POST" && method !== "undefined") {
			// dataObject.method = method;
			// method = "POST";
			if((route === "data" || route === "users" || route === "roles")&& method === "GET" && dataObject.where !== "undefined") {
				url += "?where=" + JSON.stringify(dataObject.where);
			}
			if(route === "login" && method === "GET" && dataObject.where !== "undefined") {
				url += "?username=" + dataObject.username + "&password=" + dataObject.password;
			}
			if(route === "files" && method === "GET" && dataObject.where !== "undefined") {
				url += "?where=" + JSON.stringify(dataObject.where);
			}

			if (dataObject.count > 0) {
				url+= "&count=" + dataObject.count;
			}
			if (dataObject.limit >= 0) {
				url+= "&limit=" + dataObject.limit;
			}
			if (dataObject.skip > 0) {
				url+= "&skip=" + dataObject.skip;
			}
			if (dataObject.order !== undefined) {
				url+= "&order=" + dataObject.order;
			}
		}

		headers["TDCProjectKey"] = Baas.javascriptKey;
		headers["Content-Type"] = contentType;
		if(sessionToken) {
			headers["sessionToken"] = sessionToken;
		}

		var data = JSON.stringify(dataObject);

		return Baas._ajax(method, url, data, headers).then(null, function(response) {
			// Baas._log("return Baas._ajax(method, url, data, headers).then(null, function(response) { arguments", arguments);
			var error;
			if(response && response.responseText) {
				try {
					var errorJSON = JSON.parse(response.responseText);
					if(errorJSON) {
						error = new Baas.Error(errorJSON.error.code, errorJSON.error.message);
					}
				} catch(e) {

				}
			}
			error = error || new Baas.Error(-1, response.Text);
			return Baas.Promise.error(error);
		});
	};

	Baas._fileRequest = function(self, options) {
		// Baas._log("Baas.File save: function (options) { arguments", arguments);
		var promise = new Baas.Promise();
		options = options || {};

		var ajaxOptions = { 
	        target : "#uploadfile",   // target element(s) to be updated with server response 
	        url : Baas.serverURL + "/v1/baas/files",         // override for form's 'action' attribute 
	        type : "post",        // 'get' or 'post', override for form's 'method' attribute 
            dataType : 'json',
            beforeSend: function (request) {
            	request.setRequestHeader("TDCProjectKey", Baas.javascriptKey);
            }, 
			success : function(responseText, statusText, xhr, $form)  { 
				// Baas._log("Baas.File success : function(responseText, statusText, xhr, $form)  {  arguments", arguments);
				var response = {};
				try {
					// response = responseText;
					var tempArr = new Array();
					tempArr.push(eval(responseText));
					response.results = tempArr;
				} catch(e) {
					promise.reject(e);
				}
				if(response) {
					promise.resolve(response, xhr.status, xhr, $form);
				}
			}
	    }; 
		
	    var fileResult = self._frm.ajaxSubmit(ajaxOptions); 
		return promise.then(function (response) {
			// Baas._log("Baas.File success: return promise.then(function (response) { arguments", arguments);
			var rs = Baas._.map(response.results, function (json) {
				// Baas._log("Baas.Query.prototype first var rs = _.map(response.results, function (json) { arguments", arguments);
				var obj = new Baas.File();
				obj._finishFetch(json, true);
				return obj;
			})[0];
			return rs;
		});
	}

	Baas._getValue = function(object, prop) {
		// Baas._log("Baas._getValue = function(object, prop) { arguments", arguments);
		if(!(object && object[prop])) {
			return null;
		}
		return Baas._.isFunction(object[prop]) ? object[prop]() : object[prop];
	};
	
	Baas._encode = function(value, seenObjects, disallowObjects) {
		// Baas._log("Baas._encode = function(value, seenObjects, disallowObjects) { arguments", arguments);
		var _ = Baas._;
		if (value instanceof Baas.Object) {
			if (disallowObjects) {
				throw "Baas.Objects not allowed here";
			}
			if (!seenObjects || _.include(seenObjects, value) || !value._hasData) {
				return value._toPointer();
			}
			if (!value.dirty()) {
				seenObjects = seenObjects.concat(value);
				return Baas._encode(value._toFullJSON(seenObjects), seenObjects, disallowObjects);
			}
			throw "Tried to save an object with a pointer to a new, unsaved object.";
		}
		if (value instanceof Baas.ACL) {
			return value.toJSON();
		}
		if (_.isDate(value)) {
			return {
				"__type" : "Date",
				"iso" : value.toJSON()
			};
		}
		if (value instanceof Baas.GeoPoint) {
			return value.toJSON();
		}
		if (_.isArray(value)) {
			return _.map(value, function(x) {
				// Baas._log("return _.map(value, function(x) { arguments", arguments);
				return Baas._encode(x, seenObjects, disallowObjects);
			});
		}
		if (_.isRegExp(value)) {
			return value.source;
		}
		if (value instanceof Baas.Relation) {
			return value.toJSON();
		}
		if (value instanceof Baas.Op) {
			return value.toJSON();
		}
		if (value instanceof Baas.File) {
			if (!value.url()) {
				throw "Tried to save an object containing an unsaved file.";
			}
			return {
				__type : "File",
				name : value.name(),
				url : value.url()
			};
		}
		if (_.isObject(value)) {
			var output = {};
			Baas._objectEach(value, function(v, k) {
				// Baas._log("Baas._decode Baas._objectEach(value, function(v, k) { arguments", arguments);
				output[k] = Baas._encode(v, seenObjects, disallowObjects);
			});
			return output;
		}
		// Baas._log("Baas._encode end this", this);
		return value;
	};

	Baas._decode = function(key, value) {
		// Baas._log("Baas._decode = function(key, value) { arguments", arguments);
		var _ = Baas._;
		if (!_.isObject(value)) {
			return value;
		}
		if (_.isArray(value)) {
			Baas._arrayEach(value, function(v, k) {
				// Baas._log("Baas._decode Baas._arrayEach(value, function(v, k) { arguments", arguments);
				value[k] = Baas._decode(k, v);
			});
			return value;
		}
		if (value instanceof Baas.Object) {
			return value;
		}
		if (value instanceof Baas.File) {
			return value;
		}
		if (value instanceof Baas.Op) {
			return value;
		}
		if (value.__op) {
			return Baas.Op._decode(value);
		}
		if (value.__type === "Pointer") {
			var pointer = Baas.Object._create(value.dataName);
			pointer._finishFetch({
				objectId : value.objectId
			}, false);
			return pointer;
		}
		if (value.__type === "Object") {
			// It's an Object included in a query result.
			var dataName = value.dataName;
			delete value.__type;
			delete value.dataName;
			var object = Baas.Object._create(dataName);
			object._finishFetch(value, true);
			return object;
		}
		if (value.__type === "Date") {
			return Baas._parseDate(value.iso);
		}
		if (value.__type === "GeoPoint") {
			return new Baas.GeoPoint({
				latitude : value.latitude,
				longitude : value.longitude
			});
		}
		if (key === "ACL") {
			if (value instanceof Baas.ACL) {
				return value;
			}
			return new Baas.ACL(value);
		}
		if (value.__type === "Relation") {
			var relation = new Baas.Relation(null, key);
			relation.targetClassName = value.dataName;
			return relation;
		}
		if (value.__type === "File") {
			var file = new Baas.File(value.name);
			file._url = value.url;
			return file;
		}
		Baas._objectEach(value, function(v, k) {
			// Baas._log("Baas._decode Baas._objectEach(value, function(v, k) { arguments", arguments);
			value[k] = Baas._decode(k, v);
		});
		return value;
	};
	
	Baas._arrayEach = Baas._.each;

	Baas._objectEach = Baas._each = function(obj, callback) {
		// Baas._log("Baas._objectEach = Baas._each = function(obj, callback) { arguments", arguments);
		var _ = Baas._;
		if(_.isObject(obj)) {
			_.each(_.keys(obj), function(key) {
				// Baas._log("_.each(_.keys(obj), function(key) { arguments", arguments);
				// // Baas._log("_.each(_.keys(obj), function(key) { key", key);
				callback(obj[key], key);
			});
		} else {
			_.each(obj, callback);
		}
	};
	
	Baas._isNullOrUndefined = function(x) {
		// Baas._log("Baas._isNullOrUndefined = function(x) { arguments", arguments);
		return Baas._.isNull(x) || Baas._.isUndefined(x);
	};

	Baas._isNull = function(x) {
		// Baas._log("Baas._isNullOrUndefined = function(x) { arguments", arguments);
		return Baas._.isNull(x) || Baas._.isUndefined(x) || Baas._.isEmpty(x);
	};
	
	Baas._log = function(name, object) {
		console.log("##### " + name + " #####");
		console.log(object);
	};

	Baas._traverse = function (object, func, seen) {
		// Baas._log("Baas._traverse = function (object, func, seen) { arguments", arguments);
		if (object instanceof Baas.Object) {
			seen = seen || [];
			if (Baas._.indexOf(seen, object) >= 0) {
				// We've already visited this object in this call.
				return;
			}
			seen.push(object);
			Baas._traverse(object.attributes, func, seen);
			return func(object);
		}
		if (object instanceof Baas.Relation) {
			return func(object);
		}
		if (object instanceof Baas.Relation || object instanceof Baas.File) {
			return func(object);
		}
		if (Baas._.isArray(object)) {
			Baas._.each(object, function (child, index) {
				// Baas._log("Baas._traverse Baas._.each(object, function (child, index) { arguments", arguments);
				var newChild = Baas._traverse(child, func, seen);
				if (newChild) {
					object[index] = newChild;
				}
			});
			return func(object);
		}
		if (Baas._.isObject(object)) {
			Baas._each(object, function (child, key) {
				// Baas._log("Baas._traverse Baas._each(object, function (child, key) { arguments", arguments);
				var newChild = Baas._traverse(child, func, seen);
				if (newChild) {
					object[key] = newChild;
				}
			});
			return func(object);
		}
		return func(object);
	};

	// Error
	Baas.Error = function(code, message) {
		this.code = code;
		this.message = message;
	};

	Baas.Promise = function() {
		// Baas._log("Baas.Promise = function() { arguments", arguments);
		this._resolved = false;
		this._rejected = false;
		this._resolvedCallbacks = [];
		this._rejectedCallbacks = [];
	};

	Baas._.extend(Baas, {
		initStart : function(options) {
		},
		initEnd : function(options) {
		}
	});

	/** Baas.Promise **/
	Baas._.extend(Baas.Promise, {

		is : function(promise) {
			// Baas._log("Baas.Promise is : function(promise) { arguments", arguments);
			return promise && promise.then && Baas._.isFunction(promise.then);
		},

		as : function() {
			// Baas._log("Baas.Promise as : function() { arguments", arguments);
			var promise = new Baas.Promise();
			promise.resolve.apply(promise, arguments);
			return promise;
		},

		error : function() {
			// Baas._log("Baas.Promise error : function() { arguments", arguments);
			var promise = new Baas.Promise();
			promise.reject.apply(promise, arguments);
			return promise;
		},

		when : function(promises) {
			// Baas._log("Baas.Promise when : function(promises) { arguments", arguments);
			var objects;
			if (promises && Baas._isNullOrUndefined(promises.length)) {
				objects = arguments;
			} else {
				objects = promises;
			}

			var total = objects.length;
			var hadError = false;
			var results = [];
			var errors = [];
			results.length = objects.length;
			errors.length = objects.length;

			if (total === 0) {
				return Baas.Promise.as.apply(this, results);
			}

			var promise = new Baas.Promise();

			var resolveOne = function() {
				// Baas._log("Baas.Promise when: var resolveOne = function() { arguments", arguments);
				total = total - 1;
				if (total === 0) {
					if (hadError) {
						promise.reject(errors);
					} else {
						promise.resolve.apply(promise, results);
					}
				}
			};

			Baas._arrayEach(objects, function(object, i) {
				// Baas._log("Baas.Promise when: Baas._arrayEach(objects, function(object, i) { arguments", arguments);
				if (Baas.Promise.is(object)) {
					object.then(function(result) {
						// Baas._log("Baas.Promise when: object.then(function(result) { arguments", arguments);
						results[i] = result;
						resolveOne();
					}, function(error) {
						// Baas._log("Baas.Promise when: object.then(function(result) { error arguments", arguments);
						errors[i] = error;
						hadError = true;
						resolveOne();
					});
				} else {
					results[i] = object;
					resolveOne();
				}
			});

			return promise;
		},

		_continueWhile : function(predicate, asyncFunction) {
			// Baas._log("Baas.Promise _continueWhile : function(predicate, asyncFunction) { arguments", arguments);
			if (predicate()) {
				return asyncFunction().then( function() {
					// Baas._log("return asyncFunction().then( function() { arguments", arguments);
					return Baas.Promise._continueWhile(predicate, asyncFunction);
				});
			}
			return Baas.Promise.as();
		}
	});

	/** Baas.Promise.prototype **/
	Baas._.extend(Baas.Promise.prototype, {

		resolve : function(result) {
			// Baas._log("Baas.Promise.prototype resolve : function(result) { arguments", arguments);
			if (this._resolved || this._rejected) {
				throw "A promise was resolved even though it had already been "
						+ (this._resolved ? "resolved" : "rejected") + ".";
			}
			this._resolved = true;
			this._result = arguments;
			var results = arguments;
			Baas._arrayEach(this._resolvedCallbacks, function(resolvedCallback) {
				// Baas._log("Baas.Promise.prototype resolve: Baas._arrayEach(this._resolvedCallbacks, function(resolvedCallback) { arguments", arguments);
				resolvedCallback.apply(this, results);
			});
			this._resolvedCallbacks = [];
			this._rejectedCallbacks = [];
		},

		reject : function(error) {
			// Baas._log("Baas.Promise.prototype reject : function(error) { arguments", arguments);
			if (this._resolved || this._rejected) {
				throw "A promise was rejected even though it had already been "
						+ (this._resolved ? "resolved" : "rejected") + ".";
			}
			this._rejected = true;
			this._error = error;
			Baas._arrayEach(this._rejectedCallbacks, function(rejectedCallback) {
				// Baas._log("Baas.Promise.prototype reject: Baas._arrayEach(this._rejectedCallbacks, function(rejectedCallback) { arguments", arguments);
				rejectedCallback(error);
			});
			this._resolvedCallbacks = [];
			this._rejectedCallbacks = [];
		},

		then : function(resolvedCallback, rejectedCallback) {
			// Baas._log("Baas.Promise.prototype then : function(resolvedCallback, rejectedCallback) { arguments", arguments);
			var promise = new Baas.Promise();

			var wrappedResolvedCallback = function() {
				// Baas._log("Baas.Promise.prototype then: var wrappedResolvedCallback = function() { arguments", arguments);
				var result = arguments;
				if (resolvedCallback) {
					result = [ resolvedCallback.apply(this, result) ];
				}
				if (result.length === 1 && Baas.Promise.is(result[0])) {
					result[0].then(function() {
						// Baas._log("Baas.Promise.prototype then: wrappedResolvedCallback result[0].then(function() { arguments", arguments);
						promise.resolve.apply(promise, arguments);
					}, function(error) {
						// Baas._log("Baas.Promise.prototype then: wrappedResolvedCallback }, function(error) { arguments", arguments);
						promise.reject(error);
					});
				} else {
					promise.resolve.apply(promise, result);
				}
			};

			var wrappedRejectedCallback = function(error) {
				// Baas._log("Baas.Promise.prototype then: var wrappedRejectedCallback = function(error) { arguments", arguments);
				var result = [];
				if (rejectedCallback) {
					result = [ rejectedCallback(error) ];
					if (result.length === 1 && Baas.Promise.is(result[0])) {
						result[0].then(function() {
							// Baas._log("Baas.Promise.prototype then: wrappedRejectedCallback result[0].then(function() { arguments", arguments);
							promise.resolve.apply(promise, arguments);
						}, function(error) {
							// Baas._log("Baas.Promise.prototype then: wrappedRejectedCallback }, function(error) { arguments", arguments);
							promise.reject(error);
						});
					} else {
						// A Promises/A+ compliant implementation would call:
						// promise.resolve.apply(promise, result);
						promise.reject(result[0]);
					}
				} else {
					promise.reject(error);
				}
			};

			if (this._resolved) {
				wrappedResolvedCallback.apply(this, this._result);
			} else if (this._rejected) {
				wrappedRejectedCallback(this._error);
			} else {
				this._resolvedCallbacks.push(wrappedResolvedCallback);
				this._rejectedCallbacks.push(wrappedRejectedCallback);
			}

			return promise;
		},

		always : function(callback) {
			// Baas._log("Baas.Promise.prototype always : function(callback) { arguments", arguments);
			return this.then(callback, callback);
		},

		done : function(callback) {
			// Baas._log("Baas.Promise.prototype done : function(callback) { arguments", arguments);
			return this.then(callback);
		},

		fail : function(callback) {
			// Baas._log("Baas.Promise.prototype fail : function(callback) { arguments", arguments);
			return this.then(null, callback);
		},

		_thenRunCallbacks : function(optionsOrCallback, model) {
			// Baas._log("Baas.Promise.prototype _thenRunCallbacks : function(optionsOrCallback, model) { arguments", arguments);
			var options;
			if (Baas._.isFunction(optionsOrCallback)) {
				var callback = optionsOrCallback;
				options = {
					success : function(result) {
						// Baas._log("Baas.Promise.prototype _thenRunCallbacks: success : function(result) { arguments", arguments);
						callback(result, null);
					},
					error : function(error) {
						// Baas._log("Baas.Promise.prototype _thenRunCallbacks: error : function(error) { arguments", arguments);
						callback(null, error);
					}
				};
			} else {
				options = Baas._.clone(optionsOrCallback);
			}
			options = options || {};

			return this.then(function(result) {
				// Baas._log("Baas.Promise.prototype _thenRunCallbacks: return this.then(function(result) { arguments", arguments);
				if (options.success) {
					options.success.apply(this, arguments);
				} else if (model) {
					model.trigger('sync', model, result, options);
				}
				return Baas.Promise.as.apply(Baas.Promise, arguments);
			}, function(error) {
				// Baas._log("Baas.Promise.prototype _thenRunCallbacks: _thenRunCallbacks }, function(error) { arguments", arguments);
				if (options.error) {
					if (!Baas._.isUndefined(model)) {
						options.error(model, error);
					} else {
						options.error(error);
					}
				} else if (model) {
					model.trigger('error', model, error, options);
				}
				return Baas.Promise.error(error);
			});
		},

		_continueWith : function(continuation) {
			// Baas._log("Baas.Promise.prototype _continueWith : function(continuation) { arguments", arguments);
			return this.then(function() {
				// Baas._log("Baas.Promise.prototype _continueWith : _continueWith return this.then(function() { arguments", arguments);
				return continuation(arguments, null);
			}, function(error) {
				// Baas._log("Baas.Promise.prototype _continueWith : _continueWith }, function(error) { arguments", arguments);
				return continuation(null, error);
			});
		}
	});
}).call(this);

(function() {
	var root = this;
	var Baas = (root.Baas || (root.Baas = {}));
	var eventSplitter = /\s+/;
	var slice = Array.prototype.slice;
	Baas.Events = {
		on : function(events, callback, context) {
			// Baas._log("Baas.Events on : function(events, callback, context) { arguments", arguments);
			var calls, event, node, tail, list;
			if (!callback) {
				return this;
			}
			events = events.split(eventSplitter);
			calls = this._callbacks || (this._callbacks = {});

			event = events.shift();
			while (event) {
				list = calls[event];
				node = list ? list.tail : {};
				node.next = tail = {};
				node.context = context;
				node.callback = callback;
				calls[event] = {
					tail : tail,
					next : list ? list.next : node
				};
				event = events.shift();
			}

			return this;
		},

		off : function(events, callback, context) {
			// Baas._log("off : function(events, callback, context) { arguments", arguments);
			var event, calls, node, tail, cb, ctx;

			if (!(calls = this._callbacks)) {
				return;
			}
			if (!(events || callback || context)) {
				delete this._callbacks;
				return this;
			}

			events = events ? events.split(eventSplitter) : _.keys(calls);
			event = events.shift();
			while (event) {
				node = calls[event];
				delete calls[event];
				if (!node || !(callback || context)) {
					continue;
				}
				// Create a new list, omitting the indicated callbacks.
				tail = node.tail;
				node = node.next;
				while (node !== tail) {
					cb = node.callback;
					ctx = node.context;
					if ((callback && cb !== callback) || (context && ctx !== context)) {
						this.on(event, cb, ctx);
					}
					node = node.next;
				}
				event = events.shift();
			}

			return this;
		},

		trigger : function(events) {
			// Baas._log("trigger : function(events) { arguments", arguments);
			var event, node, calls, tail, args, all, rest;
			if (!(calls = this._callbacks)) {
				return this;
			}
			all = calls.all;
			events = events.split(eventSplitter);
			rest = slice.call(arguments, 1);

			event = events.shift();
			while (event) {
				node = calls[event];
				if (node) {
					tail = node.tail;
					while ((node = node.next) !== tail) {
						node.callback.apply(node.context || this, rest);
					}
				}
				node = all;
				if (node) {
					tail = node.tail;
					args = [ event ].concat(rest);
					while ((node = node.next) !== tail) {
						node.callback.apply(node.context || this, args);
					}
				}
				event = events.shift();
			}

			return this;
		}
	};

	Baas.Events.bind = Baas.Events.on;
	Baas.Events.unbind = Baas.Events.off;
	
}.call(this));

(function (root) {
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	var _ = Baas._;

	Baas.Object = function (attributes, options) {
		// Baas._log("Baas.Object = function (attributes, options) { arguments", arguments);
		// Allow new Baas.Object("TableName") as a shortcut to _create.
		if (_.isString(attributes)) {
			return Baas.Object._create.apply(this, arguments);
		}

		attributes = attributes || {};
		if (options && options.parse) {
			attributes = this.parse(attributes);
		}
		var defaults = Baas._getValue(this, 'defaults');
		if (defaults) {
			attributes = _.extend({}, defaults, attributes);
		}
		if (options && options.collection) {
			this.collection = options.collection;
		}

		this._serverData = {}; // The last known data for this object from
		// cloud.
		this._opSetQueue = [{}]; // List of sets of changes to the data.
		this.attributes = {}; // The best estimate of this's current data.

		this._hashedJSON = {}; // Hash of values of containers at last save.
		this._escapedAttributes = {};
		this.cid = _.uniqueId('c');
		this.changed = {};
		this._silent = {};
		this._pending = {};
		if (!this.set(attributes, {
			silent: true
		})) {
			throw new Error("Can't create an invalid Baas.Object");
		}
		this.changed = {};
		this._silent = {};
		this._pending = {};
		this._hasData = true;
		this._previousAttributes = _.clone(this.attributes);
		this.initialize.apply(this, arguments);
	};

	Baas.Object.saveAll = function (list, options) {
		// Baas._log("Baas.Object.saveAll = function (list, options) { arguments", arguments);
		options = options || {};
		return Baas.Object._deepSaveAsync(list, {
			
		})._thenRunCallbacks(options);
	};

	Baas.Object.destroyAll = function (list, options) {
		// Baas._log("Baas.Object.destroyAll = function (list, options) { arguments", arguments);
		options = options || {};

		var triggerDestroy = function (object) {
			// Baas._log("var triggerDestroy = function (object) { arguments", arguments);
			object.trigger('destroy', object, object.collection, options);
		};

		var errors = [];
		var destroyBatch = function (batch) {
			// Baas._log("var destroyBatch = function (batch) { arguments", arguments);
			var promise = Baas.Promise.as();

			if (batch.length > 0) {
				promise = promise.then( function () {
					// Baas._log("promise = promise.then( function () { arguments", arguments);
					return Baas._request({
						route: "batches",
						method: "POST",
						data: {
							requests: _.map(batch, function (object) {
								// Baas._log("destroyBatch requests: _.map(batch, function (object) { arguments", arguments);
								return {
									method: "DELETE",
									path: "/v1/baas/data/" + object.dataName + "/" + object.id
								};
							})
						}
					});
				}).then( function (responses, status, xhr) {
					// Baas._log("}).then( function (responses, status, xhr) { arguments", arguments);
					Baas._arrayEach(batch, function (object, i) {
						// Baas._log("destroyBatch Baas._arrayEach(batch, function (object, i) { arguments", arguments);
						if (responses.results[i].success && options.wait) {
							triggerDestroy(object);
						} else if (responses.results[i].error) {
							var error = new Baas.Error(responses.results[i].error.code, responses.results[i].error.error);
							error.object = object;
							errors.push(error);
						}
					});
				});
			}

			return promise;
		};

		var promise = Baas.Promise.as();
		var batch = [];
		Baas._arrayEach(list, function (object, i) {
			// Baas._log("Baas.Object.destroyAll Baas._arrayEach(list, function (object, i) { arguments", arguments);
			if (!object.id || !options.wait) {
				triggerDestroy(object);
			}

			if (object.id) {
				batch.push(object);
			}

			if (batch.length === 20 || i + 1 === list.length) {
				var thisBatch = batch;
				batch = [];

				promise = promise.then(function () {
					// Baas._log("destroyBatch promise = promise.then(function () { arguments", arguments);
					return destroyBatch(thisBatch);
				});
			}
		});

		return promise.then(function () {
			// Baas._log("Baas.Object.destroyAll return promise.then(function () { arguments", arguments);
			if (errors.length === 0) {
				return true;
			} else {
				var error = new Baas.Error(-1, "다수 Row Data 삭제중 오류가 발생하였습니다.");
				error.errors = errors;

				return Baas.Promise.error(error);
			}
		})._thenRunCallbacks(options);
	};

	// Attach all inheridata methods to the Baas.Object prototype.
	_.extend(
		Baas.Object.prototype,
		Baas.Events, {
			_existed: false,

			initialize: function () {

			},

			toJSON: function () {
				// Baas._log("Baas.Object.prototype toJSON: function () { arguments", arguments);
				var json = this._toFullJSON();
				Baas._arrayEach(["__type", "dataName"], function (key) {
					// Baas._log("Baas._arrayEach([\"__type\", \"dataName\"], function (key) { arguments", arguments);
					delete json[key];
				});
				return json;
			},

			_toFullJSON: function (seenObjects) {
				// Baas._log("Baas.Object.prototype _toFullJSON: function (seenObjects) { arguments", arguments);
				var json = _.clone(this.attributes);
				Baas._objectEach(json, function (val, key) {
					// Baas._log("Baas._objectEach(json, function (val, key) { arguments", arguments);
					json[key] = Baas._encode(val, seenObjects);
				});
				Baas._objectEach(this._operations, function (val, key) {
					// Baas._log("Baas._objectEach(this._operations, function (val, key) { arguments", arguments);
					json[key] = val;
				});

				if (_.has(this, "id")) {
					json.objectId = this.id;
				}
				if (_.has(this, "createdAt")) {
					if (_.isDate(this.createdAt)) {
						json.createdAt = this.createdAt.toJSON();
					} else {
						json.createdAt = this.createdAt;
					}
				}

				if (_.has(this, "updatedAt")) {
					if (_.isDate(this.updatedAt)) {
						json.updatedAt = this.updatedAt.toJSON();
					} else {
						json.updatedAt = this.updatedAt;
					}
				}
				json.__type = "Object";
				json.dataName = this.dataName;
				return json;
			},

			_refreshCache: function () {
				// Baas._log("Baas.Object.prototype _refreshCache: function () { arguments", arguments);
				var self = this;
				if (self._refreshingCache) {
					return;
				}
				self._refreshingCache = true;
				Baas._objectEach(this.attributes, function (value, key) {
					// Baas._log("Baas._objectEach(this.attributes, function (value, key) { arguments", arguments);
					if (value instanceof Baas.Object) {
						value._refreshCache();
					} else if (_.isObject(value)) {
						if (self._resetCacheForKey(key)) {
							self.set(key, new Baas.Op.Set(value), {
								silent: true
							});
						}
					}
				});
				delete self._refreshingCache;
			},

			dirty: function (attr) {
				// Baas._log("Baas.Object.prototype dirty: function (attr) { arguments", arguments);
				this._refreshCache();

				var currentChanges = _.last(this._opSetQueue);

				if (attr) {
					return (currentChanges[attr] ? true : false);
				}
				if (!this.id) {
					return true;
				}
				if (_.keys(currentChanges).length > 0) {
					return true;
				}
				return false;
			},

			dirtyKeys: function () {
				// Baas._log("Baas.Object.prototype dirtyKeys: function () { arguments", arguments);
				return _.keys(_.last(this._opSetQueue));
			},

			_toPointer: function () {
				// Baas._log("Baas.Object.prototype _toPointer: function () { arguments", arguments);
				if (!this.id) {
					throw new Error("Can't serialize an unsaved Baas.Object");
				}
				return {
					__type: "Pointer",
					dataName: this.dataName,
					objectId: this.id
				};
			},

			_toRelation: function () {
				// Baas._log("Baas.Object.prototype _toRelation: function () { arguments", arguments);
				if (!this.id) {
					throw new Error("Can't serialize an unsaved Baas.Object");
				}
				return {
					__type: "Relation",
					dataName: this.dataName,
					objectId: this.id
				};
			},

			get: function (attr) {
				// Baas._log("Baas.Object.prototype get: function (attr) { arguments", arguments);
				return this.attributes[attr];
			},

			relation: function (attr) {
				// Baas._log("Baas.Object.prototype relation: function (attr) { arguments", arguments);
				var value = this.get(attr);
				if (value) {
					if (!(value instanceof Baas.Relation)) {
						throw "Called relation() on non-relation field " + attr;
					}
					value._ensureParentAndKey(this, attr);
					return value;
				} else {
					return new Baas.Relation(this, attr);
				}
			},

			escape: function (attr) {
				// Baas._log("Baas.Object.prototype escape: function (attr) { arguments", arguments);
				var html = this._escapedAttributes[attr];
				if (html) {
					return html;
				}
				var val = this.attributes[attr];
				var escaped;
				if (Baas._isNullOrUndefined(val)) {
					escaped = '';
				} else {
					escaped = _.escape(val.toString());
				}
				this._escapedAttributes[attr] = escaped;
				return escaped;
			},

			has: function (attr) {
				// Baas._log("Baas.Object.prototype has: function (attr) { arguments", arguments);
				return !Baas._isNullOrUndefined(this.attributes[attr]);
			},

			_mergeMagicFields: function (attrs) {
				// Baas._log("Baas.Object.prototype _mergeMagicFields: function (attrs) { arguments", arguments);
				var model = this;
				var specialFields = ["id", "objectId", "createdAt", "updatedAt"];
				Baas._arrayEach(specialFields, function (attr) {
					// Baas._log("Baas._arrayEach(specialFields, function (attr) { arguments", arguments);
					if (attrs[attr]) {
						if (attr === "objectId") {
							model.id = attrs[attr];
						} else if ((attr === "createdAt" || attr === "updatedAt") && !_.isDate(attrs[attr])) {
							model[attr] = Baas._parseDate(attrs[attr]);
						} else {
							model[attr] = attrs[attr];
						}
						delete attrs[attr];
					}
				});
			},

			_startSave: function () {
				// Baas._log("Baas.Object.prototype _startSave: function () { arguments", arguments);
				this._opSetQueue.push({});
			},

			_cancelSave: function () {
				// Baas._log("Baas.Object.prototype _cancelSave: function () { arguments", arguments);
				var failedChanges = _.first(this._opSetQueue);
				this._opSetQueue = _.rest(this._opSetQueue);
				var nextChanges = _.first(this._opSetQueue);
				Baas._objectEach(failedChanges, function (op, key) {
					// Baas._log("Baas._objectEach(failedChanges, function (op, key) { arguments", arguments);
					var op1 = failedChanges[key];
					var op2 = nextChanges[key];
					if (op1 && op2) {
						nextChanges[key] = op2._mergeWithPrevious(op1);
					} else if (op1) {
						nextChanges[key] = op1;
					}
				});
				this._saving = this._saving - 1;
			},

			_finishSave: function (serverData) {
				// Baas._log("Baas.Object.prototype _finishSave: function (serverData) { arguments", arguments);
				var fetchedObjects = {};
				Baas._traverse(this.attributes, function (object) {
					// Baas._log("Baas._traverse(this.attributes, function (object) { arguments", arguments);
					if (object instanceof Baas.Object && object.id && object._hasData) {
						fetchedObjects[object.id] = object;
					}
				});

				var savedChanges = _.first(this._opSetQueue);
				this._opSetQueue = _.rest(this._opSetQueue);
				this._applyOpSet(savedChanges, this._serverData);
				this._mergeMagicFields(serverData);
				var self = this;
				Baas._objectEach( serverData, function (value, key) {
					// Baas._log("Baas.Object.prototype _finishSave: Baas._objectEach( serverData, function (value, key) { arguments", arguments);
					self._serverData[key] = Baas._decode(key, value);

					var fetched = Baas._traverse( self._serverData[key], function (object) {
						// Baas._log("Baas.Object.prototype _finishSave: var fetched = Baas._traverse( self._serverData[key], function (object) { arguments", arguments);
						if (object instanceof Baas.Object && fetchedObjects[object.id]) {
							return fetchedObjects[object.id];
						}
					});
					if (fetched) {
						self._serverData[key] = fetched;
					}
				});
				this._rebuildAllEstimatedData();
				this._saving = this._saving - 1;
			},

			_finishFetch: function (serverData, hasData) {
				// Baas._log("Baas.Object.prototype _finishFetch: function (serverData, hasData) { arguments", arguments);
				this._opSetQueue = [{}];

				this._mergeMagicFields(serverData);
				var self = this;
				var tempServerData = {};
				Baas._objectEach(serverData, function (value, key) {
					// Baas._log("Baas.Object.prototype _finishFetch: Baas._objectEach(serverData, function (value, key) { arguments", arguments);
					tempServerData[key] = Baas._decode(key, value);
				});
				self._serverData = tempServerData;

				this._rebuildAllEstimatedData();
				this._refreshCache();
				this._opSetQueue = [{}];
				this._hasData = hasData;
			},

			_applyOpSet: function (opSet, target) {
				// Baas._log("Baas.Object.prototype _applyOpSet: function (opSet, target) { arguments", arguments);
				var self = this;
				Baas._objectEach(opSet, function (change, key) {
					// Baas._log("Baas.Object.prototype _applyOpSet: Baas._objectEach(opSet, function (change, key) { arguments", arguments);
					target[key] = change._estimate(target[key],
						self, key);
					if (target[key] === Baas.Op._UNSET) {
						delete target[key];
					}
				});
			},

			_resetCacheForKey: function (key) {
				// Baas._log("Baas.Object.prototype _resetCacheForKey: function (key) { arguments", arguments);
				var value = this.attributes[key];
				if (_.isObject(value) && !(value instanceof Baas.Object) ) {
					value = value.toJSON ? value.toJSON() : value;
					var json = JSON.stringify(value);
					if (this._hashedJSON[key] !== json) {
						this._hashedJSON[key] = json;
						return true;
					}
				}
				return false;
			},

			_rebuildEstimatedDataForKey: function (key) {
				// Baas._log("Baas.Object.prototype _rebuildEstimatedDataForKey: function (key) { arguments", arguments);
				var self = this;
				delete this.attributes[key];
				if (this._serverData[key]) {
					this.attributes[key] = this._serverData[key];
				}
				Baas._arrayEach(this._opSetQueue, function (opSet) {
					// Baas._log("Baas.Object.prototype _rebuildEstimatedDataForKey: Baas._arrayEach(this._opSetQueue, function (opSet) { arguments", arguments);
					var op = opSet[key];
					if (op) {
						self.attributes[key] = op._estimate(self.attributes[key], self, key);
						if (self.attributes[key] === Baas.Op._UNSET) {
							delete self.attributes[key];
						} else {
							self._resetCacheForKey(key);
						}
					}
				});
			},

			_rebuildAllEstimatedData: function () {
				// Baas._log("Baas.Object.prototype _rebuildAllEstimatedData: function () { arguments", arguments);
				var self = this;

				var previousAttributes = _.clone(this.attributes);

				this.attributes = _.clone(this._serverData);
				Baas._arrayEach(this._opSetQueue, function (opSet) {
					// Baas._log("Baas.Object.prototype _rebuildAllEstimatedData: Baas._arrayEach(this._opSetQueue, function (opSet) { arguments", arguments);
					self._applyOpSet(opSet, self.attributes);
					Baas._objectEach(opSet, function (op, key) {
						// Baas._log("Baas.Object.prototype _rebuildAllEstimatedData: Baas._objectEach(opSet, function (op, key) { arguments", arguments);
						self._resetCacheForKey(key);
					});
				});

				Baas._objectEach(previousAttributes, function (oldValue, key) {
					// Baas._log("Baas.Object.prototype _rebuildAllEstimatedData: Baas._objectEach(previousAttributes, function (oldValue, key) { arguments", arguments);
					if (self.attributes[key] !== oldValue) {
						self.trigger('change:' + key, self, self.attributes[key], {});
					}
				});
				Baas._objectEach(this.attributes, function (newValue, key) {
					// Baas._log("Baas.Object.prototype _rebuildAllEstimatedData: Baas._objectEach(this.attributes, function (newValue, key) { arguments", arguments);
					if (!_.has(previousAttributes, key)) {
						self.trigger('change:' + key, self, newValue, {});
					}
				});
			},

			set: function(key, value, options) {
				// Baas._log("Baas.Object.prototype set: function(key, value, options) { arguments", arguments);
				var attrs, attr;
				if (_.isObject(key) || Baas._isNullOrUndefined(key)) {
					attrs = key;
					Baas._objectEach(attrs, function(v, k) {
						// Baas._log("Baas.Object.prototype set: Baas._objectEach(attrs, function(v, k) { arguments", arguments);
						attrs[k] = Baas._decode(k, v);
					});
					options = value;
				} else {
					attrs = {};
					attrs[key] = Baas._decode(key, value);
				}

				options = options || {};
				if (!attrs) {
					return this;
				}
				if (attrs instanceof Baas.Object) {
					attrs = attrs.attributes;
				}

				if (options.unset) {
					Baas._objectEach(attrs, function(unused_value, key) {
						// Baas._log("Baas.Object.prototype set: Baas._objectEach(attrs, function(unused_value, key) { arguments", arguments);
						attrs[key] = new Baas.Op.Unset();
					});
				}

				var dataToValidate = _.clone(attrs);
				var self = this;
				Baas._objectEach(dataToValidate, function(value, key) {
					// Baas._log("Baas.Object.prototype set: Baas._objectEach(dataToValidate, function(value, key) { arguments", arguments);
					if (value instanceof Baas.Op) {
						dataToValidate[key] = value._estimate(self.attributes[key], self, key);
						if (dataToValidate[key] === Baas.Op._UNSET) {
							delete dataToValidate[key];
						}
					}
				});

				if (!this._validate(attrs, options)) {
					return false;
				}

				this._mergeMagicFields(attrs);

				options.changes = {};
				var escaped = this._escapedAttributes;
				var prev = this._previousAttributes || {};

				Baas._arrayEach(_.keys(attrs), function(attr) {
					// Baas._log("Baas.Object.prototype set: Baas._arrayEach(_.keys(attrs), function(attr) { arguments", arguments);
					var val = attrs[attr];

					if (val instanceof Baas.Relation) {
						val.parent = self;
					}

					if (!(val instanceof Baas.Op)) {
						val = new Baas.Op.Set(val);
					}

					var isRealChange = true;
					if (val instanceof Baas.Op.Set && _.isEqual(self.attributes[attr], val.value)) {
						isRealChange = false;
					}

					if (isRealChange) {
						delete escaped[attr];
						if (options.silent) {
							self._silent[attr] = true;
						} else {
							options.changes[attr] = true;
						}
					}

					var currentChanges = _.last(self._opSetQueue);
					currentChanges[attr] = val._mergeWithPrevious(currentChanges[attr]);
					self._rebuildEstimatedDataForKey(attr);

					if (isRealChange) {
						self.changed[attr] = self.attributes[attr];
						if (!options.silent) {
							self._pending[attr] = true;
						}
					} else {
						delete self.changed[attr];
						delete self._pending[attr];
					}
				});

				if (!options.silent) {
					this.change(options);
				}
				// Baas._log("Baas.Object.Prototype set End this", this);
				return this;
			},

			unset: function (attr, options) {
				// Baas._log("Baas.Object.prototype unset: function (attr, options) { arguments", arguments);
				options = options || {};
				options.unset = true;
				return this.set(attr, null, options);
			},

			increment: function (attr, amount) {
				// Baas._log("Baas.Object.prototype increment: function (attr, amount) { arguments", arguments);
				if (_.isUndefined(amount) || _.isNull(amount)) {
					amount = 1;
				}
				return this.set(attr, new Baas.Op.Increment(amount));
			},

			add: function (attr, item) {
				// Baas._log("Baas.Object.prototype add: function (attr, item) { arguments", arguments);
				return this.set(attr, new Baas.Op.Add([item]));
			},

			addUnique: function (attr, item) {
				// Baas._log("Baas.Object.prototype addUnique: function (attr, item) { arguments", arguments);
				return this.set(attr, new Baas.Op.AddUnique([item]));
			},

			remove: function (attr, item) {
				// Baas._log("Baas.Object.prototype remove: function (attr, item) { arguments", arguments);
				return this.set(attr, new Baas.Op.Remove([item]));
			},

			op: function (attr) {
				// Baas._log("Baas.Object.prototype op: function (attr) { arguments", arguments);
				return _.last(this._opSetQueue)[attr];
			},

			clear: function (options) {
				// Baas._log("Baas.Object.prototype clear: function (options) { arguments", arguments);
				options = options || {};
				options.unset = true;
				var keysToClear = _.extend(this.attributes, this._operations);
				return this.set(keysToClear, options);
			},

			_getSaveJSON: function () {
				// Baas._log("Baas.Object.prototype _getSaveJSON: function () { arguments", arguments);
				var json = _.clone(_.first(this._opSetQueue));
				Baas._objectEach(json, function (op, key) {
					// Baas._log("Baas._objectEach(json, function (op, key) { arguments", arguments);
					json[key] = op.toJSON();
				});
				return json;
			},

			_canBeSerialized: function () {
				// Baas._log("Baas.Object.prototype _canBeSerialized: function () { arguments", arguments);
				return Baas.Object._canBeSerializedAsValue(this.attributes);
			},

			fetch: function (options) {
				// Baas._log("Baas.Object.prototype fetch: function (options) { arguments", arguments);
				var self = this;
				options = options || {};
				var route = "data";
				var request = Baas._request({
					method: 'GET',
					route: route,
					dataName: this.dataName,
					objectId: this.id
				});
				return request.then(function (response, status, xhr) {
					// Baas._log("return request.then(function (response, status, xhr) { arguments", arguments);
					self._finishFetch(self.parse(response, status, xhr), true);
					return self;
				})._thenRunCallbacks(options, this);
			},

			save: function (arg1, arg2, arg3) {
				// Baas._log("Baas.Object.prototype save: function (arg1, arg2, arg3) { arguments", arguments);
				var i, attrs, current, options, saved;
				if (_.isObject(arg1) || Baas._isNullOrUndefined(arg1)) {
					attrs = arg1;
					options = arg2;
				} else {
					attrs = {};
					attrs[arg1] = arg2;
					options = arg3;
				}

				if (!options && attrs) {
					var extra_keys = _.reject(attrs, function (value, key) {
						// Baas._log("var extra_keys = _.reject(attrs, function (value, key) { arguments", arguments);
						return _.include(["success", "error", "wait"], key);
					});
					if (extra_keys.length === 0) {
						var all_functions = true;
						if (_.has(attrs, "success") && !_.isFunction(attrs.success)) {
							all_functions = false;
						}
						if (_.has(attrs, "error") && !_.isFunction(attrs.error)) {
							all_functions = false;
						}
						if (all_functions) {
							return this.save(null, attrs);
						}
					}
				}

				options = _.clone(options) || {};
				if (options.wait) {
					current = _.clone(this.attributes);
				}

				var setOptions = _.clone(options) || {};
				if (setOptions.wait) {
					setOptions.silent = true;
				}
				var setError;
				setOptions.error = function (model, error) {
					// Baas._log("setOptions.error = function (model, error) { arguments", arguments);
					setError = error;
				};
				if (attrs && !this.set(attrs, setOptions)) {
					return Baas.Promise.error(setError)._thenRunCallbacks(options, this);
				}

				var model = this;

				// Baas._log("Object Save this", this);

				model._refreshCache();

				var unsavedChildren = [];
				var unsavedFiles = [];
				Baas.Object._findUnsavedChildren(model.attributes, unsavedChildren, unsavedFiles);
				if (unsavedChildren.length + unsavedFiles.length > 0) {
					return Baas.Object._deepSaveAsync( this.attributes, {
						
					}).then( function () {
						// Baas._log("Baas.Object.prototype save }).then( function () { arguments", arguments);
						return model.save(null, options);
					},
					function (error) {
						// Baas._log("Baas.Object.prototype save function (error) { arguments", arguments);
						return Baas.Promise.error(error)._thenRunCallbacks(options, model);
					});
				}

				this._startSave();
				this._saving = (this._saving || 0) + 1;

				this._allPreviousSaves = this._allPreviousSaves || Baas.Promise.as();
				this._allPreviousSaves = this._allPreviousSaves._continueWith(function () {
					// Baas._log("this._allPreviousSaves = this._allPreviousSaves._continueWith(function () { arguments", arguments);
					var method = model.id ? 'PUT' : 'POST';

					var json = model._getSaveJSON();

					var route = "data";
					var dataName = model.dataName;
					// Baas._log("this._allPreviousSaves = this._allPreviousSaves._continueWith(function () { model", model);
					// if (model.dataName === "User" && !model.id) {
					if (model.dataName === "User") {
						route = "users";
						dataName = null;
					}
					// if (model.dataName === "Role" && !model.id) {
					if (model.dataName === "Role") {
						route = "roles";
						dataName = null;
					}
					var request = Baas._request({
						route: route,
						dataName: dataName,
						objectId: model.id,
						method: method,
						data: json
					});

					request = request.then( function (resp, status, xhr) {
						// Baas._log("request = request.then( function (resp, status, xhr) { arguments", arguments);
						var serverAttrs = model.parse(resp, status, xhr);
						if (options.wait) {
							serverAttrs = _.extend(attrs || {}, serverAttrs);
						}
						model._finishSave(serverAttrs);
						if (options.wait) {
							model.set(current, setOptions);
						}
						return model;
					},
					function (error) {
						// Baas._log("Baas.Object.prototype save request function (error) { arguments", arguments);
						model._cancelSave();
						return Baas.Promise.error(error);
					})._thenRunCallbacks(options, model);

					return request;
				});
				return this._allPreviousSaves;
			},

			destroy: function (options) {
				// Baas._log("Baas.Object.prototype destroy: function (options) { arguments", arguments);
				options = options || {};
				var model = this;

				var triggerDestroy = function () {
					// Baas._log("var triggerDestroy = function () { arguments", arguments);
					model.trigger('destroy', model, model.collection, options);
				};

				if (!(this instanceof Baas.File) && !this.id) {
					return triggerDestroy();
				} else if(this instanceof Baas.File && !this.name) {
					return triggerDestroy();
				}

				if (!options.wait) {
					triggerDestroy();
				}

				var request = null;
				
				if(this instanceof Baas.File) {
					var fileName = this.get("name");
					request = Baas._request({
						route: "files",
						fileName: fileName,
						method: 'DELETE'
					});
				} else {
					var route = "data";
					var dataName = this.dataName;
					if (model.dataName === "User") {
						route = "users";
						dataName = null;
					}
					if (model.dataName === "Role") {
						route = "roles";
						dataName = null;
					}

					request = Baas._request({
						route: route,
						dataName: dataName,
						objectId: this.id,
						method: 'DELETE'
					});
				}
				
				return request.then(function () {
					// Baas._log("return request.then(function () { arguments", arguments);
					if (options.wait) {
						triggerDestroy();
					}
					return model;
				})._thenRunCallbacks(options, this);
			},


			parse: function (resp, status, xhr) {
				// Baas._log("Baas.Object.prototype parse: function (resp, status, xhr) { arguments", arguments);
				var output = _.clone(resp);
				_(["createdAt", "updatedAt"]).each(function (key) {
					// Baas._log("_([\"createdAt\", \"updatedAt\"]).each(function (key) { arguments", arguments);
					if (output[key]) {
						output[key] = Baas._parseDate(output[key]);
					}
				});
				if (!output.updatedAt) {
					output.updatedAt = output.createdAt;
				}
				if (status) {
					this._existed = (status !== 201);
				}
				return output;
			},

			clone: function () {
				// Baas._log("Baas.Object.prototype clone: function () { arguments", arguments);
				return new this.constructor(this.attributes);
			},

			isNew: function () {
				// Baas._log("Baas.Object.prototype isNew: function () { arguments", arguments);
				return !this.id;
			},

			change: function (options) {
				// Baas._log("Baas.Object.prototype change: function (options) { arguments", arguments);
				options = options || {};
				var changing = this._changing;
				this._changing = true;

				var self = this;
				Baas._objectEach(this._silent, function (attr) {
					// Baas._log("Baas.Object.prototype change: Baas._objectEach(this._silent, function (attr) { arguments", arguments);
					self._pending[attr] = true;
				});

				var changes = _.extend({}, options.changes, this._silent);
				this._silent = {};
				Baas._objectEach(changes, function (unused_value, attr) {
					// Baas._log("Baas.Object.prototype change: Baas._objectEach(changes, function (unused_value, attr) { arguments", arguments);
					self.trigger('change:' + attr, self, self.get(attr), options);
				});
				if (changing) {
					return this;
				}

				var deleteChanged = function (value, attr) {
					// Baas._log("Baas.Object.prototype change: var deleteChanged = function (value, attr) { arguments", arguments);
					if (!self._pending[attr] && !self._silent[attr]) {
						delete self.changed[attr];
					}
				};

				while (!_.isEmpty(this._pending)) {
					this._pending = {};
					this.trigger('change', this, options);
					Baas._objectEach(this.changed, deleteChanged);
					self._previousAttributes = _.clone(this.attributes);
				}

				this._changing = false;
				return this;
			},

			existed: function () {
				// Baas._log("Baas.Object.prototype existed: function () { arguments", arguments);
				return this._existed;
			},

			hasChanged: function (attr) {
				// Baas._log("Baas.Object.prototype hasChanged: function (attr) { arguments", arguments);
				if (!arguments.length) {
					return !_.isEmpty(this.changed);
				}
				return this.changed && _.has(this.changed, attr);
			},

			changedAttributes: function (diff) {
				// Baas._log("Baas.Object.prototype changedAttributes: function (diff) { arguments", arguments);
				if (!diff) {
					return this.hasChanged() ? _.clone(this.changed) : false;
				}
				var changed = {};
				var old = this._previousAttributes;
				Baas._objectEach(diff, function (diffVal, attr) {
					if (!_.isEqual(old[attr], diffVal)) {
						changed[attr] = diffVal;
					}
				});
				return changed;
			},

			previous: function (attr) {
				// Baas._log("Baas.Object.prototype previous: function (attr) { arguments", arguments);
				if (!arguments.length || !this._previousAttributes) {
					return null;
				}
				return this._previousAttributes[attr];
			},

			previousAttributes: function () {
				// Baas._log("Baas.Object.prototype previousAttributes: function () { arguments", arguments);
				return _.clone(this._previousAttributes);
			},

			isValid: function () {
				// Baas._log("Baas.Object.prototype isValid: function () { arguments", arguments);
				return !this.validate(this.attributes);
			},

			validate: function (attrs, options) {
				// Baas._log("Baas.Object.prototype validate: function (attrs, options) { arguments", arguments);
				if (_.has(attrs, "ACL") && !(attrs.ACL instanceof Baas.ACL)) {
					return new Baas.Error(-1,"ACL이 유효하지 않습니다.");
				}
				var correct = true;
				Baas._objectEach(attrs, function (unused_value, key) {
					// Baas._log("Baas._objectEach(attrs, function (unused_value, key) { arguments", arguments);
					if (!(/^[A-Za-z][0-9A-Za-z_]*$/).test(key)) {
						// Baas._log("Baas.Object.prototype validate case3", this);
						correct = false;
					}
				});
				if (!correct) {
					// Baas._log("Baas.Object.prototype validate case2", this);
					return new Baas.Error(-1, "key값이 유효하지 않습니다.");
				}
				// Baas._log("Baas.Object.prototype validate End this", this);
				return false;
			},

			_validate: function (attrs, options) {
				// Baas._log("Baas.Object.prototype _validate: function (attrs, options) { arguments", arguments);
				if (options.silent || !this.validate) {
					return true;
				}
				attrs = _.extend({}, this.attributes, attrs);
				var error = this.validate(attrs, options);
				if (!error) {
					return true;
				}
				if (options && options.error) {
					options.error(this, error, options);
				} else {
					this.trigger('error', this, error, options);
				}
				// Baas._log("Baas.Object.prototype _validate End this", this);
				return false;
			},

			getACL: function () {
				// Baas._log("Baas.Object.prototype getACL: function () { arguments", arguments);
				return this.get("ACL");
			},

			setACL: function (acl, options) {
				// Baas._log("Baas.Object.prototype setACL: function (acl, options) { arguments", arguments);
				return this.set("ACL", acl, options);
			}

		}
	);


	Baas.Object._getSubdata = function (dataName) {
		// Baas._log("Baas.Object._getSubdata = function (dataName) { arguments", arguments);
		if (!_.isString(dataName)) {
			throw "Baas.Object._getSubdata requires a string argument.";
		}
		var ObjectTable = Baas.Object._dataMap[dataName];
		if (!ObjectTable) {
			ObjectTable = Baas.Object.extend(dataName);
			Baas.Object._dataMap[dataName] = ObjectTable;
		}
		return ObjectTable;
	};


	Baas.Object._create = function (dataName, attributes, options) {
		// Baas._log("Baas.Object._create = function (dataName, attributes, options) { arguments", arguments);
		var ObjectTable = Baas.Object._getSubdata(dataName);
		return new ObjectTable(attributes, options);
	};

	Baas.Object._dataMap = {};

	Baas.Object._extend = Baas._extend;

	Baas.Object.extend = function (dataName, protoProps, dataProps) {
		// Baas._log("Baas.Object.extend = function (dataName, protoProps, dataProps) { arguments", arguments);

		if (!_.isString(dataName)) {
			if (dataName && _.has(dataName, "dataName")) {
				return Baas.Object.extend(dataName.dataName, dataName, protoProps);
			} else {
				throw new Error("첫번째 전달인자는 테이블명이어야 합니다.");
			}
		}

		protoProps = protoProps || {};
		protoProps.dataName = dataName;

		var NewTableObject = null;
		if (_.has(Baas.Object._dataMap, dataName)) {
			var OldTableObject = Baas.Object._dataMap[dataName];
			NewTableObject = OldTableObject._extend(protoProps, dataProps);
		} else {
			NewTableObject = Baas.Object._extend(protoProps, dataProps);
		}

		NewTableObject.extend = function (arg0) {
			// Baas._log("NewTableObject.extend = function (arg0) { arguments", arguments);
			if (_.isString(arg0) || (arg0 && _.has(arg0, "dataName"))) {
				return Baas.Object.extend.apply(NewTableObject, arguments);
			}
			var newArguments = [dataName].concat(Baas._.toArray(arguments));
			return Baas.Object.extend.apply(NewTableObject, newArguments);
		};
		Baas.Object._dataMap[dataName] = NewTableObject;
		return NewTableObject;
	};

	Baas.Object._findUnsavedChildren = function (object, children, files) {
		// Baas._log("Baas.Object._findUnsavedChildren = function (object, children, files) { arguments", arguments);
		Baas._traverse(object, function (object) {
			// Baas._log("Baas._traverse(object, function (object) { arguments", arguments);
			if (object instanceof Baas.Object) {
				object._refreshCache();
				if (object.dirty()) {
					children.push(object);
				}
				return;
			}

			if (object instanceof Baas.File) {
				if (!object.url()) {
					files.push(object);
				}
				return;
			}
		});
	};

	Baas.Object._canBeSerializedAsValue = function (object) {
		// Baas._log("Baas.Object._canBeSerializedAsValue = function (object) { arguments", arguments);

		if (object instanceof Baas.Object) {
			return !!object.id;
		}
		// TODO 파일 처리.
		if (object instanceof Baas.File) {
			return true;
		}

		var canBeSerializedAsValue = true;

		if (_.isArray(object)) {
			Baas._arrayEach(object, function (child) {
				// Baas._log("Baas._arrayEach(object, function (child) { arguments", arguments);
				if (!Baas.Object._canBeSerializedAsValue(child)) {
					canBeSerializedAsValue = false;
				}
			});
		} else if (_.isObject(object)) {
			Baas._objectEach(object, function (child) {
				// Baas._log("Baas._objectEach(object, function (child) { arguments", arguments);
				if (!Baas.Object._canBeSerializedAsValue(child)) {
					canBeSerializedAsValue = false;
				}
			});
		}

		// Baas._log("Baas.Object._canBeSerializedAsValue End canBeSerializedAsValue", canBeSerializedAsValue);
		return canBeSerializedAsValue;
	};


	Baas.Object._deepSaveAsync = function (object, options) {
		// Baas._log("Baas.Object._deepSaveAsync = function (object, options) { arguments", arguments);
		var unsavedChildren = [];
		var unsavedFiles = [];
		Baas.Object._findUnsavedChildren(object, unsavedChildren, unsavedFiles);

		var promise = Baas.Promise.as();
		_.each(unsavedFiles, function (file) {
			// Baas._log("_.each(unsavedFiles, function (file) { arguments", arguments);
			promise = promise.then(function () {
				// Baas._log("Baas.Object._deepSaveAsync promise = promise.then(function () { arguments", arguments);
				return file.save(options);
			});
		});

		var objects = _.uniq(unsavedChildren);
		var remaining = _.uniq(objects);

		return promise.then(function () {
			// Baas._log("Baas.Object._deepSaveAsync return promise.then(function () { arguments", arguments);
			return Baas.Promise._continueWhile(
				function () {
					// Baas._log("Baas.Promise._continueWhile( 1 arguments", arguments);
					return remaining.length > 0;
				},
				function () {
					// Baas._log("Baas.Promise._continueWhile( 2 arguments", arguments);

					var batch = [];
					var newRemaining = [];
					Baas._arrayEach(remaining, function (object) {

						if (batch.length > 20) {
							newRemaining.push(object);
							return;
						}

						if (object._canBeSerialized()) {
							batch.push(object);
						} else {
							newRemaining.push(object);
						}
					});
					remaining = newRemaining;

					if (batch.length === 0) {
						return Baas.Promise.error(new Baas.Error(-1, "오류가 발생하였습니다."));
					}

					var readyToStart = Baas.Promise.when(_.map(batch, function (object) {
						return object._allPreviousSaves || Baas.Promise.as();
					}));
					var batchFinished = new Baas.Promise();
					Baas._arrayEach(batch, function (object) {
						object._allPreviousSaves = batchFinished;
					});

					return readyToStart._continueWith(function () {
						// Baas._log("return readyToStart._continueWith(function () { arguments", arguments);
						return Baas._request({
							route: "batches",
							method: "POST",
							data: {
								requests: _.map(batch, function (object) {
									// Baas._log("Baas.Object._deepSaveAsync requests: _.map(batch, function (object) { arguments", arguments);
									var json = object._getSaveJSON();
									var method = "POST";

									var path = "/v1/baas/data/" + object.dataName;
									if (object.id) {
										path = path + "/" + object.id;
										method = "PUT";
									}

									object._startSave();

									return {
										method: method,
										path: path,
										body: json
									};
								})
							}
						}).then( function (response, status, xhr) {
							// Baas._log("Baas.Object._deepSaveAsync }).then( function (response, status, xhr) { arguments", arguments);
							var error;
							Baas._arrayEach(batch, function (object, i) {
								// Baas._log("Baas.Object._deepSaveAsync Baas._arrayEach(batch, function (object, i) { arguments", arguments);
								if (response.results[i].success) {
									object._finishSave(object.parse(response.results[i].success,status,xhr));
								} else {
									error = error || response[i].error;
									object._cancelSave();
								}
							});
							if (error) {
								return Baas.Promise.error(new Baas.Error(error.code, error.error));
							}

						}).then(function (results) {
							// Baas._log("Baas.Object._deepSaveAsync }).then(function (results) { arguments", arguments);
							batchFinished.resolve(results);
							return results;
						},
						function (error) {
							// Baas._log("Baas.Object._deepSaveAsync function (error) { arguments", arguments);
							batchFinished.reject(error);
							return Baas.Promise.error(error);
						});
					});
				});
			}).then(function () {
			return object;
		});
	};

}(this));


(function (root) {
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	var _ = Baas._;

	Baas.Query = function (objectTable) {
		// Baas._log("Baas.Query = function (objectTable) { arguments", arguments);
		if (_.isString(objectTable)) {
			objectTable = Baas.Object._getSubdata(objectTable);
		}

		this.objectTable = objectTable;

		this.dataName = objectTable.prototype.dataName;

		this._where = {};
		this._include = [];
		this._limit = -1; 
		this._skip = 0;
		this._extraOptions = {};
	};

	Baas.Query.or = function () {
		// Baas._log("Baas.Query.or = function () { arguments", arguments);
		var queries = _.toArray(arguments);
		var dataName = null;
		Baas._arrayEach(queries, function (q) {
			// Baas._log("Baas._arrayEach(queries, function (q) { arguments", arguments);
			if (_.isNull(dataName)) {
				dataName = q.dataName;
			}

			if (dataName !== q.dataName) {
				throw "All queries must be for the same data";
			}
		});
		var query = new Baas.Query(dataName);
		query._orQuery(queries);
		return query;
	};

	_.extend(Baas.Query.prototype, {
		get: function (objectId, options) {
			// Baas._log("Baas.Query.prototype get: function (objectId, options) { arguments", arguments);
			var self = this;
			if(!_.isNull(objectId)) {
				self.equalTo('objectId', objectId);
			}

			return self.first().then(function(response) {
				// Baas._log("return self.first().then(function(response) { arguments", arguments);
				if (response) {
					return response;
				}
				var errorObject = new Baas.Error(-1, "객체가 없습니다.");
				return Baas.Promise.error(errorObject);

			})._thenRunCallbacks(options, null);
		},

		toJSON: function () {
			// Baas._log("Baas.Query.prototype toJSON: function () { arguments", arguments);
			var params = {
				where: this._where
			};

			if (this._include.length > 0) {
				params.include = this._include.join(",");
			}
			if (this._select) {
				params.keys = this._select.join(",");
			}
			if (this._limit >= 0) {
				params.limit = this._limit;
			}
			if (this._skip > 0) {
				params.skip = this._skip;
			}
			if (this._order !== undefined) {
				params.order = this._order;
			}

			Baas._objectEach(this._extraOptions, function (v, k) {
				// Baas._log("Baas._objectEach(this._extraOptions, function (v, k) { arguments", arguments);
				params[k] = v;
			});

			return params;
		},


		find: function (options) {
			// Baas._log("Baas.Query.prototype find: function (options) { arguments", arguments);
			// Baas._log("Baas.Query.prototype find: function (options) { this", this);
			var self = this;
			var route = "data";
			options = options || {};

			if (this.dataName === "Role") {
				route = "roles";
				this.dataName = null;
			}
			if (this.dataName === "User") {
				route = "users";
				this.dataName = null;
			}
			if (this.dataName === "File") {
				route = "files";
				this.dataName = null;
			}

			var request = Baas._request({
				route: route,
				dataName: this.dataName,
				method: "GET",
				data: this.toJSON()
			});

			return request.then(function (response) {
				// Baas._log("Baas.Query.prototype find return request.then(function (response) { arguments", arguments);
				var findResult = _.map(response.results, function (json) {
					// Baas._log("Baas.Query.prototype find return _.map(response.results, function (json) { arguments", arguments);
					var obj;
					if (response.dataName) {
						obj = new Baas.Object(response.dataName);
					} else {
						obj = new self.objectTable();
					}
					obj._finishFetch(json, true);
					return obj;
				});
				// Baas._log("Baas.Query.prototype find findResult", findResult);
				// Baas._log("Baas.Query.prototype find findResult", findResult instanceof Object);
				// Baas._log("Baas.Query.prototype find findResult", findResult instanceof Array);
				return findResult;
			})._thenRunCallbacks(options);
		},

		count: function (options) {
			// Baas._log("Baas.Query.prototype count: function (options) { arguments", arguments);
			var self = this;
			options = options || {};

			var params = this.toJSON();
			params.limit = 0;
			params.count = 1;
			var request = Baas._request({
				route: "data",
				dataName: self.dataName,
				method: "GET",
				data: params
			});

			return request.then(function (response) {
				// Baas._log("Baas.Query.prototype count return request.then(function (response) { arguments", arguments);
				return response.count;
			})._thenRunCallbacks(options);
		},

		totalCount: function (options) {
			// Baas._log("Baas.Query.prototype totalCount: function (options) { arguments", arguments);
			var self = this;
			options = options || {};

			var params = this.toJSON();
			params.limit = 0;
			params.count = 1;
			var request = Baas._request({
				route: "data",
				dataName: self.dataName,
				method: "GET",
				data: params
			});

			return request.then(function (response) {
				// Baas._log("Baas.Query.prototype totalCount return request.then(function (response) { arguments", arguments);
				return response.totalCount;
			})._thenRunCallbacks(options);
		},


		first: function (options) {
			// Baas._log("Baas.Query.prototype first: function (options) { arguments", arguments);
			var self = this;
			var route = "data";
			options = options || {};

			if (this.dataName === "Role") {
				route = "roles";
				this.dataName = null;
			}
			if (this.dataName === "User") {
				route = "users";
				this.dataName = null;
			}

			var params = this.toJSON();
			params.limit = 1;
			var request = Baas._request({
				route: route,
				dataName: this.dataName,
				method: "GET",
				data: params
			});

			return request.then(function (response) {
				// Baas._log("Baas.Query.prototype first return request.then(function (response) { arguments", arguments);
				var rs = _.map(response.results, function (json) {
					// Baas._log("Baas.Query.prototype first var rs = _.map(response.results, function (json) { arguments", arguments);
					var obj = new self.objectTable();
					obj._finishFetch(json, true);
					return obj;
				})[0];
				// Baas._log("first rs", rs);
				return rs;
			})._thenRunCallbacks(options);
		},

		collection: function (items, options) {
			// Baas._log("Baas.Query.prototype collection: function (items, options) { arguments", arguments);
			options = options || {};
			return new Baas.Collection(items, _.extend(options, {
				model: this.objectTable,
				query: this
			}));
		},

		skip: function (n) {
			// Baas._log("Baas.Query.prototype skip: function (n) { arguments", arguments);
			this._skip = n;
			return this;
		},

		limit: function (n) {
			// Baas._log("Baas.Query.prototype limit: function (n) { arguments", arguments);
			this._limit = n;
			return this;
		},

		equalTo: function (key, value) {
			// Baas._log("Baas.Query.prototype equalTo: function (key, value) { arguments", arguments);
			if (_.isUndefined(value)) {
				return this.doesNotExist(key);
			}

			this._where[key] = Baas._encode(value);
			return this;
		},

		_addCondition: function (key, condition, value) {
			// Baas._log("Baas.Query.prototype _addCondition: function (key, condition, value) { arguments", arguments);
			if (!this._where[key]) {
				this._where[key] = {};
			}
			this._where[key][condition] = Baas._encode(value);
			return this;
		},

		notEqualTo: function (key, value) {
			// Baas._log("Baas.Query.prototype notEqualTo: function (key, value) { arguments", arguments);
			this._addCondition(key, "$ne", value);
			return this;
		},

		lessThan: function (key, value) {
			// Baas._log("Baas.Query.prototype lessThan: function (key, value) { arguments", arguments);
			this._addCondition(key, "$lt", value);
			return this;
		},

		greaterThan: function (key, value) {
			// Baas._log("Baas.Query.prototype greaterThan: function (key, value) { arguments", arguments);
			this._addCondition(key, "$gt", value);
			return this;
		},

		lessThanOrEqualTo: function (key, value) {
			// Baas._log("Baas.Query.prototype lessThanOrEqualTo: function (key, value) { arguments", arguments);
			this._addCondition(key, "$lte", value);
			return this;
		},

		greaterThanOrEqualTo: function (key, value) {
			// Baas._log("Baas.Query.prototype greaterThanOrEqualTo: function (key, value) { arguments", arguments);
			this._addCondition(key, "$gte", value);
			return this;
		},

		containedIn: function (key, values) {
			// Baas._log("Baas.Query.prototype containedIn: function (key, values) { arguments", arguments);
			this._addCondition(key, "$in", values);
			return this;
		},

		notContainedIn: function (key, values) {
			// Baas._log("Baas.Query.prototype notContainedIn: function (key, values) { arguments", arguments);
			this._addCondition(key, "$nin", values);
			return this;
		},

		containsAll: function (key, values) {
			// Baas._log("Baas.Query.prototype containsAll: function (key, values) { arguments", arguments);
			this._addCondition(key, "$all", values);
			return this;
		},

		exists: function (key) {
			// Baas._log("Baas.Query.prototype exists: function (key) { arguments", arguments);
			this._addCondition(key, "$exists", true);
			return this;
		},

		doesNotExist: function (key) {
			// Baas._log("Baas.Query.prototype doesNotExist: function (key) { arguments", arguments);
			this._addCondition(key, "$exists", false);
			return this;
		},

		matches: function (key, regex, modifiers) {
			// Baas._log("Baas.Query.prototype matches: function (key, regex, modifiers) { arguments", arguments);
			this._addCondition(key, "$regex", regex);
			if (!modifiers) {
				modifiers = "";
			}
			if (regex.ignoreCase) {
				modifiers += 'i';
			}
			if (regex.multiline) {
				modifiers += 'm';
			}

			if (modifiers && modifiers.length) {
				this._addCondition(key, "$options", modifiers);
			}
			return this;
		},

		inQuery: function (key, query) {
			// Baas._log("Baas.Query.prototype inQuery: function (key, query) { arguments", arguments);
			var queryJSON = query.toJSON();
			queryJSON.dataName = query.dataName;
			this._addCondition("$inQuery", "query", {
				where : queryJSON.where,
				dataName : queryJSON.dataName
			});
			this._addCondition("$inQuery", "key", key);
			return this;
		},

		notInQuery: function (key, query) {
			// Baas._log("Baas.Query.prototype notInQuery: function (key, query) { arguments", arguments);
			var queryJSON = query.toJSON();
			queryJSON.dataName = query.dataName;
			this._addCondition("$notInQuery", "query", {
				where : queryJSON.where,
				dataName : queryJSON.dataName
			});
			this._addCondition("$notInQuery", "key", key);
			return this;
		},

		selectWhere: function (key, queryKey, query) {
			// Baas._log("Baas.Query.prototype selectWhere: function (key, queryKey, query) { arguments", arguments);
			var queryJSON = query.toJSON();
			queryJSON.dataName = query.dataName;
			// Baas._log("queryJSON", queryJSON);
			this._addCondition(key, "$select", {
				key: queryKey,
				where: queryJSON.where,
				dataName: queryJSON.dataName
			});
			return this;
		},

		dontSelectWhere: function (key, queryKey, query) {
			// Baas._log("Baas.Query.prototype dontSelectWhere: function (key, queryKey, query) { arguments", arguments);
			var queryJSON = query.toJSON();
			queryJSON.dataName = query.dataName;
			this._addCondition(key, "$dontSelect", {
				key: queryKey,
				where: queryJSON.where,
				dataName: queryJSON.dataName
			});
			return this;
		},

		_orQuery: function (queries) {
			// Baas._log("Baas.Query.prototype _orQuery: function (queries) { arguments", arguments);
			var queryJSON = _.map(queries, function (q) {
				return q.toJSON().where;
			});

			this._where.$or = queryJSON;
			return this;
		},

		contains: function (key, value) {
			// Baas._log("Baas.Query.prototype contains: function (key, value) { arguments", arguments);
			this._addCondition(key, "$like", {
				"__contains": value
			});
			return this;
		},

		startWith: function (key, value) {
			// Baas._log("Baas.Query.prototype startWith: function (key, value) { arguments", arguments);
			this._addCondition(key, "$like", {
				"__startWith": value
			});
			return this;
		},

		endWith: function (key, value) {
			// Baas._log("Baas.Query.prototype endWith: function (key, value) { arguments", arguments);
			this._addCondition(key, "$like", {
				"__endWith": value
			});
			return this;
		},

		ascending: function (key) {
			// Baas._log("Baas.Query.prototype ascending: function (key) { arguments", arguments);
			this._order = key;
			return this;
		},

		descending: function (key) {
			// Baas._log("Baas.Query.prototype descending: function (key) { arguments", arguments);
			this._order = "-" + key;
			return this;
		},

		near: function (key, point) {
			// Baas._log("Baas.Query.prototype near: function (key, point) { arguments", arguments);
			if (!(point instanceof Baas.GeoPoint)) {
				point = new Baas.GeoPoint(point);
			}
			this._addCondition(key, "$nearSphere", point);
			return this;
		},

		withinRadians: function (key, point, distance) {
			// Baas._log("Baas.Query.prototype withinRadians: function (key, point, distance) { arguments", arguments);
			this.near(key, point);
			this._addCondition(key, "$maxDistanceInRadians", distance);
			return this;
		},

		withinMiles: function (key, point, distance) {
			// Baas._log("Baas.Query.prototype withinMiles: function (key, point, distance) { arguments", arguments);
			this.near(key, point);
			// this._addCondition(key, "$maxDistanceInMiles", distance / 3958.8);
			this._addCondition(key, "$maxDistanceInMiles", distance);
			return this;
		},

		withinKilometers: function (key, point, distance) {
			// Baas._log("Baas.Query.prototype withinKilometers: function (key, point, distance) { arguments", arguments);
			this.near(key, point);
			// this._addCondition(key, "$maxDistanceInKilometers", distance / 6371.0);
			this._addCondition(key, "$maxDistanceInKilometers", distance);
			return this;
		},

		geoWithin: function (key, southwest, northeast) {
			// Baas._log("Baas.Query.prototype geoWithin: function (key, southwest, northeast) { arguments", arguments);
			if (!(southwest instanceof Baas.GeoPoint)) {
				southwest = new Baas.GeoPoint(southwest);
			}
			if (!(northeast instanceof Baas.GeoPoint)) {
				northeast = new Baas.GeoPoint(northeast);
			}
			this._addCondition(key, '$geoWithin', {
				'$box': [southwest, northeast]
			});
			return this;
		},

		include: function () {
			// Baas._log("Baas.Query.prototype include: function () { arguments", arguments);
			var self = this;
			Baas._arrayEach(arguments, function (key) {
				// Baas._log("Baas.Query.prototype include Baas._arrayEach(arguments, function (key) { arguments", arguments);
				if (_.isArray(key)) {
					self._include = self._include.concat(key);
				} else {
					self._include.push(key);
				}
			});
			return this;
		},

		select: function () {
			// Baas._log("Baas.Query.prototype select: function () { arguments", arguments);
			var self = this;
			this._select = this._select || [];
			Baas._arrayEach(arguments, function (key) {
				// Baas._log("Baas.Query.prototype select Baas._arrayEach(arguments, function (key) { arguments", arguments);
				if (_.isArray(key)) {
					self._select = self._select.concat(key);
				} else {
					self._select.push(key);
				}
			});
			return this;
		},

		each: function (callback, options) {
			// Baas._log("Baas.Query.prototype each: function (callback, options) { arguments", arguments);
			options = options || {};

			if (this._order || this._skip || (this._limit >= 0)) {
				var error = "Cannot iterate on a query with sort, skip, or limit.";
				return Baas.Promise.error(error)._thenRunCallbacks(options);
			}

			var promise = new Baas.Promise();

			var query = new Baas.Query(this.objectTable);
			query._limit = options.batchSize || 100;
			query._where = _.clone(this._where);
			query._include = _.clone(this._include);

			query.ascending('objectId');

			var finished = false;
			return Baas.Promise._continueWhile( function () {
				return !finished;
			},
			function () {
				// Baas._log("Baas.Query.prototype each function () { arguments", arguments);
				return query.find().then( function (results) {
					// Baas._log("Baas.Query.prototype each: return query.find().then( function (results) { arguments", arguments);
					var callbacksDone = Baas.Promise.as();
					Baas._.each( results, function (result) {
						// Baas._log("Baas.Query.prototype each: Baas._.each( results, function (result) { arguments", arguments);
						callbacksDone = callbacksDone.then(function () {
							// Baas._log("Baas.Query.prototype each: callbacksDone = callbacksDone.then(function () { arguments", arguments);
							return callback(result);
						});
					});

					return callbacksDone.then(function () {
						// Baas._log("Baas.Query.prototype each: return callbacksDone.then(function () { arguments", arguments);
						if (results.length >= query._limit) {
							query.greaterThan("objectId", results[results.length - 1].id);
						} else {
							finished = true;
						}
					});
				});
			})._thenRunCallbacks(options);
		}
	})

}(this));

(function(root) {
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	var _ = Baas._;

	Baas.Op = function() {
		// Baas._log("Baas.Op = function() { arguments", arguments);
		this._initialize.apply(this, arguments);
	};

	Baas.Op.prototype = {
		_initialize : function() {
			// Baas._log("Baas.Op.prototype _initialize : function() { arguments", arguments);
		}
	};

	_.extend(Baas.Op, {
		_extend : Baas._extend,
		_opDecoderMap : {},
		_registerDecoder : function(opName, decoder) {
			// Baas._log("Baas.Op _registerDecoder : function(opName, decoder) { arguments", arguments);
			Baas.Op._opDecoderMap[opName] = decoder;
		},

		_decode : function(json) {
			// Baas._log("Baas.Op _decode : function(json) { arguments", arguments);
			var decoder = Baas.Op._opDecoderMap[json.__op];
			if (decoder) {
				return decoder(json);
			} else {
				return undefined;
			}
		}
	});

	Baas.Op._registerDecoder("Batch", function(json) {
		// Baas._log("Baas.Op._registerDecoder(\"Batch\", function(json) { arguments", arguments);
		var op = null;
		Baas._arrayEach(json.ops, function(nextOp) {
			// Baas._log("Baas._arrayEach(json.ops, function(nextOp) { arguments", arguments);
			nextOp = Baas.Op._decode(nextOp);
			op = nextOp._mergeWithPrevious(op);
		});
		return op;
	});

	Baas.Op.Set = Baas.Op._extend({
		_initialize : function(value) {
			// Baas._log("Baas.Op.Set _initialize : function(value) { arguments", arguments);
			this._value = value;
		},

		value : function() {
			// Baas._log("Baas.Op.Set value : function() { arguments", arguments);
			return this._value;
		},

		toJSON : function() {
			// Baas._log("Baas.Op.Set toJSON : function() { arguments", arguments);
			return Baas._encode(this.value());
		},

		_mergeWithPrevious : function(previous) {
			// Baas._log("Baas.Op.Set _mergeWithPrevious : function(previous) { arguments", arguments);
			return this;
		},

		_estimate : function(oldValue) {
			// Baas._log("Baas.Op.Set _estimate : function(oldValue) { arguments", arguments);
			return this.value();
		}
	});

	Baas.Op._UNSET = {};

	Baas.Op.Unset = Baas.Op._extend({
		toJSON : function() {
			// Baas._log("Baas.Op.Unset toJSON : function() { arguments", arguments);
			return {
				__op : "Delete"
			};
		},

		_mergeWithPrevious : function(previous) {
			// Baas._log("Baas.Op.Unset _mergeWithPrevious : function(previous) { arguments", arguments);
			return this;
		},

		_estimate : function(oldValue) {
			// Baas._log("Baas.Op.Unset _estimate : function(oldValue) { arguments", arguments);
			return Baas.Op._UNSET;
		}
	});

	Baas.Op._registerDecoder("Delete", function(json) {
		// Baas._log("Baas.Op._registerDecoder(\"Delete\", function(json) { arguments", arguments);
		return new Baas.Op.Unset();
	});

	Baas.Op.Increment = Baas.Op._extend({

		_initialize : function(amount) {
			// Baas._log("Baas.Op.Increment _initialize : function(amount) { arguments", arguments);
			this._amount = amount;
		},

		amount : function() {
			// Baas._log("Baas.Op.Increment amount : function() { arguments", arguments);
			return this._amount;
		},

		toJSON : function() {
			// Baas._log("Baas.Op.Increment toJSON : function() { arguments", arguments);
			return {
				__op : "Increment",
				amount : this._amount
			};
		},

		_mergeWithPrevious : function(previous) {
			// Baas._log("Baas.Op.Increment _mergeWithPrevious : function(previous) { arguments", arguments);
			if (!previous) {
				return this;
			} else if (previous instanceof Baas.Op.Unset) {
				return new Baas.Op.Set(this.amount());
			} else if (previous instanceof Baas.Op.Set) {
				return new Baas.Op.Set(previous.value() + this.amount());
			} else if (previous instanceof Baas.Op.Increment) {
				return new Baas.Op.Increment(this.amount()
						+ previous.amount());
			} else {
				throw "Op is invalid after previous op.";
			}
		},

		_estimate : function(oldValue) {
			// Baas._log("Baas.Op.Increment _estimate : function(oldValue) { arguments", arguments);
			if (!oldValue) {
				return this.amount();
			}
			return oldValue + this.amount();
		}
	});

	Baas.Op._registerDecoder("Increment", function(json) {
		// Baas._log("Baas.Op._registerDecoder(\"Increment\", function(json) { arguments", arguments);
		return new Baas.Op.Increment(json.amount);
	});

	Baas.Op.Add = Baas.Op._extend({
		_initialize : function(objects) {
			// Baas._log("Baas.Op.Add _initialize : function(objects) { arguments", arguments);
			this._objects = objects;
		},

		objects : function() {
			// Baas._log("Baas.Op.Add objects : function() { arguments", arguments);
			return this._objects;
		},

		toJSON : function() {
			// Baas._log("Baas.Op.Add toJSON : function() { arguments", arguments);
			return {
				__op : "Add",
				objects : Baas._encode(this.objects())
			};
		},

		_mergeWithPrevious : function(previous) {
			// Baas._log("Baas.Op.Add _mergeWithPrevious : function(previous) { arguments", arguments);
			if (!previous) {
				return this;
			} else if (previous instanceof Baas.Op.Unset) {
				return new Baas.Op.Set(this.objects());
			} else if (previous instanceof Baas.Op.Set) {
				return new Baas.Op.Set(this._estimate(previous.value()));
			} else if (previous instanceof Baas.Op.Add) {
				return new Baas.Op.Add(previous.objects()
						.concat(this.objects()));
			} else {
				throw "Op is invalid after previous op.";
			}
		},

		_estimate : function(oldValue) {
			// Baas._log("Baas.Op.Add _estimate : function(oldValue) { arguments", arguments);
			if (!oldValue) {
				return _.clone(this.objects());
			} else {
				return oldValue.concat(this.objects());
			}
		}
	});

	Baas.Op._registerDecoder("Add", function(json) {
		// Baas._log("Baas.Op._registerDecoder(\"Add\", function(json) { arguments", arguments);
		return new Baas.Op.Add(Baas._decode(undefined, json.objects));
	});

	Baas.Op.AddUnique = Baas.Op._extend({

		_initialize : function(objects) {
			// Baas._log("Baas.Op.AddUnique _initialize : function(objects) { arguments", arguments);
			this._objects = _.uniq(objects);
		},

		objects : function() {
			// Baas._log("Baas.Op.AddUnique objects : function() { arguments", arguments);
			return this._objects;
		},

		toJSON : function() {
			// Baas._log("Baas.Op.AddUnique toJSON : function() { arguments", arguments);
			return {
				__op : "AddUnique",
				objects : Baas._encode(this.objects())
			};
		},

		_mergeWithPrevious : function(previous) {
			// Baas._log("Baas.Op.AddUnique _mergeWithPrevious : function(previous) { arguments", arguments);
			if (!previous) {
				return this;
			} else if (previous instanceof Baas.Op.Unset) {
				return new Baas.Op.Set(this.objects());
			} else if (previous instanceof Baas.Op.Set) {
				return new Baas.Op.Set(this._estimate(previous.value()));
			} else if (previous instanceof Baas.Op.AddUnique) {
				return new Baas.Op.AddUnique(this._estimate(previous.objects()));
			} else {
				throw "Op is invalid after previous op.";
			}
		},

		_estimate : function(oldValue) {
			// Baas._log("Baas.Op.AddUnique _estimate : function(oldValue) { arguments", arguments);
			if (!oldValue) {
				return _.clone(this.objects());
			} else {
				var newValue = _.clone(oldValue);
				Baas._arrayEach(this.objects(), function(obj) {
					// Baas._log("Baas.Op.AddUnique _estimate Baas._arrayEach(this.objects(), function(obj) { arguments", arguments);
					if (obj instanceof Baas.Object && obj.id) {
						var matchingObj = _.find(newValue, function(anObj) {
							// Baas._log("Baas.Op.AddUnique _estimate var matchingObj = _.find(newValue, function(anObj) { arguments", arguments);
							return (anObj instanceof Baas.Object) && (anObj.id === obj.id);
						});
						if (!matchingObj) {
							newValue.push(obj);
						} else {
							var index = _.indexOf(newValue, matchingObj);
							newValue[index] = obj;
						}
					} else if (!_.contains(newValue, obj)) {
						newValue.push(obj);
					}
				});
				return newValue;
			}
		}
	});

	Baas.Op._registerDecoder("AddUnique", function(json) {
		// Baas._log("Baas.Op._registerDecoder(\"AddUnique\", function(json) { arguments", arguments);
		return new Baas.Op.AddUnique(Baas._decode(undefined, json.objects));
	});

	Baas.Op.Remove = Baas.Op._extend({
		_initialize : function(objects) {
			// Baas._log("Baas.Op.Remove _initialize : function(objects) { arguments", arguments);
			this._objects = _.uniq(objects);
		},

		objects : function() {
			// Baas._log("Baas.Op.Remove objects : function() { arguments", arguments);
			return this._objects;
		},

		toJSON : function() {
			// Baas._log("Baas.Op.Remove toJSON : function() { arguments", arguments);
			return {
				__op : "Remove",
				objects : Baas._encode(this.objects())
			};
		},

		_mergeWithPrevious : function(previous) {
			// Baas._log("Baas.Op.Remove _mergeWithPrevious : function(previous) { arguments", arguments);
			if (!previous) {
				return this;
			} else if (previous instanceof Baas.Op.Unset) {
				return previous;
			} else if (previous instanceof Baas.Op.Set) {
				return new Baas.Op.Set(this._estimate(previous.value()));
			} else if (previous instanceof Baas.Op.Remove) {
				return new Baas.Op.Remove(_.union(previous.objects(), this.objects()));
			} else {
				throw "Op is invalid after previous op.";
			}
		},

		_estimate : function(oldValue) {
			// Baas._log("Baas.Op.Remove _estimate : function(oldValue) { arguments", arguments);
			if (!oldValue) {
				return [];
			} else {
				var newValue = _.difference(oldValue, this.objects());
				Baas._arrayEach(this.objects(), function(obj) {
					// Baas._log("Baas.Op.Remove _estimate Baas._arrayEach(this.objects(), function(obj) { arguments", arguments);
					if (obj instanceof Baas.Object && obj.id) {
						newValue = _.reject(newValue, function(other) {
							// Baas._log("Baas.Op.Remove _estimate newValue = _.reject(newValue, function(other) { arguments", arguments);
							return (other instanceof Baas.Object) && (other.id === obj.id);
						});
					}
				});
				return newValue;
			}
		}
	});

	Baas.Op._registerDecoder("Remove", function(json) {
		// Baas._log("Baas.Op._registerDecoder(\"Remove\", function(json) { arguments", arguments);
		return new Baas.Op.Remove(Baas._decode(undefined, json.objects));
	});

	Baas.Op.Relation = Baas.Op._extend({

		_initialize : function(adds, removes) {
			// Baas._log("Baas.Op.Relation _initialize : function(adds, removes) { arguments", arguments);
			this._targetTableName = null;

			var self = this;

			var pointerToId = function(object) {
				// Baas._log("Baas.Op.Relation var pointerToId = function(object) { arguments", arguments);
				
				if (object instanceof Baas.Object) {
					if (!object.id) {
						throw "You can't add an unsaved Baas.Object to a relation.";
					}
					if (!self._targetTableName) {
						self._targetTableName = object.dataName;
					}
					if (self._targetTableName !== object.dataName) {
						throw "Tried to create a Baas.Relation with 2 different types: "
								+ self._targetTableName
								+ " and "
								+ object.dataName + ".";
					}
					return object.id;
				}
				return object;
			};

			this.relationsToAdd = _.uniq(_.map(adds, pointerToId));
			this.relationsToRemove = _.uniq(_.map(removes, pointerToId));
		},

		added : function() {
			// Baas._log("Baas.Op.Relation added : function() { arguments", arguments);
			var self = this;
			return _.map(this.relationsToAdd, function(objectId) {
				// Baas._log("Baas.Op.Relation added : return _.map(this.relationsToAdd, function(objectId) { arguments", arguments);
				var object = Baas.Object._create(self._targetTableName);
				object.id = objectId;
				return object;
			});
		},

		removed : function() {
			// Baas._log("Baas.Op.Relation removed : function() { arguments", arguments);
			var self = this;
			return _.map(this.relationsToRemove, function(objectId) {
				// Baas._log("Baas.Op.Relation removed : return _.map(this.relationsToRemove, function(objectId) { arguments", arguments);
				var object = Baas.Object._create(self._targetTableName);
				object.id = objectId;
				return object;
			});
		},

		toJSON : function() {
			// Baas._log("Baas.Op.Relation toJSON : function() { arguments", arguments);
			var adds = null;
			var removes = null;
			var self = this;
			var idToPointer = function(id) {
				// Baas._log("var idToPointer = function(id) { arguments", arguments);
				return {
					__type : 'Relation',
					dataName : self._targetTableName,
					objectId : id
				};
			};
			var pointers = null;
			if (this.relationsToAdd.length > 0) {
				pointers = _.map(this.relationsToAdd, idToPointer);
				adds = {
					"__op" : "AddRelation",
					"objects" : pointers
				};
			}

			if (this.relationsToRemove.length > 0) {
				pointers = _.map(this.relationsToRemove, idToPointer);
				removes = {
					"__op" : "RemoveRelation",
					"objects" : pointers
				};
			}

			if (adds && removes) {
				return {
					"__op" : "Batch",
					"ops" : [ adds, removes ]
				};
			}

			return adds || removes || {};
		},

		_mergeWithPrevious : function(previous) {
			// Baas._log("Baas.Op.Relation _mergeWithPrevious : function(previous) { arguments", arguments);
			if (!previous) {
				return this;
			} else if (previous instanceof Baas.Op.Unset) {
				throw "You can't modify a relation after deleting it.";
			} else if (previous instanceof Baas.Op.Relation) {
				if (previous._targetTableName
						&& previous._targetTableName !== this._targetTableName) {
					throw "Related object must be of data "
							+ previous._targetTableName + ", but "
							+ this._targetTableName + " was passed in.";
				}
				var newAdd = _.union(
					_.difference(
						previous.relationsToAdd, 
						this.relationsToRemove
					), this.relationsToAdd);
				var newRemove = _.union(
					_.difference(
						previous.relationsToRemove,
						this.relationsToAdd
					),this.relationsToRemove);
				var newRelation = new Baas.Op.Relation(newAdd,
						newRemove);
				newRelation._targetTableName = this._targetTableName;
				return newRelation;
			} else {
				throw "Op is invalid after previous op.";
			}
		},

		_estimate : function(oldValue, object, key) {
			// Baas._log("Baas.Op.Relation _estimate : function(oldValue, object, key) { arguments", arguments);
			if (!oldValue) {
				var relation = new Baas.Relation(object, key);
				relation.targetTableName = this._targetTableName;
			} else if (oldValue instanceof Baas.Relation) {
				if (this._targetTableName) {
					if (oldValue.targetTableName) {
						if (oldValue.targetTableName !== this._targetTableName) {
							throw "Related object must be a "
									+ oldValue.targetTableName
									+ ", but a "
									+ this._targetTableName
									+ " was passed in.";
						}
					} else {
						oldValue.targetTableName = this._targetTableName;
					}
				}
				return oldValue;
			} else {
				throw "Op is invalid after previous op.";
			}
		}
	});

	Baas.Op._registerDecoder("AddRelation", function(json) {
		// Baas._log("Baas.Op._registerDecoder(\"AddRelation\", function(json) { arguments", arguments);
		return new Baas.Op.Relation(Baas._decode(undefined, json.objects), []);
	});
	Baas.Op._registerDecoder("RemoveRelation", function(json) {
		// Baas._log("Baas.Op._registerDecoder(\"RemoveRelation\", function(json) { arguments", arguments);
		return new Baas.Op.Relation([], Baas._decode(undefined, json.objects));
	});

}(this));

(function(root) {
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	var _ = Baas._;

	Baas.Relation = function(parent, key) {
		// Baas._log("Baas.Relation = function(parent, key) { arguments", arguments);
		this.parent = parent;
		this.key = key;
		this.targetTableName = null;
	};

	_.extend(Baas.Relation.prototype, {
		_ensureParentAndKey : function(parent, key) {
			// Baas._log("Baas.Relation.prototype _ensureParentAndKey : function(parent, key) { arguments", arguments);
			this.parent = this.parent || parent;
			this.key = this.key || key;
			if (this.parent !== parent) {
				throw "Internal Error. Relation retrieved from two different Objects.";
			}
			if (this.key !== key) {
				throw "Internal Error. Relation retrieved from two different keys.";
			}
		},

		add : function(objects) {
			// Baas._log("Baas.Relation.prototype add : function(objects) { arguments", arguments);
			if (!_.isArray(objects)) {
				objects = [ objects ];
			}

			var change = new Baas.Op.Relation(objects, []);
			this.parent.set(this.key, change);
			this.targetTableName = change._targetTableName;
		},

		remove : function(objects) {
			// Baas._log("Baas.Relation.prototype remove : function(objects) { arguments", arguments);
			if (!_.isArray(objects)) {
				objects = [ objects ];
			}

			var change = new Baas.Op.Relation([], objects);
			this.parent.set(this.key, change);
			this.targetTableName = change._targetTableName;
		},

		toJSON : function() {
			// Baas._log("Baas.Relation.prototype toJSON : function() { arguments", arguments);
			return {
				"__type" : "Relation",
				"dataName" : this.targetTableName
			};
		},

		relatedTo : function() {
			// Baas._log("Baas.Relation.prototype query : function() { arguments", arguments);
			// Baas._log("Baas.Relation.prototype query : function() { this", this);
			// Baas._log("Baas.Relation.prototype query : function() { this.parent", this.parent);
			var targetTable;
			var query;
			if (!this.targetTableName) {
				targetTable = Baas.Object._getSubdata(this.parent.dataName);
				query = new Baas.Query(targetTable);
				query._extraOptions.redirectTableNameForKey = this.key;
			} else {
				targetTable = Baas.Object._getSubdata(this.targetTableName);
				query = new Baas.Query(targetTable);
			}
			query._addCondition("$relatedTo", "object", this.parent._toRelation());
			query._addCondition("$relatedTo", "key", this.key);

			return query;
		}, 

		notRelatedTo : function() {
			// Baas._log("Baas.Relation.prototype query : function() { arguments", arguments);
			// Baas._log("Baas.Relation.prototype query : function() { this", this);
			// Baas._log("Baas.Relation.prototype query : function() { this.parent", this.parent);
			var targetTable;
			var query;
			if (!this.targetTableName) {
				targetTable = Baas.Object._getSubdata(this.parent.dataName);
				query = new Baas.Query(targetTable);
				query._extraOptions.redirectTableNameForKey = this.key;
			} else {
				targetTable = Baas.Object._getSubdata(this.targetTableName);
				query = new Baas.Query(targetTable);
			}
			query._addCondition("$notRelatedTo", "object", this.parent._toRelation());
			query._addCondition("$notRelatedTo", "key", this.key);

			return query;
		}
	});

}(this));

(function(root) {
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	var _ = Baas._;

	var PUBLIC_KEY = "*";

	Baas.ACL = function(arg1) {
		// Baas._log("Baas.ACL = function(arg1) { arguments", arguments);
		var self = this;
		// self.permissionsById = {};
		if (_.isObject(arg1)) {
			if (arg1 instanceof Baas.User) {
				self.setReadAccess(arg1, true);
				self.setWriteAccess(arg1, true);
			} else {
				if (_.isFunction(arg1)) {
					throw "Baas.ACL 함수를 호출해주세요.";
				}
				Baas._objectEach( arg1, function(accessList, userId) {
					// Baas._log("Baas._objectEach( arg1, function(accessList, userId) { arguments", arguments);
					if (!_.isString(userId)) {
						throw "userId의 정보가 잘못 되었습니다.";
					}
					// self.permissionsById[userId] = {};
					self[userId] = {};
					Baas._objectEach( accessList, function(allowed, permission) {
						// Baas._log("Baas._objectEach( accessList, function(allowed, permission) { arguments", arguments);
						if (permission !== "read" && permission !== "write") {
							throw "ACL 권한 타입이 유효하지 않습니다.";
						}
						if (!_.isBoolean(allowed)) {
							throw "ACL 권한 값이 유효하지 않습니다.";
						}
						// self.permissionsById[userId][permission] = allowed;
						self[userId][permission] = allowed;
					});
				});
			}
		}
		// Baas._log("Baas.ACL End this", this);
	};

	Baas.ACL.prototype.toJSON = function() {
		// Baas._log("Baas.ACL.prototype.toJSON = function() { arguments", arguments);
		// // Baas._log("Baas.ACL.prototype.toJSON this", this);
		// return _.clone(this.permissionsById);
		return _.clone(this);
	};

	Baas.ACL.prototype._setAccess = function(accessType, userId, allowed) {
		// Baas._log("Baas.ACL.prototype._setAccess = function(accessType, userId, allowed) { arguments", arguments);
		// // Baas._log("Baas.ACL.prototype._setAccess this", this);
		// // Baas._log("Baas.ACL.prototype._setAccess accessType", accessType);
		// // Baas._log("Baas.ACL.prototype._setAccess userId", userId);
		// // Baas._log("Baas.ACL.prototype._setAccess allowed", allowed);
		if (userId instanceof Baas.User) {
			userId = userId.id;
		} else if (userId instanceof Baas.Role) {
			userId = "role:" + userId.getName();
		}
		if (!_.isString(userId)) {
			throw "userId must be a string.";
		}
		if (!_.isBoolean(allowed)) {
			throw "allowed must be either true or false.";
		}
		// var permissions = this.permissionsById[userId];
		var permissions = this[userId];
		if (!permissions) {
			if (!allowed) {
				return;
			} else {
				permissions = {};
				// this.permissionsById[userId] = permissions;
				this[userId] = permissions;
			}
		}

		if (allowed) {
			// this.permissionsById[userId][accessType] = true;
			this[userId][accessType] = true;
		} else {
			delete permissions[accessType];
			if (_.isEmpty(permissions)) {
				delete permissions[userId];
			}
		}
	};

	Baas.ACL.prototype._getAccess = function(accessType, userId) {
		// Baas._log("Baas.ACL.prototype._getAccess = function(accessType, userId) { arguments", arguments);
		// // Baas._log("Baas.ACL.prototype._getAccess this", this);
		// // Baas._log("Baas.ACL.prototype._getAccess accessType", accessType);
		// // Baas._log("Baas.ACL.prototype._getAccess userId", userId);
		if (userId instanceof Baas.User) {
			userId = userId.id;
		} else if (userId instanceof Baas.Role) {
			userId = "role:" + userId.getName();
		}
		// var permissions = this.permissionsById[userId];
		var permissions = this[userId];
		if (!permissions) {
			return false;
		}
		return permissions[accessType] ? true : false;
	};

	Baas.ACL.prototype.setReadAccess = function(userId, allowed) {
		// Baas._log("Baas.ACL.prototype.setReadAccess = function(userId, allowed) { arguments", arguments);
		this._setAccess("read", userId, allowed);
	};

	Baas.ACL.prototype.getReadAccess = function(userId) {
		// Baas._log("Baas.ACL.prototype.getReadAccess = function(userId) { arguments", arguments);
		return this._getAccess("read", userId);
	};

	Baas.ACL.prototype.setWriteAccess = function(userId, allowed) {
		// Baas._log("Baas.ACL.prototype.setWriteAccess = function(userId, allowed) { arguments", arguments);
		this._setAccess("write", userId, allowed);
	};

	Baas.ACL.prototype.getWriteAccess = function(userId) {
		// Baas._log("Baas.ACL.prototype.getWriteAccess = function(userId) { arguments", arguments);
		return this._getAccess("write", userId);
	};

	Baas.ACL.prototype.setPublicReadAccess = function(allowed) {
		// Baas._log("Baas.ACL.prototype.setPublicReadAccess = function(allowed) { arguments", arguments);
		this.setReadAccess(PUBLIC_KEY, allowed);
	};

	Baas.ACL.prototype.getPublicReadAccess = function() {
		// Baas._log("Baas.ACL.prototype.getPublicReadAccess = function() { arguments", arguments);
		return this.getReadAccess(PUBLIC_KEY);
	};

	Baas.ACL.prototype.setPublicWriteAccess = function(allowed) {
		// Baas._log("Baas.ACL.prototype.setPublicWriteAccess = function(allowed) { arguments", arguments);
		this.setWriteAccess(PUBLIC_KEY, allowed);
	};

	Baas.ACL.prototype.getPublicWriteAccess = function() {
		// Baas._log("Baas.ACL.prototype.getPublicWriteAccess = function() { arguments", arguments);
		return this.getWriteAccess(PUBLIC_KEY);
	};

	Baas.ACL.prototype.getRoleReadAccess = function(role) {
		// Baas._log("Baas.ACL.prototype.getRoleReadAccess = function(role) { arguments", arguments);
		if (role instanceof Baas.Role) {
			role = role.getName();
		}
		if (_.isString(role)) {
			return this.getReadAccess("role:" + role);
		}
		throw "role must be a Baas.Role or a String";
	};

	Baas.ACL.prototype.getRoleWriteAccess = function(role) {
		// Baas._log("Baas.ACL.prototype.getRoleWriteAccess = function(role) { arguments", arguments);
		if (role instanceof Baas.Role) {
			role = role.getName();
		}
		if (_.isString(role)) {
			return this.getWriteAccess("role:" + role);
		}
		throw "role must be a Baas.Role or a String";
	};

	Baas.ACL.prototype.setRoleReadAccess = function(role, allowed) {
		// Baas._log("Baas.ACL.prototype.setRoleReadAccess = function(role, allowed) { arguments", arguments);
		if (role instanceof Baas.Role) {
			role = role.getName();
		}
		if (_.isString(role)) {
			this.setReadAccess("role:" + role, allowed);
			return;
		}
		throw "role must be a Baas.Role or a String";
	};

	Baas.ACL.prototype.setRoleWriteAccess = function(role, allowed) {
		// Baas._log("Baas.ACL.prototype.setRoleWriteAccess = function(role, allowed) { arguments", arguments);
		if (role instanceof Baas.Role) {
			role = role.getName();
		}
		if (_.isString(role)) {
			this.setWriteAccess("role:" + role, allowed);
			return;
		}
		throw "role must be a Baas.Role or a String";
	};

}(this));


(function (root) {
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	var _ = Baas._;

	Baas.User = Baas.Object.extend("User", {
		_isCurrentUser: false,

		_mergeMagicFields: function (attrs) {
			// Baas._log("Baas.User _mergeMagicFields: function (attrs) { arguments", arguments);
			if (attrs.sessionToken) {
				this._sessionToken = attrs.sessionToken;
				// delete attrs.sessionToken;
			}
			Baas.User.__super__._mergeMagicFields.call(this, attrs);
		},

		_cleanupAuthData: function () {
			// Baas._log("Baas.User _cleanupAuthData: function () { arguments", arguments);
			if (!this.isCurrent()) {
				return;
			}
			var authData = this.get('authData');
			if (!authData) {
				return;
			}
			Baas._objectEach(this.get('authData'), function (value, key) {
				// Baas._log("Baas.User _cleanupAuthData: Baas._objectEach(this.get('authData'), function (value, key) { arguments", arguments);
				if (!authData[key]) {
					delete authData[key];
				}
			});
		},

		_synchronizeAllAuthData: function () {
			// Baas._log("Baas.User _synchronizeAllAuthData: function () { arguments", arguments);
			var authData = this.get('authData');
			if (!authData) {
				return;
			}

			var self = this;
			Baas._objectEach(this.get('authData'), function (value, key) {
				// Baas._log("Baas.User _synchronizeAllAuthData: Baas._objectEach(this.get('authData'), function (value, key) { arguments", arguments);
				self._synchronizeAuthData(key);
			});
		},

		_synchronizeAuthData: function (provider) {
			// Baas._log("Baas.User _synchronizeAuthData: function (provider) { arguments", arguments);
			if (!this.isCurrent()) {
				return;
			}
			var authType;
			if (_.isString(provider)) {
				authType = provider;
				provider = Baas.User._authProviders[authType];
			} else {
				authType = provider.getAuthType();
			}
			var authData = this.get('authData');
			if (!authData || !provider) {
				return;
			}
			var success = provider.restoreAuthentication(authData[authType]);
			if (!success) {
				this._unlinkFrom(provider);
			}
		},

		_handleSaveResult: function (makeCurrent) {
			// Baas._log("Baas.User _handleSaveResult: function (makeCurrent) { arguments", arguments);
			if (makeCurrent) {
				this._isCurrentUser = true;
			}
			this._cleanupAuthData();
			this._synchronizeAllAuthData();
			delete this._serverData.password;
			this._rebuildEstimatedDataForKey("password");
			this._refreshCache();
			if (makeCurrent || this.isCurrent()) {
				Baas.User._saveCurrentUser(this);
			}
		},

		_linkWith: function (provider, options) {
			// Baas._log("Baas.User _linkWith: function (provider, options) { arguments", arguments);
			var authType;
			if (_.isString(provider)) {
				authType = provider;
				provider = Baas.User._authProviders[provider];
			} else {
				authType = provider.getAuthType();
			}
			if (_.has(options, 'authData')) {
				var authData = this.get('authData') || {};
				authData[authType] = options.authData;
				this.set('authData', authData);

				var newOptions = _.clone(options) || {};
				newOptions.success = function (model) {
					// Baas._log("Baas.User _linkWith: newOptions.success = function (model) { arguments", arguments);
					model._handleSaveResult(true);
					if (options.success) {
						options.success.apply(this, arguments);
					}
				};
				return this.save({
					'authData': authData
				}, newOptions);
			} else {
				var self = this;
				var promise = new Baas.Promise();
				provider.authenticate({
					success: function (provider, result) {
						// Baas._log("success: function (provider, result) { arguments", arguments);
						self._linkWith(provider, {
							authData: result,
							success: options.success,
							error: options.error
						}).then(function () {
							promise.resolve(self);
						});
					},
					error: function (provider, error) {
						// Baas._log("error: function (provider, error) { arguments", arguments);
						if (options.error) {
							options.error(self, error);
						}
						promise.reject(error);
					}
				});
				return promise;
			}
		},

		_unlinkFrom: function (provider, options) {
			// Baas._log("Baas.User _unlinkFrom: function (provider, options) { arguments", arguments);
			var authType;
			if (_.isString(provider)) {
				authType = provider;
				provider = Baas.User._authProviders[provider];
			} else {
				authType = provider.getAuthType();
			}
			var newOptions = _.clone(options);
			var self = this;
			newOptions.authData = null;
			newOptions.success = function (model) {
				// Baas._log("Baas.User _unlinkFrom: newOptions.success = function (model) { arguments", arguments);
				self._synchronizeAuthData(provider);
				if (options.success) {
					options.success.apply(this, arguments);
				}
			};
			return this._linkWith(provider, newOptions);
		},

		_isLinked: function (provider) {
			// Baas._log("Baas.User _isLinked: function (provider) { arguments", arguments);
			var authType;
			if (_.isString(provider)) {
				authType = provider;
			} else {
				authType = provider.getAuthType();
			}
			var authData = this.get('authData') || {};
			return !!authData[authType];
		},

		_logOutWithAll: function () {
			// Baas._log("Baas.User _logOutWithAll: function () { arguments", arguments);
			var authData = this.get('authData');
			if (!authData) {
				return;
			}
			var self = this;
			Baas._objectEach(this.get('authData'), function (value, key) {
				// Baas._log("Baas.User _logOutWithAll: Baas._objectEach(this.get('authData'), function (value, key) { arguments", arguments);
				self._logOutWith(key);
			});
		},

		_logOutWith: function (provider) {
			// Baas._log("Baas.User _logOutWith: function (provider) { arguments", arguments);
			if (!this.isCurrent()) {
				return;
			}
			if (_.isString(provider)) {
				provider = Baas.User._authProviders[provider];
			}
			if (provider && provider.deauthenticate) {
				provider.deauthenticate();
			}
		},

		signUp: function (attrs, options) {
			// Baas._log("Baas.User signUp: function (attrs, options) { arguments", arguments);
			var error;
			options = options || {};

			var username = (attrs && attrs.username) || this.get("username");
			if (!username || (username === "")) {
				error = new Baas.Error(-1, "username은 필수입니다.");
				if (options && options.error) {
					options.error(this, error);
				}
				return Baas.Promise.error(error);
			}

			var password = (attrs && attrs.password) || this.get("password");
			if (!password || (password === "")) {
				error = new Baas.Error(-1, "password는 필수입니다.");
				if (options && options.error) {
					options.error(this, error);
				}
				return Baas.Promise.error(error);
			}

			var newOptions = _.clone(options);
			newOptions.success = function (model) {
				// Baas._log("Baas.User signUp: newOptions.success = function (model) { arguments", arguments);
				model._handleSaveResult(true);
				if (options.success) {
					options.success.apply(this, arguments);
				}
			};
			return this.save(attrs, newOptions);
		},

		logIn: function (options) {
			// Baas._log("Baas.User logIn: function (options) { arguments", arguments);
			var model = this;
			options = options || {};
			var request = Baas._request({
				route: "login",
				method: "GET",
				data: this.toJSON()
			});
			return request.then(function (resp, status, xhr) {
				// Baas._log("return request.then(function (resp, status, xhr) { arguments", arguments);
				var serverAttrs = model.parse(resp, status, xhr);
				model._finishFetch(serverAttrs);
				model._handleSaveResult(true);
				return model;
			})._thenRunCallbacks(options, this);
		},

		save: function (arg1, arg2, arg3) {
			// Baas._log("Baas.User save: function (arg1, arg2, arg3) { arguments", arguments);
			var i, attrs, current, options, saved;
			if (_.isObject(arg1) || _.isNull(arg1) || _.isUndefined(arg1)) {
				attrs = arg1;
				options = arg2;
			} else {
				attrs = {};
				attrs[arg1] = arg2;
				options = arg3;
			}
			options = options || {};

			var newOptions = _.clone(options);
			newOptions.success = function (model) {
				// Baas._log("Baas.User save: newOptions.success = function (model) { arguments", arguments);
				model._handleSaveResult(false);
				if (options.success) {
					options.success.apply(this, arguments);
				}
			};
			return Baas.Object.prototype.save.call(this, attrs,newOptions);
		},

		fetch: function (options) {
			// Baas._log("Baas.User fetch: function (options) { arguments", arguments);
			var newOptions = options ? _.clone(options) : {};
			newOptions.success = function (model) {
				// Baas._log("Baas.User fetch: newOptions.success = function (model) { arguments", arguments);
				model._handleSaveResult(false);
				if (options && options.success) {
					options.success.apply(this, arguments);
				}
			};
			return Baas.Object.prototype.fetch.call(this, newOptions);
		},

		isCurrent: function () {
			// Baas._log("Baas.User isCurrent: function () { arguments", arguments);
			return this._isCurrentUser;
		},

		getUsername: function () {
			// Baas._log("Baas.User getUsername: function () { arguments", arguments);
			return this.get("username");
		},

		setUsername: function (username, options) {
			// Baas._log("Baas.User setUsername: function (username, options) { arguments", arguments);
			return this.set("username", username, options);
		},

		setPassword: function (password, options) {
			// Baas._log("Baas.User setPassword: function (password, options) { arguments", arguments);
			return this.set("password", password, options);
		},

		getEmail: function () {
			// Baas._log("Baas.User getEmail: function () { arguments", arguments);
			return this.get("email");
		},

		setEmail: function (email, options) {
			// Baas._log("Baas.User setEmail: function (email, options) { arguments", arguments);
			return this.set("email", email, options);
		},

		authenticated: function () {
			// Baas._log("Baas.User authenticated: function () { arguments", arguments);
			return !!this._sessionToken && (Baas.User.current() && Baas.User.current().id === this.id);
		},

		verifyEmail: function (email, options) {
			// Baas._log("Baas.User verifyEmail: function (options) { arguments", arguments);
			options = options || {};
			var model = this;
			// var email = model.get("email");
			
			// if(Baas._isNullOrUndefined(model.attributes["email"])) {
			if(Baas._isNullOrUndefined(email)) {
				throw "사용자 이메일 정보가 없습니다.";
			}
			var request = Baas._request({
				route: "verifyemail",
				method: "POST",
				// sessionToken: model._sessionToken,
				data: {
					email: email
				}
			});
			return request._thenRunCallbacks(options);
		}

	},

	{
		_currentUser: null,
		_currentUserMatchesDisk: false,
		_CURRENT_USER_KEY: "currentUser",
		_authProviders: {},
		_performUserRewrite: true,

		signUp: function (username, password, attrs, options) {
			// Baas._log("Baas.User signUp: function (username, password, attrs, options) { arguments", arguments);
			attrs = attrs || {};
			attrs.username = username;
			attrs.password = password;
			var user = Baas.Object._create("User");
			return user.signUp(attrs, options);
		},

		logIn: function (username, password, options) {
			// Baas._log("Baas.User logIn: function (username, password, options) { arguments", arguments);
			var user = Baas.Object._create("User");
			user._finishFetch({
				username: username,
				password: password
			});
			return user.logIn(options);
		},

		become: function (sessionToken, options) {
			// Baas._log("Baas.User become: function (sessionToken, options) { arguments", arguments);
			options = options || {};

			var user = Baas.Object._create("User");
			return Baas._request({
				route: "users",
				dataName: "me",
				method: "GET",
				sessionToken: sessionToken
			}).then(function (resp, status, xhr) {
				// Baas._log("}).then(function (resp, status, xhr) { arguments", arguments);
				var serverAttrs = user.parse(resp, status, xhr);
				user._finishFetch(serverAttrs);
				user._handleSaveResult(true);
				return user;
			})._thenRunCallbacks(options, user);
		},

		logOut: function () {
			// Baas._log("Baas.User logOut: function () { arguments", arguments);
			if (Baas.User._currentUser !== null) {
				Baas.User._currentUser._logOutWithAll();
				Baas.User._currentUser._isCurrentUser = false;
			}
			Baas.User._currentUserMatchesDisk = true;
			Baas.User._currentUser = null;
			Baas.localStorage.removeItem(Baas._getBaasPath(Baas.User._CURRENT_USER_KEY));
		},

		resetPassword: function (email, options) {
			// Baas._log("Baas.User resetPassword: function (email, options) { arguments", arguments);
			options = options || {};
			var request = Baas._request({
				route: "resetpassword",
				method: "POST",
				data: {
					email: email
				}
			});
			return request._thenRunCallbacks(options);
		},

		current: function () {
			// Baas._log("Baas.User current: function () { arguments", arguments);
			if (Baas.User._currentUser) {
				return Baas.User._currentUser;
			}

			if (Baas.User._currentUserMatchesDisk) {

				return Baas.User._currentUser;
			}

			Baas.User._currentUserMatchesDisk = true;

			var userData = Baas.localStorage.getItem(Baas._getBaasPath(Baas.User._CURRENT_USER_KEY));
			if (!userData) {

				return null;
			}
			Baas.User._currentUser = Baas.Object._create("User");
			Baas.User._currentUser._isCurrentUser = true;

			var json = JSON.parse(userData);
			Baas.User._currentUser.id = json._id;
			delete json._id;
			Baas.User._currentUser._sessionToken = json._sessionToken;
			delete json._sessionToken;
			Baas.User._currentUser.set(json);

			Baas.User._currentUser._synchronizeAllAuthData();
			Baas.User._currentUser._refreshCache();
			Baas.User._currentUser._opSetQueue = [{}];
			return Baas.User._currentUser;
		},

		allowCustomUserTable: function (isAllowed) {
			// Baas._log("Baas.User allowCustomUserTable: function (isAllowed) { arguments", arguments);
			this._performUserRewrite = !isAllowed;
		},

		_saveCurrentUser: function (user) {
			// Baas._log("Baas.User _saveCurrentUser: function (user) { arguments", arguments);
			if (Baas.User._currentUser !== user) {
				Baas.User.logOut();
			}
			user._isCurrentUser = true;
			Baas.User._currentUser = user;
			Baas.User._currentUserMatchesDisk = true;

			var json = user.toJSON();
			json._id = user.id;
			json._sessionToken = user._sessionToken;

			Baas.localStorage.setItem(Baas._getBaasPath(Baas.User._CURRENT_USER_KEY), JSON.stringify(json));
		},

		_registerAuthenticationProvider: function (provider) {
			// Baas._log("Baas.User _registerAuthenticationProvider: function (provider) { arguments", arguments);
			Baas.User._authProviders[provider.getAuthType()] = provider;
			if (Baas.User.current()) {
				Baas.User.current()._synchronizeAuthData(provider.getAuthType());
			}
		},

		_logInWith: function (provider, options) {
			// Baas._log("Baas.User _logInWith: function (provider, options) { arguments", arguments);
			var user = Baas.Object._create("User");
			return user._linkWith(provider, options);
		}

	});
}(this));

(function(root) {
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	var _ = Baas._;

	var PUBLIC_KEY = "*";

	var fbInitialized = false;
	var requestedPermissions;
	var initOptions;
	var provider = {
		authenticate : function(options) {
			// Baas._log("authenticate : function(options) { arguments", arguments);
			var self = this;
			FB.login(function(response) {
				if (response.authResponse) {
					if (options.success) {
						options.success(self, {
							id : response.authResponse.userID,
							accessToken : response.authResponse.accessToken,
							expirationDate : new Date(response.authResponse.expiresIn * 1000 + (new Date()).getTime()).toJSON()
						});
					}
				} else {
					if (options.error) {
						options.error(self, response);
					}
				}
			}, {
				scope : requestedPermissions
			});
		},
		restoreAuthentication : function(authData) {
			// Baas._log("restoreAuthentication : function(authData) { arguments", arguments);
			if (authData) {
				var authResponse = {
					userID : authData.id,
					accessToken : authData.accessToken,
					expiresIn : (Baas._parseDate(authData.expirationDate).getTime() - (new Date()).getTime()) / 1000
				};
				var newOptions = _.clone(initOptions);
				newOptions.authResponse = authResponse;

				newOptions.status = false;

				var existingResponse = FB.getAuthResponse();
				if (existingResponse && existingResponse.userID !== authResponse.userID) {
					FB.logout();
				}

				FB.init(newOptions);
			}
			return true;
		},
		getAuthType : function() {
			// Baas._log("getAuthType : function() { arguments", arguments);
			return "facebook";
		},
		deauthenticate : function() {
			// Baas._log("deauthenticate : function() { arguments", arguments);
			this.restoreAuthentication(null);
		}
	};

	
	Baas.FacebookUtils = {
		
		init : function(options) {
			// Baas._log("Baas.FacebookUtils init : function(options) { arguments", arguments);
			if (typeof (FB) === 'undefined') {
				throw "The Facebook JavaScript SDK must be loaded before calling init.";
			}
			initOptions = _.clone(options) || {};
			if (initOptions.status && typeof (console) !== "undefined") {
				var warn = console.warn || console.log || function() {};
				warn.call( console,
					"The 'status' flag passed into"
					+ " FB.init, when set to true, can interfere with Baas Facebook"
					+ " integration, so it has been suppressed. Please call"
					+ " FB.getLoginStatus() explicitly if you require this behavior.");
			}
			initOptions.status = false;
			FB.init(initOptions);
			Baas.User._registerAuthenticationProvider(provider);
			fbInitialized = true;
		},
		
		isLinked : function(user) {
			// Baas._log("Baas.FacebookUtils isLinked : function(user) { arguments", arguments);
			return user._isLinked("facebook");
		},
		
		logIn : function(permissions, options) {
			// Baas._log("Baas.FacebookUtils logIn : function(permissions, options) { arguments", arguments);
			if (!permissions || _.isString(permissions)) {
				if (!fbInitialized) {
					throw "FacebookUtil이 초기화 되지 않았습니다.";
				}
				requestedPermissions = permissions;
				return Baas.User._logInWith("facebook", options);
			} else {
				var newOptions = _.clone(options) || {};
				newOptions.authData = permissions;
				return Baas.User._logInWith("facebook", newOptions);
			}
		},

		link : function(user, permissions, options) {
			// Baas._log("Baas.FacebookUtils link : function(user, permissions, options) { arguments", arguments);
			if (!permissions || _.isString(permissions)) {
				if (!fbInitialized) {
					throw "FacebookUtil이 초기화 되지 않았습니다.";
				}
				requestedPermissions = permissions;
				return user._linkWith("facebook", options);
			} else {
				var newOptions = _.clone(options) || {};
				newOptions.authData = permissions;
				return user._linkWith("facebook", newOptions);
			}
		},

		unlink : function(user, options) {
			// Baas._log("Baas.FacebookUtils unlink : function(user, options) { arguments", arguments);
			if (!fbInitialized) {
				throw "You must initialize FacebookUtils before calling unlink.";
			}
			return user._unlinkFrom("facebook", options);
		},

		getFbInitialzed: function() {
			return fbInitialized;
		}
	};
}(this));

(function(root) {
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	var _ = Baas._;

	Baas.Role = Baas.Object.extend("Role", {
		constructor : function(name, acl) {
			// Baas._log("Baas.Role constructor : function(name, acl) { arguments", arguments);
			if (_.isString(name) && (acl instanceof Baas.ACL)) {
				Baas.Object.prototype.constructor.call(this, null, null);
				this.setName(name);
				this.setACL(acl);
			} else {
				Baas.Object.prototype.constructor.call(this, name, acl);
			}
		},
		
		getName : function() {
			// Baas._log("Baas.Role getName : function() { arguments", arguments);
			return this.get("name");
		},

		setName : function(name, options) {
			// Baas._log("Baas.Role setName : function(name, options) { arguments", arguments);
			return this.set("name", name, options);
		},

		getUsers : function() {
			// Baas._log("Baas.Role getUsers : function() { arguments", arguments);
			return this.relation("users");
		},

		getRoles : function() {
			// Baas._log("Baas.Role getRoles : function() { arguments", arguments);
			return this.relation("roles");
		},

		validate : function(attrs, options) {
			// Baas._log("Baas.Role validate : function(attrs, options) { arguments", arguments);
			if ("name" in attrs && attrs.name !== this.getName()) {
				var newName = attrs.name;
				if (this.id && this.id !== attrs.objectId) {
					return new Baas.Error(-1, "Role 이름은 저장하기 전에 설정해야 합니다.");
				}
				if (!_.isString(newName)) {
					return new Baas.Error(-1, "Role 이름은 문자열이어야 합니다.");
				}
				if (!(/^[0-9a-zA-Z\-_ ]+$/).test(newName)) {
					return new Baas.Error(-1, "Role 이름에 특수문자를 입력 할 수 없습니다.");
				}
			}
			if (Baas.Object.prototype.validate) {
				return Baas.Object.prototype.validate.call(this, attrs, options);
			}
			return false;
		}
	});
}(this));

(function(root) {
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	var _ = Baas._;

	Baas.GeoPoint = function(arg1, arg2) {
		// Baas._log("Baas.GeoPoint = function(arg1, arg2) { arguments", arguments);
		if (_.isArray(arg1)) {
			Baas.GeoPoint._validate(arg1[0], arg1[1]);
			this.latitude = arg1[0];
			this.longitude = arg1[1];
		} else if (_.isObject(arg1)) {
			Baas.GeoPoint._validate(arg1.latitude, arg1.longitude);
			this.latitude = arg1.latitude;
			this.longitude = arg1.longitude;
		} else if (_.isNumber(arg1) && _.isNumber(arg2)) {
			Baas.GeoPoint._validate(arg1, arg2);
			this.latitude = arg1;
			this.longitude = arg2;
		} else {
			this.latitude = 0;
			this.longitude = 0;
		}

		var self = this;
		if (this.__defineGetter__ && this.__defineSetter__) {
			this._latitude = this.latitude;
			this._longitude = this.longitude;
			this.__defineGetter__("latitude", function() {
				return self._latitude;
			});
			this.__defineGetter__("longitude", function() {
				return self._longitude;
			});
			this.__defineSetter__("latitude", function(val) {
				Baas.GeoPoint._validate(val, self.longitude);
				self._latitude = val;
			});
			this.__defineSetter__("longitude", function(val) {
				Baas.GeoPoint._validate(self.latitude, val);
				self._longitude = val;
			});
		}
	};
	
	Baas.GeoPoint._validate = function(latitude, longitude) {
		// Baas._log("Baas.GeoPoint._validate = function(latitude, longitude) { arguments", arguments);
		if (latitude < -90.0) {
			throw "Baas.GeoPoint latitude " + latitude + " < -90.0.";
		}
		if (latitude > 90.0) {
			throw "Baas.GeoPoint latitude " + latitude + " > 90.0.";
		}
		if (longitude < -180.0) {
			throw "Baas.GeoPoint longitude " + longitude + " < -180.0.";
		}
		if (longitude > 180.0) {
			throw "Baas.GeoPoint longitude " + longitude + " > 180.0.";
		}
	};
	
	Baas.GeoPoint.current = function(options) {
		// Baas._log("Baas.GeoPoint.current = function(options) { arguments", arguments);
		var promise = new Baas.Promise();
		navigator.geolocation.getCurrentPosition(function(location) {
			promise.resolve(new Baas.GeoPoint({
				latitude : location.coords.latitude,
				longitude : location.coords.longitude
			}));

		}, function(error) {
			promise.reject(error);
		});

		return promise._thenRunCallbacks(options);
	};

	_.extend(Baas.GeoPoint.prototype, {
		toJSON : function() {
			// Baas._log("Baas.GeoPoint.prototype toJSON : function() { arguments", arguments);
			Baas.GeoPoint._validate(this.latitude, this.longitude);
			return {
				// "__type" : "GeoPoint",
				latitude : this.latitude,
				longitude : this.longitude
			};
		},
		
		radiansTo : function(point) {
			// Baas._log("Baas.GeoPoint.prototype radiansTo : function(point) { arguments", arguments);
			var d2r = Math.PI / 180.0;
			var lat1rad = this.latitude * d2r;
			var long1rad = this.longitude * d2r;
			var lat2rad = point.latitude * d2r;
			var long2rad = point.longitude * d2r;
			var deltaLat = lat1rad - lat2rad;
			var deltaLong = long1rad - long2rad;
			var sinDeltaLatDiv2 = Math.sin(deltaLat / 2);
			var sinDeltaLongDiv2 = Math.sin(deltaLong / 2);

			var a = ((sinDeltaLatDiv2 * sinDeltaLatDiv2) + (Math.cos(lat1rad)
					* Math.cos(lat2rad) * sinDeltaLongDiv2 * sinDeltaLongDiv2));
			a = Math.min(1.0, a);
			return 2 * Math.asin(Math.sqrt(a));
		},

		kilometersTo : function(point) {
			// Baas._log("Baas.GeoPoint.prototype kilometersTo : function(point) { arguments", arguments);
			return this.radiansTo(point) * 6371.0;
		},

		milesTo : function(point) {
			// Baas._log("Baas.GeoPoint.prototype milesTo : function(point) { arguments", arguments);
			return this.radiansTo(point) * 3958.8;
		}
	});
}(this));

(function(root) {
	root.Baas = root.Baas || {};
	var Baas = root.Baas;
	var _ = Baas._;

	Baas.File = Baas.Object.extend("File", {
		getFrm: function () {
			return this._frm;
			// return this.get("frm");
		},
		setFrm: function (frm, options) {
			this._frm = frm;
			// return this.set("frm", frm, options);
		},
		getName: function() {
			return this._name;
		},
		getUrl: function() {
			return this._url;
		},
		save: function (options) {
			var request = Baas._fileRequest(this, options);
			var self = this;
			return request.then(function(fileObj) {
				// Baas._log("Baas.File save : return request.then(function(obj) { arguments", arguments);
				self._name = fileObj.get("name");
				self._url = fileObj.get("url");
				return self;
			})._thenRunCallbacks(options);
		}
	});
}(this));
