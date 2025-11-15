<?php
/**
 * Plugin Name: CogDog Splot HTML
 * Description: Detects full HTML documents pasted into the wText editor and converts them to iframe format
 * Version: 1.0.0
 * Author: Tom Woodward and cleaned up and commented by Claude
 * License: GPL v2 or later
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Save embedded HTML to custom field
 * This is called via AJAX from the JavaScript
 */
function cogdog_splot_save_html_meta() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'cogdog_splot_html')) {
        wp_send_json_error('Invalid nonce');
        return;
    }

    // Get post ID and HTML content
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
    $html_content = isset($_POST['html_content']) ? $_POST['html_content'] : '';
    $is_encoded = isset($_POST['is_encoded']) ? $_POST['is_encoded'] : '0';

    if (!$post_id || !$html_content) {
        wp_send_json_error('Missing post ID or HTML content');
        return;
    }

    // Decode if content was base64 encoded
    if ($is_encoded === '1') {
        $html_content = base64_decode($html_content);
    }

    // Check permissions
    if (!current_user_can('edit_post', $post_id)) {
        wp_send_json_error('Insufficient permissions');
        return;
    }

    // Generate a unique ID for this HTML block
    $block_id = uniqid('splot_html_');
    $meta_key = '_cogdog_splot_html_' . $block_id;

    // Save the raw HTML to post meta (bypasses kses completely)
    update_post_meta($post_id, $meta_key, $html_content);

    // Return the block ID so JavaScript can insert the placeholder
    wp_send_json_success(array('block_id' => $block_id));
}
add_action('wp_ajax_cogdog_splot_save_html', 'cogdog_splot_save_html_meta');

/**
 * Shortcode handler for [splot-html]
 * Retrieves HTML from post meta and generates iframe
 */
function cogdog_splot_html_shortcode($atts) {
    // Get shortcode attributes
    $atts = shortcode_atts(array(
        'id' => ''
    ), $atts);

    // Validate ID
    if (empty($atts['id'])) {
        return '<!-- CogDog Splot HTML: No ID provided -->';
    }

    $block_id = sanitize_text_field($atts['id']);

    // Get current post ID
    global $post;
    if (!$post) {
        return '<!-- CogDog Splot HTML: No post context -->';
    }

    // Get the HTML from post meta
    $meta_key = '_cogdog_splot_html_' . $block_id;
    $html_content = get_post_meta($post->ID, $meta_key, true);

    if (empty($html_content)) {
        return '<!-- CogDog Splot HTML: No HTML found for ID ' . esc_html($block_id) . ' -->';
    }

    // Escape for srcdoc (only & and ")
    // IMPORTANT: Escape & first to avoid double-escaping
    $escaped_content = str_replace('&', '&amp;', $html_content);
    $escaped_content = str_replace('"', '&quot;', $escaped_content);

    // Create iframe
    $iframe = sprintf(
        '<iframe srcdoc="%s" sandbox="allow-scripts allow-same-origin" style="width: 100%%; height: 600px; border: 1px solid #ccc;"></iframe>',
        $escaped_content
    );

    return $iframe;
}
add_shortcode('splot-html', 'cogdog_splot_html_shortcode');

/**
 * Enqueue the JavaScript that handles paste detection
 */
function cogdog_splot_enqueue_scripts() {
    // First enqueue the script
    wp_enqueue_script(
        'cogdog-splot-html',
        plugin_dir_url(__FILE__) . 'js/splot-html.js',
        array('jquery'),
        '1.0.3',
        true
    );

    // Then localize it - get post ID from multiple sources
    global $post;
    $post_id = 0;

    // Check for 'wid' parameter first (frontend editor write ID)
    if (isset($_GET['wid'])) {
        $post_id = intval($_GET['wid']);
    } elseif ($post && isset($post->ID)) {
        $post_id = $post->ID;
    } elseif (isset($_GET['post'])) {
        $post_id = intval($_GET['post']);
    } elseif (isset($_POST['post_ID'])) {
        $post_id = intval($_POST['post_ID']);
    }

    // Pass AJAX URL, nonce, and post ID to JavaScript
    $script_data = array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('cogdog_splot_html'),
        'postId' => $post_id
    );

    wp_localize_script('cogdog-splot-html', 'cogdogSplotData', $script_data);
}
add_action('admin_enqueue_scripts', 'cogdog_splot_enqueue_scripts');
add_action('wp_enqueue_scripts', 'cogdog_splot_enqueue_scripts');
