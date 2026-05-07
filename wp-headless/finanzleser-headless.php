<?php
/**
 * Plugin Name: Finanzleser Headless Bridge
 * Description: Biegt Vorschau- und Permalink-URLs auf das Next.js-Frontend um und triggert On-Demand-Revalidation bei Inhalts-Änderungen.
 * Version: 1.0.0
 * Author: finanzleser
 *
 * Konfiguration via wp-config.php:
 *   FL_HEADLESS_FRONTEND_URL      — Frontend-Basis-URL (ohne trailing slash)
 *   FL_HEADLESS_PREVIEW_SECRET    — Secret für /api/preview
 *   FL_HEADLESS_REVALIDATE_SECRET — Secret für /api/revalidate
 *
 * Aktiviert sich nur wenn alle drei Konstanten gesetzt sind.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! defined( 'FL_HEADLESS_FRONTEND_URL' )
  || ! defined( 'FL_HEADLESS_PREVIEW_SECRET' )
  || ! defined( 'FL_HEADLESS_REVALIDATE_SECRET' ) ) {
    return; // mu-plugin still inaktiv falls Konfig fehlt
}

/** Welche Post-Types das mu-plugin verwaltet. */
function fl_headless_post_types() {
    return [ 'post', 'page', 'rechner', 'vergleich', 'checkliste', 'anbieter' ];
}

/**
 * Hauptkategorien — muss synchron zu Next.js lib/categories.ts sein.
 * Frontend-URL für Posts ist /MAIN/SUB/slug — MAIN ist eine dieser 4.
 */
function fl_headless_main_category_slugs() {
    return [ 'finanzen', 'versicherungen', 'steuern', 'recht' ];
}

/**
 * Mappt einen WP-Post auf den Frontend-Pfad.
 * Nutzt den WP-Permalink (raw, ohne Filter-Rekursion) und ersetzt nur den Hostname.
 */
function fl_headless_path_for_post( $post ) {
    if ( ! $post instanceof WP_Post ) return null;

    // Custom Post Types haben eigene URL-Struktur im Frontend
    $cpt_map = [
        'rechner'    => '/finanztools/rechner/',
        'vergleich'  => '/finanztools/vergleiche/',
        'checkliste' => '/finanztools/checklisten/',
        'anbieter'   => '/',
    ];
    if ( isset( $cpt_map[ $post->post_type ] ) ) {
        return $cpt_map[ $post->post_type ] . $post->post_name;
    }

    // Posts/Pages: nutze WP-Permalink, ersetze Host
    // get_permalink würde Filter rekursiv aufrufen — daher manuell zusammenbauen
    if ( $post->post_type === 'page' ) {
        return '/' . trim( get_page_uri( $post ), '/' );
    }

    if ( $post->post_type === 'post' ) {
        // Frontend-URL: /MAIN/SUB/slug — main aus festem Set, sub = irgendeine andere
        if ( empty( $post->post_name ) ) return null;

        $cats = get_the_category( $post->ID );
        if ( empty( $cats ) ) return '/' . $post->post_name; // kein Pfad → Fallback

        $mains_set = fl_headless_main_category_slugs();
        $main = null;
        $sub = null;
        foreach ( $cats as $c ) {
            if ( in_array( $c->slug, $mains_set, true ) ) {
                if ( ! $main ) $main = $c->slug;
            } else {
                if ( ! $sub ) $sub = $c->slug;
            }
        }
        if ( ! $main ) $main = 'beitraege';
        if ( ! $sub )  $sub  = 'allgemein';
        return '/' . $main . '/' . $sub . '/' . $post->post_name;
    }

    return null;
}

/* ------------------------------------------------------------------ */
/* 1. Vorschau-Link (Drafts) → Next.js /api/preview                    */
/* ------------------------------------------------------------------ */
add_filter( 'preview_post_link', function( $link, $post ) {
    if ( ! in_array( $post->post_type, fl_headless_post_types(), true ) ) return $link;
    $path = fl_headless_path_for_post( $post );
    if ( ! $path ) return $link;

    return add_query_arg( [
        'secret'   => FL_HEADLESS_PREVIEW_SECRET,
        'type'     => $post->post_type,
        'id'       => $post->ID,
        'redirect' => $path,
    ], rtrim( FL_HEADLESS_FRONTEND_URL, '/' ) . '/api/preview' );
}, 10, 2 );

/* ------------------------------------------------------------------ */
/* 2. „Beitrag ansehen"-Link (published) → Frontend-URL                 */
/* ------------------------------------------------------------------ */
add_filter( 'post_type_link', function( $link, $post ) {
    if ( ! in_array( $post->post_type, fl_headless_post_types(), true ) ) return $link;
    if ( in_array( $post->post_status, [ 'draft', 'auto-draft', 'pending' ], true ) ) return $link;
    $path = fl_headless_path_for_post( $post );
    if ( ! $path ) return $link;
    return rtrim( FL_HEADLESS_FRONTEND_URL, '/' ) . $path;
}, 10, 2 );

add_filter( 'page_link', function( $link, $post_id ) {
    $post = get_post( $post_id );
    if ( ! $post ) return $link;
    $path = fl_headless_path_for_post( $post );
    if ( ! $path ) return $link;
    return rtrim( FL_HEADLESS_FRONTEND_URL, '/' ) . $path;
}, 10, 2 );

/* ------------------------------------------------------------------ */
/* 3. Revalidation: bei save_post / delete_post → Next.js HTTP-POST    */
/* ------------------------------------------------------------------ */
function fl_headless_trigger_revalidate( $post_id, $post = null ) {
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( wp_is_post_revision( $post_id ) ) return;

    if ( ! $post ) $post = get_post( $post_id );
    if ( ! $post || ! in_array( $post->post_type, fl_headless_post_types(), true ) ) return;

    $path = fl_headless_path_for_post( $post );

    wp_remote_post( rtrim( FL_HEADLESS_FRONTEND_URL, '/' ) . '/api/revalidate', [
        'headers'  => [ 'Content-Type' => 'application/json' ],
        'body'     => wp_json_encode( [
            'secret' => FL_HEADLESS_REVALIDATE_SECRET,
            'type'   => $post->post_type,
            'id'     => $post->ID,
            'slug'   => $post->post_name,
            'path'   => $path,
            'status' => $post->post_status,
        ] ),
        'timeout'  => 5,
        'blocking' => false, // fire and forget — Editor wartet nicht
    ] );
}
add_action( 'save_post',   'fl_headless_trigger_revalidate', 10, 2 );
add_action( 'delete_post', 'fl_headless_trigger_revalidate', 10, 1 );
add_action( 'transition_post_status', function( $new, $old, $post ) {
    if ( $new === $old ) return;
    fl_headless_trigger_revalidate( $post->ID, $post );
}, 10, 3 );

/* ------------------------------------------------------------------ */
/* 4. Site-Settings-Änderung → Layout-Cache komplett busten           */
/* ------------------------------------------------------------------ */
function fl_headless_revalidate_layout( $reason ) {
    wp_remote_post( rtrim( FL_HEADLESS_FRONTEND_URL, '/' ) . '/api/revalidate', [
        'headers'  => [ 'Content-Type' => 'application/json' ],
        'body'     => wp_json_encode( [
            'secret' => FL_HEADLESS_REVALIDATE_SECRET,
            'type'   => 'site_settings',
            'slug'   => $reason,
            'layout' => true,
        ] ),
        'timeout'  => 5,
        'blocking' => false,
    ] );
}
// Site-Settings (TopBanner etc.)
add_action( 'updated_option', function( $option ) {
    if ( $option === 'finanzleser_site_settings' ) {
        fl_headless_revalidate_layout( $option );
    }
}, 10, 1 );
// Rechner-Konfig (Mindestlohn, Kindergeld, BBG etc.)
add_action( 'updated_option', function( $option ) {
    if ( strpos( $option, 'finanzleser_rc_' ) === 0 ) {
        fl_headless_revalidate_layout( $option );
    }
}, 10, 1 );
