// this function is used to set values for the drop down menu
// Day 		: DYYYYMMDD ; 1st D is indicator for day
// Month 	: MYYYYMM01 ; 1st M is indicator for month
// Year 	: YYYYY0101 ; 1st Y is indicator for year
function setValuesForDropdownMenu() 
{

	var today = new Date();
	var day = today.getDate();
	var month = today.getMonth()+1;
	var year = today.getFullYear();

	if(month<10) month = "0"+month;
	if(day<10) day = "0"+day;

	var day_opt_value=year.toString()+month.toString()+day.toString();
	day_opt_value=Number(day_opt_value);

	var month_opt_value=year.toString()+month.toString()+"01";
	month_opt_value=Number(month_opt_value);

	var year_opt_value=year.toString()+"0101";
	year_opt_value=Number(year_opt_value);	

	document.getElementById('day-option').value="D"+day_opt_value;
	document.getElementById('month-option').value="M"+month_opt_value;
	document.getElementById('year-option').value="Y"+year_opt_value;
}
setValuesForDropdownMenu();
// call this function on loading the function definition

// this function is used to reverse geocode using Google Maps API
function reverseGeocodeUsingGoogleAPI(latlong)
{
	var xhr = new XMLHttpRequest();
	var maps_url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=";
	xhr.open("GET",maps_url+latlong,false);
	xhr.send();
	var response = JSON.parse(xhr.responseText);
	// console.log(response +" for "+latlong);
	var location_name = response.results[0].address_components[0].long_name;
	// console.log(location_name);
	return location_name;
}

// this is a Handlebars helper function
// to print YYYYMMDD.HHMMSS format in YYYY-MM-DD HH:MM:SS format
Handlebars.registerHelper("printDateTime",function(usertime)
{
	if(usertime==undefined) return "NOT SCANNED YET";

	var date = usertime.toString().split(".")[0];
	var year  = date.substr(0,4);
	var month = date.substr(4,2);
	var day   = date.substr(6,2);
	date = day+"-"+month+"-"+year;
	
	var time = usertime.toString().split(".")[1];
	if(time==undefined) return usertime;
	var hours = time.substr(0,2);
	var minutes = time.substr(2,2);
	var seconds = time.substr(4,2);
	time = hours+":"+minutes+":"+seconds;
	var timestamp = date +" "+time;
	
	return timestamp;
});

// this is a Handlebars helper function
// to reverse geocode
Handlebars.registerHelper("reverseGeocode",function(latlong)
{
	// console.log(latlong);
	if(latlong==undefined) return "NOT DEPARTURED YET";
	var location_name = reverseGeocodeUsingGoogleAPI(latlong);
	return location_name;
});

// this function is used to render the user travel details response data 
// in format specified in the User Interface
function renderTemplateContent(response_data)
{
	// copy the response data into two JSON objects
	var content1 = content2 = JSON.parse(response_data);
	// replace timestamp in the 1st JSON object to board_timestamp
	content1 = JSON.parse(JSON.stringify(content1).split('"timestamp":').join('"board_timestamp":'));
	// replace location in the 1st JSON object to board_location
	content1 = JSON.parse(JSON.stringify(content1).split('"location":').join('"board_location":'));
	
	// replace timestamp in the 2nd JSON object to depart_timestamp
	content2 = JSON.parse(JSON.stringify(content2).split('"timestamp":').join('"depart_timestamp":'));
	// replace location in the 1st JSON object to depart_location
	content2 = JSON.parse(JSON.stringify(content2).split('"location":').join('"depart_location":'));
	
	// reverse the two JSON objects
	content1.docs = content1.docs.reverse();
	content2.docs = content2.docs.reverse();

	// declare a result object
	// for the concatenated o/p of 2 JSON objects
	var result = {
		docs:[]
	};	

	var A=0; // to point content1 JSON object
	var B=1; // to point content2 JSON object
	
	// as board and depart transactions are considered as 1 tuple in o/p
	var count_size=content1.docs.length/2;
	for(var i=0;i<count_size;i++) 
	{
		var result_obj = {};
		// add all the board travel details to result object
		for(var key in content1.docs[A]) result_obj[key] = content1.docs[A][key];
		// add all the depart travel details to result object
		for(var key in content2.docs[B]) result_obj[key] = content2.docs[B][key];
		result.docs[i] = result_obj;
		A += 2;
		B += 2;
	}
	// now reverse the resultant result object
	result.docs = result.docs.reverse();
	// console.log(result)	;
	// get the template code from the handlebars-template 
	var raw_template = document.getElementById('employee-travel-details-template').innerHTML;
	// compile the template
	var compiled_template = Handlebars.compile(raw_template);
	// render the compiled code
	var rendered_code = compiled_template(result);	
	// set back the rendered_code into the result div
	document.getElementById('employee-travel-details').innerHTML = rendered_code;
	// check if the last transaction is done or not
	if(document.getElementById('emp-travel-depart-time').innerHTML=="NOT SCANNED YET")
	{
		document.getElementById('emp-travel-depart-time').style.color ="red";
		document.getElementById('emp-travel-depart-location').style.color="red";
	}		
}

// this function calls #ROUTE-1
function getEmpTravelDetails(start_timestamp,time_to_add,emp_id)
{
	// prepare pramameter string
	var PARAMS = "?input_timestamp="+start_timestamp;
	PARAMS += "&input_time_add="+time_to_add;
	PARAMS += "&input_emp="+emp_id;

	var xhr = new XMLHttpRequest();
	// calls to #ROUTE-1
	xhr.open("GET","/getEmpTravelDetails"+PARAMS,false);
	xhr.send();	
	// call the renderTemplateContent function with the response from #ROUTE-1
	renderTemplateContent(xhr.responseText);
}

// function for the Travel details form submission
function submitSearchForm()
{
	// put some loading image
	document.getElementById('employee-travel-details').innerHTML = '<img src="../images/loading.gif"/>';
	// get form elements
	var emp_id 	         = document.getElementById('search_emp_id').value;
	var start_timestamp  = (document.getElementById('search_timerange').value).toString().substr(1);
	var time_indication  = document.getElementById('search_timerange').value[0];
	
	// we need to calculate time to add based on the indication
	var time_to_add;
	switch(time_indication)
	{
		case 'D': time_to_add =0; break;
		case 'M': time_to_add =31; break;
		case 'Y': time_to_add =366; break;
	}
	// now call the function with the prepared details
	getEmpTravelDetails(start_timestamp,time_to_add,emp_id);
	// reset the form
	empTravelSearch.reset();
	return false;
}

setInterval(
	// function to count no. of employee in the bus
	// logic: check each employee whether he/she is in the bus
	function()
	{
		var xhr = new XMLHttpRequest();	
		// all the employees
		// for test only 2 employees
		var emp_id =['646398245','22923616767237'];
		// initial bus strength is 0
		var busStrength = 0;
		// for all the employees
		for(var i=0;i<2;i++)
		{
			// this goes for the #ROUTE-1
			// #ROUTE-1 returns 1 if emp is in the bus			
			xhr.open("GET","/getEmpTransactionsModTwo?e_id="+emp_id[i]+"&b_id=b1",false);
			xhr.send();
			// we'll add him in the busStrength
			busStrength += parseInt(xhr.responseText);
		}
		// replace the count in the division
		document.getElementById('bus1-availability').innerHTML = 50-busStrength;
	},
12000); // this function will be called for every  4 seconds


setInterval(
	// function to update the bus status
	function()
	{
		var xhr = new XMLHttpRequest();
		// goes to #ROUTE-4
		// #ROUTE-4 returns the no. of minutes ago the bus has sent update
		xhr.open("GET","/getLastStatus",false);
		xhr.send();
		// get response and split the data
		var response_data = xhr.responseText.toString().split("*");
		var delay_time = parseInt(response_data[0]);
		var current_bus_location = response_data[1];
		current_bus_location = reverseGeocodeUsingGoogleAPI(current_bus_location);
		document.getElementById('bus1-current-location').innerHTML=current_bus_location;
		// if the value is greater than 1 we update the status as inactive
		if(parseInt(delay_time)>1)
			document.getElementById('current-bus').style.color ="red";
		else
			document.getElementById('current-bus').style.color ="green";
	},
10000); // this function will be called for every 5 seconds

setInterval(
	// this function call #ROUTE-3
	// to get the latest updates about the passengers
	function()
	{
		var xhr = new XMLHttpRequest();
		
		// get date object
		var today = new Date();
		var day = today.getDate();
		var month = today.getMonth()+1;
		var year  = today.getFullYear();	
		
		// replace single digit values, pad with zero
		if(month<10) month = "0"+month;
		if(day<10) day = "0"+day;

		var hours = today.getHours();
		var minutes = today.getMinutes();
		var seconds = today.getSeconds();

		if(hours<10) hours = "0"+hours;
		if(minutes<10) minutes = "0"+minutes;
		if(seconds<10) seconds = "0"+seconds;
		
		// form today date and time in a string 
		var date = year.toString()+month.toString()+day.toString();
		var time = hours.toString()+minutes.toString()+seconds.toString();

		// form timestamp from that string
		var start_timestamp = date+".000001";
		var end_timestamp = date + "." + time;

		// prepare parameters 
		// starting range and ending range
		var PARAMS = "?start_timestamp="+start_timestamp;
		PARAMS += "&end_timestamp="+end_timestamp;

		// call to #ROUTE-3
		xhr.open("GET","/getLiveTravelUpdates"+PARAMS,false);
		xhr.send();
		var result = JSON.parse(xhr.responseText);
		// console.log(result);
		
		// get the template 
		var raw_template = document.getElementById('live-updates-template').innerHTML;
		// compile the template
		var compiled_template = Handlebars.compile(raw_template);
		// render the compiled code
		var rendered_code = compiled_template(result);
		// set the rendered code into the page
		document.getElementById('live-updates').innerHTML = rendered_code;
	},
8000); // call this function for every 5 seconds