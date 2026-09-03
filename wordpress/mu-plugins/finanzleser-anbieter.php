<?php
/**
 * Finanzleser Anbieter CPT
 *
 * Registriert den Custom Post Type "anbieter" für Kontaktseiten von
 * Versicherern und Finanzfirmen. Die URLs werden komplett über das
 * Next.js-Frontend aufgelöst (Root-Level, Legacy-Slugs), deshalb
 * rewrite => false. WordPress dient nur als Datenquelle via GraphQL.
 */

add_action('init', function () {
    register_post_type('anbieter', array(
        'labels' => array(
            'name'                  => 'Anbieter',
            'singular_name'         => 'Anbieter',
            'add_new'               => 'Neu anlegen',
            'add_new_item'          => 'Neuen Anbieter anlegen',
            'edit_item'             => 'Anbieter bearbeiten',
            'new_item'              => 'Neuer Anbieter',
            'view_item'             => 'Anbieter ansehen',
            'search_items'          => 'Anbieter suchen',
            'not_found'             => 'Keine Anbieter gefunden',
            'not_found_in_trash'    => 'Keine Anbieter im Papierkorb',
            'menu_name'             => 'Anbieter',
            'all_items'             => 'Alle Anbieter',
        ),
        'public'                => true,
        'show_ui'               => true,
        'show_in_menu'          => true,
        'show_in_rest'          => true,
        'show_in_graphql'       => true,
        'graphql_single_name'   => 'anbieter',
        'graphql_plural_name'   => 'allAnbieter',
        'supports'              => array('title', 'editor', 'revisions'),
        'has_archive'           => false,
        'rewrite'               => false,
        'menu_icon'             => 'dashicons-building',
        'menu_position'         => 26,
        'capability_type'       => 'post',
    ));
});
