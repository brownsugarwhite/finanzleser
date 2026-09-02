<?php
/**
 * Plugin Name: Finanzleser Headless noindex
 * Description: Sperrt das CMS (staging.finanzleser.de) gegen Suchmaschinen-Indexierung.
 *   Inhalte werden über www.finanzleser.de (Next.js) ausgeliefert; der WP-Host selbst
 *   soll NICHT indexiert werden (sonst Duplicate Content). Stört den Build nicht.
 */
if (!defined('ABSPATH')) exit;

add_action('send_headers', function () {
    header('X-Robots-Tag: noindex, nofollow', true);
});

add_action('wp_head', function () {
    echo '<meta name="robots" content="noindex, nofollow" />' . "\n";
}, 1);
