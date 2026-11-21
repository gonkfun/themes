<?php
/**
 * Front-end styles and editor patterns.
 *
 * @package cabinetnoir
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function cabinetnoir_setup() {
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/theme.css' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'responsive-embeds' );
}
add_action( 'after_setup_theme', 'cabinetnoir_setup' );

function cabinetnoir_assets() {
    wp_enqueue_style( 'cabinetnoir-layout', get_theme_file_uri( 'assets/theme.css' ), array(), wp_get_theme()->get( 'Version' ) );
}
add_action( 'wp_enqueue_scripts', 'cabinetnoir_assets' );

function cabinetnoir_pattern_category() {
    register_block_pattern_category( 'cabinetnoir', array( 'label' => __( 'Cabinet Noir', 'cabinetnoir' ) ) );
}
add_action( 'init', 'cabinetnoir_pattern_category' );
