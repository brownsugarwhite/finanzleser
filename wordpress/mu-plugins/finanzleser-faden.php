<?php
/**
 * Plugin Name: finanzleser Faden
 * Description: Inhaltsvertrag für den Faden (docs/Konzept_Inhaltsvertrag.md): Beitragstypen Glossar und Spiel,
 *              Taxonomie Lebenslage, sieben Meta-Felder am Beitrag, Faden-Options, REST-Endpunkte für das
 *              Content Studio, GraphQL-Felder für das Frontend. Kein ACF. Alles additiv: das heutige Frontend
 *              ignoriert die Felder, nichts Bestehendes ändert sich.
 * Version:     0.2.0 (08.09.2026: statistiken; zuerst auf cms-dev)
 * Author:      Florian Frey
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ─────────────────────────────────────────────
// 1) Beitragstypen: Glossar und Spiel, Taxonomie Lebenslage
// ─────────────────────────────────────────────

add_action( 'init', function () {

	register_post_type( 'glossar', array(
		'labels'              => array( 'name' => 'Glossar', 'singular_name' => 'Begriff', 'add_new_item' => 'Begriff anlegen', 'edit_item' => 'Begriff bearbeiten', 'menu_name' => 'Glossar' ),
		'public'              => true,
		'has_archive'         => false,
		'rewrite'             => array( 'slug' => 'glossar', 'with_front' => false ),
		'menu_icon'           => 'dashicons-book-alt',
		'supports'            => array( 'title', 'editor', 'excerpt', 'revisions', 'custom-fields' ),
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'glossarEintrag',
		'graphql_plural_name' => 'glossarEintraege',
	) );

	register_post_type( 'spiel', array(
		'labels'              => array( 'name' => 'Spiele', 'singular_name' => 'Spiel', 'add_new_item' => 'Spiel anlegen', 'menu_name' => 'Spiele' ),
		'public'              => true,
		'has_archive'         => false,
		'rewrite'             => array( 'slug' => 'spiele', 'with_front' => false ),
		'menu_icon'           => 'dashicons-games',
		'supports'            => array( 'title', 'editor', 'revisions', 'custom-fields' ),
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'spiel',
		'graphql_plural_name' => 'spiele',
	) );

	// Lebenslage: Kind, Haus, Hund, Heirat, Ruhestand, Trennung, Jobverlust – für Lebensereignis-Karten und „Leo fragt“
	register_taxonomy( 'lebenslage', array( 'post', 'rechner', 'checkliste', 'vergleich', 'glossar' ), array(
		'labels'              => array( 'name' => 'Lebenslagen', 'singular_name' => 'Lebenslage' ),
		'public'              => true,
		'hierarchical'        => false,
		'rewrite'             => array( 'slug' => 'leben', 'with_front' => false ),
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'lebenslage',
		'graphql_plural_name' => 'lebenslagen',
	) );

	// Rubrik des Begriffs (Finanzen, Versicherungen, Steuern, Recht), getrennt von den Beitragskategorien
	register_taxonomy( 'glossar_rubrik', array( 'glossar' ), array(
		'labels'              => array( 'name' => 'Rubriken', 'singular_name' => 'Rubrik' ),
		'public'              => true,
		'hierarchical'        => true,
		'rewrite'             => false,
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'glossarRubrik',
		'graphql_plural_name' => 'glossarRubriken',
	) );
}, 5 );

// ─────────────────────────────────────────────
// 2) Meta-Felder (Vertrag, Abschnitt „Die Ergänzungen am Beitrag“ und „Die neuen Typen“)
//    JSON-Felder sind Strings; Prüfung beim Schreiben (gültiges JSON), Status je Feld liegt IM JSON
//    ({ status: "entwurf"|"freigegeben", erzeugt_am, ... }), damit das Studio vorbelegen kann,
//    ohne dass Ungeprüftes erscheint.
// ─────────────────────────────────────────────

function finanzleser_faden_json_ok( $wert ) {
	if ( $wert === '' || $wert === null ) {
		return '';
	}
	$dek = json_decode( (string) $wert, true );
	return ( json_last_error() === JSON_ERROR_NONE ) ? wp_json_encode( $dek, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) : '';
}

function finanzleser_faden_felder() {
	// Feldname => [ Beitragstypen, Typ (json|text), Beschreibung ]
	return array(
		'kurzfassung'      => array( array( 'post' ), 'json', 'Leos Kurzfassung: { saetze: [], quellen: [], status, erzeugt_am }' ),
		'leo_fragen'       => array( array( 'post' ), 'json', 'Fragen je Abschnitt: [{ abschnitt, frage, antwort, quellen: [], status }]' ),
		'glossar_begriffe' => array( array( 'post', 'rechner', 'checkliste', 'vergleich', 'dokument' ), 'json', 'Vorbelegte Glossar-Slugs: ["schliessanlage", ...]' ),
		'leo_einwuerfe'    => array( array( 'post' ), 'json', 'Einwürfe: [{ nach, typ, slug, grund }]' ),
		'dazu_passt'       => array( array( 'post', 'rechner', 'checkliste', 'vergleich' ), 'json', 'Verwandte Inhalte: [{ typ, slug }]' ),
		'waechter_regeln'  => array( array( 'post', 'rechner' ), 'json', 'Berührte Werte der Rechner-Konfiguration: ["grundfreibetrag", "bbg"]' ),
		'statistiken'      => array( array( 'post' ), 'json', 'Statistiken je Abschnitt: [{ abschnitt, art: torte|saeulen|balken, titel, einheit, quelle: { name, url, stand }, reihen: [{ key, label, werte: [{ label, wert }] }], regler, hinweis, status }]' ),
		// Glossar
		'varianten'        => array( array( 'glossar' ), 'json', 'Schreibweisen und Flexionen: ["Haftpflicht", "Haftpflichtversicherung"]' ),
		'quelle'           => array( array( 'glossar' ), 'text', 'Bedingungswerk, Gesetz oder Seite' ),
		'ratgeber'         => array( array( 'glossar' ), 'text', 'Slug des verknüpften Ratgebers' ),
		'tool'             => array( array( 'glossar' ), 'text', 'Typ/Slug des verknüpften Finanztools, z. B. rechner/unterhaltsrechner' ),
		'frage'            => array( array( 'glossar' ), 'text', 'Eine interessante Frage an Leo' ),
		'antwort'          => array( array( 'glossar' ), 'text', 'Vorbereitete Antwort mit Quelle' ),
		'wappen'           => array( array( 'glossar', 'spiel' ), 'text', 'Themen-Wappen (haftpflicht, hausrat, hund, steuer, rente, kinder, kfz, wohnen, vorsorge, recht, sparen, kassensturz)' ),
		'status'           => array( array( 'glossar', 'spiel' ), 'text', 'entwurf | freigegeben' ),
		// Spiel
		'spiel_typ'        => array( array( 'spiel' ), 'text', 'mythos | quiz | schaetzen | gewusst | finanzwort' ),
		'spiel_felder'     => array( array( 'spiel' ), 'json', 'Die Felder der Box, wie das Studio sie heute als data-gam-field schreibt' ),
		'punkte'           => array( array( 'spiel' ), 'text', 'Punkte bei Erfolg' ),
		'datum'            => array( array( 'spiel' ), 'text', 'Tag oder Woche der Ausspielung (YYYY-MM-DD), leer = zeitlos' ),
	);
}

add_action( 'init', function () {
	$nur_redaktion = function () { return current_user_can( 'edit_posts' ); };
	foreach ( finanzleser_faden_felder() as $key => $def ) {
		foreach ( $def[0] as $typ ) {
			register_post_meta( $typ, $key, array(
				'type'              => 'string',
				'single'            => true,
				'default'           => '',
				'description'       => $def[2],
				'show_in_rest'      => true,
				'sanitize_callback' => $def[1] === 'json' ? 'finanzleser_faden_json_ok' : 'sanitize_textarea_field',
				'auth_callback'     => $nur_redaktion,
			) );
		}
	}
}, 6 );

// ─────────────────────────────────────────────
// 3) Options: Wächter-Regeln, Kassensturz, Leo fragt, Lebensereignisse, Level
//    (Muster finanzleser-site-settings: eine Option je Thema, JSON, REST GET öffentlich, POST Redaktion)
// ─────────────────────────────────────────────

function finanzleser_faden_optionen() {
	return array( 'faden_waechter_regeln', 'faden_kassensturz', 'faden_leo_fragt', 'faden_lebensereignisse', 'faden_level' );
}

add_action( 'rest_api_init', function () {
	$kann = function () { return current_user_can( 'edit_posts' ); };

	// Alle Faden-Options lesen (öffentlich, das Frontend braucht sie beim Rendern) / schreiben (Redaktion, Studio)
	register_rest_route( 'finanzleser/v1', '/faden-options', array(
		array(
			'methods'             => 'GET',
			'permission_callback' => '__return_true',
			'callback'            => function () {
				$aus = array();
				foreach ( finanzleser_faden_optionen() as $o ) {
					$w = get_option( $o, '' );
					$aus[ $o ] = $w === '' ? null : json_decode( $w, true );
				}
				return rest_ensure_response( $aus );
			},
		),
		array(
			'methods'             => 'POST',
			'permission_callback' => $kann,
			'callback'            => function ( WP_REST_Request $r ) {
				$geschrieben = array();
				foreach ( finanzleser_faden_optionen() as $o ) {
					if ( $r->has_param( $o ) ) {
						$wert = $r->get_param( $o );
						update_option( $o, wp_json_encode( $wert, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ), false );
						$geschrieben[] = $o;
					}
				}
				return rest_ensure_response( array( 'ok' => true, 'geschrieben' => $geschrieben ) );
			},
		),
	) );

	// Studio: die Faden-Felder eines Beitrags in einem Aufruf schreiben.
	// POST /wp-json/finanzleser/v1/faden-felder  { post_id, felder: { kurzfassung: {...}, leo_fragen: [...], ... } }
	register_rest_route( 'finanzleser/v1', '/faden-felder', array(
		'methods'             => 'POST',
		'permission_callback' => $kann,
		'args'                => array(
			'post_id' => array( 'required' => true, 'type' => 'integer' ),
			'felder'  => array( 'required' => true, 'type' => 'object' ),
		),
		'callback'            => function ( WP_REST_Request $r ) {
			$id = (int) $r['post_id'];
			$post = get_post( $id );
			if ( ! $post ) {
				return new WP_Error( 'fl_kein_beitrag', 'Beitrag nicht gefunden', array( 'status' => 404 ) );
			}
			$erlaubt = finanzleser_faden_felder();
			$geschrieben = array(); $abgelehnt = array();
			foreach ( (array) $r['felder'] as $key => $wert ) {
				if ( ! isset( $erlaubt[ $key ] ) || ! in_array( $post->post_type, $erlaubt[ $key ][0], true ) ) {
					$abgelehnt[] = $key; continue;
				}
				$speichern = $erlaubt[ $key ][1] === 'json' ? wp_json_encode( $wert, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) : sanitize_textarea_field( (string) $wert );
				update_post_meta( $id, $key, $speichern );
				$geschrieben[] = $key;
			}
			return rest_ensure_response( array( 'ok' => true, 'post_id' => $id, 'geschrieben' => $geschrieben, 'abgelehnt' => $abgelehnt ) );
		},
	) );

	// Studio: Glossar-Begriff anlegen oder aktualisieren (Schlüssel = Slug). Entwürfe bleiben Entwürfe.
	// POST /wp-json/finanzleser/v1/upsert-glossar { slug, titel, erklaerung, varianten: [], quelle, ratgeber, tool, frage, antwort, wappen, rubrik, status }
	register_rest_route( 'finanzleser/v1', '/upsert-glossar', array(
		'methods'             => 'POST',
		'permission_callback' => $kann,
		'args'                => array(
			'slug'  => array( 'required' => true, 'type' => 'string' ),
			'titel' => array( 'required' => true, 'type' => 'string' ),
		),
		'callback'            => function ( WP_REST_Request $r ) {
			$slug = sanitize_title( (string) $r['slug'] );
			$vorhanden = get_posts( array( 'post_type' => 'glossar', 'name' => $slug, 'post_status' => array( 'publish', 'draft', 'pending' ), 'numberposts' => 1 ) );
			$status = ( $r->get_param( 'status' ) === 'freigegeben' && current_user_can( 'publish_posts' ) ) ? 'publish' : 'draft';
			$daten = array(
				'post_type'    => 'glossar',
				'post_name'    => $slug,
				'post_title'   => sanitize_text_field( (string) $r['titel'] ),
				'post_content' => wp_kses_post( (string) $r->get_param( 'erklaerung' ) ),
				'post_status'  => $status,
			);
			if ( $vorhanden ) {
				$daten['ID'] = $vorhanden[0]->ID;
				$id = wp_update_post( $daten, true );
			} else {
				$id = wp_insert_post( $daten, true );
			}
			if ( is_wp_error( $id ) ) {
				return $id;
			}
			foreach ( array( 'quelle', 'ratgeber', 'tool', 'frage', 'antwort', 'wappen' ) as $k ) {
				if ( $r->has_param( $k ) ) {
					update_post_meta( $id, $k, sanitize_textarea_field( (string) $r->get_param( $k ) ) );
				}
			}
			if ( $r->has_param( 'varianten' ) ) {
				update_post_meta( $id, 'varianten', wp_json_encode( array_values( array_map( 'sanitize_text_field', (array) $r->get_param( 'varianten' ) ) ), JSON_UNESCAPED_UNICODE ) );
			}
			update_post_meta( $id, 'status', $status === 'publish' ? 'freigegeben' : 'entwurf' );
			if ( $r->has_param( 'rubrik' ) ) {
				wp_set_object_terms( $id, sanitize_text_field( (string) $r->get_param( 'rubrik' ) ), 'glossar_rubrik' );
			}
			return rest_ensure_response( array( 'ok' => true, 'id' => $id, 'slug' => $slug, 'status' => $status, 'neu' => ! $vorhanden ) );
		},
	) );

	// Studio: Spiel anlegen oder aktualisieren.
	// POST /wp-json/finanzleser/v1/upsert-spiel { slug, titel, typ, felder: {...}, punkte, wappen, datum, status }
	register_rest_route( 'finanzleser/v1', '/upsert-spiel', array(
		'methods'             => 'POST',
		'permission_callback' => $kann,
		'args'                => array(
			'slug'  => array( 'required' => true, 'type' => 'string' ),
			'titel' => array( 'required' => true, 'type' => 'string' ),
			'typ'   => array( 'required' => true, 'type' => 'string' ),
		),
		'callback'            => function ( WP_REST_Request $r ) {
			$slug = sanitize_title( (string) $r['slug'] );
			$typ  = sanitize_key( (string) $r['typ'] );
			// 'karte' und 'rubbellos' sind am 11.09.2026 gestrichen. Vorhandene Beiträge dieser Typen
			// bleiben in der Datenbank, lassen sich über diesen Weg aber nicht mehr anlegen oder ändern.
			if ( ! in_array( $typ, array( 'mythos', 'quiz', 'schaetzen', 'gewusst', 'finanzwort' ), true ) ) {
				return new WP_Error( 'fl_typ', 'Unbekannter Spieltyp', array( 'status' => 400 ) );
			}
			$vorhanden = get_posts( array( 'post_type' => 'spiel', 'name' => $slug, 'post_status' => array( 'publish', 'draft', 'pending' ), 'numberposts' => 1 ) );
			$status = ( $r->get_param( 'status' ) === 'freigegeben' && current_user_can( 'publish_posts' ) ) ? 'publish' : 'draft';
			$daten = array( 'post_type' => 'spiel', 'post_name' => $slug, 'post_title' => sanitize_text_field( (string) $r['titel'] ), 'post_status' => $status, 'post_content' => '' );
			if ( $vorhanden ) { $daten['ID'] = $vorhanden[0]->ID; $id = wp_update_post( $daten, true ); } else { $id = wp_insert_post( $daten, true ); }
			if ( is_wp_error( $id ) ) { return $id; }
			update_post_meta( $id, 'spiel_typ', $typ );
			update_post_meta( $id, 'spiel_felder', wp_json_encode( (array) $r->get_param( 'felder' ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
			foreach ( array( 'punkte', 'wappen', 'datum' ) as $k ) {
				if ( $r->has_param( $k ) ) { update_post_meta( $id, $k, sanitize_text_field( (string) $r->get_param( $k ) ) ); }
			}
			update_post_meta( $id, 'status', $status === 'publish' ? 'freigegeben' : 'entwurf' );
			return rest_ensure_response( array( 'ok' => true, 'id' => $id, 'slug' => $slug, 'status' => $status, 'neu' => ! $vorhanden ) );
		},
	) );

	// Kurzer Selbsttest: was das Plugin bereitstellt
	register_rest_route( 'finanzleser/v1', '/faden-ping', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function () {
			return rest_ensure_response( array(
				'plugin'   => 'finanzleser-faden 0.2.0',
				'typen'    => array( 'glossar' => post_type_exists( 'glossar' ), 'spiel' => post_type_exists( 'spiel' ) ),
				'felder'   => array_keys( finanzleser_faden_felder() ),
				'optionen' => finanzleser_faden_optionen(),
				'glossar'  => (int) wp_count_posts( 'glossar' )->publish + (int) wp_count_posts( 'glossar' )->draft,
				'spiele'   => (int) wp_count_posts( 'spiel' )->publish + (int) wp_count_posts( 'spiel' )->draft,
			) );
		},
	) );
} );

// ─────────────────────────────────────────────
// 4) GraphQL: Meta-Felder und Options ins Schema (WPGraphQL übernimmt register_post_meta nicht von selbst)
// ─────────────────────────────────────────────

add_action( 'graphql_register_types', function () {
	if ( ! function_exists( 'register_graphql_field' ) ) {
		return;
	}
	$aus_meta = function ( $key ) {
		return function ( $post ) use ( $key ) {
			$id = $post->databaseId ?? ( $post->ID ?? 0 );
			if ( ! $id ) { return null; }
			$w = get_post_meta( $id, $key, true );
			return ( $w === '' || $w === false ) ? null : $w;
		};
	};
	$graphql_typ = array( 'post' => 'Post', 'rechner' => 'Rechner', 'checkliste' => 'Checkliste', 'vergleich' => 'Vergleich', 'dokument' => 'Dokument', 'glossar' => 'GlossarEintrag', 'spiel' => 'Spiel' );
	// Feldnamen im Schema in camelCase, Inhalt als String (JSON-Felder als JSON-String; das Frontend parst)
	$camel = function ( $s ) { return lcfirst( str_replace( ' ', '', ucwords( str_replace( '_', ' ', $s ) ) ) ); };
	foreach ( finanzleser_faden_felder() as $key => $def ) {
		foreach ( $def[0] as $typ ) {
			if ( ! isset( $graphql_typ[ $typ ] ) ) { continue; }
			register_graphql_field( $graphql_typ[ $typ ], $camel( $key ), array(
				'type'        => 'String',
				'description' => $def[2] . ( $def[1] === 'json' ? ' (JSON-String)' : '' ),
				'resolve'     => $aus_meta( $key ),
			) );
		}
	}
	register_graphql_field( 'RootQuery', 'fadenOptions', array(
		'type'        => 'String',
		'description' => 'Alle Faden-Options als JSON-String: Wächter-Regeln, Kassensturz, Leo fragt, Lebensereignisse, Level',
		'resolve'     => function () {
			$aus = array();
			foreach ( finanzleser_faden_optionen() as $o ) {
				$w = get_option( $o, '' );
				$aus[ $o ] = $w === '' ? null : json_decode( $w, true );
			}
			return wp_json_encode( $aus, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
		},
	) );
} );
