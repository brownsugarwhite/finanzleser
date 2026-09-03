<?php
/**
 * Finanzleser Block Passthrough
 *
 * Das Next.js-Frontend parst bestimmte Gutenberg-Block-Kommentare (wp:latest-posts,
 * wp:finanzleser/*) und rendert sie selbst (z.B. als ArticleSlider / RechnerEmbed).
 * Dynamic Core-Blocks wie core/latest-posts werden aber server-seitig gerendert
 * und der Block-Kommentar geht verloren.
 *
 * Dieses Plugin erhält für bestimmte Block-Typen den Original-Kommentar in der
 * content-Ausgabe (the_content Filter) statt des gerenderten HTML.
 */

add_filter('render_block', function ($block_content, $block) {
    if (empty($block['blockName'])) {
        return $block_content;
    }

    // Nur für Next.js-Frontend passthrough (nicht im Editor/Admin):
    // render_block läuft sowohl bei do_blocks() für Frontend als auch beim Editor
    // Wir wollen nur das Frontend-Rendering ändern.
    if (is_admin() && !wp_doing_ajax()) {
        return $block_content;
    }

    $passthrough_blocks = [
        'core/latest-posts',
    ];

    if (!in_array($block['blockName'], $passthrough_blocks, true)) {
        return $block_content;
    }

    $attrs = isset($block['attrs']) && is_array($block['attrs']) ? $block['attrs'] : [];
    $attrs_json = !empty($attrs) ? ' ' . wp_json_encode($attrs) : '';
    // Core-Blocks werden im DB-Kommentar ohne "core/" Prefix gespeichert
    $name = preg_replace('#^core/#', '', $block['blockName']);

    // Self-closing Block-Kommentar (latest-posts ist ein self-closing block)
    return "<!-- wp:{$name}{$attrs_json} /-->";
}, 10, 2);
