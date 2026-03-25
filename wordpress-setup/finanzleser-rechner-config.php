<?php
/**
 * Finanzleser Rechner-Konfiguration
 *
 * Manuell einbinden in WordPress:
 * Kopiere diese Datei nach: wp-content/mu-plugins/finanzleser-rechner-config.php
 *
 * Functionality:
 * - Registriert ACF Options Page "Rechner-Konfiguration"
 * - Triggert Netlify Build Hook beim Speichern
 * - Speichert Webhook-URL sicher in WordPress-Settings
 */

// ACF Options Page registrieren (nur wenn ACF Pro installiert)
add_action('acf/init', function() {
    if (!function_exists('acf_add_options_page')) return;

    acf_add_options_page(array(
        'page_title' => 'Rechner-Konfiguration',
        'menu_title' => 'Rechner-Konfiguration',
        'menu_slug'  => 'rechner-konfiguration',
        'parent_slug' => 'edit.php',  // Unter "Beiträge"
        'icon_url'   => 'dashicons-calculator',
        'redirect'   => false,
        'capability' => 'manage_options',
    ));
});

// Webhook-URL beim ACF-Save triggern
add_action('acf/save_post', function($post_id) {
    // Nur bei Options Page (nicht bei normalen Posts)
    if ($post_id !== 'options') return;

    // Webhook-URL aus WordPress-Settings holen
    $webhook_url = get_option('finanzleser_netlify_build_hook');

    if (empty($webhook_url)) {
        error_log('[Finanzleser] Netlify Build Hook URL nicht konfiguriert');
        return;
    }

    // POST an Netlify Build Hook
    $response = wp_remote_post($webhook_url, array(
        'method'      => 'POST',
        'timeout'     => 5,
        'body'        => json_encode(array(
            'timestamp' => current_time('c'),
            'source'    => 'wordpress-acf',
        )),
        'headers'     => array(
            'Content-Type' => 'application/json',
        ),
    ));

    if (is_wp_error($response)) {
        error_log('[Finanzleser] Netlify Build Hook Fehler: ' . $response->get_error_message());
    } else {
        error_log('[Finanzleser] Netlify Build Hook getriggert (HTTP ' . wp_remote_retrieve_response_code($response) . ')');
    }
}, 20); // Nach ACF Field-Save

// Settings-Seite für Netlify Build Hook URL
add_action('admin_init', function() {
    register_setting('general', 'finanzleser_netlify_build_hook', array(
        'type' => 'string',
        'sanitize_callback' => 'esc_url',
        'show_in_rest' => false,
    ));
});

add_action('admin_menu', function() {
    add_submenu_page(
        'options-general.php',
        'Finanzleser Integration',
        'Finanzleser',
        'manage_options',
        'finanzleser-settings',
        'finanzleser_settings_page'
    );
});

function finanzleser_settings_page() {
    if (!current_user_can('manage_options')) return;

    $webhook_url = get_option('finanzleser_netlify_build_hook', '');
    ?>
    <div class="wrap">
        <h1>Finanzleser Integration</h1>
        <form method="post" action="options.php">
            <?php settings_fields('general'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="finanzleser_netlify_build_hook">
                            Netlify Build Hook URL
                        </label>
                    </th>
                    <td>
                        <input
                            type="password"
                            id="finanzleser_netlify_build_hook"
                            name="finanzleser_netlify_build_hook"
                            value="<?php echo esc_attr($webhook_url); ?>"
                            placeholder="https://api.netlify.com/build_hooks/..."
                            class="large-text"
                        />
                        <p class="description">
                            Netlify Build Hook URL für automatische Deployments bei ACF-Änderungen.
                            <br/><a href="https://docs.netlify.com/configure-builds/build-hooks/" target="_blank">Wie erstelle ich einen Build Hook?</a>
                        </p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
