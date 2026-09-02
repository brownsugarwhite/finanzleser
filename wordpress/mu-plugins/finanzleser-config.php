<?php
/**
 * Finanzleser Configuration
 * - Registriert ACF Options Page "Rechner-Konfiguration"
 * - Lädt rates.json in ACF Rechner-Konfiguration
 * - BBG Felder als text-input (nicht number)
 */

// 0. Registriere ACF Options Page
add_action('acf/init', function() {
    if (!function_exists('acf_add_options_page')) return;

    acf_add_options_page(array(
        'page_title' => 'Rechner-Konfiguration',
        'menu_title' => 'Rechner-Konfiguration',
        'menu_slug'  => 'rechner-konfiguration',
        'parent_slug' => 'edit.php',
        'icon_url'   => 'dashicons-calculator',
        'redirect'   => false,
        'capability' => 'manage_options',
    ));
});

// 1. Lade rates.json - auf späteren Hook für besseres Timing
add_action('acf/init', function() {
    if (!current_user_can('manage_options')) return;

    $rates_file = getenv('HOME') . '/Projekte/finanzleser/config/rates.json';
    if (!file_exists($rates_file)) return;

    $json = file_get_contents($rates_file);
    $rates = json_decode($json, true);
    if (!is_array($rates)) return;

    // Mapping: ACF-Feldname → rates.json Pfad
    $values = array(
        'rc_mindestlohn' => $rates['mindestlohn']['stundensatz'] ?? null,
        'rc_kindergeld' => $rates['kindergeld']['monatlich_je_kind'] ?? null,
        'rc_rentenwert' => $rates['rente']['rentenwert_ab_01jul_2026'] ?? null,
        'rc_rv_an' => $rates['sozialversicherung']['rentenversicherung']['arbeitnehmer_prozent'] ?? null,
        'rc_kv_an' => $rates['sozialversicherung']['krankenversicherung']['allgemeiner_beitrag_an_prozent'] ?? null,
        'rc_kv_zusatz' => $rates['sozialversicherung']['krankenversicherung']['durchschnittlicher_zusatzbeitrag_prozent'] ?? null,
        'rc_pv_kinderlos' => $rates['sozialversicherung']['pflegeversicherung']['arbeitnehmer_nach_kindern']['kinderlos_ueber23'] ?? null,
        'rc_alv_an' => $rates['sozialversicherung']['arbeitslosenversicherung']['arbeitnehmer_prozent'] ?? null,
        'rc_grundfreibetrag' => $rates['lohnsteuer']['grundfreibetrag'] ?? null,
        'rc_bbg_kv' => $rates['beitragsbemessungsgrenzen']['kranken_pflege']['monatlich'] ?? null,
        'rc_bbg_rv' => $rates['beitragsbemessungsgrenzen']['renten_arbeitslosen']['monatlich'] ?? null,
        'rc_elterngeld_min' => $rates['elterngeld']['minimum'] ?? null,
        'rc_elterngeld_max' => $rates['elterngeld']['maximum'] ?? null,
    );

    // Speichere als floats - nur wenn leer
    foreach ($values as $key => $value) {
        if ($value !== null && !get_field($key, 'options')) {
            if (function_exists('update_field')) {
                update_field($key, (float) $value, 'options');
            }
        }
    }
}, 20);

// 2. BBG Felder als TEXT rendern (nicht NUMBER - das verhindert Dezimal-Fehler)
add_filter('acf/load_field', function($field) {
    if (!isset($field['name'])) return $field;

    if (in_array($field['name'], ['rc_bbg_kv', 'rc_bbg_rv'])) {
        $field['type'] = 'text';
    }
    return $field;
});

// 3. BBG Werte beim Speichern zu floats konvertieren
add_filter('acf/update_value', function($value, $post_id, $field) {
    if (in_array($field['name'], ['rc_bbg_kv', 'rc_bbg_rv'])) {
        if (is_string($value)) {
            $value = str_replace(',', '.', $value);
            $value = (float) $value;
        }
    }
    return $value;
}, 10, 3);

// 4. REST API Endpoint für Rechner-Konfiguration
add_action('rest_api_init', function() {
    register_rest_route('finanzleser/v1', '/rechner-config', array(
        'methods' => 'GET',
        'callback' => function() {
            $config = array();

            // Hole alle ACF Werte
            $fields = array('rc_mindestlohn', 'rc_kindergeld', 'rc_rentenwert', 'rc_rv_an', 'rc_kv_an',
                          'rc_kv_zusatz', 'rc_pv_kinderlos', 'rc_alv_an', 'rc_grundfreibetrag',
                          'rc_bbg_kv', 'rc_bbg_rv', 'rc_elterngeld_min', 'rc_elterngeld_max');

            foreach ($fields as $field) {
                $value = get_field($field, 'options');
                if ($value !== null && $value !== false) {
                    $config[$field] = (float) $value;
                }
            }

            return rest_ensure_response($config);
        },
        'permission_callback' => '__return_true',
    ));
});

// 5. Fix admin table layout (same as pages list)
add_action('admin_head', function() {
    echo '<style>';
    echo '.wp-list-table { table-layout: auto !important; width: 100%; }';
    echo '.wp-list-table thead th, .wp-list-table tbody td { word-break: normal; overflow-wrap: break-word; }';
    echo '.wp-list-table .column-title { word-wrap: break-word; white-space: normal; }';
    echo '.wp-list-table .wp-column-tip { display: none; }';
    echo '.wp-list-table .column-comments { min-width: 110px !important; }';
    echo '.wp-list-table .column-sticky { min-width: 110px !important; }';
    echo '.wp-list-table .column-date { min-width: 110px !important; }';
    echo '.wp-list-table .column-modified { min-width: 110px !important; }';
    echo '.wp-list-table .column-cb { min-width: 110px !important; }';
    echo '</style>';
});

// 6. Aggressive cache clearing
add_action('init', function() {
    // Flush WP Rocket
    if (function_exists('rocket_clean_files')) {
        rocket_clean_files();
    }
    // Flush WP Supercache
    if (function_exists('wp_cache_clean_cache')) {
        wp_cache_clean_cache();
    }
    // Flush all transients
    global $wpdb;
    $wpdb->query("DELETE FROM $wpdb->options WHERE option_name LIKE '%_transient_%'");
}, 1);

// 7. Send no-cache headers
add_action('init', function() {
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
});

