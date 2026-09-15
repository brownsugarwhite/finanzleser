<?php
/**
 * Plugin Name: Finanzleser Vergleiche (financeads-Snapshot)
 * Description: Hält die normalisierten Produktlisten der financeads-Vergleiche als WP-Optionen — je Vergleich eine, dazu ein Index und der Verlauf der Bestwerte. REST: GET/POST /finanzleser/v1/vergleich-daten. Admin-Seite „Vergleiche → Datenstand".
 * Version: 0.1.0
 *
 * Warum WordPress und nicht die API im Seiten-Render: ein financeads-Abruf dauert 1–12 s,
 * und ein Build mit ~50 Vergleichsseiten dürfte nie an einem fremden Server hängen. Der
 * Refresh (tools/financeads-refresh.mjs, GitHub-Actions-Cron) schreibt hierher; Next liest
 * nur noch WordPress (lib/financeads/laden.ts) und bustet nach jedem Lauf den Cache-Tag.
 *
 * 🚨 Eine Option je Slug (autoload=no): der Index bleibt klein, ein einzelner Snapshot
 * (≤ 40 Produkte, wenige KB) wird nur geladen, wenn seine Seite ihn braucht.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

const FL_VGL_INDEX   = 'finanzleser_vergleich_daten_index';   // slug => { kategorie, klasse, anzahl, stand, geladen }
const FL_VGL_PREFIX  = 'finanzleser_vergleich_daten_';        // + slug → VergleichDaten (JSON)
const FL_VGL_VERLAUF = 'finanzleser_vergleich_verlauf';       // kategorie => [ { datum, wert } ] (90 Tage)

function fl_vgl_slug_ok( $slug ) {
	return is_string( $slug ) && preg_match( '/^[a-z0-9-]{3,80}$/', $slug );
}

function fl_vgl_index() {
	$i = get_option( FL_VGL_INDEX, array() );
	return is_array( $i ) ? $i : array();
}

function fl_vgl_lesen( $slug ) {
	if ( ! fl_vgl_slug_ok( $slug ) ) { return null; }
	$roh = get_option( FL_VGL_PREFIX . $slug, '' );
	if ( $roh === '' ) { return null; }
	$d = json_decode( $roh, true );
	return is_array( $d ) ? $d : null;
}

/** Snapshot ablegen. Erwartet das Format von lib/financeads/typen.ts `VergleichDaten`. */
function fl_vgl_schreiben( $slug, array $daten ) {
	if ( ! fl_vgl_slug_ok( $slug ) ) { return new WP_Error( 'slug', 'ungültiger Slug' ); }
	if ( empty( $daten['varianten'] ) || ! is_array( $daten['varianten'] ) ) { return new WP_Error( 'daten', 'varianten fehlen' ); }
	$daten['slug'] = $slug;
	$json = wp_json_encode( $daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	if ( $json === false ) { return new WP_Error( 'json', 'nicht kodierbar' ); }
	$name = FL_VGL_PREFIX . $slug;
	// add_option mit autoload=no; update_option ändert autoload nicht mehr, deshalb erst anlegen.
	if ( get_option( $name, null ) === null ) { add_option( $name, $json, '', 'no' ); } else { update_option( $name, $json, 'no' ); }
	$index = fl_vgl_index();
	$index[ $slug ] = array(
		'slug'      => $slug,
		'kategorie' => isset( $daten['kategorie'] ) ? sanitize_key( $daten['kategorie'] ) : '',
		'klasse'    => isset( $daten['klasse'] ) ? substr( sanitize_text_field( $daten['klasse'] ), 0, 1 ) : '',
		'anzahl'    => isset( $daten['anzahl'] ) ? (int) $daten['anzahl'] : 0,
		'stand'     => isset( $daten['stand'] ) ? sanitize_text_field( $daten['stand'] ) : '',
		'geladen'   => isset( $daten['geladen'] ) ? sanitize_text_field( $daten['geladen'] ) : gmdate( 'c' ),
	);
	ksort( $index );
	if ( get_option( FL_VGL_INDEX, null ) === null ) { add_option( FL_VGL_INDEX, $index, '', 'no' ); } else { update_option( FL_VGL_INDEX, $index, 'no' ); }
	return true;
}

/** Bestwert des Tages je Kategorie anhängen — Rohstoff für den Zinsverlauf (90 Tage). */
function fl_vgl_verlauf_anhaengen( $kategorie, $datum, $wert ) {
	$kategorie = sanitize_key( $kategorie );
	if ( ! $kategorie || ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $datum ) || ! is_numeric( $wert ) ) { return false; }
	$v = get_option( FL_VGL_VERLAUF, array() );
	if ( ! is_array( $v ) ) { $v = array(); }
	$reihe = isset( $v[ $kategorie ] ) && is_array( $v[ $kategorie ] ) ? $v[ $kategorie ] : array();
	$reihe = array_values( array_filter( $reihe, function ( $e ) use ( $datum ) { return isset( $e['datum'] ) && $e['datum'] !== $datum; } ) );
	$reihe[] = array( 'datum' => $datum, 'wert' => (float) $wert );
	usort( $reihe, function ( $a, $b ) { return strcmp( $a['datum'], $b['datum'] ); } );
	$v[ $kategorie ] = array_slice( $reihe, -90 );
	if ( get_option( FL_VGL_VERLAUF, null ) === null ) { add_option( FL_VGL_VERLAUF, $v, '', 'no' ); } else { update_option( FL_VGL_VERLAUF, $v, 'no' ); }
	return true;
}

// ─────────────────────────────────────────────
// REST
// ─────────────────────────────────────────────

add_action( 'rest_api_init', function () {
	$redaktion = function () { return current_user_can( 'edit_posts' ); };

	// GET ?slug=… → ein Snapshot (404, wenn keiner da); ohne slug → Index + Verlauf.
	register_rest_route( 'finanzleser/v1', '/vergleich-daten', array(
		array(
			'methods'             => 'GET',
			'permission_callback' => '__return_true',
			'callback'            => function ( WP_REST_Request $r ) {
				$slug = $r->get_param( 'slug' );
				if ( $slug ) {
					$d = fl_vgl_lesen( $slug );
					if ( ! $d ) { return new WP_Error( 'kein_snapshot', 'kein Snapshot für ' . $slug, array( 'status' => 404 ) ); }
					return rest_ensure_response( array( 'daten' => $d ) );
				}
				$verlauf = get_option( FL_VGL_VERLAUF, array() );
				return rest_ensure_response( array( 'uebersicht' => fl_vgl_index(), 'verlauf' => is_array( $verlauf ) ? $verlauf : array() ) );
			},
		),
		array(
			'methods'             => 'POST',
			'permission_callback' => $redaktion,
			'callback'            => function ( WP_REST_Request $r ) {
				$slug  = $r->get_param( 'slug' );
				$daten = $r->get_param( 'daten' );
				if ( ! is_array( $daten ) ) { return new WP_Error( 'daten', 'daten fehlen', array( 'status' => 400 ) ); }
				$ok = fl_vgl_schreiben( $slug, $daten );
				if ( is_wp_error( $ok ) ) { $ok->add_data( array( 'status' => 400 ) ); return $ok; }
				$verlauf = $r->get_param( 'verlauf' );
				if ( is_array( $verlauf ) && isset( $verlauf['kategorie'], $verlauf['datum'], $verlauf['wert'] ) ) {
					fl_vgl_verlauf_anhaengen( $verlauf['kategorie'], $verlauf['datum'], $verlauf['wert'] );
				}
				return rest_ensure_response( array( 'ok' => true, 'slug' => $slug, 'anzahl' => isset( $daten['anzahl'] ) ? (int) $daten['anzahl'] : 0 ) );
			},
		),
	) );

	// DELETE ?slug=… — für Slugs, die es nicht mehr gibt.
	register_rest_route( 'finanzleser/v1', '/vergleich-daten/(?P<slug>[a-z0-9-]+)', array(
		'methods'             => 'DELETE',
		'permission_callback' => $redaktion,
		'callback'            => function ( WP_REST_Request $r ) {
			$slug = $r['slug'];
			delete_option( FL_VGL_PREFIX . $slug );
			$i = fl_vgl_index(); unset( $i[ $slug ] ); update_option( FL_VGL_INDEX, $i, 'no' );
			return rest_ensure_response( array( 'ok' => true ) );
		},
	) );
} );

// ─────────────────────────────────────────────
// Admin: Vergleiche → Datenstand (nur lesen)
// ─────────────────────────────────────────────

add_action( 'admin_menu', function () {
	add_submenu_page( 'edit.php?post_type=vergleich', 'Datenstand der Vergleiche', 'Datenstand', 'edit_posts', 'fl-vergleich-datenstand', function () {
		$index = fl_vgl_index();
		echo '<div class="wrap"><h1>Datenstand der Vergleiche</h1>';
		echo '<p>Die Produktlisten der financeads-Vergleiche, wie der letzte Lauf des Refresh-Skripts sie abgelegt hat. Das Frontend zeigt genau diese Daten; „Stand“ ist das jüngste Konditionsdatum, „geladen“ der Abruf.</p>';
		if ( ! $index ) { echo '<p><em>Noch kein Snapshot vorhanden — der Refresh ist noch nicht gelaufen.</em></p></div>'; return; }
		echo '<table class="widefat striped"><thead><tr><th>Vergleich</th><th>Kategorie</th><th>Klasse</th><th>Produkte</th><th>Stand</th><th>geladen</th></tr></thead><tbody>';
		foreach ( $index as $slug => $e ) {
			$post = get_page_by_path( $slug, OBJECT, 'vergleich' );
			$link = $post ? get_edit_post_link( $post->ID ) : '';
			printf( '<tr><td>%s</td><td><code>%s</code></td><td>%s</td><td>%d</td><td>%s</td><td>%s</td></tr>',
				$link ? '<a href="' . esc_url( $link ) . '">' . esc_html( $slug ) . '</a>' : esc_html( $slug ),
				esc_html( $e['kategorie'] ), esc_html( $e['klasse'] ), (int) $e['anzahl'], esc_html( substr( (string) $e['stand'], 0, 16 ) ), esc_html( substr( (string) $e['geladen'], 0, 16 ) ) );
		}
		echo '</tbody></table></div>';
	} );
} );
