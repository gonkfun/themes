<?php
/**
 * Front-end styles and editor patterns.
 *
 * @package relaygrid
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function relaygrid_setup() {
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/theme.css' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'responsive-embeds' );
}
add_action( 'after_setup_theme', 'relaygrid_setup' );

function relaygrid_assets() {
    wp_enqueue_style( 'relaygrid-layout', get_theme_file_uri( 'assets/theme.css' ), array(), wp_get_theme()->get( 'Version' ) );
}
add_action( 'wp_enqueue_scripts', 'relaygrid_assets' );

function relaygrid_pattern_category() {
    register_block_pattern_category( 'relaygrid', array( 'label' => __( 'Relaygrid', 'relaygrid' ) ) );
}
add_action( 'init', 'relaygrid_pattern_category' );
