<?php
/**
 * Liest scripts/anbieter-import.json und legt/aktualisiert fuer jeden Eintrag
 * einen Post des Typs 'anbieter'.
 *
 * Aufruf (vom Projekt-Root aus):
 *   php -d mysqli.default_socket=<sock> wp-cli.phar \
 *     --path="/Users/bsw/Local Sites/finanzleser/app/public" \
 *     eval-file scripts/import-anbieter.php
 */

// Pfad relativ zum Projekt-Root ermitteln (WP-CLI setzt ABSPATH, nicht cwd).
$projectRoot = '/Users/bsw/Projekte/finanzleser';
$jsonFile = $projectRoot . '/scripts/anbieter-import.json';

if (!file_exists($jsonFile)) {
    WP_CLI::error("JSON nicht gefunden: $jsonFile – erst `python3 scripts/import-anbieter.py` laufen lassen.");
}

$raw = file_get_contents($jsonFile);
$entries = json_decode($raw, true);
if (!is_array($entries)) {
    WP_CLI::error('Ungueltiges JSON.');
}

$created = 0;
$updated = 0;
$failed = 0;

foreach ($entries as $entry) {
    $slug = $entry['slug'] ?? '';
    $title = $entry['title'] ?? '';
    $content = $entry['content'] ?? '';

    if (!$slug || !$title) {
        $failed++;
        WP_CLI::warning("Eintrag ohne slug/title uebersprungen.");
        continue;
    }

    $existing = get_posts(array(
        'name' => $slug,
        'post_type' => 'anbieter',
        'post_status' => 'any',
        'numberposts' => 1,
    ));

    $data = array(
        'post_type'    => 'anbieter',
        'post_name'    => $slug,
        'post_title'   => $title,
        'post_content' => $content,
        'post_status'  => 'publish',
    );

    if ($existing && !empty($existing[0]->ID)) {
        $data['ID'] = $existing[0]->ID;
        $result = wp_update_post($data, true);
        if (is_wp_error($result)) {
            $failed++;
            WP_CLI::warning("Update fehlgeschlagen ($slug): " . $result->get_error_message());
            continue;
        }
        $updated++;
    } else {
        $result = wp_insert_post($data, true);
        if (is_wp_error($result)) {
            $failed++;
            WP_CLI::warning("Insert fehlgeschlagen ($slug): " . $result->get_error_message());
            continue;
        }
        $created++;
    }
}

WP_CLI::success(sprintf(
    'Fertig: %d erstellt, %d aktualisiert, %d fehlgeschlagen (gesamt %d).',
    $created, $updated, $failed, count($entries)
));
