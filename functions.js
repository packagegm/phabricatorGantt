taskAdapter = function(taskPhp) {

    var tasks = [];
    var links = [];

    var data = taskPhp.data;

    for (var dataEl = 0; dataEl < data.length; dataEl++) {
        var task = data[dataEl];
        var tmpTask = {};

        tmpTask.id = task.phid;
        tmpTask.text = task.fields.name;
        tmpTask.description = task.fields.description.raw;
        tmpTask.start_date = timestampToDate( task.fields['custom.start-day'] );
        tmpTask.duration = task.fields[ 'custom.estimated-days' ];
        tmpTask.progress = 0;
        tmpTask.open = true;
        tmpTask.holder = users[task.fields.ownerPHID];

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
