var overlay_markup = `
    <div class="OUTER_CLASS_NAME">
        <form class="tc-form"></form>

        <div class="tc-ex">
            <textarea class="tc-post-data"></textarea>
        </div>
        <div class="tc-footer tc-disabled">
            <a href="">Export</a>
            <a href="">Import</a>
        </div>
    </div>
`;

var form_content = `
    <div class="tc-title-wrapper"></div>
    <div tabindex="0" class="tc-add tc-button tc-add-title fa fa-plus"></div><br/>
    <div class="tc-tag-selector tc-wide-input">
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
    <div class="tc-preview-link tc-wide-input">
        <input type="text" class="tc-text-input tc-preview-link-input" placeholder="Preview Link">
        <div tabindex="0" class="tc-reset tc-button fa fa-minus"></div>
    </div>
    <div class="tc-text-wrapper">
        <div id="tc-text" class="tc-text"></div>
        <div tabindex="0" class="tc-reset tc-button fa fa-minus"></div>
    </div>
    <div class="tc-bottom-link-wrapper"></div>
    <div tabindex="0" class="tc-add tc-button tc-add-bottom-link fa fa-plus"></div><br/>
    <div class="tc-ps-text tc-wide-input">
        <input type="text" class="tc-text-input tc-ps-text-input" placeholder="PS">
        <div tabindex="0" class="tc-reset tc-button fa fa-minus"></div>
    </div>
    <div class="tc-form-footer">
        <a href="#" class="tc-parse tc-wide-button tc-text-button">Parse</a>
        <a href="#" class="tc-clear-form tc-wide-button tc-text-button">Clear</a>
        <div class="tc-drafts">
            <div class="tc-draft-left tc-draft-column">
                <a href="#" class="tc-save-draft tc-narrow-button tc-text-button">
                    <span class="tc-save-draft-text">Save Draft</span>
                    <span class="tc-save-draft-icon fa fa-floppy-o"></span>
                </a>
                <a href="#" class="tc-save-draft-complete tc-narrow-button tc-text-button tc-disabled fa fa-check"></a>
            </div>
            <div class="tc-draft-right tc-draft-column">
                <a href="#" class="tc-load-draft tc-narrow-button tc-text-button">Load Draft</a>
                <div class="tc-load-draft-form tc-disabled">
                    <div class="tc-select-wrapper">
                        <select class="tc-draft-list">
                        </select>
                    </div>
                    <div tabindex="0" class="tc-load tc-button fa fa-upload"></div>
                    <div tabindex="0" class="tc-delete tc-button fa fa-trash-o"></div>                
                </div>
            </div>
        </div>
    </div>
`;

var title_markup = `
    <div class="tc-title tc-wide-input">
        <input type="text" class="tc-text-input tc-title-input" placeholder="Title">
        <div tabindex="0" class="tc-remove tc-button fa fa-minus"></div>
    </div>
`;

var bottom_link_markup = `
    <div class="tc-bottom-link">
        <input type="text" placeholder="http://" class="tc-text-input tc-bottom-link-input tc-link">
        <input type="text" placeholder="Link Text" class="tc-text-input tc-bottom-link-input tc-link-text">
        <div tabindex="0" class="tc-remove tc-button fa fa-minus"></div>
    </div>
`;

var link_preview_markup = `
    <div class="tc-link-preview">
        <iframe src="LINK" width="560" height="315" frameborder="0"></iframe>
    </div>
`;