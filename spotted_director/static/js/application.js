$(function(){

    var container = $('#application-container');


    var AppRouter = Backbone.Router.extend({

        routes: {
            "":                 "index",    // #help
            "help":                 "help",    // #help
            "search/:query":        "search",  // #search/kiwis
            "search/:query/p:page": "search"   // #search/kiwis/p7
        },

        index: function() {
            container.html('Hello, index');
        },

        help: function() {
            container.html('Help');
        },

        search: function(query, page) {
            container.html('Search ' + query);
        }

    });


    var HomeView = Backbone.View.extend({

        initialize:function () {
        },

        events:{
            "click #showMeBtn":"showMeBtnClick"
        },

        render:function () {
            $(this.el).html(this.template());
            return this;
        },

        showMeBtnClick:function () {
            app.headerView.search();
        }

    });



    var Application = function() {
        var self = this;
        self.router = new AppRouter();

        $('body').on('click', 'a', function(e){
            var href = $(this).attr('href');
            if (href[0] == '#') {
                var new_href = href.slice(1);
                e.preventDefault();
                self.navigate(new_href);
            }
        });

/*        $('a').on('click', function(){
            var href = $(this).attr('href');
            if (href[0] == '#') {
                href = href.slice(1);
                self.router.navigate(href, {trigger: true});
            }
            else if (href == '/') {
                self.router.navigate(href, {trigger: true});
            }
        });*/
        Backbone.history.start({pushState: true});
    };


    Application.prototype = {
        navigate: function(destination) {
            this.router.navigate(destination, {"trigger": true});
            this.updateActiveLinks();
        },
        updateActiveLinks: function() {
            var frag = Backbone.history.fragment;
            $('.nav > li > a').each(function(){
                var $this = $(this),
                    $parent = $($this.parent());
                if ($this.attr('href') == '#' + frag) {
                    $parent.addClass('active');
                }
                else {
                    $parent.removeClass('active');
                }
            });
        }
    };

    window.app = new Application();
    app.updateActiveLinks();

});
