<?php
/** Epoch theme setup. GPL-2.0-or-later. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function epoch_setup() {
 load_theme_textdomain( 'epoch', get_template_directory() . '/languages' );
 add_theme_support( 'editor-styles' );
 add_editor_style( 'assets/epoch.css' );
 add_theme_support( 'responsive-embeds' );
 add_theme_support( 'post-thumbnails' );
 add_theme_support( 'automatic-feed-links' );
 add_theme_support( 'title-tag' );
}
add_action( 'after_setup_theme', 'epoch_setup' );
function epoch_assets() {
 $version = wp_get_theme()->get( 'Version' );
 wp_enqueue_style( 'epoch', get_theme_file_uri( 'assets/epoch.css' ), array(), $version );
 wp_enqueue_script( 'epoch', get_theme_file_uri( 'assets/epoch.js' ), array(), $version, true );
}
add_action( 'wp_enqueue_scripts', 'epoch_assets' );
function epoch_body_class( $classes ) { $classes[] = 'ep-wp'; return $classes; }
add_filter( 'body_class', 'epoch_body_class' );
function epoch_patterns() {
 register_block_pattern_category( 'epoch', array( 'label' => __( 'Epoch sections', 'epoch' ) ) );
}
add_action( 'init', 'epoch_patterns' );
