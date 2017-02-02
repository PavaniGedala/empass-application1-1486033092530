// express is used for HTTP protocols via Node
var express 	= require('express');
// used for session variables
var session		= require('express-session');
// used to parse the document sent by the request
var bodyParser  = require('body-parser');
// use for defining the absolute path of a file
var path    = require("path");
// cfenv provides access to your Cloud Foundry environment
var cfenv = require('cfenv');
// used for accessing the cloudant cloud database
var Cloudant = require('cloudant');
// fs is used for file operations
var fs = require("fs");

// create a new express server
var app = express();
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
// define the objects of the imported files
var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    url = require('url');
// coudant credentials
var cloudant_user = "f1e0f979-add5-43b0-938c-bbbf0d1df907-bluemix";
var cloudant_pwd  = "417a901232b4dfda37594e720d458eb126a9bd8dc1045c28f8105ae9e8cde540";
var cloudant      = Cloudant({account:cloudant_user, password:cloudant_pwd})
// define cloudant databases with objects
var employee_db   = cloudant.db.use('employee');
var passengers_db = cloudant.db.use('passengers');
var bus_status_db = cloudant.db.use('bus_status');

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public/'));

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

// login to cloudant operations
var cloudant      = Cloudant({account:cloudant_user, password:cloudant_pwd})

// global variable
// to count the no. of requests to login
var login_req_count = 0;

// session operations
var session_var="";
app.use(session({secret: 'saikalyan1408@gmail.com',saveUninitialized: true,resave: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// All Routings are here...

// app.get('/',function(request,response){
// 	// render login page
// 	response.render('login.ejs',{loginError:''})
// })
// #ROUTE-1
// main route
app.get('/',function(request,response){
	// check if the sessions are valid or not
	session_var = request.session;
	if(session_var.card_num != undefined)
	{
		// if the loggedin user is admin,
		// render admin page
		if(session_var.type=="admin")
			response.render('admin.ejs',{card_num:session_var.card_num,type:session_var.type})
		else{
			// if the loggedin user is general user
			// render user page
			response.render('user.ejs',{card_num:session_var.card_num,type:session_var.type,b_id:session_var.b_id.toString()});
		}			
	}
	else
	{
		// check if the user has tried for login atleast once or not
		if(login_req_count!=0)
			// render login page with an error message
			response.render('login.ejs',{loginError:'Invalid Credentials'})	
		else
			// render login page
			response.render('login.ejs',{loginError:''})
	}
})

// #ROUTE-2
// route to get employee travel details for a specific period
// this logic is used to fetch the data of employee
// for DAY, MONTH and YEAR
// Timestamp format will be YYYYMMDD.HHMMSS
// logic for Day: 
// 		Day range will be : YYYYMMDD.000000 to YYYYMMDD.235959
// logic for Month
// 		Month range will be: YYYYMM01.000000 to YYYYMM31.235959
// logic for Year
// 		Year range will be: YYYY0101.000000 to YYYY1231.235959
app.get('/getEmpTravelDetails',function(request,response){
	
	// parameters
	// starting time stamp
	var input_timestamp = request.param('input_timestamp'); 
	// time to add as per the range
	var input_time_add  = request.param('input_time_add');
	// employee ID
	var input_emp       = request.param('input_emp');

	// prepare inputs for processing
	var input_start_timestamp = parseFloat( input_timestamp +".000001");
	var input_end_timestamp   = parseFloat( parseInt(input_timestamp)+ parseInt(input_time_add) +".235959");

	// prepare query to fetch data
	var fetch_query = {
	  "selector": {
	    "timestamp": {
	      "$gte": input_start_timestamp,
	      "$lte": input_end_timestamp
	    },
	    "e_id" : {
	    	"$eq" : input_emp
	    }
	  },
	  "fields": ["e_id","b_id","timestamp","location"],
	  "sort": [
	    {
	      "timestamp": "desc"
	    }
	  ],
	  "limit" : 16
	}
	// console.log(fetch_query)
	// execute fetch_query
	passengers_db.find(fetch_query,
		function (error,success_response_data)
		{
			if(!error)
			{
				// console.log(success_response_data.docs)
				// fetch is success then send the success_response_data as a response
				response.writeHead("200", {"Content-Type": "application/json"});
				response.end(JSON.stringify(success_response_data));
			}
			else
			{
				// fetch failed for some reason
				// the reason will be in the error object 
				console.log(error);
			}
	});
});

// to check whether the passenger is in the particular bus or not
// #ROUTE-3
// logic : if the transactions of users are odd
// 			then definitely he'll be in the bus
// for that we are doing Employeee transactions count mod 2
app.get('/getEmpTransactionsModTwo',function(request,response){
	// parameters
	var b_id = request.param('b_id');	// Bus ID
	var e_id = request.param('e_id')	// Emp ID
	var query = {
		"selector":{
			"b_id": b_id,
			"e_id": e_id
		},
		"fields":["eid"]
	}
	passengers_db.find(query,function (error,success_response_data) {
		if(!error)
		{
			// success_response_data.docs.length is used as COUNT(*) here
			var transactions_count = success_response_data.docs.length;
			// if even, send this employee is not in the bus
			// else, the employee is in the bus
			if(transactions_count%2==0)
				response.send("0")
			else
				response.send("1")	
		}
		else
			console.log(error)
		
	});
})

// route to get live updates
// #ROUTE-4
// logic : get the last 5transactions from the passenger table
// constraint : updates must be of today itself
// following the logic of range #ROUTE-2
app.get('/getLiveTravelUpdates',function(request,response){
	var start_timestamp = request.param('start_timestamp');
	var end_timestamp   = request.param('end_timestamp');
	// prepare query to get the latest transactions of today
	var query = {
	  "selector": {
	    "timestamp": {
	      "$gte": parseFloat(start_timestamp),
	      "$lte": parseFloat(end_timestamp)
	    }
	  },
	  "fields": ["e_id","b_id","timestamp","location"],
	  "sort": [
	    {
	      "timestamp": "desc"
	    }
	  ],
	  "limit" : 5
	}
	// console.log(query)
	passengers_db.find(query,function(error,success_response_data){
		if(!error){
			// console.log(success_response_data)
			response.send(success_response_data.docs);
			// response.send(query)
		}
		else
			// console.log(error);
			response.send(error)
	});
})

// function to get the difference between 
// the given time and current time in terms of minutes
// Input time will be in format : YYYYMMDD.HHMMSS
function getTimeDiff(last_status)
{
	// separate data and time
	// part before "." is Date
	// after "." is Time
	var date = last_status.toString().split(".")[0];
	var time = last_status.toString().split(".")[1];

	// get individual elements from YEAR and TIME
	// YYYY, MM, DD : HH, SS
	var last_status_year  = parseInt(date.substr(0,4));
	var last_status_month = parseInt(date.substr(4,2))-1;
	var last_status_day   = parseInt(date.substr(6,2));

	var last_status_hour   = parseInt(time.substr(0,2)); 
	var last_status_minute = parseInt(time.substr(2,2));

	// get current date object and individual elements 
	// YYYY, MM, DD : HH, SS
	var today = new Date();
	var current_year = today.getFullYear();
	var current_month = today.getMonth();
	var current_day = today.getDate();
	var current_hours = today.getHours();
	var current_minutes = today.getMinutes();

	// prepare datetime objects
	var datetime1 = new Date(last_status_year,last_status_month,last_status_day,last_status_hour,last_status_minute);
	var datetime2 = new Date(current_year,current_month,current_day,current_hours,current_minutes);var timegap = (datetime2-datetime1)/60000;

	// get the difference between two datetime objects and return
	var timegap = (datetime2-datetime1)/60000;
	return timegap;
}

// route to get the bus status
// #ROUTE-5
// logic : bus updates its location along with the timestamp for every 5 seconds
// if the difference between the last update and the current time > 1 minute
// we can say the bus is inactive
app.get('/getLastStatus',function(request,response){
	// prepare query to get the last update from the bus
	var query = {
	  "selector": {
	    "bus_timestamp": {
	      "$gt": 0
	    }
	  },
	  "fields": [
	    "bus_timestamp","bus_location"
	  ],
	  "sort": [
	    {
	      "bus_timestamp": "desc"
	    }
	  ],
	  "limit":1
	}

	bus_status_db.find(query,function (error,success_response_data) {
		if(!error)
		{
			// to trace data on console , uncomment below line
			// console.log(success_response_data.docs[0])
			// get the timestamp from the success_response_data object
			var last_status = success_response_data.docs[0].bus_timestamp;
			// get the location from the success_response_data object
			var location = success_response_data.docs[0].bus_location;
			// some time will have a single digit in place of seconds
			// to make it consistent we are padding a "0" at the end of it
			if(last_status.toString().length < 15) last_status += "0";
			// get the diffence between the last_status and the current time
			var timeDiff= getTimeDiff(last_status);
			// send this difference  along with location
			response.send(timeDiff.toString()+"*"+location.toString());
		}
		else
			console.log(error);
	});	
})


// #ROUTE-6
// to verify login details
app.post('/verifyLogin',function(request, response) {
	// get parameters
	var email = decodeURIComponent(request.body.email);
	var password  = request.body.password;

	// prepare query to cross check email and password
	var validation_query = {
	  "selector": {
	    "email": {
	      "$eq": email
	    },
	    "password": {
	      "$eq": password
	    }	    
	  },
	  "fields": [
	    "card_num","type","email","b_id"
	  ]
	}
	// execute validation_query and get count(*)
	employee_db.find(validation_query,function (error,success_response_data) {
		if(error)
		{
			console.log(error)
		}
		else
		{
			
			var count = success_response_data.docs.length;	
			// User is registered
			if(count == 1)
			{
				if(success_response_data.docs[0].type=="admin")
				{
					session_var=request.session;
					session_var.type  	 = success_response_data.docs[0].type;
					session_var.card_num = success_response_data.docs[0].email;
					response.redirect('/')
				}
				else
				{
					// save user details in a session
					session_var=request.session;
					var card_num = success_response_data.docs[0].card_num;
					// later this to be changed as HASH for more security
					session_var.card_num = card_num;
					session_var.type=success_response_data.docs[0].type;
					session_var.b_id=success_response_data.docs[0].b_id;
					// console.log(success_response_data.docs[0].b_id)
					response.redirect('/')
				}				
			}
			else
			{
				// user is not registered
				console.log(' User not authenticated')
				login_req_count ++;
				response.redirect('/')
			}		
		}	
		
	});	
})

// #ROUTE-8
// route to logout
app.get('/logout',function(request,response){
	// session_var= request.session;
	// session_var.card_num = undefined;
	// redirect to login page
	request.session.destroy();
	login_req_count = 0;
	response.redirect('/')		
});

