$(function(){

    var container = $('#application-container');


    // === Utilities ===========================================================

    var Template = function(name) {
        return Handlebars.compile($("#template-" + name).html());
    };

    var fetchModel = function(model, id, options) {
        return new model({id: id}).fetch(options);
    };

    var updateActiveLinks = function(container, fragment) {
        if (!fragment) {
            fragment = Backbone.history.fragment;
        }
        if (!container) {
            container = $(document.body);
        }
        $(container).find('.nav > li > a').each(function(){
            var $this = $(this),
                $parent = $($this.parent());
            if ($this.attr('href') == '#' + fragment) {
                $parent.addClass('active');
            }
            else {
                $parent.removeClass('active');
            }
        });
    };


    // === Models ==============================================================

    /**
     * Screen server model
     */
    var ScreenServerModel = Backbone.Model.extend({
        urlRoot: '/api/server',
        defaults: {
            id: null,
            url: null
        },
        initialize: function(){
            this.messages = new ScreenMessageCollection();
            this.messages.parent = this;
        },
        getServerInfo: function(options) {
            var url = this.urlRoot + '/' + this.get('id') + '/status';
            $.ajax({
                url: url,
                dataType:"json",
                success: options.success,
                error: options.error
            });
        }
    });

    /**
     * Message on a screen server
     */
    var ScreenMessageModel = Backbone.Model.extend({
        defaults: {
            id: null,
            server: null, // Must be a valid ScreenServerModel id
            text: "",
            color: null
        }
    });

    /**
     * Message in the queue
     */
    var QueuedMessageModel = Backbone.Model.extend({
        urlRoot: '/api/queue',
        default: {
            // ... something ...
            id: null,
            text: "",
            color: null
        }
    });


    // === Collections =========================================================

    /**
     * Collection to manage screen servers
     * @type {*}
     */
    var ScreenServersCollection = Backbone.Collection.extend({
        model: ScreenServerModel,
        url: '/api/server'
    });

    /**
     * Sub-collection of the screen message model
     */
    var ScreenMessageCollection = Backbone.Collection.extend({
        model: ScreenMessageModel,
        url: function(){
            return '/api/server/' + this.parent.get('id') + '/message';
        }
    });

    /**
     * Collection to manage queued messages
     */
    var QueueCollection = Backbone.Collection.extend({
        model: QueuedMessageModel,
        url: '/api/queue'
    });


    // === Router ==============================================================

    var AppRouter = Backbone.Router.extend({
        app: null, // reference to application

        routes: {
            "": "server_list",
            "server/:server_id": "server_info",
            "server/:server_id/messages": "server_messages",
            "server/:server_id/queue": "server_queue",
            "server/:server_id/archive": "server_archive",
            "*path": "notFound"   // Handler for "404"
        },

        server_list: function() {
            this.app.selectView('server_list');
        },

        server_info: function(server_id) {
            fetchModel(ScreenServerModel, server_id, {
                success: function(model){
                    this.app
                        .selectView('server', {model: model})
                        .selectView('info');
                },
                error: function(){
                    this.app.selectView(
                        'error', {message: "Unable to fetch model"});
                }
            });
        },

        server_messages: function(server_id) {
            fetchModel(ScreenServerModel, server_id, {
                success:function(model){
                    this.app
                        .selectView('server', {model: model})
                        .selectView('messages');
                },
                error: function(){
                    this.app.selectView(
                        'error', {message: "Unable to fetch model"});
                }
            });
        },

        server_queue: function(server_id) {
            fetchModel(ScreenServerModel, server_id, {
                success:function(model){
                    this.app
                        .selectView('server', {model: model})
                        .selectView('queue');
                },
                error: function(){
                    this.app.selectView(
                        'error', {message: "Unable to fetch model"});
                }
            });
        },

        server_archive: function(server_id) {
            fetchModel(ScreenServerModel, server_id, {
                success:function(model){
                    this.app
                        .selectView('server', {model: model})
                        .selectView('archive');
                },
                error: function(){
                    this.app.selectView(
                        'error', {message: "Unable to fetch model"});
                }
            });
        },

        notFound: function(path) {
            container.html(Template('not-found')({path: path}));
        }

    });


    // === Views ===============================================================

    /**
     * View switcher
     * @param parent
     * @param container
     * @param views
     * @constructor
     */
    var ViewSwitcher = function(parent, container, views) {
        this.parent = parent;
        this.container = container;
        this.subviews = views;
        this.subview = null;
        this.cached_views = {};
    };
    /**
     * Switch the current view
     * @param name
     * @param args
     */
    ViewSwitcher.prototype.selectView = function(name, args) {
        if (!args) {
            // This works only for views without arguments
            var cached_view;
            if (cached_view = this.cached_views[name]) {
                this.subview = cached_view;
                this.subview.parent = this.parent;
                this.subview.render();
                this.container.html(this.subview.el);
                return this.subview;
            }
        }

        this.subview = new this.subviews[name](args);

        if (!args) {
            this.cached_views[name] = this.subview;
        }

        this.subview.parent = this.parent;
        this.subview.render();
        this.container.html(this.subview.el);
        return this.subview;
    };

    /**
     * Display an error message
     */
    var ErrorView = Backbone.View.extend({
        render: function() {
            var template = Template('error-message'),
                message = this.options['message'];
            this.$el.html(template({message:message}));
        }
    });

    /**
     * Main index: list of all the servers
     */
    var ServerListView = Backbone.View.extend({
        render: function () {
            var view = this;
            view.$el.html('Loading...');
            view.parent.collections.screen_servers.fetch({
                success: function(collection, response, options) {
                    var template = Template('server-list');
                    view.$el.html(template({servers: response}));
                },
                error: function() {
                    view.parent.selectView(
                        'error', {message: "Error fetching servers list."});
                }
            });
            return this;
        }
    });

    /**
     * Base for the "Screen" views
     * @param model: The associated model (required!)
     */
    var ScreenServerBaseView = Backbone.View.extend({
        initialize: function() {
            var self = this;
            this.switcher_el = $('<div>');
            this.switcher = new ViewSwitcher(self, this.switcher_el, {
                info: ScreenServerInfoView,
                messages: ScreenServerMessagesView,
                queue: null,
                archive: null,
                error: ErrorView
            });
        },
        selectView: function(name, args) {
            args = args || {};
            args.model = this.model;
            return this.switcher.selectView(name, args);
        },
        render: function() {
            var template_h = Template('server-page-header'),
                json_model = this.model.toJSON();
            this.$el
                .html(template_h({server: json_model}))
                .append(this.switcher_el);
            updateActiveLinks(this.$el);
        }
    });

    /**
     * Information about the server.
     */
    var ScreenServerInfoView = Backbone.View.extend({
        render: function() {
            var view = this;
            view.$el.html('Loading...');

            var json_model = this.model.toJSON();
            var template = Template('server-dashboard');

            this.model.getServerInfo({
                success:function(data){
                    view.$el.html(template({
                        server: json_model,
                        info: data
                    }));
                },
                error: function(){
                    view.parent.selectView('error', {message:'Unable to load server info.'})
                }
            });
        }
    });

    /**
     * List of messages currently displayed on the server.
     * @type {*}
     */
    var ScreenServerMessagesView = Backbone.View.extend({
        render: function() {
            var view = this;
            view.$el.html('Loading...');
            this.model.messages.fetch({
                success: function(collection, response, options) {

                    var messages = [], json_message;
                    collection.forEach(function(message){
                        json_message = message.toJSON();
                        json_message.html_color = json_message.color.slice(0, -2); // Remove alpha
                        var shown_at = new Date(json_message._shown_at * 1000);
                        json_message.shown_at_time = shown_at.toTimeString().split(' ')[0];
                        json_message.shown_at = shown_at;

                        json_message.shown_time = Math.round(json_message._shown_time);
                        json_message.max_show_time = Math.round(json_message._max_show_time);

                        messages.push(json_message);
                    });

                    var template = Template('server-messages');
                    view.$el.html(template({messages:messages}));

                },
                error: function(){
                    view.parent.selectView('error', {message:'Unable to load messages.'});
                    //view.parent.parent.updateActiveLinks();
                }
            });

        }
    });


    // === Application =========================================================

    var Application = function(container) {
        var self = this;
        self.container = container;

        self.switcher = new ViewSwitcher(self, self.container, {
            server_list: ServerListView,
            server: ScreenServerBaseView,
            error: ErrorView
        });

        self.collections = {
            screen_servers: new ScreenServersCollection()
        };

        self.router = new AppRouter();
        self.router.app = self; // Need to reference..

        // Handle internal links..
        $('body').on('click', 'a', function(e){
            var href = $(this).attr('href');
            if (href[0] == '#') {
                var new_href = href.slice(1);
                e.preventDefault();
                self.navigate(new_href);
            }
        });

        Backbone.history.start({pushState: true});
    };


    Application.prototype = {

        navigate: function(destination) {
            var self=this;
            this.router.navigate(destination, {"trigger": true});
            self.updateActiveLinks();
        },

        updateActiveLinks: function() {
            /*var frag = Backbone.history.fragment;
            $('.nav > li > a').each(function(){
                var $this = $(this),
                    $parent = $($this.parent());
                if ($this.attr('href') == '#' + frag) {
                    $parent.addClass('active');
                }
                else {
                    $parent.removeClass('active');
                }
            });*/
            updateActiveLinks();
        },

        selectView: function(view_name, args) {
            return this.switcher.selectView(view_name, args);
        }
    };

    window.app = new Application(container);
    app.updateActiveLinks();

});
