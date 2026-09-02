<?php
/**
 * Finanzleser Kategorie-Bilder (ACF-frei)
 *
 * Gibt Kategorie-Terms zwei Bildfelder (Slider + WIDE-Banner) per register_term_meta,
 * inkl. Media-Picker im Term-Editor und WPGraphQL-Feldern. Ersatz für das ACF-Feld
 * `kategorieFelder.kategorieBild` (Roadmap-Phase E: ACF raus).
 *
 * Term-Meta:
 *   kategorie_bild_id        → Attachment-ID Slider-Bild (Karten im SubcategorySlider)
 *   kategorie_bild_wide_id   → Attachment-ID WIDE-Banner (Header der (Sub-)Kategorieseite)
 *
 * GraphQL (Category):
 *   kategorieBildSlider { sourceUrl altText }
 *   kategorieBildWide   { sourceUrl altText }
 *
 * REST-Schreibpfad (für scripts/assign-category-images.js):
 *   POST /wp-json/wp/v2/categories/{id}  { meta: { kategorie_bild_id, kategorie_bild_wide_id } }
 */

if (!defined('ABSPATH')) exit;

const FL_KAT_BILD_FIELDS = [
    'kategorie_bild_id'      => ['label' => 'Kategorie-Bild (Slider)',     'graphql' => 'kategorieBildSlider'],
    'kategorie_bild_wide_id' => ['label' => 'Kategorie-Banner (WIDE)',     'graphql' => 'kategorieBildWide'],
];

// ─────────────────────────────────────────────
// Term-Meta registrieren (REST-schreibbar)
// ─────────────────────────────────────────────
add_action('init', function () {
    foreach (array_keys(FL_KAT_BILD_FIELDS) as $key) {
        register_term_meta('category', $key, [
            'type'          => 'integer',
            'single'        => true,
            'show_in_rest'  => true,
            'auth_callback' => function () {
                return current_user_can('manage_categories');
            },
        ]);
    }
});

// ─────────────────────────────────────────────
// Term-Editor: Media-Picker (Add- + Edit-Form)
// ─────────────────────────────────────────────
function fl_kat_bild_picker_markup($key, $cfg, $value = 0) {
    $url  = $value ? wp_get_attachment_image_url($value, 'medium') : '';
    $name = esc_attr($key);
    ?>
    <div class="fl-kat-bild-picker" data-field="<?php echo $name; ?>" style="margin:6px 0;">
        <input type="hidden" name="<?php echo $name; ?>" id="<?php echo $name; ?>" value="<?php echo esc_attr((int) $value); ?>" />
        <div class="fl-kat-bild-preview" style="margin-bottom:6px;">
            <?php if ($url): ?>
                <img src="<?php echo esc_url($url); ?>" alt="" style="max-width:200px;height:auto;display:block;border:1px solid #ccc;" />
            <?php else: ?>
                <em>Kein Bild gewählt.</em>
            <?php endif; ?>
        </div>
        <button type="button" class="button fl-kat-bild-select">Bild auswählen</button>
        <button type="button" class="button fl-kat-bild-remove" <?php echo $value ? '' : 'style="display:none"'; ?>>Entfernen</button>
    </div>
    <?php
}

// Add-Form (neue Kategorie): div-Layout
add_action('category_add_form_fields', function () {
    foreach (FL_KAT_BILD_FIELDS as $key => $cfg) {
        echo '<div class="form-field">';
        echo '<label>' . esc_html($cfg['label']) . '</label>';
        fl_kat_bild_picker_markup($key, $cfg, 0);
        echo '</div>';
    }
});

// Edit-Form (bestehende Kategorie): table-Layout
add_action('category_edit_form_fields', function ($term) {
    foreach (FL_KAT_BILD_FIELDS as $key => $cfg) {
        $value = (int) get_term_meta($term->term_id, $key, true);
        echo '<tr class="form-field">';
        echo '<th scope="row"><label>' . esc_html($cfg['label']) . '</label></th>';
        echo '<td>';
        fl_kat_bild_picker_markup($key, $cfg, $value);
        echo '</td></tr>';
    }
}, 10, 1);

// Speichern (Add + Edit)
function fl_kat_bild_save($term_id) {
    if (!current_user_can('manage_categories')) return;
    foreach (array_keys(FL_KAT_BILD_FIELDS) as $key) {
        if (!isset($_POST[$key])) continue;
        $id = (int) $_POST[$key];
        if ($id > 0) {
            update_term_meta($term_id, $key, $id);
        } else {
            delete_term_meta($term_id, $key);
        }
    }
}
add_action('created_category', 'fl_kat_bild_save');
add_action('edited_category', 'fl_kat_bild_save');

// Media-Library-JS auf den Kategorie-Term-Screens laden
add_action('admin_enqueue_scripts', function ($hook) {
    if ($hook !== 'edit-tags.php' && $hook !== 'term.php') return;
    if (!isset($_GET['taxonomy']) || $_GET['taxonomy'] !== 'category') return;
    wp_enqueue_media();
    add_action('admin_print_footer_scripts', 'fl_kat_bild_footer_js');
});

function fl_kat_bild_footer_js() {
    ?>
    <script>
    (function($){
        $(document).on('click', '.fl-kat-bild-select', function(e){
            e.preventDefault();
            var $picker = $(this).closest('.fl-kat-bild-picker');
            var frame = wp.media({ title: 'Bild auswählen', button: { text: 'Übernehmen' }, library: { type: 'image' }, multiple: false });
            frame.on('select', function(){
                var att = frame.state().get('selection').first().toJSON();
                $picker.find('input[type=hidden]').val(att.id);
                var src = (att.sizes && att.sizes.medium) ? att.sizes.medium.url : att.url;
                $picker.find('.fl-kat-bild-preview').html('<img src="' + src + '" alt="" style="max-width:200px;height:auto;display:block;border:1px solid #ccc;" />');
                $picker.find('.fl-kat-bild-remove').show();
            });
            frame.open();
        });
        $(document).on('click', '.fl-kat-bild-remove', function(e){
            e.preventDefault();
            var $picker = $(this).closest('.fl-kat-bild-picker');
            $picker.find('input[type=hidden]').val('');
            $picker.find('.fl-kat-bild-preview').html('<em>Kein Bild gewählt.</em>');
            $(this).hide();
        });
    })(jQuery);
    </script>
    <?php
}

// ─────────────────────────────────────────────
// WPGraphQL: kategorieBildSlider / kategorieBildWide auf Category
// ─────────────────────────────────────────────
add_action('graphql_register_types', function () {
    foreach (FL_KAT_BILD_FIELDS as $key => $cfg) {
        register_graphql_field('Category', $cfg['graphql'], [
            'type'        => 'MediaItem',
            'description' => 'Kategorie-Visual aus Term-Meta (' . $key . ')',
            'resolve'     => function ($term, $args, $context, $info) use ($key) {
                $id = (int) get_term_meta($term->databaseId, $key, true);
                if (!$id) return null;
                return $context->get_loader('post')->load_deferred($id);
            },
        ]);
    }
});
