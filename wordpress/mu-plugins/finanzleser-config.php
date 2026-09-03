<?php
/**
 * Finanzleser Rechner-Konfiguration (ACF-frei)
 *
 * Stellt 13 Rechenwerte (Mindestlohn, Kindergeld, Beitragssätze, Freibeträge …)
 * unter `/wp-json/finanzleser/v1/rechner-config` bereit und gibt der Redaktion eine
 * Eingabemaske dafür.
 *
 * ── Umbau am 03.09.2026 (Roadmap-Phase E) ────────────────────────────────────
 *
 * Vorher lief das über eine ACF-Options-Page und `get_field($key, 'options')`.
 * Ohne ACF war `get_field()` eine undefinierte Funktion — der Endpunkt lieferte
 * HTTP 500. Die Werte selbst lagen ohnehin schon als ganz normale Optionen in der
 * Datenbank (`options_rc_*`), ACF war nur die Oberfläche davor.
 *
 * 🚨 Die Optionsnamen bleiben deshalb unverändert (`options_rc_mindestlohn` usw.) —
 * die vorhandenen Werte werden ohne Datenmigration weiterverwendet.
 *
 * Ebenfalls entfernt, weil aktiv schädlich (Altlast der Vorgängerseite):
 *
 *   - „Aggressive cache clearing": löschte bei JEDEM Seitenaufruf sämtliche
 *     Transients per DELETE-Query — also WordPress' eigenen Zwischenspeicher,
 *     plus eine Schreiboperation pro Anfrage.
 *   - „Send no-cache headers": setzte auf jeder Antwort `no-store`, auch auf
 *     REST und GraphQL, und verhinderte damit jede Zwischenspeicherung.
 *
 *   Beides zusammen erklärt einen erheblichen Teil der Antwortzeiten des alten
 *   Systems (~3,1 s je GraphQL-Abfrage). Netlify rechnet nach Compute-Sekunden ab;
 *   im August entfielen 74 % der Rechnung auf Wartezeit gegenüber WordPress.
 *
 * Der frühere Selbst-Befüller aus `config/rates.json` ist entfallen: Er las aus
 * einem lokalen Entwicklungspfad (`$HOME/Projekte/…`), lief auf dem Server also nie.
 * `config/rates.json` bleibt im Frontend die Basisquelle, dieser Endpunkt überschreibt.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

const FL_RECHNER_FELDER = array(
	'rc_mindestlohn'      => 'Mindestlohn (€/Stunde)',
	'rc_kindergeld'       => 'Kindergeld (€/Monat je Kind)',
	'rc_rentenwert'       => 'Rentenwert (€)',
	'rc_rv_an'            => 'Rentenversicherung Arbeitnehmer (%)',
	'rc_kv_an'            => 'Krankenversicherung Arbeitnehmer (%)',
	'rc_kv_zusatz'        => 'KV-Zusatzbeitrag durchschnittlich (%)',
	'rc_pv_kinderlos'     => 'Pflegeversicherung kinderlos über 23 (%)',
	'rc_alv_an'           => 'Arbeitslosenversicherung Arbeitnehmer (%)',
	'rc_grundfreibetrag'  => 'Grundfreibetrag (€/Jahr)',
	'rc_bbg_kv'           => 'BBG Kranken-/Pflegeversicherung (€/Monat)',
	'rc_bbg_rv'           => 'BBG Renten-/Arbeitslosenversicherung (€/Monat)',
	'rc_elterngeld_min'   => 'Elterngeld Minimum (€/Monat)',
	'rc_elterngeld_max'   => 'Elterngeld Maximum (€/Monat)',
);

/** Optionsname wie ihn ACF angelegt hat — Präfix „options_" bleibt erhalten. */
function fl_rechner_option_name( $feld ) {
	return 'options_' . $feld;
}

/**
 * Kommazahl robust einlesen: die Redaktion tippt „5.812,50" oder „5812.5".
 * Getrennt behandelt, weil ein reines (float) bei deutscher Schreibweise 5 ergäbe.
 */
function fl_rechner_zahl( $eingabe ) {
	if ( is_float( $eingabe ) || is_int( $eingabe ) ) {
		return (float) $eingabe;
	}
	$s = trim( (string) $eingabe );
	if ( $s === '' ) {
		return '';
	}
	// Tausenderpunkte nur entfernen, wenn zusätzlich ein Komma vorkommt.
	if ( strpos( $s, ',' ) !== false ) {
		$s = str_replace( '.', '', $s );
		$s = str_replace( ',', '.', $s );
	}
	return is_numeric( $s ) ? (float) $s : '';
}

// ─────────────────────────────────────────────
// REST: /wp-json/finanzleser/v1/rechner-config
// ─────────────────────────────────────────────

add_action( 'rest_api_init', function () {
	register_rest_route( 'finanzleser/v1', '/rechner-config', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function () {
			$config = array();
			foreach ( array_keys( FL_RECHNER_FELDER ) as $feld ) {
				$wert = get_option( fl_rechner_option_name( $feld ), null );
				if ( $wert !== null && $wert !== false && $wert !== '' ) {
					$config[ $feld ] = (float) $wert;
				}
			}
			return rest_ensure_response( $config );
		},
	) );
} );

// ─────────────────────────────────────────────
// Eingabemaske für die Redaktion
// ─────────────────────────────────────────────

add_action( 'admin_menu', function () {
	add_submenu_page(
		'edit.php',
		'Rechner-Konfiguration',
		'Rechner-Konfiguration',
		'manage_options',
		'rechner-konfiguration',
		'fl_rechner_config_seite'
	);
} );

add_action( 'admin_init', function () {
	foreach ( array_keys( FL_RECHNER_FELDER ) as $feld ) {
		register_setting( 'fl_rechner_config', fl_rechner_option_name( $feld ), array(
			'type'              => 'string',
			'sanitize_callback' => 'fl_rechner_zahl',
			'default'           => '',
		) );
	}
} );

function fl_rechner_config_seite() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1>Rechner-Konfiguration</h1>
		<p>Diese Werte übersteuern die Grundwerte aus <code>config/rates.json</code> im
		   Frontend. Das Frontend liest sie über
		   <code>/wp-json/finanzleser/v1/rechner-config</code>.</p>
		<form method="post" action="options.php">
			<?php settings_fields( 'fl_rechner_config' ); ?>
			<table class="form-table" role="presentation">
				<?php foreach ( FL_RECHNER_FELDER as $feld => $beschriftung ) :
					$name = fl_rechner_option_name( $feld );
					$wert = get_option( $name, '' );
					?>
					<tr>
						<th scope="row"><label for="<?php echo esc_attr( $name ); ?>"><?php echo esc_html( $beschriftung ); ?></label></th>
						<td>
							<input type="text" class="regular-text" id="<?php echo esc_attr( $name ); ?>"
							       name="<?php echo esc_attr( $name ); ?>"
							       value="<?php echo esc_attr( $wert ); ?>">
							<p class="description"><code><?php echo esc_html( $feld ); ?></code></p>
						</td>
					</tr>
				<?php endforeach; ?>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

// ─────────────────────────────────────────────
// Kosmetik: Spaltenbreiten der Listentabellen
// ─────────────────────────────────────────────

add_action( 'admin_head', function () {
	echo '<style>'
	   . '.wp-list-table{table-layout:auto!important;width:100%}'
	   . '.wp-list-table thead th,.wp-list-table tbody td{word-break:normal;overflow-wrap:break-word}'
	   . '.wp-list-table .column-title{word-wrap:break-word;white-space:normal}'
	   . '.wp-list-table .column-comments,.wp-list-table .column-sticky,'
	   . '.wp-list-table .column-date,.wp-list-table .column-modified,'
	   . '.wp-list-table .column-cb{min-width:110px!important}'
	   . '</style>';
} );
