<?php
/**
 * SVG Visual Placeholder — WordPress Script
 *
 * 1. Diesen Code in die functions.php deines WordPress-Themes einfügen
 * 2. Zuerst die 20 SVGs in die WordPress Media Library hochladen
 * 3. Dann im Browser aufrufen: http://finanzleser.local/?assign_visuals=1
 * 4. Nach erfolgreicher Ausführung den Code wieder aus functions.php entfernen
 */

// SVG-Upload in WordPress erlauben
add_filter('upload_mimes', function($mimes) {
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
});

// SVG-Vorschau in der Media Library ermöglichen
add_filter('wp_check_filetype_and_ext', function($data, $file, $filename, $mimes) {
    $ext = pathinfo($filename, PATHINFO_EXTENSION);
    if ($ext === 'svg') {
        $data['type'] = 'image/svg+xml';
        $data['ext'] = 'svg';
        $data['proper_filename'] = $filename;
    }
    return $data;
}, 10, 4);

// Einmaliges Script: SVGs random als Featured Image zuweisen
add_action('init', function() {
    if (!isset($_GET['assign_visuals']) || $_GET['assign_visuals'] !== '1') {
        return;
    }

    // Nur Admins dürfen das ausführen
    if (!current_user_can('manage_options')) {
        wp_die('Keine Berechtigung.');
    }

    // Alle SVG-Attachments aus der Media Library holen
    $svg_attachments = get_posts([
        'post_type'      => 'attachment',
        'post_mime_type' => 'image/svg+xml',
        'posts_per_page' => -1,
        'fields'         => 'ids',
    ]);

    if (empty($svg_attachments)) {
        wp_die('Keine SVGs in der Media Library gefunden. Bitte zuerst die 20 SVGs hochladen.');
    }

    // Alle Posts holen
    $posts = get_posts([
        'post_type'      => 'post',
        'posts_per_page' => -1,
        'fields'         => 'ids',
    ]);

    if (empty($posts)) {
        wp_die('Keine Posts gefunden.');
    }

    $count = 0;
    $total = count($posts);
    $svg_count = count($svg_attachments);

    foreach ($posts as $post_id) {
        // Random SVG auswählen
        $random_svg_id = $svg_attachments[array_rand($svg_attachments)];

        // Als Featured Image setzen (überschreibt bestehendes Bild)
        set_post_thumbnail($post_id, $random_svg_id);
        $count++;
    }

    wp_die(sprintf(
        'Fertig! %d von %d Posts haben ein SVG-Visual als Beitragsbild erhalten. (%d SVGs verfügbar)',
        $count,
        $total,
        $svg_count
    ));
});
