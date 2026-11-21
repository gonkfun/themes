<?php
/**
 * Front-end styles and editor patterns.
 *
 * @package signalatelier
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function signalatelier_setup() {
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/theme.css' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'responsive-embeds' );
}
add_action( 'after_setup_theme', 'signalatelier_setup' );

function signalatelier_assets() {
    wp_enqueue_style( 'signalatelier-layout', get_theme_file_uri( 'assets/theme.css' ), array(), wp_get_theme()->get( 'Version' ) );
}
add_action( 'wp_enqueue_scripts', 'signalatelier_assets' );

function signalatelier_pattern_category() {
    register_block_pattern_category( 'signalatelier', array( 'label' => __( 'Signal Atelier', 'signalatelier' ) ) );
}
add_action( 'init', 'signalatelier_pattern_category' );
