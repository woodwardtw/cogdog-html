# CogDog Splot HTML

A WordPress plugin that enables embedding full HTML documents (with `<head>` and `<body>` tags) into posts by automatically detecting pasted HTML and converting it to a safely sandboxed iframe.

## Description

This plugin was created to solve the challenge of embedding complete HTML documents into WordPress posts without having them stripped by kses filtering. When you paste HTML containing both `<head>` and `<body>` tags into the text editor, the plugin automatically:

1. Detects the full HTML document
2. Saves it to a custom field (bypassing kses filtering)
3. Inserts a shortcode placeholder in the editor
4. Renders the HTML in a sandboxed iframe on the frontend

## Background

Read more about the development and use case for this plugin:
[Trying to Stuff That Full HTML Into the SPLOT Editor](https://cogdogblog.com/2025/11/trying-to-stuff-that-full-html-into-the-splot-editor/)

## Requirements

- **TRU Writer SPLOT**: This plugin is designed to work with the TRU Writer SPLOT theme and its frontend editor
- WordPress 5.0 or higher
- jQuery

## Installation

1. Upload the `cogdog-html` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. No configuration needed - it works automatically!

## Usage

1. Navigate to the TRU Writer frontend editor (with `wText` editor field)
2. Paste any full HTML document that contains both `<head>` and `<body>` tags
3. The plugin automatically converts it to a shortcode: `[splot-html id="..."]`
4. Save/publish your post
5. The HTML will render in a sandboxed iframe when viewing the post

## How It Works

### Paste Detection
The plugin uses a native JavaScript event listener in capture phase to intercept paste events before WordPress can filter the content.

### Safe Storage
HTML content is base64-encoded and sent via AJAX to be stored in WordPress post meta, completely bypassing kses filtering.

### Shortcode Rendering
The `[splot-html]` shortcode retrieves the HTML from post meta and generates an iframe with:
- `srcdoc` attribute containing the full HTML
- `sandbox="allow-scripts allow-same-origin"` for security
- Responsive sizing (100% width, 600px height)

## Security

The iframe uses the `sandbox` attribute with restricted permissions:
- `allow-scripts`: Allows JavaScript to run within the iframe
- `allow-same-origin`: Allows the iframe to access its own origin

This provides a secure sandboxed environment for embedded HTML while preventing it from accessing the parent page.

## Files

- `cogdog-splot-html.php` - Main plugin file with PHP handlers
- `js/splot-html.js` - JavaScript for paste detection and AJAX handling
- `README.md` - This file

## Credits

- **Author**: Tom Woodward
- **Development assistance**: Claude (Anthropic)
- **License**: GPL v2 or later

## Changelog

### 1.0.3
- Removed all debugging code for production use

### 1.0.2
- Fixed post ID detection for frontend editors using `wid` parameter

### 1.0.1
- Added base64 encoding for safe AJAX transmission

### 1.0.0
- Initial release
