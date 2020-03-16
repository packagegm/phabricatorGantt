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
 *
 * @param  array $constraints Additional query arguments
 * @return array
 */
function query_tasks( $constraints = [] ) {
	$deadline_tasks = [];

	// query arguments
	$args = [
		'order'       => 'newest',
		'constraints' => $constraints,
	];

	// call the query
	$tasks = conduit()->callMethodSynchronous( 'maniphest.search', $args );

	// prepare the array of Tasks
	foreach( $tasks['data'] as $task ) {
		if( isset( $task['fields']['custom.deadline'] ) ) {
			$deadline_tasks[] = $task;
		}
	}

	// sort by deadline
	usort( $deadline_tasks, function ( $a, $b ) {
		return $b['fields']['custom.deadline'] <=> $a['fields']['custom.deadline'];
	} );

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

/**
 * Get and sanitize a GET parameter
 *
 * @return string
 */
function sanitize_GET_string( $arg ) {
	$value = $_GET[ $arg ] ?? '';

	// the value should be a string and should be short
	if( !$value || !is_string( $value ) || strlen( $value ) > 500 ) {
		$value = null;
	}

	return $value;
}
