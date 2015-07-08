(function($){
	if (!Array.prototype.filter) {
		Array.prototype.filter = function(fun/*, thisArg*/) {
			'use strict';
			if (this === void 0 || this === null) throw new TypeError();
			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun !== 'function') throw new TypeError();
			var res = [];
			var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
			for (var i = 0; i < len; i++) {
				if (i in t) {
					var val = t[i];       
					if (fun.call(thisArg, val, i, t)) res.push(val);
				}
			}
			return res;
		};
	};
	var groups = {};
	var NAMESPACE = "modernCheckbox";
	$.fn.modernCheckboxOpts = {
			placeholder : true
	};
	var methods = {
			init: function(opts){
				for (var i = 0; i < this.length; i++){
					var self = $(this);
					if (methods["_isCheckbox"].call(this,self)){
						methods["_init"].call(this,self,opts["placeholder"]);
					} else {
						var that = this;
						self.find("input:checkbox").each(function(){
							methods["_init"].call(that,$(this),opts["placeholder"]);
						});
					}
				}
			},
			_init: function(self, placeholder){
				if (!self.hasClass(NAMESPACE)){
					var label = methods["_getLabel"].call(this,self[0].name);
					if (label.length == 0) return;
					self.addClass(NAMESPACE).addClass(NAMESPACE + "_chkbx");
					label.addClass(NAMESPACE + "_lbl");
					if (self.is(":checked")) label.addClass(NAMESPACE + "_checked");
					else label.addClass(NAMESPACE + "_unchecked");
					label.bind("click",methods["_clickHandler"]);
					self.bind("click",methods["_inputClickHandler"]);
					var data = {};
					if (typeof self.attr("data-" + NAMESPACE + "-group") != "undefined"){
						data["group"] = self.attr("data-" + NAMESPACE + "-group");
						data["type"] =  methods["_getElementType"].call(this,self.attr("data-" + NAMESPACE + "-type"));
						methods["_addToGroup"].call(this,label,data["group"],data["type"]);
					}
					data["input"] = self;
					label.data(NAMESPACE,data);
					if (placeholder){
						label.addClass(NAMESPACE + "_placeholder");
						self.addClass(NAMESPACE + "_placeholder");
					}
				}
			},
			_isCheckbox: function(elem){
				return elem[0].tagName.toLowerCase() == 'input' && elem[0].type.toLowerCase() == 'checkbox';
			},
			_getLabel: function(name){
				return $("label[for='" + name + "']");
			}, 
			check: function(){
				var self = $(this);
				if (!self.hasClass(NAMESPACE)) methods["init"].call(this);
				methods["_changeStatus"].call(this,self,"checked");
			}, 
			uncheck: function(){
				var self = $(this);
				if (!self.hasClass(NAMESPACE)) methods["init"].call(this);
				methods["_changeStatus"].call(this,self,"unchecked");
			}, 
			indeterminate: function(){
				var self = $(this);
				if (!self.hasClass(NAMESPACE)) methods["init"].call(this);
				methods["_changeStatus"].call(this,self,"indeterminated");
			},
			_changeStatus: function(self,status){
				var label = self[0].tagName.toLowerCase() == 'label' ? self : methods["_getLabel"].call(this,self[0].name);
				label.removeClass(NAMESPACE + "_checked")
				.removeClass(NAMESPACE + "_unchecked")
				.removeClass(NAMESPACE + "_indeterminated")
				.addClass(NAMESPACE + "_" + status);
				var data = label.data(NAMESPACE);
				var input = data["input"];
				input[0].checked = input[0].indeterminate = false;
				if (status == 'checked') input[0].checked = true;
				else if (status == 'unchecked') input[0].checked = false;
				else input[0].indeterminate = true;
			},
			_inputClickHandler: function(){
				var self = $(this);
				if (!self.hasClass(NAMESPACE + "_disabled")){
					var label = methods["_getLabel"].call(this,self[0].name);
					var status = self.is(":checked") ? "checked" : "unchecked";
					methods["_changeStatus"].call(this,label,status);
					methods["_updateGroup"].call(this,label);
				}
			},
			_clickHandler: function(){
				var self = $(this);
				var status = self.hasClass(NAMESPACE + "_checked") ? "unchecked" : "checked";
				var data = self.data(NAMESPACE);
				var input = data["input"];
				input.addClass(NAMESPACE + "_disabled");
				methods["_changeStatus"].call(this,self,status);
				methods["_updateGroup"].call(this,self);
				input.removeClass(NAMESPACE + "_disabled");
				return false;
			},
			_addToGroup: function(elem,groupName, type){
				if (typeof groups[groupName] == 'undefined') groups[groupName] = {master : [], slave : []};
				groups[groupName][type].push(elem);
			},
			_getElementType: function(type){
				return type && (type == 'master' || type == 'slave') ? type : "slave";
			},
			_updateGroup: function(elem){
				var data = elem.data(NAMESPACE);
				if (data && data["type"] == 'slave'){
					var myMasters = groups[data["group"]]["master"];
					var mySlaves = groups[data["group"]]["slave"];
					var statuses = $.map(mySlaves, function(val,i){ return methods["_getStatus"].call(this,val); });
					var checked = statuses.filter(function(val){ return val == 'checked'});
					var allChecked = checked.length == statuses.length;
					var someChecked = checked.length > 0;
					var status = "unchecked";
					if (allChecked) status = "checked";
					else if (someChecked) status = "indeterminated";
					for (var i = 0; i < myMasters.length; i++) methods["_changeStatus"].call(this,myMasters[i],status);
				} else if (data && data["type"] == 'master'){
					var mySlaves = groups[data["group"]]["slave"];
					var status = methods["_getStatus"].call(this,elem);
					for (var i = 0; i < mySlaves.length; i++) methods["_changeStatus"].call(this,mySlaves[i],status);
				}
			},
			_getStatus: function(elem){
				if (elem.hasClass(NAMESPACE + "_unchecked")) return "unchecked";
				if (elem.hasClass(NAMESPACE + "_checked")) return "checked";
				if (elem.hasClass(NAMESPACE + "_indeterminated")) return "indeterminated";
			}
	};
	$.fn.modernCheckbox = function(method){
		var opts = {};
		if (typeof method === 'object'){
			opts = method;
			method = "init";
		}
		method = method || "init";
		opts = $.extend({},$.fn.modernCheckboxOpts,opts);
		methods[method].call(this,opts);
	};
	$.attrHooks.checked = {
			get : function(elem){
				var self = $(elem);
				if (!self.hasClass(NAMESPACE)) return undefined;
				var label = methods["_getLabel"].call(this,self[0].name);
				return methods["_getStatus"].call(this,label) == 'checked';
			}, 
			set : function(elem,value){
				var self = $(elem);
				if (!self.hasClass(NAMESPACE)) return undefined;
				var status = value;
				if (typeof value == 'boolean') status = value ? "checked" : "unchecked";
				var label = methods["_getLabel"].call(this,self[0].name);
				methods["_changeStatus"].call(this,label,status);
				methods["_updateGroup"].call(this,label);
			}
	};
})(jQuery);