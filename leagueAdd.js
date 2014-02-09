"use strict";

var async = require('async'),
	sprintf = require('sprintf').sprintf,
	modts = require('orm-timestamps'),
	orm = require('orm');

exports.setting = function() {
	return {
		url: "/api/test/leagueRegister",
		method: "get",
		middlewares: [
			{ name: 'commonAPI' },
			{ name: 'bindModel' }
		]
	};
}

exports.main = function() {
	var that = this;
	var arg = process.argv.splice(2);
	var args = {
		"id": arg[0],
		"curriculum": arg[1],
		"nickname": arg[2],
		"score": arg[3]
	};

	orm.connect("mysql://csk6124:2682293@localhost/jarvis_admin", function (err, db) {
		//console.log(err,  db);
		var tasks = new Tasks(db, args);
	});
};

var Tasks = function(db, args) {
	this.db = db;
	this.args = args;
	that.user = {
		user_id: args.id,
		curriculum: args.curriculum
	};


	this.model = {};
	//console.log('db', this.db);

	this.db.use(modts, {
		createdProperty: 'created_at',
		modifiedProperty: 'modified_at',
		dbtype: { type: 'date', time: true },
		now: function() { return new Date(); }
	});


	this.model.LeagueClass= this.db.define("league_class", {
		name: {type: 'text'},
		level: {type: 'enum', values: ["Excellent", "Awesome", "Cool", "Nice", "Good"]},
		img_url: {type: 'text'},
		description: {type: 'text'}
	}, {
		method: {

		}, 
		hooks: {

		},
		timestamp: false,
		cache: false
	});

	this.model.LeagueRank = this.db.define("league_rank", {
		user_id: {type: 'number'},
		cal_score_before: {type: 'number'},
		cal_score: {type: 'number'},
		curriculum: {type: 'number'},
		count: {type: 'number'},
		teamId: {type: 'number'}
	}, {
		method: {

		}, 
		hooks: {

		},
		timestamp: true,
		cache: false
	});

	this.model.LeagueScore = this.db.define("league_score", {
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

	this.model.LeagueTeam = this.db.define("league_team", {
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

	this.model.LeagueTeam.hasOne("class", this.model.LeagueClass);
	this.model.LeagueRank.hasOne("team", this.model.LeagueTeam);

	
	//this.model.LeagueClass.sync();
	this.model.LeagueRank.sync();
	this.model.LeagueScore.sync();
	this.model.LeagueTeam.sync();
	
	
	this.adjectives = [	
		"간지러운", 
		"반짝이는", 
		"상냥한", 
		"귀여운", 
		"축축한", 
		"향기로운", 
		"겁이많은", 
		"시큼한", 
		"커다란", 
		"끈적한"
	];
	this.nouns = [
		"곰돌이", 
		"꿀벌", 
		"고양이", 
		"지렁이", 
		"쭈꾸미", 
		"구름", 
		"달", 
		"콩", 
		"잎새", 
		"풍선"
	];

	

	this.initialize();
};

var _ = Tasks.prototype;


_.initialize = function() {
	var that = this;

	async.series(
		[
			this.getLeague()
		],
		function(err,result) {
			if(!result) {
				that.req.error(that.res, err);
				return;
			}
			console.log('result', result);
			//that.req.success();
		}
	);

};

_.getLeague = function() {
	var that = this;
	
	async.series(
		[
			that._getUserInfo(),
			that._getLeagueScores(),
			that._getLeagueRanks()
		],
		function(err,result) {
			if(!result) {
				that.req.error(that.res, err);
				return;
			}
			console.log('result', result, that.ranks, that.scores, that.userInfo);
			//that.req.success();
		}
	);	

};


_._getUserInfo = function() {
	var that = this;

	return function(callback) {
		that.model.LeagueRank.find({
				user_id: that.user.user_id, 
				curriculum: that.user.curriculum
		}, function(err, result) {
			if(err) {
				that.req.error(that.res, err);
				return;
			}

			if(result.length === 0) {
				that.req.out('userInfo', []);
				callback(null, true);
				return;
			}

			that.userInfo = result[0];
			callback(null, true);
		});
	};

};


_._getLeagueScores = function() {
	var that = this;

	return function(callback) {
		that.model.LeagueScore.find({
			user_id:that.userInfo.user_id, 
			curriculum:that.userInfo.curriculum
		}, ["created_at", "A"], function(err, results) {
			if(err) {
				that.req.error(that.res, err);
				return;
			}

			if(results.length === 0) {
				that.req.out('scores', []);
				callback(null,true);
				return;
			}

			that.scores = [];
			results.forEach(function(val) {
				var timestamp = new Date(val.created_at);
				that.scores.push({"score": val.score, "timestamp": timestamp.getTime()});
			});
			
			callback(null, true);
		});
	};

};

_._getLeagueRanks = function() {
	var that = this;

	var rankObj = null,
		index = null

	return function(callback) {
		that.model.LeagueRank.find({
			teamId:that.userInfo.team_id
		}, ["cal_score", "Z"], function(err, results) {
			if(err) {
				that.req.error(that.res, err);
				return;
			}

			if(results.length === 0) {
				that.req.out('ranks', []);
				that.req.out('userInfo', []);
				callback(null,true);
				return;
			}

			that.ranks = [];
			results.forEach(function(val, index) {
				that.ranks.push({
					difference: val.cal_score_before,
					rank: index+1,
					nickname: "nickname",
					score: val.cal_score,
					location: "location"
				});
				if(val.user_id === that.userInfo.user_id) {
					rankObj = val;
					index = index+1;
				}
			});

			if(rankObj === null)	{
				console.log('rankObj', rankObj);
				return callback(null, true);
			}
			rankObj.getTeam(function(err, Team) {
				if(err) {
					that.req.error(that.res, err);
					return;
				}

				that.userInfo = {
					difference: rankObj.cal_score_before,
					score: rankObj.cal_score,
					rank: index,
					team: Team.name1 + Team.name2,
					rank_total: Team.total
				};
				
				Team.getClass(function(err, Class) {
					if(err) {
						that.req.error(that.res, err);
						return;
					}

					that.userInfo.img_url = Class.img_url;
					callback(null, true);
				});

			});

		});

	};

};


