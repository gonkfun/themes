<?php
/**
 * Front-end styles and editor patterns.
 *
 * @package longweekend
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function longweekend_setup() {
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/theme.css' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'responsive-embeds' );
}
add_action( 'after_setup_theme', 'longweekend_setup' );

function longweekend_assets() {
    wp_enqueue_style( 'longweekend-layout', get_theme_file_uri( 'assets/theme.css' ), array(), wp_get_theme()->get( 'Version' ) );
}
add_action( 'wp_enqueue_scripts', 'longweekend_assets' );

function longweekend_pattern_category() {
    register_block_pattern_category( 'longweekend', array( 'label' => __( 'Long Weekend', 'longweekend' ) ) );
}
add_action( 'init', 'longweekend_pattern_category' );
