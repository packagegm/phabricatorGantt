taskAdapter = function(taskPhp) {

	var tasks = [];
	var links = [];

	var SECONDS_IN_DAY = 86400;

	var EXTIMATION_DAYS_THRESHOLD = 1;

	var data = taskPhp;

	for (var dataEl = 0; dataEl < data.length; dataEl++) {
		var task = data[dataEl];
		var tmpTask = {};

		var dateCreated = task.fields.dateCreated;
		var dateClosed  = task.fields.dateClosed;
		var deadline    = task.fields[ 'custom.deadline' ];

		// no deadline no party
		if( deadline ) {

			var duration = parseInt( ( deadline - dateCreated ) / 86400 );
			if( duration < 1 ) {
				duration = 1;
			}

			var taskID = 'T' + task.id;

			var openClose = dateClosed ? '✓' : '';

			tmpTask.id = task.phid;
			tmpTask.text = task.fields.name;
			tmpTask.link = "<a href=" + BASE_URL + taskID + " target=\"_blank\">" + taskID + "</a>" + ' ' + openClose;
			tmpTask.description = task.fields.description.raw;
			tmpTask.start_date = timestampToDate( dateCreated );
			tmpTask.end_date = timestampToDate( deadline );
			tmpTask.open = !dateClosed;
			tmpTask.progress = tmpTask.open ? 0 : 1;
			tmpTask.holder = users[task.fields.ownerPHID];

			/**
			 * Check extimation
			 */
			if( dateClosed ) {
				var dateClosedMinusDeadline = parseInt( ( deadline - dateClosed ) / SECONDS_IN_DAY );
				if( dateClosedMinusDeadline > EXTIMATION_DAYS_THRESHOLD ) {
					tmpTask.extimation = "OVERstimated +" + dateClosedMinusDeadline;
				} else if( dateClosedMinusDeadline < -EXTIMATION_DAYS_THRESHOLD ) {
					tmpTask.extimation = "UNDERstimated -" + dateClosedMinusDeadline;
				} else {
					tmpTask.extimation = "In Time";
				}
			} else {
				tmpTask.extimation = '';
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
}
