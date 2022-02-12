$(document).ready(function() {
    var $body = $("body");
    var $window_wrapper = undefined;
    var $checklist_title = undefined;

    var cookie_lifetime = 365 * 5;
    var save = "trickychaos";
    var remembered_save = "tc-remembered";
    var feature_name = "trello-addons"
    var window_top_markup = `
    <a class="icon-lg tc-window-button tc-mute-all fa fa-volume-off" href="#"></a>
    <a class="icon-lg tc-window-button tc-add-checklist" href="#"></a>
    `;
    var checklist_buttons_markup = `
        <div class="button subtle hide-on-edit tc-solo-button tc-custom-button fa fa-play" href="#" style="margin: 0">&nbsp;</div>
        <div class="button subtle hide-on-edit tc-mute-button tc-custom-button fa fa-volume-off" href="#" style="margin: 0">&nbsp;</div>
    `;
    var enabled = false;
    var check_delta = 333;
    var window_check = undefined;

    var remembered_solo = {};
    var remembered_mute = {};
    var current_window = "";

    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.text === 'toggle_display_mode') {
            toggle_display_mode();
        }
    });

    // === main ===

    if ($.cookie(save)) {
        enable();
    }

    load_remembered();

    $(document).keydown(function(e) {
        if (e.which != 113)
            return;
        toggle_display_mode();
    });



    // === functions ===

    function save_remembered() {
        var remembered_object = {
            solo: remembered_solo,
            mute: remembered_mute
        }
        $.cookie(remembered_save, JSON.stringify(remembered_object), { expires: cookie_lifetime });
        // console.log(remembered_object);
    }

    function load_remembered() {
        if ($.cookie(remembered_save)) {
            var remembered_object = JSON.parse($.cookie(remembered_save));
            remembered_solo = remembered_object.solo;
            remembered_mute = remembered_object.mute;
            // console.log(remembered_object);
        }
    }

    function toggle_display_mode() {
        if ($body.hasClass(feature_name))
            disable();
        else
            enable();
    }

    function enable() {
        enabled = true;
        $body.addClass(feature_name);
        $.cookie(save, true, { expires: cookie_lifetime });

        check_window_addons();
    }

    function disable() {
        enabled = false;
        $body.removeClass(feature_name);
        $.cookie(save, null);
        clearTimeout(window_check);

        remove_checklist_controls();
    }

    function check_window_addons() {
        if (enabled) {
            window_check = setTimeout(function() {
                check_window_addons();
            }, check_delta);
        }

        $window_wrapper = $(".window-wrapper");
        $checklist_title = $(".checklist .window-module-title");
        if (!$window_wrapper.length) {
            return;
        }

        apply_checklist_lightup();
        add_checklist_controls();

        $addon = $(".tc-window-button");
        if ($addon.length) {
            return;
        }

        register_window();
    }

    function register_window() {
        current_window = $("h2.card-detail-title-assist").html();
        window_solo = remembered_solo[current_window];
        if (window_solo !== undefined) {
            $item = $(".checklist:nth-child("+ (window_solo + 1) +")");
            toggle_solo($item, true);
        }
        window_mute = remembered_mute[current_window];
        if (window_mute !== undefined) {
            for (i = 0; i < window_mute.length; i++) {
                $item = $(".checklist:nth-child("+ (window_mute[i] + 1) +")");
                toggle_mute($item, true);
            }
        }
        add_window_buttons();
    }
    
    function apply_checklist_lightup() {
        $checklist_items = $(".checklist-item");
        $checklist_items.each(function() {
            $this = $(this);
            $input = $this.find(".edit textarea");

            item = $this.find(".checklist-item-details-text").text();
            input_item = $input.val();

            compare_item = item;
            if (input_item == "") {
                if ($this.hasClass("tc-checked")) {
                    return;
                }
            } else {
                $this.removeClass("tc-checked");
                if (input_item != item) {
                    compare_item = input_item;
                }
            }
            if (compare_item == undefined) {
                return;
            }

            $this.addClass("tc-checked");
            compare_item = compare_item.replace(/\./g, "");

            mark = compare_item[compare_item.length-1];
            switch(mark) {
                case "!":
                    $this.addClass("tc-important");
                    break;
                case "?":
                    $this.addClass("tc-unsure");
                    break;
                default:
                    $this.removeClass("tc-important");
                    $this.removeClass("tc-unsure");
                    break;
            }
        });
    }

    function add_window_buttons() {
        $window_wrapper.append(window_top_markup);
        add_window_buttons_events();
        hide_all_checked_items();
    }

    function add_checklist_controls() {
        if ($checklist_title.length != $(".tc-solo-button").length)
        {
            remove_checklist_controls();
            $checklist_title.append(checklist_buttons_markup);
            add_checklist_controls_events();
            $(".checklist .js-confirm-delete").addClass("fa").addClass("fa-trash-o");
            $(".checklist .js-show-checked-items").addClass("fa").addClass("fa-check-circle-o");
            $(".checklist .js-hide-checked-items").addClass("fa").addClass("fa-check-circle");
        }
    }

    function remove_checklist_controls() {
        $(".tc-window-button").remove().detach();
        $(".tc-custom-button").remove();
        $(".tc-hidden").removeClass("tc-hidden");
        $(".fa").removeClass("fa").removeClass("fa-trash-o").removeClass("fa-check-circle").removeClass("fa-check-circle-o");
        $(".icon-description").unbind("click");
        $(".icon-checklist").unbind("click");
    }

    function hide_all_checked_items() {
        $(".js-hide-checked-items").each(function() {
            $(this)[0].click();
        });
    }

    function add_window_buttons_events() {
        $(".tc-add-checklist").click(function(e){
            e.preventDefault();
            $(".js-add-checklist-menu")[0].click();
            $(".pop-over").addClass("checklist");
            $("#id-checklist").val("to do");
            setTimeout(function() {
                check_overlay_shown();
            }, 200);
        });
        $(".tc-mute-all").click(function(e){
            e.preventDefault();
            selector = $(this).hasClass("tc-option-active") ? ".tc-collapsed" : ":not(.tc-collapsed)";
            toggle_mute($(".checklist" + selector));
            $(this).toggleClass("tc-option-active");
        });
        $(".icon-description").click(function(e){
            e.preventDefault();
            $body.toggleClass("tc-show-description");
            $(this).toggleClass("tc-option-active");
        });
        $(".icon-checklist").click(function(e){
            e.preventDefault();
            $checklist = $(this).parents(".checklist");
            $items = $checklist.find(".checklist-item");
            $checked_items = $items.filter(".checklist-item-state-complete");
            $unchecked_items = $items.filter(":not(.checklist-item-state-complete)");
            enable_checkboxes = $checked_items.length < $unchecked_items.length;
            $target_checkboxes = enable_checkboxes ? $unchecked_items : $checked_items;
            $target_checkboxes.each(function() {
                $(this).find(".checklist-item-checkbox").click();
            });
        });
    }

    function add_checklist_controls_events() {
        $(".tc-solo-button").click(function(e){
            e.preventDefault();
            $item = $(this).parent().parent();
            toggle_solo($item);
        });
        $(".tc-mute-button").click(function(e){
            e.preventDefault();
            $item = $(this).parent().parent();
            toggle_mute($item);
        });
    }

    function toggle_solo($item, tech=false)
    {
        $solo_button = $item.find(".tc-solo-button");
        $solo_button.toggleClass("tc-option-active");
        $target = $(".checklist, .js-fill-card-detail-desc, .card-detail-data, .js-open-move-from-header, .js-attachments-section").not($item);
        $target.toggleClass("tc-hidden");
        if (tech)
            return;

        list_number = $item.index();
        if ($solo_button.hasClass("tc-option-active")) {
            if (remembered_solo[current_window] == undefined)
                remembered_solo[current_window] = list_number;
        } else {
            delete remembered_solo[current_window];
        }
        save_remembered();
    }

    function toggle_mute($item, tech=false)
    {
        $mute_button = $item.find(".tc-mute-button");
        $mute_button.toggleClass("tc-option-active");
        $target = $item.find(".checklist-items-list, .checklist-progress, .checklist-new-item");
        $target.toggleClass("tc-hidden");
        $item.toggleClass("tc-collapsed");
        if (tech)
            return;

        list_numbers = [];
        $item.each(function() {
            list_numbers.push($(this).index());
        });

        for (i = 0; i < list_numbers.length; i++) {
            list_number = list_numbers[i];
            if ($mute_button.hasClass("tc-option-active")) {
                if (remembered_mute[current_window] == undefined)
                    remembered_mute[current_window] = [];
                if (remembered_mute[current_window].indexOf(list_number) == -1)
                    remembered_mute[current_window].push(list_number);
            } else if (remembered_mute[current_window]) {
                remembered_mute[current_window] = arrayRemove(remembered_mute[current_window], list_number);
            }
        }
        save_remembered();
    }

    function check_overlay_shown() {
        if ($(".pop-over").hasClass("is-shown")) {
            setTimeout(function() {
                check_overlay_shown();
            }, 100);
            return;
        }
        $(".pop-over").removeClass("checklist");
    }

    // from the net
    function arrayRemove(arr, value) { 
        return arr.filter(function(ele){ 
            return ele != value; 
        });
    }
});