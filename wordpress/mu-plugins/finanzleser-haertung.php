<?php
/**
 * Plugin Name: Finanzleser Härtung
 * Description: Schliesst die Befunde aus dem Sicherheitsvorfall vom August 2026 —
 *              oeffentliche Benutzer-Auflistung und XML-RPC.
 *
 * Hintergrund: Beim Einbruch (wp2shell / CVE-2026-63030) war dokumentiert, dass das
 * System oeffentlich Benutzernamen preisgab (`/wp-json/wp/v2/users`, `?author=N`).
 * Benutzernamen sind die halbe Miete fuer einen Anmeldeversuch. Headless braucht
 * beides nicht: das Frontend liest nur posts, pages, media, search, vergleich und
 * die eigenen finanzleser/v1-Endpunkte (geprueft am Frontend-Code, 03.09.2026).
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * 1) Benutzer-Endpunkt nur fuer Angemeldete.
 *    Nicht komplett entfernen — das WP-Backend und der Content-Studio-Helper
 *    brauchen ihn im angemeldeten Zustand.
 */
add_filter( 'rest_endpoints', function ( $endpoints ) {
	if ( is_user_logged_in() ) {
		return $endpoints;
	}
	unset( $endpoints['/wp/v2/users'] );
	unset( $endpoints['/wp/v2/users/(?P<id>[\d]+)'] );
	return $endpoints;
} );

/**
 * 2) Autoren-Auflistung ueber ?author=N unterbinden.
 *    WP leitet sonst auf /author/<benutzername>/ um und verraet damit den Login-Namen.
 */
add_action( 'parse_request', function ( $wp ) {
	if ( is_admin() ) {
		return;
	}
	$per_query = isset( $wp->query_vars['author'] ) && $wp->query_vars['author'] !== '';
	$per_get   = isset( $_GET['author'] ) && $_GET['author'] !== '';
	if ( $per_query || $per_get ) {
		wp_die( 'Nicht verfügbar.', '', array( 'response' => 404 ) );
	}
} );

/**
 * 3) XML-RPC abschalten. Headless nutzt es nicht; es ist ein bekannter Angriffsweg
 *    fuer Passwort-Durchprobieren (system.multicall buendelt viele Versuche in einer
 *    einzigen Anfrage).
 */
add_filter( 'xmlrpc_enabled', '__return_false' );
add_filter( 'xmlrpc_methods', '__return_empty_array' );

/**
 * 4) WordPress-Version nicht im Quelltext ausweisen.
 */
remove_action( 'wp_head', 'wp_generator' );
add_filter( 'the_generator', '__return_empty_string' );
