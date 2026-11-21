<?php
/**
 * Styles, appearance preference, and editorial patterns.
 *
 * @package lumen
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function lumen_setup() {
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/lumen.css' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'responsive-embeds' );
}
add_action( 'after_setup_theme', 'lumen_setup' );

function lumen_assets() {
    $version = wp_get_theme()->get( 'Version' );
    wp_enqueue_style( 'lumen-reading', get_theme_file_uri( 'assets/lumen.css' ), array(), $version );
    wp_enqueue_script( 'lumen-appearance', get_theme_file_uri( 'assets/lumen.js' ), array(), $version, false );
}
add_action( 'wp_enqueue_scripts', 'lumen_assets' );

function lumen_body_class( $classes ) {
    $classes[] = 'lumen-journal';
    return $classes;
}
add_filter( 'body_class', 'lumen_body_class' );

function lumen_pattern_category() {
    register_block_pattern_category( 'lumen', array( 'label' => __( 'Lumen journal', 'lumen' ) ) );
}
add_action( 'init', 'lumen_pattern_category' );
