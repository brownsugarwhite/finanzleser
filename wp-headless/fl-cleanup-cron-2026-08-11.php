<?php
/**
 * Plugin Name: FL Aufraeumer Zeitplan (EINMALIG - danach loeschen!)
 * Description: Entfernt den geplanten Auftrag der Hintertuer "blaze-updater-pad".
 *
 * ANLEITUNG
 * 1. Nach  wp-content/mu-plugins/  hochladen
 * 2. Als Administrator anmelden
 * 3. TESTLAUF:  /wp-admin/?fl_cron=test
 * 4. LOESCHEN:  /wp-admin/?fl_cron=los
 * 5. Datei wieder loeschen
 *
 * HINTERGRUND
 * Der Auftrag heisst "fn6ytf11w1fangbjz" und lief STUENDLICH. Das war die Uhr der
 * Hintertuer: Sie prueft, ob ihre Datei noch vorhanden ist, und schreibt sie andernfalls
 * aus der Datenbank zurueck. Die zugehoerigen Optionen wurden am 11.08.2026 entfernt,
 * der Zeitplan-Eintrag blieb dabei stehen.
 *
 * Legitime Plugins benennen ihre Auftraege nie mit Zufallszeichen — alle anderen 28
 * Eintraege heissen wp_scheduled_delete, wpseo_*, updraft_backup usw.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Der Auftrag der Hintertuer. */
const FL_CRON_SCHADHOOK = 'fn6ytf11w1fangbjz';

/**
 * Altlasten laengst entfernter Plugins. NICHT geloescht — sie sind harmlos, laufen
 * ins Leere und gehoeren nicht zu diesem Vorfall. Nur zur Information aufgelistet:
 *   advanced_ads_auto_comp          Advanced Ads
 *   prli_ipn_clean                  Pretty Links
 *   rocket_atf_cleanup              WP Rocket
 *   rocket_rucss_clean_rows_time_event
 *   tribe_common_log_cleanup        The Events Calendar
 *   wpse_daily_cron                 WP Sheet Editor
 */

add_action( 'admin_notices', function () {

	if ( ! current_user_can( 'manage_options' ) ) { return; }
	if ( ! isset( $_GET['fl_cron'] ) ) { return; }

	$modus = sanitize_text_field( wp_unslash( $_GET['fl_cron'] ) );
	if ( ! in_array( $modus, array( 'test', 'los' ), true ) ) { return; }

	$echt = ( 'los' === $modus );

	echo '<div class="notice notice-' . ( $echt ? 'success' : 'warning' ) . '" style="padding:12px 16px">';
	echo '<h2 style="margin-top:0">FL Aufraeumer Zeitplan &ndash; ' .
		( $echt ? 'DURCHGEFUEHRT' : 'TESTLAUF (es wurde nichts geloescht)' ) . '</h2>';

	// Alle geplanten Zeitpunkte fuer diesen Auftrag sammeln
	$zeiten = array();
	$cron   = _get_cron_array();
	if ( is_array( $cron ) ) {
		foreach ( $cron as $zeitpunkt => $hooks ) {
			if ( isset( $hooks[ FL_CRON_SCHADHOOK ] ) ) {
				foreach ( $hooks[ FL_CRON_SCHADHOOK ] as $eintrag ) {
					$zeiten[] = array(
						'zeit'      => $zeitpunkt,
						'schedule'  => isset( $eintrag['schedule'] ) ? $eintrag['schedule'] : '—',
						'interval'  => isset( $eintrag['interval'] ) ? $eintrag['interval'] : 0,
					);
				}
			}
		}
	}

	if ( empty( $zeiten ) ) {
		echo '<p style="font-size:14px"><strong>Kein Eintrag <code>' . esc_html( FL_CRON_SCHADHOOK ) .
			'</code> vorhanden.</strong> Entweder bereits entfernt oder nie vorhanden gewesen.</p>';
	} else {
		echo '<table class="widefat striped" style="max-width:820px"><thead><tr>' .
			'<th>Auftrag</th><th>Naechste Ausfuehrung</th><th>Rhythmus</th><th>Status</th>' .
			'</tr></thead><tbody>';
		foreach ( $zeiten as $z ) {
			printf(
				'<tr><td><code>%s</code></td><td>%s</td><td>%s (alle %d s)</td><td>%s</td></tr>',
				esc_html( FL_CRON_SCHADHOOK ),
				esc_html( wp_date( 'd.m.Y H:i', $z['zeit'] ) ),
				esc_html( $z['schedule'] ),
				(int) $z['interval'],
				$echt
					? '<strong style="color:#0a7d24">GELOESCHT</strong>'
					: '<strong style="color:#b32d2e">wuerde geloescht</strong>'
			);
		}
		echo '</tbody></table>';

		if ( $echt ) {
			// WordPress-eigene Funktion: entfernt ALLE Ausfuehrungen dieses Auftrags
			$anzahl = wp_unschedule_hook( FL_CRON_SCHADHOOK );
			printf(
				'<p style="font-size:14px"><strong>%d Ausfuehrung(en) entfernt.</strong></p>' .
				'<p style="font-size:14px;color:#b32d2e"><strong>Jetzt bitte diese Datei per SFTP loeschen:</strong> ' .
				'<code>wp-content/mu-plugins/fl-cleanup-cron-2026-08-11.php</code></p>',
				is_int( $anzahl ) ? $anzahl : count( $zeiten )
			);
		} else {
			printf(
				'<p style="font-size:14px"><strong>%d Ausfuehrung(en) gefunden.</strong> ' .
				'Mit <code>?fl_cron=los</code> wirklich entfernen.</p>',
				count( $zeiten )
			);
		}
	}

	// Zur Kontrolle: alle uebrigen Auftraege auflisten
	echo '<p style="font-size:13px;color:#666;margin-top:10px"><strong>Alle geplanten Auftraege dieser Installation:</strong><br>';
	$alle = array();
	if ( is_array( $cron ) ) {
		foreach ( $cron as $hooks ) {
			foreach ( array_keys( $hooks ) as $h ) { $alle[ $h ] = true; }
		}
	}
	ksort( $alle );
	echo esc_html( implode( ' · ', array_keys( $alle ) ) );
	echo '</p>';

	echo '</div>';
} );
