<?php
/**
 * Plugin Name:       finanzleser Studio Helper
 * Plugin URI:        https://github.com/nicolehahn2890/finanzleser-content-studio
 * Description:       Helper-Plugin für das finanzleser Content Studio. Gibt Yoast-Felder per REST frei, ermöglicht modified-Datum-Lock und liefert Yoast-SEO-Scores zurück ans Studio.
 * Version:           1.1.4
 * Author:            finanzleser
 * Requires at least: 5.6
 * Requires PHP:      7.2
 * License:           GPL v2 or later
 * Text Domain:       finanzleser-studio-helper
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Direktzugriff verboten
}

/**
 * 1) Yoast-Meta-Felder per REST freigeben.
 * Yoast registriert _yoast_wpseo_metadesc / _focuskw / _title als private postmeta.
 * Ohne register_post_meta(show_in_rest=true) sind sie für die WP REST API unsichtbar.
 * Wir registrieren sie hier explizit – wirkt nach Yoast (Priority 20).
 */
add_action( 'init', function () {
	$fields = array(
		'_yoast_wpseo_metadesc' => 'Yoast Meta-Description',
		'_yoast_wpseo_focuskw'  => 'Yoast Focus Keyword',
		'_yoast_wpseo_title'    => 'Yoast SEO Title',
	);
	foreach ( $fields as $key => $description ) {
		register_post_meta( 'post', $key, array(
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'string',
			'description'       => $description,
			'sanitize_callback' => 'sanitize_text_field',
			'auth_callback'     => function () {
				return current_user_can( 'edit_posts' );
			},
		) );
	}
}, 20 );

/**
 * Hilfsfunktion: einheitliche permission-Logik.
 */
function finanzleser_studio_can_edit_posts() {
	return current_user_can( 'edit_posts' );
}

/**
 * 2) REST-Endpunkt: Beitrags-Modified-Datum auf einen früheren Wert zurücksetzen.
 *    POST /wp-json/finanzleser/v1/lock-modified
 *    Body: { "post_id": 123, "modified_gmt": "2026-04-28T10:15:00" }
 *
 * Hintergrund: WordPress setzt post_modified bei jedem Update automatisch auf NOW().
 * Damit Google ein "nur Zahlen aktualisiert"-Update nicht als neu indexiert,
 * holen wir uns das alte modified_gmt vorab im Studio, schicken es nach dem Update
 * an diesen Endpunkt zurück, und der Endpunkt schreibt den alten Wert per direkter
 * DB-Operation wieder ein (kein wp_update_post – das würde modified erneut neu setzen).
 */
add_action( 'rest_api_init', function () {
	register_rest_route( 'finanzleser/v1', '/lock-modified', array(
		'methods'             => 'POST',
		'callback'            => 'finanzleser_studio_lock_modified',
		'permission_callback' => 'finanzleser_studio_can_edit_posts',
		'args'                => array(
			'post_id'      => array( 'required' => true, 'type' => 'integer' ),
			'modified_gmt' => array( 'required' => true, 'type' => 'string' ),
		),
	) );
} );

function finanzleser_studio_lock_modified( WP_REST_Request $request ) {
	global $wpdb;

	$pid = (int) $request['post_id'];
	$gmt = trim( (string) $request['modified_gmt'] );

	if ( $pid <= 0 || $gmt === '' ) {
		return new WP_Error( 'fl_bad_input', 'post_id und modified_gmt erforderlich', array( 'status' => 400 ) );
	}
	if ( ! current_user_can( 'edit_post', $pid ) ) {
		return new WP_Error( 'fl_forbidden', 'Keine Bearbeitungsrechte für diesen Beitrag', array( 'status' => 403 ) );
	}
	$post = get_post( $pid );
	if ( ! $post ) {
		return new WP_Error( 'fl_not_found', 'Beitrag existiert nicht', array( 'status' => 404 ) );
	}

	// 'YYYY-MM-DDTHH:MM:SS' (ggf. mit Z) → 'YYYY-MM-DD HH:MM:SS' (DB-Format)
	$gmt_clean = preg_replace( '/Z$/', '', $gmt );
	$gmt_db    = str_replace( 'T', ' ', $gmt_clean );
	if ( ! preg_match( '/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $gmt_db ) ) {
		return new WP_Error( 'fl_bad_date', 'modified_gmt-Format ungültig (erwartet: YYYY-MM-DDTHH:MM:SS)', array( 'status' => 400 ) );
	}
	// Sanity-Check: kein zukünftiges Datum erlauben (mit 5 Min Puffer für Clock-Skew)
	$ts = strtotime( $gmt_db . ' UTC' );
	if ( $ts === false ) {
		return new WP_Error( 'fl_bad_date', 'modified_gmt nicht parsebar', array( 'status' => 400 ) );
	}
	if ( $ts > time() + 300 ) {
		return new WP_Error( 'fl_future_date', 'modified_gmt darf nicht in der Zukunft liegen', array( 'status' => 400 ) );
	}
	$local_db = get_date_from_gmt( $gmt_db, 'Y-m-d H:i:s' );

	$updated = $wpdb->update(
		$wpdb->posts,
		array(
			'post_modified'     => $local_db,
			'post_modified_gmt' => $gmt_db,
		),
		array( 'ID' => $pid ),
		array( '%s', '%s' ),
		array( '%d' )
	);

	if ( false === $updated ) {
		return new WP_Error( 'fl_db_error', 'Datenbank-Update fehlgeschlagen', array( 'status' => 500 ) );
	}

	clean_post_cache( $pid );

	return array(
		'success'      => true,
		'post_id'      => $pid,
		'modified_gmt' => $gmt_db,
		'modified'     => $local_db,
	);
}

/**
 * 3) REST-Endpunkt: Yoast-SEO-Score für einen Beitrag abfragen.
 *    GET /wp-json/finanzleser/v1/seo-score?post_id=123
 *
 * Hinweis: Yoast berechnet die Scores normalerweise erst, wenn der Beitrag im
 * Block-Editor geöffnet wird. Für frisch via REST erstellte/aktualisierte
 * Beiträge können die Werte noch leer sein (null). In dem Fall zeigt das Studio
 * "Score noch nicht berechnet – bitte Beitrag einmal im WP-Editor öffnen".
 */
add_action( 'rest_api_init', function () {
	register_rest_route( 'finanzleser/v1', '/seo-score', array(
		'methods'             => 'GET',
		'callback'            => 'finanzleser_studio_seo_score',
		'permission_callback' => 'finanzleser_studio_can_edit_posts',
		'args'                => array(
			'post_id' => array( 'required' => true, 'type' => 'integer' ),
		),
	) );
} );

function finanzleser_studio_seo_score( WP_REST_Request $request ) {
	$pid = (int) $request['post_id'];
	if ( $pid <= 0 ) {
		return new WP_Error( 'fl_bad_input', 'post_id erforderlich', array( 'status' => 400 ) );
	}
	if ( ! current_user_can( 'edit_post', $pid ) ) {
		return new WP_Error( 'fl_forbidden', 'Keine Rechte für diesen Beitrag', array( 'status' => 403 ) );
	}
	if ( ! get_post( $pid ) ) {
		return new WP_Error( 'fl_not_found', 'Beitrag existiert nicht', array( 'status' => 404 ) );
	}

	$seo  = get_post_meta( $pid, '_yoast_wpseo_linkdex', true );        // 0–100 (SEO-Score)
	$read = get_post_meta( $pid, '_yoast_wpseo_content_score', true );  // 0–100 (Lesbarkeit)
	$kw   = get_post_meta( $pid, '_yoast_wpseo_focuskw', true );
	$md   = get_post_meta( $pid, '_yoast_wpseo_metadesc', true );
	$tt   = get_post_meta( $pid, '_yoast_wpseo_title', true );

	$score_to_int = function ( $val ) {
		if ( $val === '' || $val === null ) {
			return null;
		}
		return (int) $val;
	};

	return array(
		'post_id'           => $pid,
		'seo_score'         => $score_to_int( $seo ),
		'readability_score' => $score_to_int( $read ),
		'focus_keyword'     => (string) $kw,
		'meta_description'  => (string) $md,
		'seo_title'         => (string) $tt,
		'edit_url'          => get_edit_post_link( $pid, 'raw' ),
	);
}

/**
 * 4) REST-Endpunkt: Checklisten-CPT anlegen/aktualisieren + PDF (ACF) verknüpfen.
 *    POST /wp-json/finanzleser/v1/upsert-checkliste
 *    Body: { "slug": "abfindungen", "title": "Abfindungen", "pdf_media_id": 12345,
 *            "excerpt": "Kurzbeschreibung mit ca. 150 Zeichen ..." (optional, seit 1.1.4) }
 *
 * Das Headless-Frontend rendert die interaktive Checkliste aus der PDF, die im ACF-
 * Datei-Feld des CPT "checkliste" hängt. Dieser Endpunkt legt den passenden checkliste-
 * Eintrag (per Slug) an bzw. aktualisiert ihn und verknüpft die hochgeladene PDF.
 */
add_action( 'rest_api_init', function () {
	register_rest_route( 'finanzleser/v1', '/upsert-checkliste', array(
		'methods'             => 'POST',
		'callback'            => 'finanzleser_studio_upsert_checkliste',
		'permission_callback' => 'finanzleser_studio_can_edit_posts',
		'args'                => array(
			'slug'         => array( 'required' => true, 'type' => 'string' ),
			'title'        => array( 'required' => true, 'type' => 'string' ),
			'pdf_media_id' => array( 'required' => true, 'type' => 'integer' ),
			'excerpt'      => array( 'required' => false, 'type' => 'string' ),
		),
	) );
} );

function finanzleser_studio_upsert_checkliste( WP_REST_Request $request ) {
	$slug    = sanitize_title( (string) $request['slug'] );
	$title   = sanitize_text_field( (string) $request['title'] );
	$mid     = (int) $request['pdf_media_id'];
	$excerpt = sanitize_text_field( (string) $request->get_param( 'excerpt' ) ); // optional, seit 1.1.4

	if ( $slug === '' || $title === '' || $mid <= 0 ) {
		return new WP_Error( 'fl_bad_input', 'slug, title und pdf_media_id erforderlich', array( 'status' => 400 ) );
	}
	// Objekt-Level-Check (analog lock-modified/seo-score): Anlegen+Veröffentlichen braucht publish_posts
	if ( ! current_user_can( 'publish_posts' ) ) {
		return new WP_Error( 'fl_forbidden', 'Keine Berechtigung zum Anlegen/Veröffentlichen von Checklisten', array( 'status' => 403 ) );
	}
	if ( ! post_type_exists( 'checkliste' ) ) {
		return new WP_Error( 'fl_no_cpt', 'Custom Post Type "checkliste" existiert auf dieser Site nicht', array( 'status' => 400 ) );
	}
	if ( ! function_exists( 'update_field' ) || ! function_exists( 'get_field' ) ) {
		return new WP_Error( 'fl_no_acf', 'ACF (update_field/get_field) ist nicht verfügbar', array( 'status' => 400 ) );
	}
	if ( 'attachment' !== get_post_type( $mid ) ) {
		return new WP_Error( 'fl_bad_media', 'pdf_media_id ist kein Mediathek-Eintrag', array( 'status' => 400 ) );
	}
	if ( 'application/pdf' !== get_post_mime_type( $mid ) ) {
		return new WP_Error( 'fl_bad_mime', 'pdf_media_id ist keine PDF-Datei', array( 'status' => 400 ) );
	}

	// Bestehenden checkliste-Eintrag per Slug suchen
	$existing = get_posts( array(
		'post_type'        => 'checkliste',
		'name'             => $slug,
		'post_status'      => 'any',
		'numberposts'      => 1,
		'suppress_filters' => false,
	) );

	$created = false;
	if ( ! empty( $existing ) ) {
		$post_id = (int) $existing[0]->ID;
		// post_status mitsetzen: ein liegengebliebener Entwurf wäre für das Frontend unsichtbar
		$upd = array( 'ID' => $post_id, 'post_title' => $title, 'post_status' => 'publish' );
		if ( $excerpt !== '' ) {
			$upd['post_excerpt'] = $excerpt; // Kurzbeschreibung (~150 Z.) laut Beitragsaufbau
		}
		wp_update_post( $upd );
	} else {
		$ins = array(
			'post_type'   => 'checkliste',
			'post_title'  => $title,
			'post_name'   => $slug,
			'post_status' => 'publish',
		);
		if ( $excerpt !== '' ) {
			$ins['post_excerpt'] = $excerpt;
		}
		$post_id = wp_insert_post( $ins, true );
		if ( is_wp_error( $post_id ) ) {
			return new WP_Error( 'fl_insert_failed', 'CPT konnte nicht angelegt werden: ' . $post_id->get_error_message(), array( 'status' => 500 ) );
		}
		$created = true;
	}

	// ACF-PDF-Feld dynamisch auflösen: Datei-/Bild-Feld der checkliste-Feldgruppe
	$field_key = '';
	if ( function_exists( 'acf_get_field_groups' ) && function_exists( 'acf_get_fields' ) ) {
		$groups = acf_get_field_groups( array( 'post_type' => 'checkliste' ) );
		foreach ( (array) $groups as $g ) {
			$fields = acf_get_fields( $g['key'] );
			foreach ( (array) $fields as $f ) {
				if ( in_array( $f['type'], array( 'file', 'image' ), true ) ) {
					if ( stripos( $f['name'], 'pdf' ) !== false ) { $field_key = $f['key']; break 2; }
					if ( $field_key === '' ) { $field_key = $f['key']; }
				}
			}
		}
	}

	if ( $field_key === '' ) {
		$field_key = 'checkliste_pdf'; // Fallback auf vermuteten Feldnamen
	}
	update_field( $field_key, $mid, $post_id );
	$raw     = get_field( $field_key, $post_id, false ); // false = Rohwert (Attachment-ID)
	$pdf_set = ( is_array( $raw ) ? false : ( (int) $raw === $mid ) );

	// HINWEIS: Die alte PDF wird BEWUSST nicht sofort geloescht. Wuerde sie geloescht,
	// zeigt der Frontend-Cache (GraphQL revalidate) waehrend des Cache-Fensters noch auf
	// die alte, nun geloeschte URL -> "Parse error"/kaputte Checkliste. Verwaiste PDFs
	// sind harmlos und werden ggf. separat (z.B. manuell in der Mediathek) aufgeraeumt.

	clean_post_cache( $post_id );

	return array(
		'success'      => true,
		'post_id'      => $post_id,
		'slug'         => $slug,
		'created'      => $created,
		'pdf_media_id' => $mid,
		'field_key'    => $field_key,
		'pdf_set'      => $pdf_set,
		'excerpt_set'  => ( $excerpt !== '' ),
		'edit_url'     => get_edit_post_link( $post_id, 'raw' ),
	);
}

/**
 * 5) Health-Check-Endpunkt – damit das Studio prüfen kann, ob das Plugin aktiv ist.
 *    GET /wp-json/finanzleser/v1/ping
 */
add_action( 'rest_api_init', function () {
	register_rest_route( 'finanzleser/v1', '/ping', array(
		'methods'             => 'GET',
		'callback'            => function () {
			return array(
				'plugin'  => 'finanzleser-studio-helper',
				'version' => '1.1.4',
				'time'    => current_time( 'mysql', true ),
			);
		},
		'permission_callback' => '__return_true',
	) );
} );
