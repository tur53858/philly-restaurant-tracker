// The Walk-In — Philly Restaurant Tracker
// Web service
// Modeled after MIS3502 pattern (Prof. Shafer, Spring 2026)
// Created by: Max Perry, Summer 2026

// REMINDER - Don't forget to change your database connection
// timeout from 3 seconds to 3 minutes.
// Look under Configuration / General Configuration

// declarations *****************************************
import qs from 'qs'; //for parsing URL encoded data
import axios from 'axios'; // for calling another API
import mysql from 'mysql2/promise'; //for talking to a database


const dboptions = {
  'user'     : 'YOUR_DB_USERNAME',
  'password' : 'YOUR_DB_PASSWORD',
  'database' : 'walkin',
  'host'     : 'YOUR_RDS_ENDPOINT.rds.amazonaws.com'
};

//global connection variable
var connection;

const features = [
	"Issue a POST against login. Provide the keys of username and password. The response will be a JSON object representing the user and the session token.",
	"Issue a DELETE against login and provide a token. This is the logout action. If the token is good then login will be deleted. The result will be a confirmation string.",
	"Issue a GET against visits and provide a token. If the token is good then return all the visits for that user, joined with restaurant details.",
	"Issue a GET against visit and provide a token and a visit_id. If the token is good then return a JSON object that represents the specified visit.",
	"Issue a POST against visit and provide a token. You must also provide restaurant_id, visit_date, rating, would_return, occasion, dish_ordered, next_time_try, and notes. The result will be a JSON object representing the newly created visit.",
	"Issue a DELETE against visit and provide a token and a visit_id. If the token is good then the visit will be deleted. The result will be a confirmation string.",
	"Issue a GET against restaurants and provide a token. Returns the full list of restaurants.",
	"Issue a POST against restaurant and provide a token. You must also provide name, neighborhood, cuisine, and price_tier. The result will be a JSON object representing the newly created restaurant.",
	"Issue a GET against adminreport and provide a token. If the token is good, and if the token belongs to an admin, then return a JSON object representing all visits for all users, joined with user and restaurant details.",
	"Issue a GET against debugusers. The result will be a JSON array of all users.",
	"Issue a GET against debugvisits. The result will be a JSON array of all visits.",
	"Issue a GET against debugrestaurants. The result will be a JSON array of all restaurants.",
	"Issue a GET against debuglogins. The result will be a JSON array of all logins.",
	"Created by Max Perry, Summer 2026",
];


// supporting functions ******* STUDENT MAY EDIT ***********

let postLogin = async (res, body) => {

	// 1. Extract username and password from the request body
	let username = body.username;
	let password = body.password;

	// Validate that both fields have been provided
	if (username == undefined || username.trim() == "") {
		return formatres(res, "Username is missing or incorrect.", 400);
	}
	if (password == undefined || password.trim() == "") {
		return formatres(res, "Password is missing or incorrect.", 400);
	}

	// 2. Check if username/password combination exists
	let txtSQL1 = "SELECT * FROM users WHERE username = ? AND password = ?";
	let [result1] = await connection.execute(txtSQL1, [username, password]);

	// If no user was found, send a 400 error
	if (result1.length == 0) {
		return formatres(res, "Login failed.", 400);
	}

	// 3. Insert a new row in the logins table with a randomly generated token
	let user_id = result1[0]['user_id'];
	let txtSQL2 = "INSERT INTO logins (token, logints, user_id) VALUES (UUID(), NOW(), ?)";
	let [result2] = await connection.execute(txtSQL2, [user_id]);

	// 4. Retrieve the token just created using login_id
	let login_id = result2.insertId;
	let txtSQL3 = "SELECT token FROM logins WHERE login_id = ?";
	let [result3] = await connection.execute(txtSQL3, [login_id]);
	let newtoken = result3[0]['token'];

	// 5. Update the user's lasttoken field in the users table
	let txtSQL4 = "UPDATE users SET lasttoken = ? WHERE user_id = ?";
	let [result4] = await connection.execute(txtSQL4, [newtoken, user_id]);

	// 6. Fetch and return the user's public information along with the new token
	let txtSQL5 = "SELECT username, fname, lname, lasttoken, isadmin FROM users WHERE user_id = ?";
	let [result5] = await connection.execute(txtSQL5, [user_id]);

	// 7. Send the final response
	return formatres(res, result5, 200);
};


// ** additional supporting functions begin ** //

let deleteLogin = async (res, query) => {

	// 1. Extract the token from the query string
	let token = query.token;

	// Validate the token
	if (token == undefined || token.trim() == "") {
		return formatres(res, "Token is missing or incorrect.", 400);
	}

	// 2. Check if the token exists in the logins table
	let txtSQL1 = "SELECT * FROM logins WHERE token = ?";
	let [result1] = await connection.execute(txtSQL1, [token]);

	// If no login was found, send a 400 error
	if (result1.length == 0) {
		return formatres(res, "Token not found. Logout failed.", 400);
	}

	// 3. Delete the login row with the matching token
	let txtSQL2 = "DELETE FROM logins WHERE token = ?";
	let [result2] = await connection.execute(txtSQL2, [token]);

	// 4. Return a confirmation string
	return formatres(res, "Logout successful.", 200);
};

let getVisits = async (res, query) => {

	// 1. Extract the token from the query string
	let token = query.token;

	// Validate the token
	if (token == undefined || token.trim() == "") {
		return formatres(res, "Token is missing or incorrect.", 400);
	}

	// 2. Look up the token to find the associated user
	let txtSQL1 = "SELECT * FROM logins WHERE token = ?";
	let [result1] = await connection.execute(txtSQL1, [token]);

	// If no login was found, the token is bad
	if (result1.length == 0) {
		return formatres(res, "Token not found.", 400);
	}

	// 3. Get the user_id from the login record
	let user_id = result1[0]['user_id'];

	// 4. Retrieve all visits for that user, joined with restaurant details
	let txtSQL2 = "SELECT visits.*, restaurants.name, restaurants.neighborhood, restaurants.cuisine, restaurants.price_tier FROM visits JOIN restaurants ON visits.restaurant_id = restaurants.restaurant_id WHERE visits.user_id = ? ORDER BY visits.visit_date DESC";
	let [result2] = await connection.execute(txtSQL2, [user_id]);

	// 5. Return the visits
	return formatres(res, result2, 200);
};

let getVisit = async (res, query) => {

	// 1. Extract the token and visit_id from the query string
	let token = query.token;
	let visit_id = query.visit_id;

	// Validate the token
	if (token == undefined || token.trim() == "") {
		return formatres(res, "Token is missing or incorrect.", 400);
	}

	// Validate the visit_id
	if (visit_id == undefined || visit_id.trim() == "") {
		return formatres(res, "Visit_id is missing or incorrect.", 400);
	}

	// 2. Look up the token to find the associated user
	let txtSQL1 = "SELECT * FROM logins WHERE token = ?";
	let [result1] = await connection.execute(txtSQL1, [token]);

	// If no login was found, the token is bad
	if (result1.length == 0) {
		return formatres(res, "Token not found.", 400);
	}

	// 3. Get the user_id from the login record
	let user_id = result1[0]['user_id'];

	// 4. Retrieve the specified visit, ensuring it belongs to this user
	let txtSQL2 = "SELECT visits.*, restaurants.name, restaurants.neighborhood, restaurants.cuisine, restaurants.price_tier FROM visits JOIN restaurants ON visits.restaurant_id = restaurants.restaurant_id WHERE visits.visit_id = ? AND visits.user_id = ?";
	let [result2] = await connection.execute(txtSQL2, [visit_id, user_id]);

	// If no visit was found, return a 400 error
	if (result2.length == 0) {
		return formatres(res, "Visit not found.", 400);
	}

	// 5. Return the visit
	return formatres(res, result2[0], 200);
};

let postVisit = async (res, body) => {

	// 1. Extract all the fields from the request body
	let token = body.token;
	let restaurant_id = body.restaurant_id;
	let visit_date = body.visit_date;
	let rating = body.rating;
	let would_return = body.would_return;
	let occasion = body.occasion;
	let dish_ordered = body.dish_ordered;
	let next_time_try = body.next_time_try;
	let notes = body.notes;

	// Validate the token
	if (token == undefined || token.trim() == "") {
		return formatres(res, "Token is missing or incorrect.", 400);
	}

	// Validate the restaurant_id
	if (restaurant_id == undefined || restaurant_id.toString().trim() == "") {
		return formatres(res, "Restaurant_id is missing or incorrect.", 400);
	}

	// Validate the visit_date
	if (visit_date == undefined || visit_date.trim() == "") {
		return formatres(res, "Visit_date is missing or incorrect.", 400);
	}

	// Validate the rating
	if (rating == undefined || rating.toString().trim() == "") {
		return formatres(res, "Rating is missing or incorrect.", 400);
	}

	// Validate would_return
	if (would_return == undefined || would_return.trim() == "") {
		return formatres(res, "Would_return is missing or incorrect.", 400);
	}

	// optional fields default to empty strings if blank
	if (occasion == undefined){ occasion = ""; }
	if (dish_ordered == undefined){ dish_ordered = ""; }
	if (next_time_try == undefined){ next_time_try = ""; }
	if (notes == undefined){ notes = ""; }

	// 2. Look up the token to find the associated user
	let txtSQL1 = "SELECT * FROM logins WHERE token = ?";
	let [result1] = await connection.execute(txtSQL1, [token]);

	// If no login was found, the token is bad
	if (result1.length == 0) {
		return formatres(res, "Token not found.", 400);
	}

	// 3. Get the user_id from the login record
	let user_id = result1[0]['user_id'];

	// 4. Insert the new visit
	let txtSQL2 = "INSERT INTO visits (restaurant_id, user_id, visit_date, rating, occasion, would_return, dish_ordered, next_time_try, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
	let [result2] = await connection.execute(txtSQL2, [restaurant_id, user_id, visit_date, rating, occasion, would_return, dish_ordered, next_time_try, notes]);

	// 5. Retrieve the newly created visit using the insertId
	let visit_id = result2.insertId;
	let txtSQL3 = "SELECT visits.*, restaurants.name, restaurants.neighborhood, restaurants.cuisine, restaurants.price_tier FROM visits JOIN restaurants ON visits.restaurant_id = restaurants.restaurant_id WHERE visits.visit_id = ?";
	let [result3] = await connection.execute(txtSQL3, [visit_id]);

	// 6. Return the new visit
	return formatres(res, result3[0], 200);
};

let deleteVisit = async (res, query) => {

	// 1. Extract the token and visit_id from the query string
	let token = query.token;
	let visit_id = query.visit_id;

	// Validate the token
	if (token == undefined || token.trim() == "") {
		return formatres(res, "Token is missing or incorrect.", 400);
	}

	// Validate the visit_id
	if (visit_id == undefined || visit_id.trim() == "") {
		return formatres(res, "Visit_id is missing or incorrect.", 400);
	}

	// 2. Look up the token to find the associated user
	let txtSQL1 = "SELECT * FROM logins WHERE token = ?";
	let [result1] = await connection.execute(txtSQL1, [token]);

	// If no login was found, the token is bad
	if (result1.length == 0) {
		return formatres(res, "Token not found.", 400);
	}

	// 3. Get the user_id from the login record
	let user_id = result1[0]['user_id'];

	// 4. Verify the visit exists and belongs to this user
	let txtSQL2 = "SELECT * FROM visits WHERE visit_id = ? AND user_id = ?";
	let [result2] = await connection.execute(txtSQL2, [visit_id, user_id]);

	// If no visit was found, return a 400 error
	if (result2.length == 0) {
		return formatres(res, "Visit not found.", 400);
	}

	// 5. Delete the visit
	let txtSQL3 = "DELETE FROM visits WHERE visit_id = ?";
	let [result3] = await connection.execute(txtSQL3, [visit_id]);

	// 6. Return a confirmation string
	return formatres(res, "Visit deleted successfully.", 200);
};

let getRestaurants = async (res, query) => {

	// 1. Extract the token from the query string
	let token = query.token;

	// Validate the token
	if (token == undefined || token.trim() == "") {
		return formatres(res, "Token is missing or incorrect.", 400);
	}

	// 2. Look up the token to validate it
	let txtSQL1 = "SELECT * FROM logins WHERE token = ?";
	let [result1] = await connection.execute(txtSQL1, [token]);

	// If no login was found, the token is bad
	if (result1.length == 0) {
		return formatres(res, "Token not found.", 400);
	}

	// 3. Retrieve all restaurants, ordered alphabetically
	let txtSQL2 = "SELECT * FROM restaurants ORDER BY name ASC";
	let [result2] = await connection.execute(txtSQL2);

	// 4. Return the restaurants
	return formatres(res, result2, 200);
};

let postRestaurant = async (res, body) => {

	// 1. Extract the fields from the request body
	let token = body.token;
	let name = body.name;
	let neighborhood = body.neighborhood;
	let cuisine = body.cuisine;
	let price_tier = body.price_tier;
	let address = body.address;

	// Validate the token
	if (token == undefined || token.trim() == "") {
		return formatres(res, "Token is missing or incorrect.", 400);
	}

	// Validate the name
	if (name == undefined || name.trim() == "") {
		return formatres(res, "Name is missing or incorrect.", 400);
	}

	// Validate the neighborhood
	if (neighborhood == undefined || neighborhood.trim() == "") {
		return formatres(res, "Neighborhood is missing or incorrect.", 400);
	}

	// Validate the cuisine
	if (cuisine == undefined || cuisine.trim() == "") {
		return formatres(res, "Cuisine is missing or incorrect.", 400);
	}

	// Validate the price_tier
	if (price_tier == undefined || price_tier.toString().trim() == "") {
		return formatres(res, "Price_tier is missing or incorrect.", 400);
	}

	// optional fields default to empty strings if blank
	if (address == undefined){ address = ""; }

	// 2. Look up the token to validate it
	let txtSQL1 = "SELECT * FROM logins WHERE token = ?";
	let [result1] = await connection.execute(txtSQL1, [token]);

	// If no login was found, the token is bad
	if (result1.length == 0) {
		return formatres(res, "Token not found.", 400);
	}

	// 3. Insert the new restaurant
	let txtSQL2 = "INSERT INTO restaurants (name, neighborhood, cuisine, price_tier, address) VALUES (?, ?, ?, ?, ?)";
	let [result2] = await connection.execute(txtSQL2, [name, neighborhood, cuisine, price_tier, address]);

	// 4. Retrieve the newly created restaurant using the insertId
	let restaurant_id = result2.insertId;
	let txtSQL3 = "SELECT * FROM restaurants WHERE restaurant_id = ?";
	let [result3] = await connection.execute(txtSQL3, [restaurant_id]);

	// 5. Return the new restaurant
	return formatres(res, result3[0], 200);
};

let getAdminReport = async (res, query) => {

	// 1. Extract the token from the query string
	let token = query.token;

	// Validate the token
	if (token == undefined || token.trim() == "") {
		return formatres(res, "Token is missing or incorrect.", 400);
	}

	// 2. Look up the token to find the associated user
	let txtSQL1 = "SELECT * FROM logins WHERE token = ?";
	let [result1] = await connection.execute(txtSQL1, [token]);

	// If no login was found, the token is bad
	if (result1.length == 0) {
		return formatres(res, "Token not found.", 400);
	}

	// 3. Get the user_id from the login record and verify admin status
	let user_id = result1[0]['user_id'];
	let txtSQL2 = "SELECT * FROM users WHERE user_id = ?";
	let [result2] = await connection.execute(txtSQL2, [user_id]);

	// If the user is not an admin, deny access
	if (result2[0]['isadmin'] != "Y") {
		return formatres(res, "Access denied. Admin only.", 400);
	}

	// 4. Retrieve all visits for all users, joined with user and restaurant details
	let txtSQL3 = "SELECT users.lname, users.fname, users.username, visits.*, restaurants.name AS restaurant_name, restaurants.neighborhood, restaurants.cuisine, restaurants.price_tier FROM visits JOIN users ON visits.user_id = users.user_id JOIN restaurants ON visits.restaurant_id = restaurants.restaurant_id ORDER BY users.lname ASC, users.fname ASC, visits.visit_date DESC";
	let [result3] = await connection.execute(txtSQL3);
	return formatres(res, result3, 200);
};

let getDebugUsers = async (res, query) => {
	// Retrieve all users
	let [result] = await connection.execute("SELECT * FROM users");
	return formatres(res, result, 200);
};

let getDebugVisits = async (res, query) => {
	// Retrieve all visits
	let [result] = await connection.execute("SELECT * FROM visits");
	return formatres(res, result, 200);
};

let getDebugRestaurants = async (res, query) => {
	// Retrieve all restaurants
	let [result] = await connection.execute("SELECT * FROM restaurants");
	return formatres(res, result, 200);
};

let getDebugLogins = async (res, query) => {
	// Retrieve all logins
	let [result] = await connection.execute("SELECT * FROM logins");
	return formatres(res, result, 200);
};

// ** additional supporting functions end ** //


// do not delete this handy little supporting function
let formatres = async (res, output, statusCode) => {

	// kill the global database connection
	if (connection != undefined &&
		typeof(connection)=='object' &&
		typeof(connection.end())=='object'  ){
		await connection.end();
	}

	res.statusCode = statusCode;
	res.body = JSON.stringify(output);
	return res;
}

// do not delete this handy little supporting function
function isEmpty(obj) {
	return Object.keys(obj).length === 0;
}

// My Routing Function ****** STUDENT MAY EDIT **********

let myRoutingFunction = (res,method,path,query,body) => {

	// conditional statements go here.
	// look at the path and method and return the output from the
	// correct supporting function.

	// Simple GET request with no features specified results
	// in a list of features / instructions
	if (method == "GET" && path == ""){
		return formatres(res, features, 200);
	}

	// ** additional routing conditions begin ** //

	if (method == "POST" && path == "login"){
		return postLogin(res, body);
	}

	if (method == "DELETE" && path == "login"){
		return deleteLogin(res, query);
	}

	if (method == "GET" && path == "visits"){
		return getVisits(res, query);
	}

	if (method == "GET" && path == "visit"){
		return getVisit(res, query);
	}

	if (method == "POST" && path == "visit"){
		return postVisit(res, body);
	}

	if (method == "DELETE" && path == "visit"){
		return deleteVisit(res, query);
	}

	if (method == "GET" && path == "restaurants"){
		return getRestaurants(res, query);
	}

	if (method == "POST" && path == "restaurant"){
		return postRestaurant(res, body);
	}

	if (method == "GET" && path == "adminreport"){
		return getAdminReport(res, query);
	}

	if (method == "GET" && path == "debugusers"){
		return getDebugUsers(res, query);
	}

	if (method == "GET" && path == "debugvisits"){
		return getDebugVisits(res, query);
	}

	if (method == "GET" && path == "debugrestaurants"){
		return getDebugRestaurants(res, query);
	}

	if (method == "GET" && path == "debuglogins"){
		return getDebugLogins(res, query);
	}

	// ** additional routing conditions end ** //

	return(res);
}


// event handler **** DO NOT EDIT ***********

// Students should not have to change the code here.
// Students should be able to read and understand the code here.

export const handler = async (request) => {

	connection = await mysql.createConnection(dboptions);

	// identify the method (it will be a string)
	let method = request["httpMethod"];

	// identify the path (it will also be a string)
	let fullpath = request["path"];

	// we clean the full path up a little bit
	if (fullpath == undefined || fullpath == null){ fullpath = ""};
	let pathitems = fullpath.split("/");
	let path = pathitems[2];
	if (path == undefined || path == null){ path = ""};

	// identify the querystring ( we will convert it to
	//   a JSON object named query)
	let query = request["queryStringParameters"];
	if (query == undefined || query == null){ query={} };

	// identify the body (we will convert it to
	//   a JSON object named body)
	let body;
	try {
		body = JSON.parse(request["body"]);
	} catch (e) {
		body = qs.parse(request["body"]);
	}
	if (body == undefined || body == null){ body={} };

	// Create the default response object that will include
	// the status code, the headers needed by CORS, and
	// the string to be returned formatted as a JSON data structure.
	let res = {
		'statusCode': 400,
		'headers': {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Credentials': true
		},
		'body': JSON.stringify("Feature not found."),
	};

	// run all the parameters through my routing function
	// and return the result
	return myRoutingFunction(res,method,path,query,body);
};
