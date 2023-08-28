var overlay_markup = `
    <div class="overlay-text-template">
        <div class="tc-form"></div>
        <div class="tc-footer tc-disabled">
            <a href="">Export</a>
            <a href="">Import</a>
        </div>
        <div class="tc-preview-wrapper">
            <div class="tc-preview">

            </div>
        </div>
    </div>
`;

var form_content = `
    <div class="tc-form-controls">
        <div class="tc-button-container">
            <div tabindex="0" class="tc-toggle-form tc-top-button fa fa-list"></div>
            <div tabindex="0" class="tc-toggle-preview tc-top-button fa fa-eye"></div>
            <div tabindex="0" class="tc-load-draft tc-top-button fa fa-arrow-down"></div>
            <div tabindex="0" class="tc-save-draft tc-top-button fa fa-floppy-o"></div>
            <div tabindex="0" class="tc-save-draft-complete tc-top-button tc-disabled fa fa-check"></div>
            <div tabindex="0" class="tc-clear-form tc-top-button fa fa-trash-o"></div>
        </div>
        <div class="tc-drafts tc-hidden tc-wrapper">
            <div class="tc-select-wrapper">
                <select class="tc-draft-list"></select>
            </div>
            <div tabindex="0" class="tc-load tc-button fa fa-upload"></div>
            <div tabindex="0" class="tc-delete tc-button fa fa-trash-o"></div>
        </div>
    </div>
    <div class="tc-form-inputs">
        <div class="tc-title-wrapper"></div>
        <div tabindex="0" class="tc-add tc-button tc-add-title fa fa-plus"></div><br/>
        <div class="tc-tag-selector tc-wide-input tc-wrapper">
            <input type="text" class="tc-text-input tc-tag-selector-input" placeholder="#tags">
            <div tabindex="0" class="tc-reset tc-button fa fa-minus"></div>
            <div class="tc-tag-helper">
                <div class="tc-tag-view"></div>
                <textarea class="tc-tag-helper-edit tc-disabled" placeholder="Your #tag #map could be here..."></textarea>
                <div tabindex="0" class="tc-edit tc-button fa fa-pencil"></div>
                <div tabindex="0" class="tc-accept tc-disabled tc-button fa fa-floppy-o"></div>
                <div tabindex="0" class="tc-cancel tc-disabled tc-button fa fa-times"></div>
            </div>
        </div>
        <div class="tc-preview-link tc-wide-input tc-wrapper">
            <input type="text" class="tc-text-input tc-preview-link-input" placeholder="Preview Link">
            <div tabindex="0" class="tc-reset tc-button fa fa-minus"></div>
        </div>
        <div class="tc-text-wrapper tc-wrapper">
            <div id="tc-text" class="tc-text"></div>
            <div tabindex="0" class="tc-reset tc-button fa fa-minus"></div>
        </div>
        <div class="tc-bottom-link-wrapper"></div>
        <div tabindex="0" class="tc-add tc-button tc-add-bottom-link fa fa-plus"></div><br/>
        <div class="tc-ps-text tc-wide-input tc-wrapper">
            <input type="text" class="tc-text-input tc-ps-text-input" placeholder="PS">
            <div tabindex="0" class="tc-reset tc-button fa fa-minus"></div>
        </div>
    </div>
`;

var title_markup = `
    <div class="tc-title tc-wide-input tc-wrapper">
        <input type="text" class="tc-text-input tc-title-input" placeholder="Title">
        <div tabindex="0" class="tc-remove tc-button fa fa-minus"></div>
        <div tabindex="0" class="tc-bottom tc-button fa fa-arrow-down"></div>
        <div tabindex="0" class="tc-up tc-button fa fa-arrow-up"></div>
    </div>
`;

var bottom_link_markup = `
    <div class="tc-bottom-link tc-wrapper">
        <input type="text" placeholder="http://" class="tc-text-input tc-bottom-link-input tc-link">
        <input type="text" placeholder="Link Text" class="tc-text-input tc-bottom-link-input tc-link-text">
        <div tabindex="0" class="tc-remove tc-button fa fa-minus"></div>
        <div tabindex="0" class="tc-bottom tc-button fa fa-arrow-down"></div>
        <div tabindex="0" class="tc-up tc-button fa fa-arrow-up"></div>
    </div>
`;

var link_preview_markup = `
    <div class="tc-link-preview">
        <iframe src="LINK" width="420" height="236" frameborder="0"></iframe>
    </div>
`;

var options_button_markup = `
    <div class="tc-options-button">
        <span class="label on fa fa-caret-down tc-disabled"></span>
        <span class="label off fa fa-caret-up"></span>
    </div>
`;