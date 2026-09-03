<?php
/**
 * Finanzleser – Excerpt-Support für CPTs rechner / checkliste / vergleich
 *
 * Die CPTs rechner, checkliste und vergleich sind per ACF-UI registriert und
 * besitzen standardmäßig KEINEN Excerpt-Support. Ziel der ACF-Ablösung (Phase E)
 * ist es, die Tool-Beschreibung im nativen WP-Auszug („excerpt") zu führen statt
 * im ACF-Feld. Dieser Filter ergänzt den Excerpt-Support nachträglich, ohne die
 * ACF-UI-Definition anzufassen.
 *
 * WPGraphQL exponiert das Feld `excerpt` automatisch, sobald der Post-Type
 * 'excerpt' unterstützt (post_type_supports). Damit wird `excerpt` auf den
 * GraphQL-Typen Checkliste / Rechner / Vergleich abfragbar.
 */

if (!defined('ABSPATH')) exit;

add_filter('register_post_type_args', function ($args, $post_type) {
    if (!in_array($post_type, array('rechner', 'checkliste', 'vergleich'), true)) {
        return $args;
    }

    // Excerpt-Support ergänzen (Editor-Metabox „Auszug" + REST + GraphQL).
    if (!isset($args['supports']) || !is_array($args['supports'])) {
        $args['supports'] = array('title', 'editor');
    }
    if (!in_array('excerpt', $args['supports'], true)) {
        $args['supports'][] = 'excerpt';
    }

    // Sicherstellen, dass excerpt auch über die REST-API kommt (für tool-title-Route).
    $args['show_in_rest'] = true;

    return $args;
}, 20, 2);
