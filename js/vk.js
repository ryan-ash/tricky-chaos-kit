$(document).ready(function() {
    var height = 0;
    var newHeight = 0;
    var noProgress = 0;

    createScrollButton();

    $("#l_msg").mousedown(function() {
        console.log("creating scroll button");
        setTimeout(function() {
            createScrollButton();
        }, 1000);
    });

    function createScrollButton() {
        if ($("#page_body .im-chat-input .scroll-button").length)
            return;
        $("#page_body .im-chat-input").append("<div class='scroll-button'></div>");
        $(".scroll-button").click(clickScrollTop);    
    }

    function clickScrollTop() {
        noProgress = 0;
        height = 0;
        scrollTopAndCheck();
    }

    function scrollTopAndCheck() {
        newHeight = $("body").height();
        if (newHeight > height) {
            height = newHeight;
            window.scrollTo(0,0);
            noProgress = 0;
        } else {
            noProgress += 1;
        }

        if (noProgress > 20)
            return;
        setTimeout(scrollTopAndCheck, 100);        
    }
});
