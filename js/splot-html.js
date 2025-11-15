/**
 * CogDog Splot HTML - Paste Handler
 * Detects when full HTML documents are pasted into the wText editor
 * Saves HTML to custom field and inserts placeholder
 */

(function($) {
    'use strict';

    /**
     * Check if content contains both head and body tags
     */
    function isFullHTMLDocument(content) {
        return content.match(/<head[\s>]/i) && content.match(/<body[\s>]/i);
    }

    /**
     * Save HTML content to custom field via AJAX
     */
    function saveHTMLToMeta(htmlContent, callback) {
        // Check if we have the required data
        if (!window.cogdogSplotData) {
            callback(null);
            return;
        }

        // Get post ID - try multiple sources
        let postId = cogdogSplotData.postId;

        // Try URL parameters first (for frontend editors)
        const urlParams = new URLSearchParams(window.location.search);

        // Check for 'wid' parameter (write ID for frontend editor)
        const widParam = urlParams.get('wid');
        if (widParam) {
            postId = widParam;
        }

        // If still no post ID, try other sources
        if (!postId || postId === 0) {
            // Try 'post' URL parameter
            postId = urlParams.get('post');

            // Try post_ID input field
            if (!postId) {
                const postIdInput = document.getElementById('post_ID');
                if (postIdInput) {
                    postId = postIdInput.value;
                }
            }
        }

        if (!postId || postId === 0) {
            callback(null);
            return;
        }

        // Base64 encode the HTML content to safely transmit it
        const encodedContent = btoa(unescape(encodeURIComponent(htmlContent)));

        // Send AJAX request to save HTML
        $.ajax({
            url: cogdogSplotData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'cogdog_splot_save_html',
                nonce: cogdogSplotData.nonce,
                post_id: postId,
                html_content: encodedContent,
                is_encoded: '1'
            },
            success: function(response) {
                if (response.success && response.data.block_id) {
                    callback(response.data.block_id);
                } else {
                    callback(null);
                }
            },
            error: function(xhr, status, error) {
                callback(null);
            }
        });
    }

    /**
     * Handle paste events on the wText editor (native event)
     */
    function handlePasteNative(event) {
        // Get raw clipboard data BEFORE any WordPress filtering
        let pastedData = '';

        if (event.clipboardData) {
            // Try text/plain first (most reliable for code editors)
            pastedData = event.clipboardData.getData('text/plain');

            // Also try text/html as fallback
            if (!pastedData) {
                pastedData = event.clipboardData.getData('text/html');
            }
        }

        if (!pastedData) {
            return; // No data to process
        }

        // Check if it's a full HTML document
        const hasHead = /<head[\s>]/i.test(pastedData);
        const hasBody = /<body[\s>]/i.test(pastedData);

        if (hasHead && hasBody) {
            // Prevent default paste behavior
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const editor = event.target;

            // Save HTML to custom field via AJAX
            saveHTMLToMeta(pastedData, function(blockId) {
                if (blockId) {
                    // Create placeholder shortcode
                    const placeholder = `[splot-html id="${blockId}"]`;

                    // Insert placeholder instead of HTML
                    if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') {
                        // For textarea/input, insert at cursor position
                        const cursorPos = editor.selectionStart;
                        const textBefore = editor.value.substring(0, cursorPos);
                        const textAfter = editor.value.substring(editor.selectionEnd);
                        editor.value = textBefore + placeholder + textAfter;

                        // Set cursor position after inserted content
                        const newPos = cursorPos + placeholder.length;
                        editor.setSelectionRange(newPos, newPos);

                        // Trigger change event
                        $(editor).trigger('change');
                    } else {
                        // For contenteditable or other elements
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            range.deleteContents();
                            const textNode = document.createTextNode(placeholder);
                            range.insertNode(textNode);
                            range.setStartAfter(textNode);
                            range.setEndAfter(textNode);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }

                        // Trigger change event
                        $(editor).trigger('change');
                    }
                }
            });
        }
    }

    /**
     * Initialize the paste handler
     */
    function init() {
        // Wait for DOM to be ready and check for wText editor
        const checkAndAttach = function() {
            const wTextEditor = document.getElementById('wText');

            if (wTextEditor) {
                // Use native addEventListener with capture phase
                // This ensures we intercept BEFORE any WordPress handlers
                wTextEditor.addEventListener('paste', handlePasteNative, true);
            } else {
                // If editor not found yet, try again after a short delay
                setTimeout(checkAndAttach, 500);
            }
        };

        checkAndAttach();
    }

    // Initialize when document is ready
    $(document).ready(init);

})(jQuery);
