'use strict';

module.exports = function(knowreObject, db) {
	this.model = null;
	this.db = db;
	this.models = knowreObject;

	this._initialize();
};

var _ = module.exports.prototype;

_._initialize = function() {
	var that = this;

	this.model = this.db.define("league_class", {
		name: {type: 'text'},
		level: {type: 'enum', values: ["Excellent", "Awesome", "Cool", "Nice", "Good"]},
		img_url: {type: 'text'},
		description: {type: 'text'}
	}, {
		method: {

		}, 
		hooks: {

		},
		timestamp: true,
		cache: false
	});

	this.model.setRelations = function() {

	};

};