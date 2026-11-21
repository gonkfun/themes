<?php
/** Fieldnote theme setup. GPL-2.0-or-later. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function fieldnote_setup() {
 load_theme_textdomain( 'fieldnote', get_template_directory() . '/languages' );
 add_theme_support( 'editor-styles' );
 add_editor_style( 'assets/fieldnote.css' );
 add_theme_support( 'responsive-embeds' );
 add_theme_support( 'post-thumbnails' );
 add_theme_support( 'automatic-feed-links' );
 add_theme_support( 'title-tag' );
}
add_action( 'after_setup_theme', 'fieldnote_setup' );
function fieldnote_assets() {
 $version = wp_get_theme()->get( 'Version' );
 wp_enqueue_style( 'fieldnote', get_theme_file_uri( 'assets/fieldnote.css' ), array(), $version );
 wp_enqueue_script( 'fieldnote', get_theme_file_uri( 'assets/fieldnote.js' ), array(), $version, true );
}
add_action( 'wp_enqueue_scripts', 'fieldnote_assets' );
function fieldnote_body_class( $classes ) { $classes[] = 'fn-wp'; return $classes; }
add_filter( 'body_class', 'fieldnote_body_class' );
function fieldnote_patterns() {
 register_block_pattern_category( 'fieldnote', array( 'label' => __( 'Fieldnote sections', 'fieldnote' ) ) );
 register_block_style( 'core/group', array( 'name' => 'margin-note', 'label' => __( 'Margin note', 'fieldnote' ), 'inline_style' => '' ) );
}
add_action( 'init', 'fieldnote_patterns' );
/** Margin-note block style uses the theme's .fn-margin look. */
function fieldnote_margin_note_class( $block_content, $block ) {
 if ( isset( $block['attrs']['className'] ) && false !== strpos( $block['attrs']['className'], 'is-style-margin-note' ) ) {
  $block_content = preg_replace( '/class="/', 'class="fn-margin ', $block_content, 1 );
 }
 return $block_content;
}
add_filter( 'render_block_core/group', 'fieldnote_margin_note_class', 10, 2 );
