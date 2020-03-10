<?php

function getTasks() {

	$conduit = new ConduitClient( config( 'CONDUIT_URL' ) );
	$conduit->setConduitToken( config( 'CONDUIT_API_TOKEN' ) );
	$response = $conduit->callMethodSynchronous('maniphest.query', array());

	return $response;
}

function getUsers() {

	$conduit = new ConduitClient( config( 'CONDUIT_URL' ) );
	$conduit->setConduitToken( config( 'CONDUIT_API_TOKEN' ) );
	$response = $conduit->callMethodSynchronous('user.query',array());

	return $response;
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
			"Missing configuration for %s - this means you have to copy the file config-example.php to config.php and fill it",
			$attribute
		) );
	}

	return $config;
}
