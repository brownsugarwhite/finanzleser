<?php
/**
 * Create WordPress categories for finanzleser.de
 * Access: http://finanzleser.local/wp-content/uploads/create-categories.php
 * Then delete this file after running!
 */

// Load WordPress
require_once( dirname( __FILE__ ) . '/../../../../wp-load.php' );

if ( ! current_user_can( 'manage_categories' ) ) {
    wp_die( 'Du musst als Admin angemeldet sein!' );
}

$categories = array(
    // Main categories
    array( 'name' => 'Finanzen', 'slug' => 'finanzen', 'parent' => 0 ),
    array( 'name' => 'Versicherungen', 'slug' => 'versicherungen', 'parent' => 0 ),
    array( 'name' => 'Steuern', 'slug' => 'steuern', 'parent' => 0 ),
    array( 'name' => 'Recht', 'slug' => 'recht', 'parent' => 0 ),

    // Finanzen subcategories
    array( 'name' => 'Geldanlagen', 'slug' => 'geldanlagen', 'parent' => 'finanzen' ),
    array( 'name' => 'Kredite & Bauen', 'slug' => 'kredite-bauen', 'parent' => 'finanzen' ),
    array( 'name' => 'Energiekosten', 'slug' => 'energiekosten', 'parent' => 'finanzen' ),
    array( 'name' => 'Weitere Themen', 'slug' => 'weitere-themen', 'parent' => 'finanzen' ),

    // Versicherungen subcategories
    array( 'name' => 'Altersvorsorge', 'slug' => 'altersvorsorge', 'parent' => 'versicherungen' ),
    array( 'name' => 'Krankenversicherung', 'slug' => 'krankenversicherung', 'parent' => 'versicherungen' ),
    array( 'name' => 'Berufsunfähigkeit', 'slug' => 'berufsunfaehigkeit', 'parent' => 'versicherungen' ),
    array( 'name' => 'Unfallversicherung', 'slug' => 'unfallversicherung', 'parent' => 'versicherungen' ),
    array( 'name' => 'Sachversicherungen', 'slug' => 'sachversicherungen', 'parent' => 'versicherungen' ),
    array( 'name' => 'Tierversicherungen', 'slug' => 'tierversicherungen', 'parent' => 'versicherungen' ),
    array( 'name' => 'Sozialversicherungen', 'slug' => 'sozialversicherungen', 'parent' => 'versicherungen' ),

    // Steuern subcategories
    array( 'name' => 'Steuererklärung', 'slug' => 'steuererklarung', 'parent' => 'steuern' ),
    array( 'name' => 'Steuerarten', 'slug' => 'steuerarten', 'parent' => 'steuern' ),
    array( 'name' => 'Steuerpflichtige', 'slug' => 'steuerpflichtige', 'parent' => 'steuern' ),

    // Recht subcategories
    array( 'name' => 'Ehe & Familie', 'slug' => 'ehe-familie', 'parent' => 'recht' ),
    array( 'name' => 'Arbeitsrecht', 'slug' => 'arbeitsrecht', 'parent' => 'recht' ),
    array( 'name' => 'Mietrecht', 'slug' => 'mietrecht', 'parent' => 'recht' ),

    // Finanztools
    array( 'name' => 'Finanztools', 'slug' => 'finanztools', 'parent' => 0 ),
);

// Store parent IDs for subcategories
$parent_ids = array();

// First pass: create main categories and store their IDs
$main_categories = array_filter( $categories, function( $cat ) {
    return $cat['parent'] === 0;
} );

foreach ( $main_categories as $cat ) {
    $term = wp_insert_term(
        $cat['name'],
        'category',
        array(
            'slug' => $cat['slug'],
            'description' => ''
        )
    );

    if ( is_wp_error( $term ) ) {
        echo "❌ Fehler bei '{$cat['name']}': " . $term->get_error_message() . "<br>";
    } else {
        $parent_ids[ $cat['slug'] ] = $term['term_id'];
        echo "✅ Erstellt: {$cat['name']}<br>";
    }
}

// Second pass: create subcategories
$sub_categories = array_filter( $categories, function( $cat ) {
    return $cat['parent'] !== 0;
} );

foreach ( $sub_categories as $cat ) {
    $parent_id = isset( $parent_ids[ $cat['parent'] ] ) ? $parent_ids[ $cat['parent'] ] : 0;

    $term = wp_insert_term(
        $cat['name'],
        'category',
        array(
            'slug' => $cat['slug'],
            'parent' => $parent_id,
            'description' => ''
        )
    );

    if ( is_wp_error( $term ) ) {
        echo "❌ Fehler bei '{$cat['name']}': " . $term->get_error_message() . "<br>";
    } else {
        echo "✅ Erstellt: {$cat['name']}<br>";
    }
}

echo "<hr>";
echo "<strong>✅ Kategorien erstellt!</strong> Du kannst diese Datei jetzt löschen.";
?>
