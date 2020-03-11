<?php

/**
 * Get or create a valid ConduitClient instantiated objectr
 *
 * @return ConduitClient
 */
function conduit() {

	// remember the instance
	static $instance = null;

	// eventually create the instance
	if( !$instance ) {
		$instance = new ConduitClient( config( 'CONDUIT_URL'       ) );
		$instance->setConduitToken(    config( 'CONDUIT_API_TOKEN' ) );
	}

	return $instance;

}

/**
 * Query all the Maniphest Tasks
 */
function query_tasks() {
	$deadline_tasks = [];

	$tasks =
		conduit()
			->callMethodSynchronous( 'maniphest.search', [
//				'queryKey' => 'open',
				'order'    => 'newest',
			] );

	foreach( $tasks['data'] as $task ) {
		if( isset( $task['fields']['custom.deadline'] ) ) {
			$deadline_tasks[] = $task;
		}
	}

	return $deadline_tasks;
}

/**
 * Query all the Users
 */
function query_users() {
	return conduit()
		->callMethodSynchronous( 'user.query', [] );
}

/**
 * Get a global configuration attribute or die
 *
 * @param  string
 * @return mixed
 */
function config( $attribute ) {

	// check if the configuration exists or NULL
	$config = $GLOBALS['CONFIG'][ $attribute ] ?? null;

	// no config no party
	if( !$config ) {
		throw new Exception( sprintf(
			"Missing configuration for %s from config.php",
			$attribute
		) );
	}

	return $config;
}
