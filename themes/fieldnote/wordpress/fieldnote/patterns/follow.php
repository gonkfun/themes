<?php
/**
 * Title: Follow by RSS
 * Slug: fieldnote/follow
 * Categories: fieldnote
 * Inserter: yes
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<!-- wp:html -->
<section class="fn-rss"><h2>Follow along</h2><p>New entries in your RSS reader, in the order they were written.</p><a class="fn-button ghost" href="<?php echo esc_url( get_feed_link() ); ?>">Subscribe by RSS</a></section>
<!-- /wp:html -->