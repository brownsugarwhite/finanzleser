# WordPress ACF Setup für Rechner-Konfiguration

> ⚠️ **VERALTET** — Wird mit Roadmap-Phase E (ACF-Eliminierung) obsolet.
> Die 13 Rechner-Konfigurationswerte werden auf WP-Options-API oder
> `config/rates.json` migriert. Datei bleibt vorerst als Referenz für
> die Migration. Siehe [ROADMAP.md](../ROADMAP.md) Phase E7.
>
> Anleitung zur Einrichtung der dynamischen Rechner-Konfiguration via WordPress ACF (aktueller Stand)

---

## 📋 Übersicht

Die Rechner-Konfigurationswerte (Mindestlohn, Kindergeld, Steuersätze, etc.) werden in WordPress via ACF Options Page verwaltet. Beim Speichern wird automatisch ein Netlify Build Hook getriggert, damit alle Besucher die neuen Werte sehen.

**Workflow:**
```
Admin → ACF Options Page "Rechner-Konfiguration"
         ↓ Speichern
   WordPress Hook → POST → Netlify Build Hook URL
         ↓ (~2 Min)
   Netlify Build startet → Next.js neu gebaut
         ↓
   /api/rates liefert neue Werte → Alle Rechner aktualisiert
```

---

## ✅ Schritt 1: ACF Options Page registrieren

**In WordPress `functions.php` oder als mu-plugin:**

```php
<?php
/**
 * Rechner-Konfiguration ACF Options Page
 * In wp-content/mu-plugins/finanzleser-rechner-config.php
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
    register_setting('general', 'finanzleser_netlify_build_hook');
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
```

---

## ✅ Schritt 2: ACF Feldgruppe importieren

**Im WordPress Admin:**

1. Gehe zu **ACF → Tools → Import**
2. Wähle `/acf-json/group_rechner_config.json` aus der Next.js repo
3. Klick "Import"
4. ACF-Felder sollten jetzt unter "Beiträge → Rechner-Konfiguration" sichtbar sein

**Alternativ:** ACF JSON Sync (automatisch bei Export aus diesem File)

---

## ✅ Schritt 3: Netlify Build Hook erstellen

**Im Netlify Dashboard:**

1. Gehe zum Projekt **finanzleser**
2. **Settings → Build & deploy → Build hooks**
3. Klick "Add build hook"
4. Name: `WordPress Config Update`
5. Branch: `main`
6. Kopiere die generierte URL: `https://api.netlify.com/build_hooks/...`

**Im WordPress Admin:**

1. Gehe zu **Einstellungen → Finanzleser**
2. Trage die Build Hook URL ein
3. Speichern

---

## ✅ Schritt 4: Testen

1. Gehe zu **Beiträge → Rechner-Konfiguration**
2. Ändere einen Wert, z.B. "Mindestlohn" zu `12,50`
3. Klick "Aktualisieren"
4. Gehe zu **Netlify Builds** und beobachte den neuen Build
5. Nach ~2 Min: Build complete ✓
6. Öffne finanzleser.de/finanztools/rechner in neuem Tab
7. Der neue Wert sollte in den Rechnern sichtbar sein ✓

---

## 📊 ACF-Feldgruppe Übersicht

| Label | ACF-Key | Typ | Fallback (rates.json) |
|-------|---------|-----|-----|
| Mindestlohn | `rc_mindestlohn` | Number | `arbeitsmarkt.mindestlohn` |
| Kindergeld | `rc_kindergeld` | Number | `sozialhilfe.kindergeld` |
| Rentenwert | `rc_rentenwert` | Number | `rente.rentenwert` |
| RV Arbeitnehmer | `rc_rv_an` | Number (%) | `sozialversicherung.rentenversicherung_arbeitnehmer` |
| KV allgemein AN | `rc_kv_an` | Number (%) | `sozialversicherung.krankenversicherung_arbeitnehmer` |
| KV Zusatzbeitrag | `rc_kv_zusatz` | Number (%) | `sozialversicherung.krankenversicherung_zusatzbeitrag` |
| PV AN kinderlos | `rc_pv_kinderlos` | Number (%) | `sozialversicherung.pflegeversicherung_kinderlos` |
| ALV Arbeitnehmer | `rc_alv_an` | Number (%) | `sozialversicherung.arbeitslosenversicherung_arbeitnehmer` |
| Grundfreibetrag | `rc_grundfreibetrag` | Number | `lohnsteuer.grundfreibetrag` |
| BBG KV/PV | `rc_bbg_kv` | Number | `sozialversicherung.beitragssatzbasis_kv` |
| BBG RV/ALV | `rc_bbg_rv` | Number | `sozialversicherung.beitragssatzbasis_rv` |
| Elterngeld Min | `rc_elterngeld_min` | Number | `elterngeld.minimum` |
| Elterngeld Max | `rc_elterngeld_max` | Number | `elterngeld.maximum` |
| Letzte Aktualisierung | `rc_letzte_aktualisierung` | Date | – |

---

## 🔄 Architektur (vereinfacht)

```
┌──────────────────┐
│  WordPress Admin │
│  ACF Rechner-    │
│  Konfiguration   │
└────────┬─────────┘
         │ Wert gespeichert
         │
┌────────▼────────────────────────────┐
│ WordPress Hook: acf/save_post       │
│ POST → Netlify Build Hook URL       │
└────────┬─────────────────────────────┘
         │
┌────────▼──────────────────────┐
│ Netlify Build Hook            │
│ Trigger Build auf main Branch │
└────────┬──────────────────────┘
         │ ~2 Min Build
┌────────▼───────────────────────────────┐
│ Next.js Build                         │
│ 1. /api/rates lädt rates.json         │
│ 2. getRechnerConfig() → WordPress    │
│ 3. mergeRates() → WP + JSON           │
│ 4. /api/rates gibt Merged Rates      │
└────────┬───────────────────────────────┘
         │
┌────────▼──────────────┐
│ Netlify CDN Deploy    │
│ New Build live ✓      │
└───────────────────────┘
         │
┌────────▼──────────────────────┐
│ Besucher öffnet Rechner        │
│ useRates Hook lädt /api/rates  │
│ → Neue Werte sichtbar ✓        │
└───────────────────────────────┘
```

---

## ⚠️ Fallbacks & Error Handling

**Szenario 1: WordPress ACF nicht verfügbar**
- `/api/rates` fällt auf `rates.json` zurück
- Rechner rechnen weiterhin korrekt
- Admin kann nicht ändern, aber Benutzer sehen alte Werte

**Szenario 2: Netlify Build Hook URL nicht konfiguriert**
- ACF-Felder speichern normal
- Webhook triggert nicht
- Rechner-Besucher sehen alte gecachte Werte (bis 1h ISR Cache läuft ab)

**Szenario 3: `/api/rates` Fehler**
- `useRates` Hook fällt auf initiale RATES zurück
- Rechner rechnen mit Fallback-Werten

---

## 🔧 Wartung & Debugging

**Logs anschauen:**
```bash
# WordPress-Fehler
wp-content/debug.log

# Netlify Build Log
Netlify Dashboard → Deploys → Build Log
```

**Build Hook manuell testen:**
```bash
curl -X POST "YOUR_NETLIFY_BUILD_HOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "test"}'
```

**GraphQL Query testen:**
```
POST http://finanzleser.local/graphql

query GetRechnerConfig {
  rechnerConfig {
    rcMindestlohn
    rcKindergeld
    rcRentenwert
    rcRvAn
    rcKvAn
    rcKvZusatz
    rcPvKinderlos
    rcAlvAn
    rcGrundfreibetrag
    rcBbgKv
    rcBbgRv
    rcElterngeldMin
    rcElterngeldMax
    rcLetzteAktualisierung
  }
}
```

---

## 📝 Checkliste vor Go-Live

- [ ] ACF Pro installiert & lizenziert
- [ ] mu-plugin in `wp-content/mu-plugins/finanzleser-rechner-config.php` deploy
- [ ] ACF Feldgruppe via JSON importiert
- [ ] Netlify Build Hook erstellt
- [ ] Webhook URL in WP-Settings eingetragen
- [ ] Test: 1 Wert in ACF ändern
- [ ] Test: Netlify Build wird getriggert (Log anschauen)
- [ ] Test: Build completed, neue Werte in /api/rates sichtbar
- [ ] Test: Rechner laden neue Werte nach Reload

---

*Zuletzt aktualisiert: März 2026*
