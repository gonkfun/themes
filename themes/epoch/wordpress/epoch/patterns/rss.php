<?php
/**
 * Title: RSS invitation
 * Slug: epoch/rss
 * Categories: epoch
 * Inserter: yes
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<!-- wp:html -->
<section class="ep-rss"><h2>A feed, at your pace.</h2><p>Follow new posts in your favourite RSS reader. No algorithm deciding what you see.</p><a class="ep-button" href="<?php echo esc_url( get_feed_link() ); ?>">Follow through RSS ↗</a></section>
<!-- /wp:html -->