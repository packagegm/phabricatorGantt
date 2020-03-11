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

$tasks = query_tasks();
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
		    {name:"text",       label:"Task name",  tree:true, width:'*' },
		    {name:"link",       label:"Task", align: "center" },
/*		    {name:"start_date", label:"Start time", align: "center" }, */
		    {name:"end_date",   label:"Deadline",   align: "center" },
		    {name:"holder",     label:"Assigned To", align: "center" },
		    {name:"humanStatus",label:"Status",      align: "center" }
		];
	</script>
</head>
<body>
	<h1>Phabricator Deadlines</h1>
	<div id="gantt_here" style='height:400px;'></div>
	<input value="Export to PDF" type="button" onclick='gantt.exportToPDF()'>
	<script type="text/javascript">
		var users = userAdapter(<?= json_encode( $users ) ?>);
		var tasks = taskAdapter(<?= json_encode( $tasks ) ?>);
		gantt.init("gantt_here");
		gantt.parse(tasks);
	</script>
</body>
</html>
