<?php
#########################################################
#                                                       #
# Phabricator Gantt configuration file                  #
#                                                       #
#########################################################
# Note: the file 'config-example.php' should be copied  #
#       to 'config.php' and THEN filled.                #
#########################################################

// fill this configuration with your credentials
$CONFIG = [
	// Conduit client API URL:
	'CONDUIT_URL'    => "https://your.phabricator.com/",

	// Conduit Client API Token:
	'CONDUIT_API_TOKEN' => 'your_conduit_api_token',

	// Arcanist pathname:
	'ARCANIST_PATH'     => '../arcanist/src/__phutil_library_init__.php',
];
