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

		var officialStart = task.fields[ 'custom.startdate' ];
		var deadline      = task.fields[ 'custom.deadline' ];
		var dateCreated   = task.fields.dateCreated;
		var dateClosed    = task.fields.dateClosed;
		var startDate     = officialStart || dateCreated;
		var endDate       = deadline;

		// avoid tasks shorter than half day
		if( endDate - startDate < SECONDS_IN_DAY ) {
			endDate = startDate + parseInt( SECONDS_IN_DAY / 2 );
		}

		// no deadline no party
		if( deadline ) {

			var taskID = 'T' + task.id;

			var openClose = dateClosed ? '✓' : '';

			tmpTask.id = task.phid;
			tmpTask.text = task.fields.name;
			tmpTask.link = "<a href=" + BASE_URL + taskID + " target=\"_blank\">" + taskID + "</a>" + ' ' + openClose;
			tmpTask.description = task.fields.description.raw;
			tmpTask.start_date = timestampToDate( startDate );
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
				tmpTask.textColor = 'grey';
			} else if( dateClosedMinusDeadline && dateClosedMinusDeadline < -EXTIMATION_DAYS_THRESHOLD ) {
				// task closed after deadline: UNDERstimated
				tmpTask.extimation = "UNDERstimated " + dateClosedMinusDeadline;
				tmpTask.color = '#ffccbc'; // deep-orange lighten-4
				tmpTask.textColor = 'grey';
			} else if( !dateClosed && nowMinusDeadline < -EXTIMATION_DAYS_THRESHOLD ) {
				// task running after deadline: UNDERstimated
				tmpTask.extimation = "UNDERstimated " + nowMinusDeadline;
				tmpTask.color = '#ff7043'; // deep-orange lighten-1
				tmpTask.textColor = 'black';
			} else if( dateClosed ) {
				// task closed in time
				tmpTask.extimation = "In Time";
				tmpTask.color = '#dcedc8'; // light-green lighten-4
				tmpTask.textColor = 'grey';
			} else {
				// task running in time (before deadline)
				tmpTask.extimation = "In Time";
				tmpTask.color = '#8bc34a'; // light-green
				tmpTask.textColor = 'black';
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
	return new Date(unix_timestamp * 1000);
};

/**
 * Do an HTTP GET request over weird Phabricator APIs
 *
 * @param  {String} api   Phabricator Typeahead API endpoint
 * @param  {String} query Query
 * @return {Promise}
 */
function requestPhabricatorWeirdAPIGETRequest( api, query ) {

	// API query string
	var args = {
		q:        query,
		raw:      query,
		__ajax__: 'true',
	};

	// example.com/typeahead/class/PhabricatorProjectDatasource/?q=foo&raw=foo&__ajax__=true&__metablock__=5
	var url = '/typeahead/class/' + api + '/?' + createURLParams( args );

	return new Promise( function( resolve, reject ) {

		// initialize the request
		var xhr = new XMLHttpRequest();
		xhr.open( 'GET', url );

		xhr.onload = function() {
			// check the HTTP status code
			if ( xhr.status == 200 ) {
				// resolve the promise with the response text
				resolve( normalizeWeirdPhabricatorJSON( xhr.response ) );
			} else {
				// otherwise reject with the status text
				reject( Error( xhr.statusText ) );
			}
		};

		// handle network errors
		xhr.onerror = function() {
			reject( Error( 'network error' ) );
		};

		// make the request
		xhr.send();
	} );
};

/**
 * Convert some Phabricator Tyhead Projects results to some HTML <option>s
 *
 * @param  {Array} Projects
 * @return {Array} Array of Option
 */
function adaptPhabProjectsToSelectOptions( results ) {
	var data, uid, options = [];
	for( var i = 0; i < results.length; i++ ) {
		data = results[i];

		uid = data[14]; // #project_name
		uid = uid.replace( '#', '' ); // avoid hashtag

		options.push( new Option( data[4], uid ) );
	}
	return options;
}

/**
 * Convert some Phabricator Tyhead Projects results to some HTML <option>s
 *
 * @param  {Array} Users
 * @return {Array} Array of Option
 */
function adaptPhabUsersToSelectOptions( results ) {
	var data, options = [];
	for( var i = 0; i < results.length; i++ ) {
		data = results[i];
		options.push( new Option( data[0], data[3] ) );
	}
	return options;
}

/**
 * Phabricator has a weird but original way to circumvent the
 * JSON-hijacking vulnerability. It puts an infinite JS loop
 * in every JSON requests.
 *
 * @param  {String} response
 * @return {Object}
 */
function normalizeWeirdPhabricatorJSON( response ) {

	/**
	 * Strip this f****** "shield"
	 *
	 * See https://secure.phabricator.com/source/phabricator/browse/master/src/aphront/response/AphrontResponse.php;62f5bdbbd2c55e42c85bde52a72784faa07996b6$349
	 */
	var SHIELD = 'for (;;);';
	if( response.indexOf( SHIELD ) === 0 ) {
		response = response.substring( SHIELD.length );
	} else {
		console.log( "shield not found? API changed?", response );
	}

	// for some strange reasons there are some DAMN unescaped newlines
	response = response.replace( /\n/g, '' );

	// the data is JSON encoded and encapsulated inside a payload
	var data = JSON.parse( response );
	var payload = data.payload;
	if( !payload ) {
		console.error( 'bad result', data );
		throw 'Must have a payload from Phabricator API';
	}
	return payload;
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

var KISSAutocomplete = {
	/**
	 * @param search       Text input element
	 * @param autocomplete Select input element
	 * @param callback     Function that should accept a query parameter return an Promise returning an array of Option
	 * @param onSelected   Function that will be called when an element is selected from the autocomplete
	 */
	init: function( search, autocomplete, callback, onSelected ) {
		var timeout = null;
		var KISSAutocomplete = this;

		// at every keystroke
		search.addEventListener( 'keyup', function() {

			// wait then call API
			if( timeout ) {
				clearTimeout( timeout );
			}
			timeout = setTimeout( function() {
				var query = search.value;
				KISSAutocomplete.populateAutocompleteAfterCallback( search, autocomplete, callback( query ) );
			}, 500 );
		} );

		// when an autocomplete element is selected
		autocomplete.addEventListener( 'change', function() {
			var value = autocomplete.value;
			if( value ) {
				// save its value
				search.value = value;

				// hide the autocomplete
				KISSAutocomplete.clearAutocomplete( autocomplete );

				// callback useful to detect when the user pick an element
				if( onSelected ) {
					onSelected( search, autocomplete, value );
				}
			}
		} );

		// initialize the autocomplete
		this.clearAutocomplete( autocomplete );
	},
	/**
	 * Populate the autocomplete after the Promise callback will be resolved
	 *
	 * @param search       Text input element
	 * @param autocomplete Select input element
	 * @param callback     Promise function that should return an array of Option
	 */
	populateAutocompleteAfterCallback: function( search, autocomplete, callback ) {

		var KISSAutocomplete = this;

		// call the API or whatever and return an array of { label:, value: }
		callback.then( function( options ) {

			// clear the autocomplete
			KISSAutocomplete.clearAutocomplete( autocomplete );

			// add a fake option
			var fakeOption = new Option( "Choose" );
			fakeOption.disabled = true;
			fakeOption.selected = true;
			autocomplete.options.add( fakeOption );

			// append the new ones
			for( var i = 0; i < options.length; i++ ) {
				autocomplete.options.add( options[i] );
			}

			// show again the autocomplete
			autocomplete.style.visibility = 'visible';
		} );
	},
	/**
	 * Clear an autocomplete
	 */
	clearAutocomplete: function( autocomplete ) {

		// hide the autocomplete
		autocomplete.style.visibility = "hidden";

		// clear old autocomplete options
		while ( autocomplete.options.length > 0 ) {
			autocomplete.remove( 0 );
		}
	},
};

/**
 * Sanitize an HTML string
 *
 * @param  {String} unsafeString
 * @return {String}
 */
function htmlEntities( unsafeString ) {

	// eventually initialize a dummy HTML element to sanitize strings
	if( !this.p ) {
		this.p = document.createElement( 'p' );
	}

	// set the text
	this.p.textContent = unsafeString;

	// return the sanitized text
	return this.p.innerHTML;
};
