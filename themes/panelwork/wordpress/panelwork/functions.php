<?php
/**
 * Load Panelwork's styles and local presentation controls.
 *
 * @package panelwork
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function panelwork_setup() {
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/panelwork.css' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'responsive-embeds' );
}
add_action( 'after_setup_theme', 'panelwork_setup' );

function panelwork_assets() {
    $version = wp_get_theme()->get( 'Version' );
    wp_enqueue_style( 'panelwork-layout', get_theme_file_uri( 'assets/panelwork.css' ), array(), $version );
    wp_enqueue_script( 'panelwork-dashboard', get_theme_file_uri( 'assets/panelwork.js' ), array(), $version, false );
}
add_action( 'wp_enqueue_scripts', 'panelwork_assets' );

function panelwork_body_class( $classes ) {
    $classes[] = 'panelwork-theme';
    return $classes;
}
add_filter( 'body_class', 'panelwork_body_class' );
