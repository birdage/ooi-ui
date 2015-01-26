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
 * Usage
 *  var arrays = new ArrayCollection();
 *  var tocView = new TOCView({
 *      collection: arrays
 *  })
 */

/*
 * The TOCView acts as a ul tag with .nav .sidebar-nav .navbar-collapse
 * the first child is a search box, which is currently not hooked up to event
 * handling. The other children are the TOCItemView of each model in the
 * collection passed in. The collection is fetched on initialization.
 */
var TimelineView = Backbone.View.extend({
  tagName: 'li',
  className: 'timeline',
  initialize: function() {
    _.bindAll(this, "render", "addItem");
    var self = this;
    this.collection.fetch({success: function(collection, response, options) {
      self.render();
    }});
  },
  template: JST['ooiui/static/js/partials/Timeline.html'],
  addItem: function(view) {
    this.$el.append(view.el);
  },
  render: function() {
    var self = this;
    this.$el.html(this.template());
    /*
    this.collection.each(function(item) { 
      var entryView = new TimelineEntryView({model: item, level: 1});
      self.addItem(itemView);
    });
    */
    for (var i = 0; i < Things.length; i++) {
      var entryView = new TimelineEntryView({model: item, level: 1});
      self.addItem(itemView);
    };
  }
});

var TimelineEntryView = Backbone.View.extend({
  tagName: 'li',
  events: {    
  },
  initialize: function(options) {   
    this.render();
  },
  template: JST['ooiui/static/js/partials/TimelineEntry.html'],
  render: function() {
    this.$el.html(this.template({
      data: this.model.toJSON()
    }));
  }
});


