"use strict";

var StatusUIItemView = Backbone.View.extend({
  tagName: "div",
  className: "platform-tile",

  events: {
    'click button': 'plot'
  },

  initialize: function() {
    var self = this;
    _.bindAll(this, "render");
    this.render();
  },
    
  template: JST['ooiui/static/js/partials/StatusUIItem.html'],

  render: function() {
    var self = this;
    this.$el.html(this.template({model:this.model}));
  },

  plot: function(button) {
    if(button.target.id=='plot_status'||button.target.className.search('chart')>-1){

      var ref_array = this.model.attributes.ref_des.split('-');
      var plot_url = '/plotting/'+this.model.attributes.ref_des.substring(0, 2)+'/'+ref_array[0]+'/'+this.model.attributes.ref_des;

      //plotting/CP/CP05MOAS/GL001/CP05MOAS-GL001-05-PARADM000
      window.open(plot_url,'_blank');
    }
  }

});

