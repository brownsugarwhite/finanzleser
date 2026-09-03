<?php
/**
 * Plugin Name: FL Aufraeumer 11.08.2026 (EINMALIG - danach loeschen!)
 * Description: Entfernt die Datenbank-Rueckstaende der Hintertuer "blaze-updater-pad".
 *
 * ANLEITUNG
 * 1. Diese Datei per SFTP nach  wp-content/mu-plugins/  hochladen
 * 2. Im WordPress-Adminbereich als Administrator anmelden
 * 3. TESTLAUF (loescht nichts):   /wp-admin/?fl_clean=test
 * 4. Ergebnis pruefen. Passt es:  /wp-admin/?fl_clean=los
 * 5. Diese Datei per SFTP WIEDER LOESCHEN
 *
 * SICHERHEIT
 * - Laeuft ausschliesslich fuer angemeldete Administratoren
 * - Ohne den Parameter fl_clean passiert gar nichts
 * - Fasst ausschliesslich die unten aufgefuehrten Eintraege an
 * - Rueckfallebene: das geprueft vollstaendige Datenbank-Backup vom 11.08.2026, 10:15
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Zu loeschende Optionen. Jeder Eintrag wurde einzeln geprueft.
 */
function fl_cleanup_liste() {
	return array(
		// --- Selbsterhaltung: prueft, ob die Schaddatei noch da ist, und holt sie zurueck
		'sc_persist_manifest'   => 'Merkt sich Pfad und Groesse der Schaddatei',
		'sc_last_recovery_check' => 'Zeitpunkt der letzten Selbstpruefung',

		// --- Der Wiederherstellungs-Bausatz
		'7e1fbe4a9185' => 'ENTHAELT DEN KOMPLETTEN SCHADCODE (190.334 Bytes, XOR 0x12) - der wichtigste Eintrag',
		'e74601b1b835' => 'Dateiname rueckwaerts + Version ("4.0.3|php.dap-retadpu-ezalb")',

		// --- Weitere Nutzlast
		'188031f8ead8' => 'Nutzlast (157.288 Zeichen)',
		'7f3b2f1573'   => 'Nutzlast (78.500 Zeichen, gzip in base64)',
		'f584f6977c2c' => 'Nutzlast (53.860 Zeichen)',
		'379ad01d8c08' => 'Nutzlast (38.696 Zeichen)',

		// --- Konfiguration
		'9c9a55f0ec25' => 'Konfiguration',
		'005b826a6ab3' => 'Konfiguration (enthaelt "blaze-updater-pad.php" verschluesselt)',
		'89ae22bcaa3a' => 'Konfiguration',
		'58e2721dcf5d' => 'Konfiguration',
		'b5717761427c' => 'Konfiguration',
		'bcd8c2a17f9c' => 'Konfiguration',
		'69196134209f' => 'Konfiguration',
	);
}

/**
 * BEWUSST NICHT in der Liste - geprueft und als unbedenklich eingestuft:
 *
 *   db05451aba                        base64-JSON {"__last_checked__":"1505659474"} = 17.09.2017
 *   05c1b9b773                        base64-JSON {"__last_checked__":"1505215328"} = 12.09.2017
 *      -> beide neun Jahre aelter als der Angriff, unverschluesselt, Rueckstand eines
 *         alten Plugins der Vorgaengerseite. Kein Bezug zu dieser Schadsoftware.
 *
 *   c932dd40dd20e8ec23458556e8b35232  serialisiertes PHP-Array mit "new_version"/"stable_version"
 *      -> regulaerer WordPress-Zwischenspeicher fuer Plugin-Updates.
 */

add_action( 'admin_notices', function () {

	if ( ! current_user_can( 'manage_options' ) ) { return; }
	if ( ! isset( $_GET['fl_clean'] ) ) { return; }

	$modus = sanitize_text_field( wp_unslash( $_GET['fl_clean'] ) );
	if ( ! in_array( $modus, array( 'test', 'los' ), true ) ) { return; }

	global $wpdb;
	$echt = ( 'los' === $modus );

	echo '<div class="notice notice-' . ( $echt ? 'success' : 'warning' ) . '" style="padding:12px 16px">';
	echo '<h2 style="margin-top:0">FL Aufraeumer &ndash; ' .
		( $echt ? 'DURCHGEFUEHRT' : 'TESTLAUF (es wurde nichts geloescht)' ) . '</h2>';

	echo '<table class="widefat striped" style="max-width:1000px"><thead><tr>' .
		'<th>Eintrag</th><th>Groesse</th><th>Status</th><th>Was es ist</th>' .
		'</tr></thead><tbody>';

	$gefunden = 0;
	$geloescht = 0;

	foreach ( fl_cleanup_liste() as $name => $zweck ) {
		// Direkt aus der Tabelle lesen: get_option() wuerde serialisierte Werte auspacken.
		$wert = $wpdb->get_var(
			$wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $name )
		);

		if ( null === $wert ) {
			$status = '<span style="color:#666">nicht vorhanden</span>';
			$groesse = '&ndash;';
		} else {
			$gefunden++;
			$groesse = number_format_i18n( strlen( $wert ) ) . ' Zeichen';
			if ( $echt ) {
				$ok = $wpdb->delete( $wpdb->options, array( 'option_name' => $name ), array( '%s' ) );
				if ( $ok ) {
					$geloescht++;
					$status = '<strong style="color:#0a7d24">GELOESCHT</strong>';
				} else {
					$status = '<strong style="color:#b32d2e">FEHLER beim Loeschen</strong>';
				}
			} else {
				$status = '<strong style="color:#b32d2e">wuerde geloescht</strong>';
			}
		}

		printf(
			'<tr><td><code>%s</code></td><td>%s</td><td>%s</td><td>%s</td></tr>',
			esc_html( $name ), $groesse, $status, esc_html( $zweck )
		);
	}

	// --- Verwaiste Metadaten des geloeschten Fremdkontos ID 15 (admin_c56a8da4b8)
	$meta = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->usermeta} WHERE user_id = 15" );
	if ( $meta > 0 ) {
		$gefunden++;
		if ( $echt ) {
			$wpdb->delete( $wpdb->usermeta, array( 'user_id' => 15 ), array( '%d' ) );
			$geloescht++;
			$status = '<strong style="color:#0a7d24">GELOESCHT</strong>';
		} else {
			$status = '<strong style="color:#b32d2e">wuerde geloescht</strong>';
		}
		printf(
			'<tr><td><code>wp_usermeta / user_id 15</code></td><td>%d Zeilen</td><td>%s</td>' .
			'<td>Rechte-Rueckstand des geloeschten Fremdkontos admin_c56a8da4b8</td></tr>',
			(int) $meta, $status
		);
	} else {
		echo '<tr><td><code>wp_usermeta / user_id 15</code></td><td>&ndash;</td>' .
			'<td><span style="color:#666">nicht vorhanden</span></td><td>bereits bereinigt</td></tr>';
	}

	echo '</tbody></table>';

	if ( $echt ) {
		printf(
			'<p style="font-size:14px"><strong>%d von %d gefundenen Eintraegen entfernt.</strong></p>' .
			'<p style="font-size:14px;color:#b32d2e"><strong>Jetzt bitte diese Datei per SFTP loeschen:</strong> ' .
			'<code>wp-content/mu-plugins/fl-cleanup-2026-08-11.php</code></p>',
			$geloescht, $gefunden
		);
	} else {
		printf(
			'<p style="font-size:14px"><strong>%d Eintraege gefunden.</strong> ' .
			'Wenn die Liste plausibel aussieht, mit <code>?fl_clean=los</code> wirklich loeschen.</p>',
			$gefunden
		);
	}

	echo '<p style="font-size:13px;color:#666">Hinweis: Damit sind nur die Datenbank-Rueckstaende ' .
		'entfernt. Die beiden Installer-Archive <code>845a5f6d.zip</code> im Theme-Ordner und in ' .
		'der Mediathek muessen separat per SFTP geloescht werden.</p>';

	echo '</div>';
} );
