<?php
/**
 * Finanzleser Site Settings
 * - WP-Admin „Einstellungen → Site-Einstellungen"
 * - Settings API + WP-Options (kein ACF)
 * - REST: GET /wp-json/finanzleser/v1/site-settings
 *
 * Schema (erweiterbar; weitere Sektionen einfach in $defaults ergänzen):
 *   top_banner: { visibility, text, link_type, link_value }
 */

const FINANZLESER_SITE_SETTINGS_OPTION = 'finanzleser_site_settings';
const FINANZLESER_SITE_SETTINGS_GROUP  = 'finanzleser_site_settings_group';

/**
 * Seitentypen für die Werbe-Schalter (pro Typ einzeln). Artikel wird separat
 * über die bestehende Sektion „Werbung in Beiträgen" (article_ads) gesteuert.
 * mid = true → zusätzlich Mid-Banner sinnvoll (Prosa-Seiten).
 */
function finanzleser_ad_types() {
    return [
        'rechner'    => ['label' => 'Rechner',                   'mid' => false],
        'vergleich'  => ['label' => 'Vergleiche',                'mid' => false],
        'checkliste' => ['label' => 'Checklisten',               'mid' => false],
        'anbieter'   => ['label' => 'Anbieter',                  'mid' => true],
        'kategorie'  => ['label' => 'Kategorie-/Subkat.-Listen', 'mid' => false],
        'suche'      => ['label' => 'Suche',                     'mid' => false],
        'dokumente'  => ['label' => 'Dokumente-Liste',           'mid' => false],
    ];
}

function finanzleser_ads_defaults() {
    $ads = [];
    foreach (finanzleser_ad_types() as $type => $meta) {
        $row = ['top' => false, 'rails' => false];
        if (!empty($meta['mid'])) $row['mid'] = false;
        $ads[$type] = $row;
    }
    return $ads;
}

function finanzleser_site_settings_defaults() {
    return [
        'top_banner' => [
            'visibility' => 'all',     // 'all' | 'landing' | 'off'
            'text'       => '',
            'link_type'  => 'none',    // 'none' | 'internal' | 'external' | 'anchor'
            'link_value' => '',
        ],
        // Werbung in Beiträgen — pro Platzierung einzeln schaltbar. Default aus.
        'article_ads' => [
            'top'   => false, // breiter Banner zwischen Nav und Breadcrumb
            'rails' => false, // sticky Seiten-Rails links + rechts
            'mid'   => false, // breiter Banner in der Artikelmitte
        ],
        // Werbung pro weiterem Seitentyp — je Platzierung einzeln schaltbar. Default überall aus.
        'ads' => finanzleser_ads_defaults(),
    ];
}

function finanzleser_site_settings_get() {
    $stored = get_option(FINANZLESER_SITE_SETTINGS_OPTION, []);
    if (!is_array($stored)) $stored = [];
    $defaults = finanzleser_site_settings_defaults();
    // Tiefen-Merge eine Ebene tief (Sektionen)
    $out = $defaults;
    foreach ($defaults as $section => $fields) {
        if (isset($stored[$section]) && is_array($stored[$section])) {
            $out[$section] = array_merge($fields, $stored[$section]);
        }
    }
    return $out;
}

function finanzleser_site_settings_sanitize($input) {
    $defaults = finanzleser_site_settings_defaults();
    $out = $defaults;

    if (!is_array($input)) return $out;

    // top_banner
    if (isset($input['top_banner']) && is_array($input['top_banner'])) {
        $tb = $input['top_banner'];

        $visibility = isset($tb['visibility']) ? (string) $tb['visibility'] : 'all';
        if (!in_array($visibility, ['all', 'landing', 'off'], true)) $visibility = 'all';

        $link_type = isset($tb['link_type']) ? (string) $tb['link_type'] : 'none';
        if (!in_array($link_type, ['none', 'internal', 'external', 'anchor'], true)) $link_type = 'none';

        $text = isset($tb['text']) ? sanitize_text_field((string) $tb['text']) : '';

        $link_value_raw = isset($tb['link_value']) ? (string) $tb['link_value'] : '';
        $link_value = '';
        switch ($link_type) {
            case 'external':
                $link_value = esc_url_raw(trim($link_value_raw));
                break;
            case 'internal':
                $link_value = '/' . ltrim(sanitize_text_field(trim($link_value_raw)), '/');
                if ($link_value === '/') $link_value = '';
                break;
            case 'anchor':
                $link_value = sanitize_text_field(trim($link_value_raw));
                if ($link_value !== '' && strpos($link_value, '#') !== 0) {
                    $link_value = '#' . ltrim($link_value, '#');
                }
                break;
            case 'none':
            default:
                $link_value = '';
                break;
        }

        $out['top_banner'] = [
            'visibility' => $visibility,
            'text'       => $text,
            'link_type'  => $link_type,
            'link_value' => $link_value,
        ];
    }

    // article_ads — Checkboxen: abwesend im POST = nicht angehakt = false.
    $aa = (isset($input['article_ads']) && is_array($input['article_ads'])) ? $input['article_ads'] : [];
    $out['article_ads'] = [
        'top'   => !empty($aa['top']),
        'rails' => !empty($aa['rails']),
        'mid'   => !empty($aa['mid']),
    ];

    // ads (pro Seitentyp) — Checkboxen senden nur den Wert wenn angehakt.
    $ads_in = (isset($input['ads']) && is_array($input['ads'])) ? $input['ads'] : [];
    foreach ($out['ads'] as $type => $fields) {
        $in  = (isset($ads_in[$type]) && is_array($ads_in[$type])) ? $ads_in[$type] : [];
        $row = [
            'top'   => !empty($in['top']),
            'rails' => !empty($in['rails']),
        ];
        if (array_key_exists('mid', $fields)) {
            $row['mid'] = !empty($in['mid']);
        }
        $out['ads'][$type] = $row;
    }

    return $out;
}

// ──────────────────────────────────────────────────────────────
// Settings registrieren
// ──────────────────────────────────────────────────────────────
add_action('admin_init', function () {
    register_setting(FINANZLESER_SITE_SETTINGS_GROUP, FINANZLESER_SITE_SETTINGS_OPTION, [
        'type'              => 'array',
        'sanitize_callback' => 'finanzleser_site_settings_sanitize',
        'default'           => finanzleser_site_settings_defaults(),
    ]);

    add_settings_section(
        'finanzleser_top_banner_section',
        'TopBanner (durchlaufende Schrift oben)',
        function () {
            echo '<p>Steuert den Lauftext-Banner ganz oben auf der Site.</p>';
        },
        'finanzleser-site-settings'
    );

    $opt = finanzleser_site_settings_get();
    $tb  = $opt['top_banner'];
    $name = FINANZLESER_SITE_SETTINGS_OPTION;

    add_settings_field('top_banner_visibility', 'Sichtbarkeit', function () use ($tb, $name) {
        $v = $tb['visibility'];
        ?>
        <select name="<?php echo esc_attr($name); ?>[top_banner][visibility]">
            <option value="all"     <?php selected($v, 'all'); ?>>Auf allen Seiten</option>
            <option value="landing" <?php selected($v, 'landing'); ?>>Nur Landingpage</option>
            <option value="off"     <?php selected($v, 'off'); ?>>Aus</option>
        </select>
        <?php
    }, 'finanzleser-site-settings', 'finanzleser_top_banner_section');

    add_settings_field('top_banner_text', 'Text', function () use ($tb, $name) {
        ?>
        <input type="text"
               name="<?php echo esc_attr($name); ?>[top_banner][text]"
               value="<?php echo esc_attr($tb['text']); ?>"
               class="large-text"
               placeholder="z. B. Der neue Finanzleser ist da. Abonnieren Sie jetzt unseren Newsletter!" />
        <?php
    }, 'finanzleser-site-settings', 'finanzleser_top_banner_section');

    add_settings_field('top_banner_link_type', 'Link-Typ', function () use ($tb, $name) {
        $v = $tb['link_type'];
        ?>
        <select name="<?php echo esc_attr($name); ?>[top_banner][link_type]" id="fl-top-banner-link-type">
            <option value="none"     <?php selected($v, 'none'); ?>>Kein Link</option>
            <option value="internal" <?php selected($v, 'internal'); ?>>Interner Link (z. B. /finanztools/)</option>
            <option value="external" <?php selected($v, 'external'); ?>>Externer Link (https://…)</option>
            <option value="anchor"   <?php selected($v, 'anchor'); ?>>Anchor auf aktueller Seite (#section-id)</option>
        </select>
        <?php
    }, 'finanzleser-site-settings', 'finanzleser_top_banner_section');

    add_settings_field('top_banner_link_value', 'Link-Ziel', function () use ($tb, $name) {
        ?>
        <input type="text"
               name="<?php echo esc_attr($name); ?>[top_banner][link_value]"
               value="<?php echo esc_attr($tb['link_value']); ?>"
               class="large-text"
               id="fl-top-banner-link-value"
               placeholder="je nach Link-Typ: /finanztools/  ·  https://example.com  ·  #newsletter" />
        <p class="description" id="fl-top-banner-link-hint">Bei „Kein Link" wird dieses Feld ignoriert.</p>
        <script>
        (function(){
            var sel = document.getElementById('fl-top-banner-link-type');
            var hint = document.getElementById('fl-top-banner-link-hint');
            var input = document.getElementById('fl-top-banner-link-value');
            if (!sel || !hint || !input) return;
            var hints = {
                none:     'Bei „Kein Link" wird dieses Feld ignoriert.',
                internal: 'Pfad mit führendem Slash, z. B. /finanztools/ oder /finanzen/geldanlage/festgeld/',
                external: 'Vollständige URL inkl. https://, z. B. https://www.finconext.de/',
                anchor:   'ID-Anchor inkl. #, z. B. #newsletter (muss auf der angezeigten Seite existieren)'
            };
            function update() {
                hint.textContent = hints[sel.value] || '';
                input.disabled = (sel.value === 'none');
            }
            sel.addEventListener('change', update);
            update();
        })();
        </script>
        <?php
    }, 'finanzleser-site-settings', 'finanzleser_top_banner_section');

    // ── Werbung in Beiträgen ───────────────────────────────────
    add_settings_section(
        'finanzleser_article_ads_section',
        'Werbung in Beiträgen',
        function () {
            echo '<p>Schaltet die Werbeflächen in Beiträgen ein/aus (vorerst graue Platzhalter). '
               . 'Top-Banner zwischen Navigation und Breadcrumb, sticky Rails links/rechts '
               . '(ab großen Bildschirmen), Banner in der Artikelmitte.</p>';
        },
        'finanzleser-site-settings'
    );

    $aa = $opt['article_ads'];

    add_settings_field('article_ads_top', 'Top-Banner', function () use ($aa, $name) {
        ?>
        <label>
            <input type="checkbox" name="<?php echo esc_attr($name); ?>[article_ads][top]" value="1" <?php checked(!empty($aa['top'])); ?> />
            Breiter Banner zwischen Navigation und Breadcrumb
        </label>
        <?php
    }, 'finanzleser-site-settings', 'finanzleser_article_ads_section');

    add_settings_field('article_ads_rails', 'Seiten-Rails', function () use ($aa, $name) {
        ?>
        <label>
            <input type="checkbox" name="<?php echo esc_attr($name); ?>[article_ads][rails]" value="1" <?php checked(!empty($aa['rails'])); ?> />
            Sticky-Werbung links und rechts neben dem Artikel (ab großen Bildschirmen)
        </label>
        <?php
    }, 'finanzleser-site-settings', 'finanzleser_article_ads_section');

    add_settings_field('article_ads_mid', 'Mittel-Banner', function () use ($aa, $name) {
        ?>
        <label>
            <input type="checkbox" name="<?php echo esc_attr($name); ?>[article_ads][mid]" value="1" <?php checked(!empty($aa['mid'])); ?> />
            Breiter Banner in der Mitte des Artikels
        </label>
        <?php
    }, 'finanzleser-site-settings', 'finanzleser_article_ads_section');

    // ── Werbung auf weiteren Seitentypen (pro Typ) ─────────────
    add_settings_section(
        'finanzleser_ads_section',
        'Werbung auf weiteren Seiten (pro Seitentyp)',
        function () {
            echo '<p><strong>Top</strong> = breiter Banner unter dem Heading · <strong>Rails</strong> = sticky Seiten-Banner links/rechts (ab ~1440px Breite) · <strong>Mid</strong> = Banner im/unter dem Inhalt. Vorerst graue Platzhalter. Default: alles aus.</p>';
        },
        'finanzleser-site-settings'
    );

    foreach (finanzleser_ad_types() as $ad_type => $ad_meta) {
        add_settings_field(
            'ads_' . $ad_type,
            esc_html($ad_meta['label']),
            function () use ($ad_type, $ad_meta, $opt, $name) {
                $a = isset($opt['ads'][$ad_type]) && is_array($opt['ads'][$ad_type]) ? $opt['ads'][$ad_type] : [];
                $cb = function ($key, $label) use ($a, $name, $ad_type) {
                    printf(
                        '<label style="margin-right:18px"><input type="checkbox" name="%s[ads][%s][%s]" value="1" %s> %s</label>',
                        esc_attr($name), esc_attr($ad_type), esc_attr($key),
                        checked(!empty($a[$key]), true, false),
                        esc_html($label)
                    );
                };
                $cb('top', 'Top-Banner');
                $cb('rails', 'Rails');
                if (!empty($ad_meta['mid'])) $cb('mid', 'Mid-Banner');
            },
            'finanzleser-site-settings',
            'finanzleser_ads_section'
        );
    }
});

// ──────────────────────────────────────────────────────────────
// Admin-Page
// ──────────────────────────────────────────────────────────────
add_action('admin_menu', function () {
    add_options_page(
        'Site-Einstellungen',
        'Site-Einstellungen',
        'manage_options',
        'finanzleser-site-settings',
        function () {
            if (!current_user_can('manage_options')) return;
            ?>
            <div class="wrap">
                <h1>Site-Einstellungen</h1>
                <form method="post" action="options.php">
                    <?php
                    settings_fields(FINANZLESER_SITE_SETTINGS_GROUP);
                    do_settings_sections('finanzleser-site-settings');
                    submit_button();
                    ?>
                </form>
            </div>
            <?php
        }
    );
});

// ──────────────────────────────────────────────────────────────
// REST-Endpoint
// ──────────────────────────────────────────────────────────────
add_action('rest_api_init', function () {
    register_rest_route('finanzleser/v1', '/site-settings', [
        'methods'             => 'GET',
        'callback'            => function () {
            return rest_ensure_response(finanzleser_site_settings_get());
        },
        'permission_callback' => '__return_true',
    ]);
});
