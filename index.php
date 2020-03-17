<!DOCTYPE html>
<?php
// require some utilities
require 'functions.php';

// require the configuration file
if( !file_exists( 'config.php' ) ) {
	die( "Please copy the config-example.php to config.php and fill it" );
}
require 'config.php';

// require the Arcanist utilities to talk with the APIs
require config( 'ARCANIST_PATH' );

// read the GET parameters
$assigned = sanitize_GET_string( 'assigned' );
$project  = sanitize_GET_string( 'project'  );

// query arguments
$args = [
	'assigned' => $assigned ? [ $assigned ] : [],
	'projects' => $project  ? [ $project  ] : [],
];

$tasks = query_tasks( $args );
$users = query_users();
?>
<html>
<head>
	<title>Gantt Diagram from Phabricator</title>
	<script src="resources/gantt/codebase/dhtmlxgantt.js"></script>
	<script src="functions.js"></script>
	<script src="resources/gantt-api/api.js"></script>
	<link href="resources/gantt/codebase/dhtmlxgantt.css" rel="stylesheet" />
	<style type="text/css" media="screen">
		html, body{
			margin:0px;
			padding:0px;
			height:100%;
			overflow:hidden;
		}
	</style>
	<script type="text/javascript">
		var BASE_URL = <?= json_encode( config( 'CONDUIT_URL' ) ) ?>;
		gantt.config.grid_width = 600;
		gantt.config.readonly = true;
		gantt.locale.labels.section_template = "Task";
		gantt.templates.task_text = function(start,end,task) {
			return "<b>" + task.text + "</b>";
		};
/*
		gantt.config.lightbox.sections = [
	        {name: "description", map_to: "description", type: "textarea", focus: true},
	        {name: "link", map_to: "link", type: "template" },
	        {name: "time", type: "duration", map_to: "auto", time_format:["%d", "%m", "%Y", "%H:%i"]},
	    ];
*/
	    gantt.config.columns =  [
		    {name:"link",       label:"Task", align: "left", width: "50" },
		    {name:"text",       label:"Task name",  align: "left", tree:true, width:'*' },
/*		    {name:"start_date", label:"Start time", align: "center" }, */
		    {name:"end_date",   label:"Deadline",   align: "left" },
		    {name:"holder",     label:"Assigned To", align: "center" },
		    {name:"extimation", label:"Extimation",  align: "left" }
		];
	</script>
</head>
<body>
	<h1>Phabricator Deadlines</h1>

	<form method="get">
		<p>
			<input type="text" name="assigned" id="assigned-search" placeholder="Search User" value="<?= htmlspecialchars( $assigned ) ?>" />
			<select type="select" id="assigned-autocomplete"></select>
		</p>
		<p>
			<input type="text" name="project" id="project-search" placeholder="Project_Name" value="<?= htmlspecialchars( $project ) ?>" />
			<select type="select" id="project-autocomplete"></select>
		</p>
		<p>
			<button type="submit">Filter</button>
		</p>
	</form>

	<div id="gantt_here"></div>

	<input value="Export to PDF" type="button" onclick='gantt.exportToPDF()'>

	<script type="text/javascript">
		/**
		 * Space to be considered above the Gantt and eventually below
		 * to do not have a vertical scrollbar when enlarging the Gantt
		 * to the current window height
		 */
		var UNUSEFUL_SPACE = 200;
		var gantt_id = 'gantt_here';

		// check if this page can try to access Phabricator APIs
		var SHARE_PHABRICATOR_DOMAIN = <?= json_encode( config( 'SHARE_PHABRICATOR_DOMAIN' ) ) ?>;

		var users = userAdapter(<?= json_encode( $users ) ?>);
		var tasks = taskAdapter(<?= json_encode( $tasks ) ?>);
		gantt.init( gantt_id );
		gantt.parse(tasks);

		var ganttEl = document.getElementById( gantt_id );

		var assignedSearch       = document.getElementById( 'assigned-search' );
		var projectSearch        = document.getElementById( 'project-search' );
		var assignedAutocomplete = document.getElementById( 'assigned-autocomplete' );
		var projectAutocomplete  = document.getElementById( 'project-autocomplete' );

		// if your installation is near Phabricator, you can enable this feature
		if( SHARE_PHABRICATOR_DOMAIN ) {

			// initialize the Users autocomplete
			KISSAutocomplete.init( assignedSearch, assignedAutocomplete, function( query ) {
				return requestPhabricatorWeirdAPIGETRequest( 'PhabricatorPeopleDatasource', query )
					.then( adaptPhabUsersToSelectOptions )
			} );

			// initialize the Projects autocomplete
			KISSAutocomplete.init( projectSearch, projectAutocomplete, function( query ) {
				return requestPhabricatorWeirdAPIGETRequest( 'PhabricatorProjectDatasource', query )
					.then( adaptPhabProjectsToSelectOptions );
			} );
		} else {
			// these autocompletes are unuseful for you because they will not work
			assignedAutocomplete.style.visibility = 'hidden';
			projectAutocomplete.style.visibility  = 'hidden';
		}

		/**
		 * Adjust the Gantt height to the windows size
		 */
		function adjustLayout() {
			var h = document.body.clientHeight - UNUSEFUL_SPACE;
			ganttEl.style.height = h + 'px';
		}

		// adjust at startup
		adjustLayout();

		// adjust on layout change
		window.addEventListener( 'resize', function( event ) {
			adjustLayout();
		} );
	</script>
</body>
</html>
