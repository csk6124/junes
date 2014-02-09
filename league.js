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
		"user_id": arg[0],
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
	this.user = {
		user_id: args.user_id,
		curriculum: args.curriculum,
		nickname: args.nickname,
		score: args.score
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
			that._getUserInfo(),
			that._getCalculateScore(),
			that._getClassLevel()
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

_._getUserInfo = function() {
	var that = this;
	
	console.log('_getUserInfo');
	return function(callback) {
		var user = {
			score: 0,
			cal_score: 0,
			classId: 0,
			rankObject: null
		};
		user.userId = that.user.user_id;
		user.curriculum = that.user.curriculum;
		user.nickname = that.user.nickname;
		user.score = that.user.score;
		callback(null, true)


		// 사용자 정보 
		/*
		that.model.User.find({"account":lessonInfo.userId}, 1, function(err, result) {
			console.log('getUserInfo', JSON.stringify(result));

			var user = {
				score: 0,
				cal_score: 0,
				classId: 0,
				rankObject: null
			};
			if(result.length == 1) {
				user.userId = result[0].id;
				user.curriculum = result[0].curriculum;
				user.nickname = result[0].nickname;
				user.score = lessonInfo.score;
				callback(null, user)
			} else {
				callback(null, user)
			}
		});
*/
	};
	
};


_._getCalculateScore = function() {
	var that = this;

	var calculateLeageScore = function(scores) {
		console.log('arguments', scores);
		var that = this;
		var calculation_score = 0;
		var lower_score = 0;
		var lower_devision = 0;
		var upper_score = 0;
		var upper_devision = 0;
		var length = scores.length;

		// 가중치 계산처리 
		scores.forEach(function(score, index) {
			if(index <= 4) {		// 최근 5건의 평균 
				switch(index) {
					case 0:
						lower_score += score * 1;
						lower_devision += 1;
						break;
					case 1:
						lower_score += score * 0.8;
						lower_devision += 0.8;
						break;
					case 2:
						lower_score += score * 0.6;
						lower_devision += 0.6;
						break;
					case 3:
						lower_score += score * 0.4;
						lower_devision += 0.4;
						break;
					case 4:
						lower_score += score * 0.2;
						lower_devision += 0.2;
						break;
					default:
						lower_score += score * 0.2;
						lower_devision += 0.2;
						break;
				}
			} else {				// 최근 5건을 넘는경우 8:2가중치를 두고 평균값을 계산한다. 
				upper_score += score * 1;
				upper_devision += 1;
			}
			console.log('before calculation', index, score, index, lower_score,  upper_score);
		});
		
		if(length <= 5) {	
			calculation_score = lower_score / lower_devision;
		} else {
			calculation_score = ((lower_score / lower_devision) * 0.8);
			calculation_score += ((upper_score / upper_devision) * 0.2);
		}
		console.log('after calculation', length, calculation_score);
		return calculation_score;

	};

	return function(callback) {
		that.model.LeagueScore.find({
			user_id: that.user.userId, 
			curriculum: that.user.curriculum
		}, ["created_at", "Z"], function(err, results) {
			
			var scores = [];
			scores.push(that.user.score);
			if(results.length === 0) {
				that.user.cal_score = calculateLeageScore(scores);
				callback(null, true);
			} else {
				results.forEach(function(val) {
					console.log('score array', val.score);
					scores.push(val.score);
				});
				that.user.cal_score = calculateLeageScore(scores);
				callback(null, true);
			}
		});
	}

};


/* 
레벨을 구한다 .
1. 총 랭킹 테이블의 사용자를 구한다. 
2. 랭킹에서 자기 순위를 쿼리 
3. class테이블 정보를 가져온다 
4. 랭킹정보가 없다면 최상의 레벨도 등극하고 랭킹사용자 등록 
5. 랭킹정보가 있다면 레벨을 재확인한후, 레벨이 변경시 랭킹정보와 팀정보를 갱신하여 등록한다. 
*/
_._getClassLevel = function() {
	var that = this;

	var insertLeagueScore = function(callback) {
		that.model.LeagueScore.create([{
			"user_id": that.user.userId,
			"score": that.user.score,
			"cal_score": that.user.cal_score,
			"curriculum": that.user.curriculum
		}], function(err, items) {
			console.log('insertLeagueScore', err, JSON.stringify(items));
			callback(err, items);
		});
	};

	var insertLeagueRank = function(callback) {
		that.model.LeagueRank.create([{
			"user_id": that.user.userId,
			"cal_score_before": that.user.cal_score_before,
			"cal_score": that.user.cal_score,
			"count": 1,
			"curriculum": that.user.curriculum,
			"teamId": that.user.teamId,
			"team_id": that.user.teamId
		}], function(err, items) {
			console.log('insertLeagueRank', err, items);
			insertLeagueScore(function() {
				callback(err, items);
			});
		});
	};

	var updateLeagueRank = function(rankObject, callback) {
		rankObject[0].cal_score = that.user.cal_score;
		rankObject[0].cal_score_before = that.user.cal_score_before;
		rankObject[0].curriculum = that.user.curriculum;
		rankObject[0].teamId = that.user.teamId;
		rankObject[0].count += 1;
		rankObject[0].save(function(err) {
			console.log('saved and err : %s', err);
			insertLeagueScore(function() {
				callback(err);
			});
		});
	};

	var makeTeam = function(callback) {	
		var randomIndex = Math.floor(Math.random() * that.adjectives.length);
		that.model.LeagueTeam.find({
			classId: that.user.classId
		}).each().filter(function(teams) {
			return teams.total < 50;
		}).get(function(team) {
			if(team.length <= 0) {
				that.model.LeagueTeam.create([{
					name1: that.adjectives[randomIndex],
					name2: that.nouns[randomIndex],
					classId:that.user.classId,
					class_id: that.user.classId,
					total: 1,
					description: null
				}], function(err, leagueTeam) {
					callback(null, leagueTeam[0].id);
				});
			} else {
				team[0].total = team[0].total + 1;
				callback(null, team[0].id);
			}
			
		}).save(function(err) {
			console.log('err', err);
		});

	};

	var proc = function(rankObject, callback) {
		if(rankObject.length === 1) {
			// 클래스 레벨 업데이트
			if(that.user.classId !== rankObject[0].classId) {
				that.user.cal_score_before = rankObject[0].cal_score;
				that.user.rankObject = rankObject;

				// 사용자의 레벨이 변경시 
				makeTeam(function(err, teamId) {
					that.user.teamId = teamId;
					updateLeagueRank(rankObject, function() {
						callback(null, 'done');
					});
				});
			} else {
				that.user.classId = rankObject[0].classId;
				that.user.teamId = rankObject[0].teamId;
				that.user.cal_score_before = rankObject[0].cal_score;
				that.user.rankObject = rankObject;
				updateLeagueRank(rankObject, function() {
					callback(null, 'done');
				});
			}
			
		} else {
			that.user.teamId = null;
			that.user.cal_score_before = that.user.cal_score;
			makeTeam(function(err, teamId) {
				that.user.teamId = teamId;
				insertLeagueRank(function(err, result) {
					callback(null, 'done');
				});
			});
		}

	};

	return function(callback) {
		that.model.LeagueRank.count(function(err, totalCount) {
			that.model.LeagueRank.count({
				cal_score: orm.gt(that.user.cal_score)
			}, function(err, count) {
				console.log('total rank %d/%d count', count, totalCount);
		
				that.model.LeagueRank.find({
					user_id: that.user.userId, 
					curriculum: that.user.curriculum
				}, function(err, rankObject) {
					that._calculateLevel(totalCount, count, function(classId, level) {
						that.user.classId = classId;
						that.user.level = level;
						console.log('rank', JSON.stringify(rankObject, rankObject.length));	
						proc(rankObject, function(err, result) {
							callback(null, 'done');
						});
					});
				});
			});
		});
	};

};


_._calculateLevel = function(totalCount, count, callback) {
	// 계급을 구한다 
	var divide = totalCount / 5,
		level = "Good";

	if(divide <= count) {
		level = "Excellent";
	} else if(divide * 2 <= count) {
		level = "Awesome";
	} else if(divide * 3 <= count) {
		level = "Cool";
	} else if(divide * 4 <= count) {
		level = "Nice";
	} else {
		level = "Good";
	}

	console.log("log %d %d %s", totalCount, count, level);
	this.model.LeagueClass.find({"name": level}, function(err, classObject) {
		console.log('getLevel %d', classObject[0].id, JSON.stringify(classObject));
		callback(classObject[0].id, level);
	});

};

