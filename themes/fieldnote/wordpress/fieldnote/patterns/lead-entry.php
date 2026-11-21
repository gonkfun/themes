<?php
/**
 * Title: Today’s observation (homepage lead)
 * Slug: fieldnote/lead-entry
 * Categories: fieldnote
 * Inserter: yes
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<!-- wp:html -->
<section class="fn-lead-entry" aria-labelledby="fn-lead-title"><div><div class="fn-kicker">Today’s observation</div><h1 id="fn-lead-title">Look closely.<br/><em>Write it down.</em></h1><p class="fn-intro">A field journal for the birds at the feeder, the fern in the shade and the weather rolling in. Small notes, gathered patiently, become a record of a place.</p><div class="fn-actions"><a class="fn-button" href="#entries">Open the journal <span aria-hidden="true">→</span></a><a class="fn-text-link" href="<?php echo esc_url( home_url( '/category/notes/' ) ); ?>">How to keep a field notebook</a></div></div><figure class="fn-plate"><span class="fn-tape" aria-hidden="true"></span><img src="<?php echo esc_url( get_theme_file_uri( 'assets/' ) ); ?>fern.svg" alt="Line drawing of a fern unfurling beside a small note" width="400" height="300"/><figcaption><span>Plate I · Polypodium</span><span>Shade garden</span></figcaption></figure></section>
<!-- /wp:html -->