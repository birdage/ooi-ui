"use strict";
/*
 * ooiui/static/js/views/common/TOCView.js
 * View definitions to build the table of contents
 *
 * Dependencies
 * Libs
 * - ooiui/static/lib/underscore/underscore.js
 * - ooiui/static/lib/backbone/backbone.js
 * - ooiui/static/js/ooi.js
 */


var TOCView = Backbone.View.extend({
    id: 'assetBrowser',
    events: {
        'keyup #search-filter' : 'filterToc'
    },
    initialize: function(options){
        _.bindAll(this, "render", "derender", "renderArrays", "renderItems");
        this.initalRender();

        this.arrayCollection = options.arrayCollection;
        this.assetCollection = options.assetCollection;
        this.listenTo(vent, 'toc:derenderItems', function() {
            this.derender();
        });

    },
    initalRender: function(){
        this.$el.html('<i class="fa fa-spinner fa-spin" style="margin-top:15%;margin-left:50%;font-size:90px;"> </i>');
    },
    getArrayCode: function(model){
        var array_code = model.get('mooring_code').substr(0,2)
        return array_code
    },
    template: JST['ooiui/static/js/partials/TOC.html'],
    renderArrays: function(){
        var arrayContainerView = this.arrayCollection.map(function(model) {
            return (new ArrayContainerView({ model:model })).render().el;
        });
        this.$el.find('#array-accordion').append(arrayContainerView);
    },
    renderItems: function(){
        // create a model for each item in the collection, and based on it's class,
        // render it in the browser as a platform or instrument.
        this.assetCollection.map(function(model) {
            // only render assets that have a lat/lon (since it's a map).
            var coord = model.get('coordinates');
            var assetClass = model.get('asset_class');
            if (coord) {

                // get the array code from the reference designator
                var arrayCode = model.get('ref_des').substr(0,2);
                // get the platform code as well.
                var platformCode = model.get('ref_des').substr(0,14);

                // set the target to where this item will be inserted.
                var arrayTarget = '#array_'+ arrayCode +'_body';
                var platformTarget = 'li#'+platformCode+' > div > ul';
                console.log(platformTarget);
                var assetItemView = new AssetItemView({ model:model });

                // lets check to see if it's a platform (.AssetRecord) or an (.instrumentAssetRecord)
                if (assetClass == '.AssetRecord') {
                    // workout the number of each asset...
                    var contentNum = parseInt($('#array_'+ arrayCode +'_badge').text());
                    $('#array_'+ arrayCode +'_badge').text(contentNum+1);
                    $( arrayTarget ).append( assetItemView.render().el );

                } else if (assetClass == '.InstrumentAssetRecord')  {
                    $( platformTarget ).append( assetItemView.render().el );
                }
            }
        });
    },
    render: function(){
                this.$el.html(this.template());
                this.renderArrays();
                this.$el.find('[data-toggle="tooltip"]').tooltip();

                return this;
    },
    derender: function() {
        this.remove();
        this.unbind();
    },
});

var SearchResultView = Backbone.View.extend({
    tagName: 'ul',
    initialize: function() {
        _.bindAll(this, 'render', 'derender');
        this.listenTo(vent, 'toc:derenderItems', function() {
            this.derender();
        });
    },
    render: function(){
        var assetItemView = this.collection.map(function(model) {
            var coord = model.get('coordinates');
            if (coord) {
                return(new AssetItemView({ model:model }).render().el);
            }
        });
        this.$el.html(assetItemView);
        return this;
    },
    derender: function() {
        this.remove();
        this.unbind();
    },
});

var ArrayContainerView = Backbone.View.extend({
    events:{
        'click h4' : 'onClick',
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'onClick');
        this.listenTo(vent, 'toc:derenderItems', function() {
            this.derender();
        });
    },
    onClick: function(e) {
                 ooi.trigger('toc:selectArray', this.model);
             },
    template: JST['ooiui/static/js/partials/ArrayItem.html'],
    render: function(){
        this.$el.html( this.template(this.model.toJSON()) );
        return this;
    },
    derender: function() {
        this.remove();
        this.unbind();
        this.model.off;
    },
})

var AssetItemView = Backbone.View.extend({
    //TODO: Create a partial and put all the html/css in it...
    tagName: 'li',
    className: 'col-md-12 btn btn-sm',
    attributes: function() {
        return {
        'style': 'text-align: left !important; overflow: hidden; white-space: normal;'
        };
    },
    events: {
        'click': 'onClick'
    },
    initialize: function(options) {
        _.bindAll(this,'render', 'onClick');
        this.listenTo(vent, 'toc:derenderItems', function() {
            this.derender();
        });
    },
    onClick: function() {
         ooi.trigger('toc:selectItem', this.model);
    },
    template: _.template('<a href="#"><%= assetId %> | <%= assetInfo.name %> <br> <%= ref_des %></a>'),
    derender: function() {
        this.remove();
        this.unbind();
        this.model.off;
    },
    render: function() {

        // If the asset class is an AssetRecord, give the view an ID of the
        // first 8 characters of the Reference Designator
        if (this.model.get('asset_class') == '.AssetRecord') {
            this.$el.attr('id', this.model.get('ref_des').substr(0,14));
            this.$el.html( this.template(this.model.toJSON()) );
            // since this is an AssetRecord (platform / glider) lets assume
            // it'll need to have instruments attached to it...so create a container!
            this.$el.append('<div id="'+ this.model.get('id') +'" class="collapse"><ul class="sidebar-nav"></ul></div>');
            // since there will be a lot of instrumnets, lets set this view to collapse.
            this.$('a').attr('data-toggle', 'collapse');
            this.$('a').attr('data-target', '#'+this.model.get('id'));
        // otherwise, if it's an InstrumentAssetRecord then give the view an ID
        // of the entire Reference Designator
        } else if(this.model.get('asset_class') == '.InstrumentAssetRecord') {
            this.$el.attr('id', this.model.get('ref_des'));
            // since the instrument is to be attached to something, lets
            // change the indent and display slightly.
            this.$el.html( this.template(this.model.toJSON()) );
        }
        return this;
    }
});
//--------------------------------------------------------------------------------
//  NestedItemView
//--------------------------------------------------------------------------------

var NestedTocItemView = Backbone.View.extend({
  display_name:"",
  sub_id: "",
  level:1,
  key:"",
  events:{
    'click a' : 'onClick',
  },
  stream_list:[],
  variable_list:[],
  initialize: function(options) {
    var self = this;
    if(options && options.level && options.key) {
      self.level = options.level;
      self.key = options.key;
    }
    if(options && options.display_name) {
      self.display_name = options.display_name;
    }
    if(options && options.sub_id) {
      self.sub_id = options.sub_id;
    }
    if(options && options.stream_list) {
      self.stream_list = options.stream_list;
    }
    if(options && options.variable_list) {
      self.variable_list = options.variable_list;
    }

  },
  template: JST['ooiui/static/js/partials/NestedTocItem.html'],
  onClick: function(e) {
    e.stopPropagation();
    this.toggle(e);
    if(this.level == 1){
      ooi.trigger('platformDeploymentItemView:platformSelect', this.model);
    }
    else if(this.level ==2){
      ooi.trigger('InstrumentItemView:instrumentSelect', this.model);
    }
    else if(this.level ==3){
      console.log(this.model);
    }
  },
  toggle: function(e) {
    var self = this

    var current = this.$el.find("ul a #"+(self.level)+"_icon")
    this.$el.find('#'+self.sub_id).collapse('toggle')

    if (current.hasClass("fa-rotate-90")){
        current.removeClass("fa-rotate-90");
        //this.$el.find("ul ."+(self.level+1)+"_item_content").removeClass("in")
    }
    else{
        current.addClass("fa-rotate-90");
        //this.$el.find("ul ."+(self.level+1)+"_item_content").addClass("in")
    }

    if (self.level ==3 ){
      self.instrumentSelect();
    }

  },
  instrumentSelect: function(){
    ooi.trigger('InstrumentItemView:instrumentSelect', this.model);
  },
    filterToc: function(){
        var self = this
    },
  render: function(){
    var self = this;
    var plottingLink = ""
    if(this.level == 3) {
      var mooring = self.model.get('mooring_code')
      var array = mooring.substr(0,2)
      var platform = self.model.get('platform_code')
      var ref = self.model.get('reference_designator')
      plottingLink = array+"/"+mooring+"/"+platform+"/"+ref
      var plottingLink = window.location.protocol + '//' + window.location.host+"/plotting/"+plottingLink
    }

    self.$el.html(self.template({plottingLink:plottingLink,display_name: self.display_name,sub_id : self.sub_id, key:self.key ,level: self.level}));

    if(this.level == 1) {
      self.$el.toggleClass('sidebar-nav-first-level');
      //this.$el.collapse('show');
    } else if(this.level == 2) {
      self.$el.toggleClass('sidebar-nav-second-level');
      //self.$el.find(self.key+"_item_content").addClass("collapse")
    } else if(this.level == 3) {
      self.$el.toggleClass('sidebar-nav-third-level');
      self.$el.find(self.key+"_item_content").addClass("collapse")
      //add popover
    }
  }
});
