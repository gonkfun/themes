<?php
require '/wordpress/wp-load.php';
switch_theme('epoch');
update_option('blogname','epoch');
update_option('blogdescription','Independent Solana journal');
update_option('posts_per_page',4);
update_option('permalink_structure','/%postname%/');
foreach(get_posts(['numberposts'=>-1,'post_status'=>'any']) as $p)wp_delete_post($p->ID,true);
foreach(['Guides','Ecosystem','DeFi','Builders','Culture','Security'] as $name)wp_insert_term($name,'category',['slug'=>strtolower($name)]);
$stories=[
 ['security','Security','The wallet check you should make before every connection','Permissions are small decisions with real consequences. Here’s how to read them without getting lost.'],
 ['builders','Builders','Behind the build: shipping something people actually use','A field guide to listening, simplifying and finding the first useful version of an idea.'],
 ['defi','DeFi','Liquidity pools, explained without the spreadsheet','What happens when two tokens share a pool—and why the price changes when someone trades.'],
 ['wallets','Guides','Your first Solana wallet: a calmer place to start','Addresses, recovery phrases and your first transaction. A practical introduction to the basics.'],
 ['community','Culture','Communities are more than a scrolling chat','The small habits that help an online group become a place people want to return to.'],
 ['orbital','Ecosystem','A better way to explore the Solana ecosystem','Start with the problem you want to understand, rather than the loudest project in your feed.']
];
foreach($stories as $i=>$story){
 $term=get_term_by('slug',strtolower($story[1]),'category');
 $content='<!-- wp:paragraph --><p>'.$story[3].'</p><!-- /wp:paragraph --><!-- wp:heading --><h2 class="wp-block-heading">Start with one useful question.</h2><!-- /wp:heading --><!-- wp:paragraph --><p>This is fictional sample content for the Epoch theme demonstration. Replace it with your own original research before publishing. A useful community publication makes complex ideas easier to understand without promising returns or manufacturing urgency.</p><!-- /wp:paragraph --><!-- wp:quote --><blockquote class="wp-block-quote"><p>Good explanations create space for better questions.</p></blockquote><!-- /wp:quote --><!-- wp:heading --><h2 class="wp-block-heading">Keep exploring.</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Compare official documentation, explain unfamiliar terms and help readers distinguish an explanation from a recommendation. Keep recovery phrases private and review wallet permissions before approving requests.</p><!-- /wp:paragraph -->';
 $id=wp_insert_post(['post_title'=>$story[2],'post_content'=>$content,'post_excerpt'=>$story[3],'post_status'=>'publish','post_author'=>1,'post_date'=>gmdate('Y-m-d H:i:s',time()-$i*86400),'post_category'=>[$term->term_id]]);
 $url=get_theme_file_uri('assets/'.$story[0].'.svg');
 $image=wp_insert_attachment(['post_title'=>'Original Epoch artwork','post_mime_type'=>'image/svg+xml','guid'=>$url,'post_status'=>'inherit']);
 update_post_meta($image,'_wp_attached_file','epoch-demo-'.$story[0].'.svg');
 update_post_meta($image,'_wp_attachment_metadata',['width'=>800,'height'=>600,'file'=>'epoch-demo-'.$story[0].'.svg','sizes'=>[]]);
 // A test fixture only: point attachment URL at bundled theme artwork, not uploads.
 update_post_meta($image,'epoch_demo_url',$url);
 set_post_thumbnail($id,$image);
}
wp_update_user(['ID'=>1,'display_name'=>'Epoch demo editor','description'=>'Fictional demo author for local theme testing.']);
foreach(['About','Contact','Privacy'] as $title)wp_insert_post(['post_type'=>'page','post_title'=>$title,'post_status'=>'publish','post_content'=>'<!-- wp:paragraph --><p>This is a sample '.$title.' page. Replace it with your publication’s real information before publishing.</p><!-- /wp:paragraph -->']);
flush_rewrite_rules();
echo 'Epoch demo content installed.';
