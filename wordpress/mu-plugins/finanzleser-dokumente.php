<?php
/**
 * Finanzleser Dokumente CPT
 *
 * Registriert den Custom Post Type "dokument" für PDF-Broschüren
 * (Ratgeber, Merkblätter, Tabellen, Formulare). URLs werden über
 * Next.js aufgelöst (/finanztools/dokumente/[slug]), daher rewrite => false.
 *
 * - CPT mit Gutenberg-Editor + Excerpt für Beschreibung
 * - Custom Taxonomy "dokument_kategorie" (flach, 13 vorgegebene Terms)
 * - Post-Meta "dokument_pdf_id" verlinkt Attachment via Media Library
 * - WPGraphQL-Field "pdfFile" exposed Attachment-Daten
 */

// ─────────────────────────────────────────────
// Custom Post Type
// ─────────────────────────────────────────────

add_action('init', function () {
    register_post_type('dokument', array(
        'labels' => array(
            'name'                  => 'Dokumente',
            'singular_name'         => 'Dokument',
            'add_new'               => 'Neu anlegen',
            'add_new_item'          => 'Neues Dokument anlegen',
            'edit_item'             => 'Dokument bearbeiten',
            'new_item'              => 'Neues Dokument',
            'view_item'             => 'Dokument ansehen',
            'search_items'          => 'Dokumente suchen',
            'not_found'             => 'Keine Dokumente gefunden',
            'not_found_in_trash'    => 'Keine Dokumente im Papierkorb',
            'menu_name'             => 'Dokumente',
            'all_items'             => 'Alle Dokumente',
        ),
        'public'                => true,
        'show_ui'               => true,
        'show_in_menu'          => true,
        'show_in_rest'          => true,
        'show_in_graphql'       => true,
        'graphql_single_name'   => 'dokument',
        'graphql_plural_name'   => 'dokumente',
        'supports'              => array('title', 'editor', 'excerpt', 'custom-fields', 'thumbnail', 'revisions'),
        'has_archive'           => false,
        'rewrite'               => false,
        'menu_icon'             => 'dashicons-media-document',
        'menu_position'         => 27,
        'capability_type'       => 'post',
        'taxonomies'            => array('dokument_kategorie'),
    ));

    register_taxonomy('dokument_kategorie', array('dokument'), array(
        'labels' => array(
            'name'              => 'Dokument-Kategorien',
            'singular_name'     => 'Dokument-Kategorie',
            'menu_name'         => 'Kategorien',
            'all_items'         => 'Alle Kategorien',
            'edit_item'         => 'Kategorie bearbeiten',
            'view_item'         => 'Kategorie ansehen',
            'update_item'       => 'Kategorie aktualisieren',
            'add_new_item'      => 'Neue Kategorie',
            'new_item_name'     => 'Neue Kategorie',
            'search_items'      => 'Kategorien suchen',
            'not_found'         => 'Keine Kategorien gefunden',
        ),
        'hierarchical'          => true,
        'public'                => true,
        'show_ui'               => true,
        'show_admin_column'     => true,
        'show_in_rest'          => true,
        'show_in_graphql'       => true,
        'graphql_single_name'   => 'dokumentKategorie',
        'graphql_plural_name'   => 'dokumentKategorien',
        'rewrite'               => false,
    ));
});

// ─────────────────────────────────────────────
// Seed-Terms (idempotent)
// ─────────────────────────────────────────────

add_action('init', function () {
    $terms = array(
        'tabellen'                      => 'Tabellen',
        'altersvorsorge'                => 'Altersvorsorge',
        'rente'                         => 'Rente',
        'sozialversicherung'            => 'Sozialversicherung',
        'steuern'                       => 'Steuern',
        'private-krankenversicherung'   => 'Private Krankenversicherung',
        'gesetzliche-krankenkasse'      => 'Gesetzliche Krankenkasse',
        'pflegeversicherung'            => 'Pflegeversicherung',
        'versicherungen'                => 'Versicherungen',
        'immobilien'                    => 'Immobilien',
        'familie'                       => 'Familie',
        'finanzierung'                  => 'Finanzierung',
        'arbeit'                        => 'Arbeit',
    );
    foreach ($terms as $slug => $name) {
        if (!term_exists($slug, 'dokument_kategorie')) {
            wp_insert_term($name, 'dokument_kategorie', array('slug' => $slug));
        }
    }
}, 11);

// ─────────────────────────────────────────────
// Post-Meta: PDF-Attachment-ID
// ─────────────────────────────────────────────

add_action('init', function () {
    register_post_meta('dokument', 'dokument_pdf_id', array(
        'type'              => 'integer',
        'single'            => true,
        'show_in_rest'      => true,
        'auth_callback'     => function () {
            return current_user_can('edit_posts');
        },
    ));
});

// ─────────────────────────────────────────────
// Editor-Meta-Box: PDF-Picker
// ─────────────────────────────────────────────

add_action('add_meta_boxes', function () {
    add_meta_box(
        'dokument_pdf_box',
        'PDF-Datei',
        'finanzleser_dokument_pdf_meta_box',
        'dokument',
        'side',
        'high'
    );
});

function finanzleser_dokument_pdf_meta_box($post) {
    wp_nonce_field('finanzleser_dokument_pdf', 'finanzleser_dokument_pdf_nonce');
    $pdf_id = (int) get_post_meta($post->ID, 'dokument_pdf_id', true);
    $pdf_url = $pdf_id ? wp_get_attachment_url($pdf_id) : '';
    $pdf_name = $pdf_id ? basename(get_attached_file($pdf_id)) : '';
    ?>
    <div class="dokument-pdf-picker">
        <input type="hidden"
               id="dokument_pdf_id"
               name="dokument_pdf_id"
               value="<?php echo esc_attr($pdf_id); ?>" />
        <p id="dokument-pdf-current" style="margin: 6px 0;">
            <?php if ($pdf_id): ?>
                <strong><?php echo esc_html($pdf_name); ?></strong><br>
                <a href="<?php echo esc_url($pdf_url); ?>" target="_blank">Vorschau öffnen</a>
            <?php else: ?>
                <em>Keine PDF gewählt.</em>
            <?php endif; ?>
        </p>
        <button type="button" class="button" id="dokument-pdf-select">PDF auswählen</button>
        <button type="button" class="button" id="dokument-pdf-remove" <?php echo $pdf_id ? '' : 'style="display:none"'; ?>>Entfernen</button>
    </div>
    <script>
    (function($){
        $(function(){
            var frame;
            $('#dokument-pdf-select').on('click', function(e){
                e.preventDefault();
                if (frame) { frame.open(); return; }
                frame = wp.media({
                    title: 'PDF auswählen',
                    button: { text: 'Übernehmen' },
                    library: { type: 'application/pdf' },
                    multiple: false
                });
                frame.on('select', function(){
                    var att = frame.state().get('selection').first().toJSON();
                    $('#dokument_pdf_id').val(att.id);
                    $('#dokument-pdf-current').html('<strong>' + att.filename + '</strong><br><a href="' + att.url + '" target="_blank">Vorschau öffnen</a>');
                    $('#dokument-pdf-remove').show();
                });
                frame.open();
            });
            $('#dokument-pdf-remove').on('click', function(e){
                e.preventDefault();
                $('#dokument_pdf_id').val('');
                $('#dokument-pdf-current').html('<em>Keine PDF gewählt.</em>');
                $(this).hide();
            });
        });
    })(jQuery);
    </script>
    <?php
}

add_action('save_post_dokument', function ($post_id) {
    if (!isset($_POST['finanzleser_dokument_pdf_nonce']) ||
        !wp_verify_nonce($_POST['finanzleser_dokument_pdf_nonce'], 'finanzleser_dokument_pdf')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    if (isset($_POST['dokument_pdf_id'])) {
        $pdf_id = (int) $_POST['dokument_pdf_id'];
        if ($pdf_id > 0) {
            update_post_meta($post_id, 'dokument_pdf_id', $pdf_id);
        } else {
            delete_post_meta($post_id, 'dokument_pdf_id');
        }
    }
});

add_action('admin_enqueue_scripts', function ($hook) {
    global $post;
    if (in_array($hook, array('post.php', 'post-new.php')) &&
        isset($post) && $post->post_type === 'dokument') {
        wp_enqueue_media();
    }
});

// ─────────────────────────────────────────────
// WPGraphQL: pdfFile-Field auf Dokument
// ─────────────────────────────────────────────

add_action('graphql_register_types', function () {
    register_graphql_field('Dokument', 'pdfFile', array(
        'type' => 'MediaItem',
        'description' => 'Verknüpfte PDF-Datei aus der Media Library',
        'resolve' => function ($post, $args, $context, $info) {
            $pdf_id = (int) get_post_meta($post->ID, 'dokument_pdf_id', true);
            if (!$pdf_id) return null;
            return $context->get_loader('post')->load_deferred($pdf_id);
        },
    ));
});
