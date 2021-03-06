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

	this.model = this.db.define("league_score", {
		user_id: {type: 'number'},
		score: {type: 'number'},
		cal_score: {type: 'number'},
		curriculum: {type: 'number'}
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