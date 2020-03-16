taskAdapter = function(taskPhp) {

	var tasks = [];
	var links = [];

	var SECONDS_IN_DAY = 86400;

	var EXTIMATION_DAYS_THRESHOLD = 1;

	// actual timestamp
	var NOW = ( +new Date() ) / 1000;

	var data = taskPhp;

	for (var dataEl = 0; dataEl < data.length; dataEl++) {
		var task = data[dataEl];
		var tmpTask = {};

		var dateCreated = task.fields.dateCreated;
		var dateClosed  = task.fields.dateClosed;
		var deadline    = task.fields[ 'custom.deadline' ];
		var endDate     = deadline;

		// avoit tasks shorter than one day
		if( endDate - dateCreated < SECONDS_IN_DAY ) {
			endDate = dateCreated + SECONDS_IN_DAY;
		}

		// no deadline no party
		if( deadline ) {

			var taskID = 'T' + task.id;

			var openClose = dateClosed ? '✓' : '';

			tmpTask.id = task.phid;
			tmpTask.text = task.fields.name;
			tmpTask.link = "<a href=" + BASE_URL + taskID + " target=\"_blank\">" + taskID + "</a>" + ' ' + openClose;
			tmpTask.description = task.fields.description.raw;
			tmpTask.start_date = timestampToDate( dateCreated );
			tmpTask.end_date = timestampToDate( endDate );
			tmpTask.open = !dateClosed;

			// we currently does not indicate in this way the progress
			tmpTask.progress = 0; //tmpTask.open ? 0 : 1;

			tmpTask.holder = users[task.fields.ownerPHID];

			/**
			 * Create an extimation phrase
			 */
			tmpTask.extimation = '';

			// difference between the deadline and the closed timestamp
			var dateClosedMinusDeadline = dateClosed && parseInt( ( deadline - dateClosed ) / SECONDS_IN_DAY );

			// difference between the deadline and now
			var nowMinusDeadline = parseInt( ( deadline - NOW ) / SECONDS_IN_DAY );

			/**
			 * Visually distinguish the situations
			 *
			 * See https://sviluppo.erinformatica.it/T342
			 */
			if( dateClosedMinusDeadline && dateClosedMinusDeadline > EXTIMATION_DAYS_THRESHOLD ) {
				// task closed before deadline: OVERstimated
				tmpTask.extimation = "OVERstimated +" + dateClosedMinusDeadline;
				tmpTask.color = '#bbdefb'; // blue lighten-4
			} else if( dateClosedMinusDeadline && dateClosedMinusDeadline < -EXTIMATION_DAYS_THRESHOLD ) {
				// task closed after deadline: UNDERstimated
				tmpTask.extimation = "UNDERstimated " + dateClosedMinusDeadline;
				tmpTask.color = '#ffccbc'; // deep-orange lighten-4
			} else if( nowMinusDeadline < -EXTIMATION_DAYS_THRESHOLD ) {
				// task running after deadline: UNDERstimated
				tmpTask.extimation = "UNDERstimated " + nowMinusDeadline;
				tmpTask.color = '#ff7043'; // deep-orange lighten-1
			} else if( dateClosed ) {
				// task closed in time
				tmpTask.extimation = "In Time";
				tmpTask.color = '#f1f8e9'; // light-green lighten-5
			} else {
				// task running in time (before deadline)
				tmpTask.extimation = "In Time";
				tmpTask.color = '#8bc34a'; // light-green
			}

			tasks.push(tmpTask);

			var i = 0;
			for (var depends in task.dependsOnTaskPHIDs) {
				var targetId = task.dependsOnTaskPHIDs[depends]
				var tmpLink = {};
				tmpLink.id = i;
				tmpLink.target = tmpTask.id;
				tmpLink.source = targetId;
				tmpLink.type = 0;
				links.push(tmpLink);
			}
		}
	}

	var result = {};
	result.data = tasks;
	result.links = links;
	return result;
}

userAdapter = function(taskPhp) {
	var users = {};

	for (var userIndex in taskPhp) {
		var user = taskPhp[userIndex]
		var tmpUser = {};
		tmpUser.phid = user.phid;
		tmpUser.user = user.userName;

		users[tmpUser.phid] = tmpUser.user;
	}
	return users;
}


timestampToDate = function(unix_timestamp) {
	var now = new Date(unix_timestamp * 1000);
	// Create an array with the current month, day and time
	var date = [now.getDate(), now.getMonth() + 1, now.getFullYear()];
	for (var i = 0; i < 3; i++) {
		if (date[i] < 10) {
			date[i] = "0" + date[i];
		}
	}
	return date.join("-");
};

function prepareAutocompletes() {
	// TODO
}

/**
 * Query Phabricator Users by name
 *
 * This method works if you expose this script in a subdirectory of Phabricator.
 *
 * @param {String}} query
 * @return {Promise}
 */
queryPhabricatorUsersByName = function ( query ) {

	// example.com//typeahead/class/PhabricatorPeopleDatasource/?q=foo&raw=foo&__ajax__=true
	var url = '/typeahead/class/PhabricatorPeopleDatasource/';

	return requestPhabricatorWeirdAPIGETRequest( url, {
		q: query,
		raw: query,
		__ajax__: 'true',
	} );
};

/**
 * Do an HTTP GET request over weird Phabricator APIs
 *
 * @param  {String} url
 * @param  {Object} args Arguments
 * @return {Promise}
 */
function requestPhabricatorWeirdAPIGETRequest( url, args ) {


	url += '?' + createURLParams( args );

	return new Promise( function( resolve, reject ) {

		var xhr = new XMLHttpRequest();
		xhr.open( 'GET', url );

		xhr.onload = function() {
			// check the HTTP status code
			if (xhr.status == 200) {
				// resolve the promise with the response text
				resolve( normalizeWeirdPhabricatorJSON( xhr.response ) );
			} else {
				// otherwise reject with the status text
				reject( Error( xhr.statusText ) );
			}
		};

		// handle network errors
		xhr.onerror = function() {
			reject(Error("Network Error"));
		};

		// make the request
		xhr.send();
	} );
}

/**
 * Phabricator has a weird but original way to circumvent the
 * JSON-hijacking vulnerability. It puts an infinite JS loop
 * in every JSON requests.
 *
 * See https://secure.phabricator.com/source/phabricator/browse/master/src/aphront/response/AphrontResponse.php;62f5bdbbd2c55e42c85bde52a72784faa07996b6$349
 *
 * @param  {String} response
 * @return {Object}
 */
function normalizeWeirdPhabricatorJSON( response ) {

	// strip this f****** "shield"
	var SHIELD = 'for (;;);';
	if( response.indexOf( SHIELD ) === 0 ) {
		response = response.substring( 0, SHIELD.length );
	} else {
		console.log( "shield not found? API changed?" );
	}

	return JSON.parse( response );
};

/**
 * Vanilla JS implementation of jQuery.params()
 *
 * @return string
 */
function createURLParams( args ) {
	var params = new URLSearchParams( Object.entries( args ) );
	return params.toString();
};
