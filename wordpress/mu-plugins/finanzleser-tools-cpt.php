<?php
/**
 * Finanzleser Tool-CPTs + Felder (ACF-frei)
 *
 * Ersetzt drei Custom Post Types und drei Felder, die bisher über die ACF-UI
 * definiert waren und deshalb ohne ACF Pro gar nicht existierten:
 *
 *   rechner · checkliste · vergleich          (waren `acf-post-type`-Einträge)
 *   beitrag_untertitel                        (Feldgruppe „Beitrag")
 *   rechner_typ · rechner_beschreibung        (Feldgruppe „Rechner")
 *
 * Die Einstellungen sind 1:1 aus den ACF-Definitionen der Produktionsdatenbank
 * übernommen (ausgelesen am 03.09.2026), damit das GraphQL-Schema unverändert
 * bleibt — insbesondere:
 *
 *   rechner:    single = plural = "rechner"  → WPGraphQL erzeugt daraus `allRechner`
 *   checkliste: single "checkliste", plural "checklisten" → `checklisten`
 *   vergleich:  single "vergleich", plural "vergleiche"   (Frontend nutzt REST)
 *
 * 🚨 Die Meta-Schlüssel bleiben unverändert (`beitrag_untertitel`, `rechner_typ`,
 * `rechner_beschreibung`) — die vorhandenen Werte für 202 Beiträge und 56 Rechner
 * werden dadurch ohne Datenmigration weiterverwendet.
 *
 * Siehe Roadmap-Phase E. Mit dieser Datei entfallen ACF Pro und WPGraphQL-ACF.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// ─────────────────────────────────────────────
// Custom Post Types
// ─────────────────────────────────────────────

add_action( 'init', function () {

	$gemeinsam = array(
		'public'              => true,
		'publicly_queryable'  => true,
		'show_ui'             => true,
		'show_in_menu'        => true,
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'hierarchical'        => false,
		'has_archive'         => false,
		'exclude_from_search' => false,
		'supports'            => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
		'capability_type'     => 'post',
		'can_export'          => true,
		'delete_with_user'    => false,
		// URLs löst das Next.js-Frontend auf (/finanztools/…), WP muss nicht umschreiben.
		'rewrite'             => false,
		'menu_icon'           => 'dashicons-admin-post',
	);

	register_post_type( 'rechner', array_merge( $gemeinsam, array(
		'labels' => array(
			'name'               => 'Rechner',
			'singular_name'      => 'Rechner',
			'menu_name'          => 'Rechner',
			'all_items'          => 'Alle Rechner',
			'add_new'            => 'Neu anlegen',
			'add_new_item'       => 'Neuen Rechner anlegen',
			'edit_item'          => 'Rechner bearbeiten',
			'new_item'           => 'Neuer Rechner',
			'view_item'          => 'Rechner ansehen',
			'search_items'       => 'Rechner suchen',
			'not_found'          => 'Keine Rechner gefunden',
			'not_found_in_trash' => 'Keine Rechner im Papierkorb',
		),
		// 🚨 Einzahl UND Mehrzahl "rechner" — genau wie in ACF. WPGraphQL stellt bei
		// Namensgleichheit ein "all" voran, daraus wird `allRechner`. Wird hier eine
		// echte Mehrzahl eingetragen, heisst die Abfrage ploetzlich anders und das
		// Frontend bricht.
		'graphql_single_name' => 'rechner',
		'graphql_plural_name' => 'rechner',
		'menu_position'       => 25,
	) ) );

	register_post_type( 'checkliste', array_merge( $gemeinsam, array(
		'labels' => array(
			'name'               => 'Checklisten',
			'singular_name'      => 'Checkliste',
			'menu_name'          => 'Checklisten',
			'all_items'          => 'Alle Checklisten',
			'add_new'            => 'Neu anlegen',
			'add_new_item'       => 'Neue Checkliste anlegen',
			'edit_item'          => 'Checkliste bearbeiten',
			'new_item'           => 'Neue Checkliste',
			'view_item'          => 'Checkliste ansehen',
			'search_items'       => 'Checklisten suchen',
			'not_found'          => 'Keine Checklisten gefunden',
			'not_found_in_trash' => 'Keine Checklisten im Papierkorb',
		),
		'graphql_single_name' => 'checkliste',
		'graphql_plural_name' => 'checklisten',
		'menu_position'       => 26,
	) ) );

	register_post_type( 'vergleich', array_merge( $gemeinsam, array(
		'labels' => array(
			'name'               => 'Vergleiche',
			'singular_name'      => 'Vergleich',
			'menu_name'          => 'Vergleiche',
			'all_items'          => 'Alle Vergleiche',
			'add_new'            => 'Neu anlegen',
			'add_new_item'       => 'Neuen Vergleich anlegen',
			'edit_item'          => 'Vergleich bearbeiten',
			'new_item'           => 'Neuer Vergleich',
			'view_item'          => 'Vergleich ansehen',
			'search_items'       => 'Vergleiche suchen',
			'not_found'          => 'Keine Vergleiche gefunden',
			'not_found_in_trash' => 'Keine Vergleiche im Papierkorb',
		),
		'graphql_single_name' => 'vergleich',
		'graphql_plural_name' => 'vergleiche',
		'menu_position'       => 27,
	) ) );
}, 5 );

// ─────────────────────────────────────────────
// Felder (ersetzen die ACF-Feldgruppen)
// ─────────────────────────────────────────────

add_action( 'init', function () {

	$nur_redaktion = function () {
		return current_user_can( 'edit_posts' );
	};

	// Untertitel des Beitrags. 202 vorhandene Werte unter demselben Schlüssel.
	register_post_meta( 'post', 'beitrag_untertitel', array(
		'type'              => 'string',
		'single'            => true,
		'default'           => '',
		'description'       => 'Untertitel des Beitrags (Kicker unter der Überschrift)',
		'show_in_rest'      => true,
		'sanitize_callback' => 'sanitize_text_field',
		'auth_callback'     => $nur_redaktion,
	) );

	// Rechner-Typ steuert, welche React-Komponente das Frontend lädt.
	register_post_meta( 'rechner', 'rechner_typ', array(
		'type'              => 'string',
		'single'            => true,
		'default'           => '',
		'description'       => 'Technischer Typ des Rechners (bestimmt die Frontend-Komponente)',
		'show_in_rest'      => true,
		'sanitize_callback' => 'sanitize_text_field',
		'auth_callback'     => $nur_redaktion,
	) );

	register_post_meta( 'rechner', 'rechner_beschreibung', array(
		'type'              => 'string',
		'single'            => true,
		'default'           => '',
		'description'       => 'Kurzbeschreibung des Rechners (Karten und Übersichten)',
		'show_in_rest'      => true,
		'sanitize_callback' => 'sanitize_textarea_field',
		'auth_callback'     => $nur_redaktion,
	) );

	register_post_meta( 'checkliste', 'checkliste_pdf', array(
		'type'              => 'integer',
		'single'            => true,
		'default'           => 0,
		'description'       => 'Anhang-ID des Checklisten-PDFs',
		'show_in_rest'      => true,
		'sanitize_callback' => 'absint',
		'auth_callback'     => $nur_redaktion,
	) );

	register_post_meta( 'checkliste', 'checkliste_beschreibung', array(
		'type'              => 'string',
		'single'            => true,
		'default'           => '',
		'description'       => 'Kurzbeschreibung der Checkliste (Karten und Übersichten)',
		'show_in_rest'      => true,
		'sanitize_callback' => 'sanitize_textarea_field',
		'auth_callback'     => $nur_redaktion,
	) );

	// 🚨 Anhang-ID eines Beitrags-PDFs. Das Frontend las das bisher als `acf.beitrag_pdf`
	// aus der REST-Antwort — ohne ACF fehlt dieses Objekt ersatzlos, und die
	// PDF-Vorschau waere LAUTLOS verschwunden (kein Fehler, nur weg). Betrifft aktuell
	// genau EINEN Beitrag — die 27 postmeta-Zeilen sind bis auf eine alle 0.
	// Mit `show_in_rest` steht der Wert jetzt unter `meta.beitrag_pdf`.
	register_post_meta( 'post', 'beitrag_pdf', array(
		'type'              => 'integer',
		'single'            => true,
		'default'           => 0,
		'description'       => 'Anhang-ID des zugehörigen PDF-Dokuments',
		'show_in_rest'      => true,
		'sanitize_callback' => 'absint',
		'auth_callback'     => $nur_redaktion,
	) );
}, 5 );

// ─────────────────────────────────────────────
// GraphQL-Felder
// ─────────────────────────────────────────────
//
// 🚨 `register_post_meta` allein genuegt NICHT: WPGraphQL uebernimmt registrierte
// Meta-Felder nicht automatisch ins Schema (ein `show_in_graphql`-Argument wertet es
// dort nicht aus). Jedes Feld muss explizit ueber `register_graphql_field` angemeldet
// werden — sonst meldet die Abfrage „Cannot query field".

add_action( 'graphql_register_types', function () {

	$aus_meta = function ( $meta_key ) {
		return function ( $post ) use ( $meta_key ) {
			$id = $post->databaseId ?? ( $post->ID ?? 0 );
			if ( ! $id ) {
				return null;
			}
			$wert = get_post_meta( $id, $meta_key, true );
			return ( $wert === '' || $wert === false ) ? null : $wert;
		};
	};

	register_graphql_field( 'Post', 'untertitel', array(
		'type'        => 'String',
		'description' => 'Untertitel des Beitrags (frueher ACF beitragFelder.beitragUntertitel)',
		'resolve'     => $aus_meta( 'beitrag_untertitel' ),
	) );

	register_graphql_field( 'Rechner', 'rechnerTyp', array(
		'type'        => 'String',
		'description' => 'Technischer Typ des Rechners (frueher ACF rechnerFelder.rechnerTyp)',
		'resolve'     => $aus_meta( 'rechner_typ' ),
	) );

	register_graphql_field( 'Rechner', 'beschreibung', array(
		'type'        => 'String',
		'description' => 'Kurzbeschreibung des Rechners (frueher ACF rechnerFelder.beschreibung)',
		'resolve'     => $aus_meta( 'rechner_beschreibung' ),
	) );

	register_graphql_field( 'Checkliste', 'beschreibung', array(
		'type'        => 'String',
		'description' => 'Kurzbeschreibung der Checkliste (frueher ACF checklisten.checklistenBeschreibung)',
		'resolve'     => $aus_meta( 'checkliste_beschreibung' ),
	) );

	// Frueher `checklisten { checklistePdf { node { mediaItemUrl } } }`. Die Verschachtelung
	// war eine ACF-Eigenheit; gespeichert ist ohnehin nur eine Anhang-ID. Hier direkt als
	// URL — das Frontend braucht nichts anderes davon.
	register_graphql_field( 'Checkliste', 'pdfUrl', array(
		'type'        => 'String',
		'description' => 'URL des hinterlegten Checklisten-PDFs',
		'resolve'     => function ( $post ) {
			$id = $post->databaseId ?? ( $post->ID ?? 0 );
			if ( ! $id ) {
				return null;
			}
			$anhang = (int) get_post_meta( $id, 'checkliste_pdf', true );
			if ( ! $anhang ) {
				return null;
			}
			$url = wp_get_attachment_url( $anhang );
			return $url ? $url : null;
		},
	) );
} );
