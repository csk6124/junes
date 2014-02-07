'use strict';

var async = require('async'),
	sprintf = require('sprintf').sprintf,
	request = require('request');

exports.setting = function(app) {
	return {
		url: '/api/profile/league',
		method: 'post',
		middlewares: [
			{ name: 'commonAPI' },
			//{ name: 'checkSession' },
			{ name: 'bindModel' }
		]
	};
};


/*
[Input]
없음 
[Output]
{
    "success": boolean,
    "session": boolean,
    "error": string,
    "data": {
        "user_info": {
            "img_url": string,
            "team": string,
            "difference": double,
            "rank": int,
            "rank_total": int,
            "score": double
        },
        "user_score_list": [
            {
                "score": double,
                "timestamp": int
            }
        ],
        "league_rank_list": [
            {
                "difference": double,
                "rank": int,
                "nickname": string,
                "score": double,
                "location": string
            }
        ]
    }
}
*/


exports.main = function(req, res) {
	var tasks = new Tasks(req, res);
};

var Tasks = function(req, res) {
	this.req = req;
	this.res = res;

	this.initialize();
	this.test();
};

var _ = Tasks.prototype;

_.initialize = function() {
	var that = this;
	this.model = that.req.app.get('server').model;
	
	async.series(
		[
			this._getUserInfo(),
			this._getLeagueScores(),
			this._getLeagueRanks()
		],
		function(err,result) {
			console.log('result', err, result);
			if(!result) {
				that.req.error(that.res, err);
				return;
			} else {
				that.req.success();
			}
		}
	);
};

_.test = function() {
	this._calculateLeageScore([85,84]);	// 최근순으로 sorting처리 한다 
}


_._getUserInfo = function() {
	var that = this;


	return function(callback) {
		var leagueInfo = {
			"img_url" : null,
	        "team": "겁이 많은 풍선",
	        "difference" : 10,
	        "rank": 1,
	        "rank_total":50,
	        "score": 92.11
		}
		that.req.out('user_info', leagueInfo);
		callback(null, true);
	};

};

_._getLeagueScores = function() {
	var that = this;

	return function(callback) {
		var scores = [
			{"score":90, "timestamp": 1391576768000},
			{"score":40, "timestamp": 1391439600000},
			{"score":20, "timestamp": 1391339600000},
			{"score":99, "timestamp": 1391239600000}
		];
		that.req.out('league_score_list', scores);
		callback(null, true);
	};

};

_._getLeagueRanks = function() {
	var that = this;

	return function(callback) {
		var ranks = [
			{"difference":10, "rank":1, "nickname": "AAA", "score":92.11, "location": "서울시 성북구"},
			{"difference":-2, "rank":2, "nickname": "BBB", "score":82.11, "location": "서울시 동작구"},
			{"difference":-10, "rank":3, "nickname": "CCC", "score":72.11, "location": "서울시 동작구"},
			{"difference":0, "rank":4, "nickname": "DDD", "score":62.11, "location": "서울시 강남구"}
		];
		that.req.out('league_rank_list', ranks);
		callback(null, true);
	};
};


_._calculateLeageScore = function(scores) {
	var calculation_score = 0;
	var lower_score = 0;
	var upper_score = 0;
	var lower_devision = 0;
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
	});
	
	if(length <= 5)
		calculation_score = lower_score / lower_devision;
	else
		calculation_score = ((lower_score / lower_devision) * 0.8) + ((upper_score / upper_devision) * 0.2);

	return calculation_score;

};


_._divideLeagueGroup = function() {


};





