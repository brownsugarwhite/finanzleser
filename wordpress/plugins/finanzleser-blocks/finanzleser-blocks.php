<?php
/**
 * Plugin Name: Finanzleser Blocks
 * Description: Gutenberg-Blöcke für Finanzrechner, Checklisten und Vergleiche
 * Version: 1.1.0
 * Author: Finanzleser
 */

if (!defined('ABSPATH')) exit;

// REST API Endpoints für Block-Dropdowns
add_action('rest_api_init', function() {
    // Alle Rechner laden
    register_rest_route('finanzleser/v1', '/rechner', array(
        'methods' => 'GET',
        'callback' => function() {
            $posts = get_posts(array(
                'post_type' => 'rechner',
                'numberposts' => 200,
                'post_status' => 'publish',
                'orderby' => 'title',
                'order' => 'ASC',
            ));
            $result = array();
            foreach ($posts as $p) {
                $typ = get_field('rechner_typ', $p->ID);
                $result[] = array(
                    'slug' => $p->post_name,
                    'title' => $p->post_title,
                    'typ' => is_array($typ) ? $typ[0] : $typ,
                );
            }
            return rest_ensure_response($result);
        },
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ));

    // Alle Checklisten laden
    register_rest_route('finanzleser/v1', '/checklisten', array(
        'methods' => 'GET',
        'callback' => function() {
            $posts = get_posts(array(
                'post_type' => 'checkliste',
                'numberposts' => 200,
                'post_status' => 'publish',
                'orderby' => 'title',
                'order' => 'ASC',
            ));
            $result = array();
            foreach ($posts as $p) {
                $result[] = array(
                    'slug' => $p->post_name,
                    'title' => $p->post_title,
                );
            }
            return rest_ensure_response($result);
        },
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ));

    // Alle Vergleiche laden
    register_rest_route('finanzleser/v1', '/vergleiche', array(
        'methods' => 'GET',
        'callback' => function() {
            $posts = get_posts(array(
                'post_type' => 'vergleich',
                'numberposts' => 200,
                'post_status' => 'publish',
                'orderby' => 'title',
                'order' => 'ASC',
            ));
            $result = array();
            foreach ($posts as $p) {
                $typ = get_field('vergleich_typ', $p->ID);
                $result[] = array(
                    'slug' => $p->post_name,
                    'title' => $p->post_title,
                    'typ' => is_array($typ) ? $typ[0] : $typ,
                );
            }
            return rest_ensure_response($result);
        },
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ));

    // Alle Dokumente laden (für Mehrfachauswahl im Dokumente-Block)
    register_rest_route('finanzleser/v1', '/dokumente', array(
        'methods' => 'GET',
        'callback' => function() {
            $posts = get_posts(array(
                'post_type' => 'dokument',
                'numberposts' => 300,
                'post_status' => 'publish',
                'orderby' => 'title',
                'order' => 'ASC',
            ));
            $result = array();
            foreach ($posts as $p) {
                $terms = wp_get_post_terms($p->ID, 'dokument_kategorie', array('fields' => 'names'));
                $result[] = array(
                    'slug' => $p->post_name,
                    'title' => $p->post_title,
                    'typ' => (!is_wp_error($terms) && !empty($terms)) ? $terms[0] : '',
                );
            }
            return rest_ensure_response($result);
        },
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ));
});

// Blocks registrieren (statisch — save()-Output in JS ist die Quelle der Wahrheit,
// render_callback entfaellt, WP uebernimmt den Inhalt direkt aus post_content)
add_action('init', function() {
    $slug_attr = array(
        'slug' => array(
            'type' => 'string',
            'default' => '',
        ),
    );

    register_block_type('finanzleser/rechner', array(
        'api_version' => 3,
        'title' => 'Finanzrechner',
        'description' => 'Einen interaktiven Finanzrechner einbetten',
        'category' => 'embed',
        'icon' => 'calculator',
        'attributes' => $slug_attr,
    ));

    // Checkliste ist DYNAMIC (202 Bestands-Posts sind self-closing ohne Inner-Div).
    // render_callback gibt den Div aus, den der Next.js-Parser erwartet.
    register_block_type('finanzleser/checkliste', array(
        'api_version' => 3,
        'title' => 'Checkliste',
        'description' => 'Eine interaktive Checkliste einbetten',
        'category' => 'embed',
        'icon' => 'yes-alt',
        'attributes' => $slug_attr,
        'render_callback' => function($attributes) {
            $slug = $attributes['slug'] ?? '';
            if (!$slug) return '';
            return '<div data-finanzleser-checkliste="' . esc_attr($slug) . '"></div>';
        },
    ));

    register_block_type('finanzleser/vergleich', array(
        'api_version' => 3,
        'title' => 'Vergleich',
        'description' => 'Einen Vergleich einbetten',
        'category' => 'embed',
        'icon' => 'chart-bar',
        'attributes' => $slug_attr,
    ));

    // Vergleich-Quelle: liegt IM vergleich-CPT und traegt die Embed-Config
    // (iframe-URL / Script / Roh-Embed) als base64-JSON. DYNAMIC (save()=null in JS),
    // render_callback gibt den Div aus, den der Next.js-Parser (route.ts) liest.
    register_block_type('finanzleser/vergleich-quelle', array(
        'api_version' => 3,
        'title' => 'Vergleich-Quelle (Embed-Config)',
        'description' => 'Embed-Konfiguration (iframe / Script / Roh-Embed) fuer diesen Vergleich',
        'category' => 'embed',
        'icon' => 'admin-links',
        'attributes' => array(
            'config' => array('type' => 'string', 'default' => ''),
        ),
        'render_callback' => function($attributes) {
            $config = isset($attributes['config']) ? $attributes['config'] : '';
            if (!$config) return '';
            return '<div class="fl-vergleich-src" data-config="' . esc_attr($config) . '"></div>';
        },
    ));

    // Dokumente: Mehrfachauswahl (bis zu 4). Statischer Block — save() in JS gibt
    // <div data-finanzleser-dokumente="slug1,slug2,..."></div> aus (Next.js parst das).
    register_block_type('finanzleser/dokumente', array(
        'api_version' => 3,
        'title' => 'Dokumente',
        'description' => 'Bis zu 4 Dokumente (PDF) einbetten',
        'category' => 'embed',
        'icon' => 'media-document',
        'attributes' => array(
            'slugs' => array(
                'type' => 'array',
                'default' => array(),
                'items' => array('type' => 'string'),
            ),
        ),
    ));

    // Editor Script registrieren
    wp_register_script(
        'finanzleser-blocks-editor',
        plugins_url('blocks.js', __FILE__),
        array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-api-fetch'),
        filemtime(plugin_dir_path(__FILE__) . 'blocks.js'),
        true
    );
});

// Editor Script enqueuen
add_action('enqueue_block_editor_assets', function() {
    wp_enqueue_script('finanzleser-blocks-editor');
});
