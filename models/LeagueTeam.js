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

	this.model = this.db.define("league_team", {
		name1: {type: 'text'},
		name2: {type: 'text'},
		classId: {type: 'number'},
		total: {type: 'number'},
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