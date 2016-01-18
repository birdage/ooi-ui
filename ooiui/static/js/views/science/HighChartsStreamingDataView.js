"use strict";
/*
 * ooiui/static/js/views/science/HighChartsStreamingDataView.js
 */

var HighchartsStreamingContainerView = Backbone.View.extend({
    subviews : [],
    initialize: function(options) {
        _.bindAll(this, "render", "add","remove");
        this.render();
    },
    render: function() {
        this.$el.html("<div class='streaming-plot-container-header'><div class='streaming-plot-container-contents'></div></div>");
    },
    add: function(streamModel) {
        var self = this;

        if (self.subviews.length >= 5){
            return false;
        }

        var refExists = false;
        var streamPlotAdded = false;
        _.each(self.subviews,function(currentView){
            var currntRef = currentView.model.get('reference_designator');
            var currntStrm = currentView.model.get('stream_name');

            if (currntRef == streamModel.get('reference_designator') && currntStrm == streamModel.get('stream_name') ){
                //check to see if the reference designator already exists
                refExists= true;
            }
        });

        if (!refExists){
            var subview = new HighchartsStreamingDataOptionsView({
              model: streamModel,
            });

            subview.render();
            this.subviews.push(subview);
            this.$el.find('.streaming-plot-container-contents').append(subview.el);
            streamPlotAdded = true;
        }
        return streamPlotAdded
    },
    remove: function(streamModel) {
        var self = this;
        var streamPlotRemoved = false;
        _.each(self.subviews,function(currentView,i){
            var currntRef = currentView.model.get('reference_designator');
            var currntStrm = currentView.model.get('stream_name');

            if (currntRef == streamModel.get('reference_designator') && currntStrm == streamModel.get('stream_name')){
                //check to see if the reference designator already exists
                if (i > -1) {
                    //de render and remove for the list
                    currentView.derender();
                    self.subviews.splice(i, 1);
                    streamPlotRemoved= true;
                }

            }
        });
        return streamPlotRemoved;
    },
});

var HighchartsStreamingDataOptionsView = Backbone.View.extend({
    initialize: function(options) {
        if (options && options.model){
            this.model = options.model;
        }
        _.bindAll(this,'render','onPlayClick','onRemoveClick','onPauseClick');
    },
    events:{
        'click #removePanel': 'onRemoveClick',
        'click #playStream': 'onPlayClick',
        'click #pauseStream': 'onPauseClick',
    },
    onRemoveClick:function(){
      //NOT IMPLEMENTED
    },
    onPlayClick:function(){
      var self = this;
      this.$el.find('#playStream').prop('disabled', true);
      if (self.streamingDataView.isRendered){
        self.streamingDataView.chart.showLoading();
        self.streamingDataView.chart.isLoading=true;
        self.streamingDataView.updateVariable(self.getVariableList());
        self.streamingDataView.resume();
      }else{
        self.streamingDataView.updateVariable(self.getVariableList());
        self.streamingDataView.render();
      }
      this.$el.find('#pauseStream').prop('disabled', false);
      this.$el.find('#paramSelection').attr('disabled',true);
      this.$el.find('.selectpicker').selectpicker('refresh');
    },
    onPauseClick:function(){
      var self = this
      this.$el.find('#pauseStream').prop('disabled', true);
      self.streamingDataView.abort();
      this.$el.find('#playStream').prop('disabled', false);
      this.$el.find('#paramSelection').attr('disabled',false);
      this.$el.find('.selectpicker').selectpicker('refresh');
    },
    template: JST['ooiui/static/js/partials/HighChartsStreamingDataOptionsView.html'],
    initialRender: function() {
        this.$el.html('<i class="fa fa-spinner fa-spin" style="margin-top:80px;margin-left:50%;font-size:90px;"> </i>');
        return this;
    },
    getVariableList:function(){
      var self = this;
      var selectedItem =  self.$el.find("#paramSelection option:selected");
      var selected = [];
      $(selectedItem).each(function(index){
        selected.push($(this).data('params'));
      });
      return selected;
    },
    render: function() {
        var self = this;

        this.$el.html(this.template({streamModel:self.model}));

        var param_list = [],
        parameterhtml = "",
        shape = self.model.get('variables_shape'),
        autoPlot = false;

        parameterhtml += "<optgroup label='Derived'>"
        for (var i = 0; i < _.uniq(self.model.get('variables')).length; i++) {
          if (param_list.indexOf(self.model.get('variables')) == -1){
            if (shape[i] === "function"){
              var parameterId = self.model.get('parameter_id')[i];
              var units = self.model.get('units')[i];
              var variable = self.model.get('variables')[i];
              var displayName;

              try{
                displayName = self.model.get('parameter_display_name')[i];
              } catch(err){
                displayName = variable;
              }

              //for the case when we have "sal"inity in the variable nanem but we want to remove units of "1"
              var validUnits = false;
              var validUnitsClass = "class=invalidParam"
              if (units.toLowerCase() != "s" && units.toLowerCase() != "1" && units.toLowerCase() != "counts" && units.toLowerCase().indexOf("seconds since") == -1 && units.toLowerCase() != "bytes"){
                validUnits = true
              }
              if (variable.toLowerCase().indexOf("sal") > -1){
                validUnits = true;
              }

              if (validUnits){
                validUnitsClass = 'class=validParam'
              }

              if (variable.indexOf("_timestamp") == -1){
                if (variable.toLowerCase() != "time"){
                    if ( validUnits &&   (variable.indexOf('oxygen') > -1 ||
                            variable.indexOf('temperature') > -1 ||
                            variable.indexOf('velocity') > -1 ||
                            variable.indexOf('conductivity') > -1 ||
                            variable.indexOf('current') > -1 ||
                            variable.indexOf('voltage') > -1 ||
                            variable.indexOf('pressure') > -1 ||
                            variable.indexOf('ang_rate') > -1 ||
                            variable.indexOf('coefficient') > -1 ||
                            variable.indexOf('chlorophyll') > -1 ||
                            variable.indexOf('par') > -1 ||
                            variable.indexOf('heat') > -1
                      )){
                        parameterhtml+= "<option "+validUnitsClass+" selected pid='"+ parameterId +"'data-params='" + variable + "' data-subtext='"+ units +"' >"+ displayName +"</option>";
                    } else {

                        parameterhtml+= "<option "+validUnitsClass+" pid='"+ parameterId +"'data-params='" + variable + "' data-subtext='"+ units +"' >"+ displayName +"</option>";
                    }

                    param_list.push(variable);
                }
              }
            }

          }
        }
        parameterhtml += "</optgroup>"
        //Now get non derived parameters
        parameterhtml += "<optgroup label='Non Derived'>"
        for (var i = 0; i < _.uniq(self.model.get('variables')).length; i++) {
          if (param_list.indexOf(self.model.get('variables')) == -1){
            if (shape[i] != "function"){
              var parameterId = self.model.get('parameter_id')[i];
              var units = self.model.get('units')[i];
              var variable = self.model.get('variables')[i];
              var displayName;
              try{
                displayName = self.model.get('parameter_display_name')[i];
              } catch(err){
                displayName = variable;
              }

              //for the case when we have "sal"inity in the variable nanem but we want to remove units of "1"
              var validUnits = false;
              var validUnitsClass = "class=invalidParam";
              if (units.toLowerCase() != "s" && units.toLowerCase() != "1" && units.toLowerCase() != "counts" && units.toLowerCase().indexOf("seconds since") == -1 && units.toLowerCase() != "bytes"){
                validUnits = true
              }
              if (variable.toLowerCase().indexOf("sal") > -1){
                validUnits = true;
              }

              if (validUnits){
                validUnitsClass = 'class=validParam'
              }

              if (variable.toLowerCase() != "time"){
                  if (   ( parameterhtml.indexOf("<optgroup label='Derived'></optgroup>") > -1 ) && validUnits &&
                          (variable.indexOf('oxygen') > -1 ||
                          variable.indexOf('temperature') > -1 ||
                          variable.indexOf('velocity') > -1 ||
                          variable.indexOf('conductivity') > -1 ||
                          variable.indexOf('current') > -1 ||
                          variable.indexOf('voltage') > -1 ||
                          variable.indexOf('pressure') > -1 ||
                          variable.indexOf('ang_rate') > -1 ||
                          variable.indexOf('coefficient') > -1 ||
                          variable.indexOf('chlorophyll') > -1 ||
                          variable.indexOf('par') > -1)
                    ) {
                      parameterhtml+= "<option "+validUnitsClass+" selected pid='"+ parameterId +"'data-params='" + variable + "' data-subtext='"+ units +"' >"+ displayName +"</option>";
                  } else {
                      parameterhtml+= "<option "+validUnitsClass+" pid='"+ parameterId +"'data-params='" + variable + "' data-subtext='"+ units +"' >"+ displayName +"</option>";
                  }
                param_list.push(variable);
              }
            }
          }
        }
        parameterhtml += "</optgroup>"


        self.$el.find('#paramSelection').html(parameterhtml)
        self.$el.find('#paramSelection .invalidParam').attr('disabled','disabled');
        self.$el.find('#paramSelection').selectpicker('refresh');

        this.streamingDataView = new HighchartsStreamingDataView({
            model: self.model,
            el: self.$el.find('#streamingDataPlot'),
            variable: self.getVariableList()
        });


        this.$el.find('#playStream').click();
        setTimeout(function (){
          $(document).resize()
        }, 100);

    },
    derender: function() {
        this.streamingDataView.abort();
        this.streamingDataView.remove();
        this.streamingDataView.unbind();
        this.streamingDataView.chart = null;
        this.streamingDataView.$el.remove();
        this.streamingDataView = null;

        this.remove();
        this.unbind();
        if (this.model)
            this.model.off();
    }
});


var HighchartsStreamingDataView = Backbone.View.extend({
  multiRequest: true,
  isRendered:false,
  initialize: function(options) {
    this.title = options && options.title || "Chart";
    this.title_style = options && options.title_style || {
    };
    this.subtitle = options && options.subtitle || "";

    _.bindAll(this, "onClick",'requestData','abort','updateDateTimes','getUrl','updateVariable','resume');

    var dt = moment();
    var dt2Str = dt.format("YYYY-MM-DDTHH:mm:ss.000")+"Z"
    var dt1Str = dt.subtract(10, 'seconds').format("YYYY-MM-DDTHH:mm:ss.000")+"Z"
    self.variable = options.variable;
    this.ds = new DataSeriesCollection([],{'stream':this.model.get('stream_name'),'ref_des':this.model.get('ref_des'), 'xparameters':['time'],'yparameters':self.variable, 'startdate':dt1Str,'enddate':dt2Str});
  },
  updateVariable:function(variable){
    var self = this;
    self.variable = variable;
    self.ds.yparameters = [variable];
    self.resetAxis = true;
  },
  updateDateTimes:function(){
    var self = this;
    //update datetime using new moment dates
    var dt = moment();
    var dt2Str = dt.format("YYYY-MM-DDTHH:mm:ss.000")+"Z"
    var dt1Str = dt.subtract(10, 'seconds').format("YYYY-MM-DDTHH:mm:ss.000")+"Z"
    this.ds.startdate = dt1Str;
    this.ds.enddate = dt2Str;
  },
  onClick: function(e, point) {
    //this.trigger('onClick', e, point);
  },
  abort:function(){
    //kill the request, if its availble
    this.multiRequest = false;
    try{
      this.xhr.onreadystatechange = null;
      this.xhr.abort()
    }catch(e){

    }

  },
  resume:function(){
    //kill the request
    this.multiRequest = true;
    this.requestData();
  },
  getUrl:function(){
    var self = this;
    self.updateDateTimes();
    return this.ds.url();
  },
  requestData: function() {
    var self = this;
    self.xhr = $.ajax({
        url: self.getUrl(),
        cache: false,
        success: function(points) {
            console.log(points)
            if (self.multiRequest){
              if (self.isLoading){
                self.chart.hideLoading();
              }
              var point = null;

              if (self.resetAxis){
                for (var i = 0; i < 4; i++) {
                  var series = self.chart.series[i];
                  self.chart.yAxis[i].update({
                    labels: {enabled: false},
                    title: {text: null}
                  });
                  self.chart.series[i].setData([]);
                  self.chart.series[i].hide();
                  self.chart.series[i].options.showInLegend = false;
                  self.chart.series[i].legendItem = null;
                  self.chart.legend.destroyItem(self.chart.series[i]);
                }
              }
              self.chart.legend.render();

              _.each(self.variable,function(data_variable,vv){
                var series = self.chart.series[vv],
                  shift = series.data.length > 200;
                if (self.resetAxis){
                  //reset the axis and some of the contents
                  series.name = data_variable;
                  //self.chart.legend.allItems[vv].update({name:series.name});
                  series.options.showInLegend = true;
                  self.chart.yAxis[vv].update({
                    labels: {enabled: true},
                    title: {text:points['units'][self.variable[vv]]}
                  });
                  self.chart.series[vv].show();
                  self.chart.redraw();

                  self.chart.legend.renderItem(series);
                  self.chart.legend.render();
                }

                for (var i = 0; i < points['data'].length; i++) {
                    var x = points['data'][i]['time'];
                    var y = points['data'][i][self.variable[vv]];
                    x -= 2208988800;
                    x *= 1000
                    point = [x,y]

                    if (i < points['data'].length-1){
                        self.chart.series[vv].addPoint(point, false, shift);
                    }else{
                        self.chart.series[vv].addPoint(point, true, shift);
                    }
                }
              });

              if (self.resetAxis){
                self.chart.redraw();
                self.resetAxis = false;
              }


              if (self.multiRequest){
                  // call it again after (X) seconds
                  setTimeout(self.requestData, 2000);
              }
            }
        },
        cache: false
    });
  },
  render: function() {
    var self = this;
    self.isRendered = true;
    self.resetAxis = true;
    self.isLoading = true;

    var yAxisList = [];
    var seriesList = [];
    for (var i = 0; i < 4; i++) {
      var op = !((i+1) % 2);
      var gridWidth = 1;
      if (i>0){
        gridWidth = 0;
      }
      yAxisList.push({
        gridLineWidth:gridWidth,
        labels: {
          format: '{value:.2f}',
          style: {
              color: Highcharts.getOptions().colors[i]
          }
        },
        minPadding: 0.2,
        maxPadding: 0.2,
        title: {
            text: null,
            margin: 80,
            style: {
                  color: Highcharts.getOptions().colors[i]
            }
        },
        opposite: op
      })

      seriesList.push({
        yAxis: i,
        name: "unknown",
        data: []
      });
    }

    self.chart = new Highcharts.Chart({
        chart: {
            renderTo: self.el,
            defaultSeriesType: 'line',
            events: {
                load: self.requestData
            }
        },
        credits: {
          enabled: false
        },
        loading: {
            labelStyle: {
                //color: 'black'
            },
            style: {
                //backgroundColor: 'lightblue',
                //opacity: 0.4,
            },
            hideDuration: 500,
            showDuration: 1000,
        },
        title: {
            text: self.model.get('display_name')
        },
        xAxis: [{
            type: 'datetime',
            tickPixelInterval: 150,
            maxZoom: 20 * 1000,
            title: {
              text: 'Date (UTC)'
            }
        }],
        tooltip: {
            shared: true
        },
        yAxis: yAxisList,
        series: seriesList
    });
    self.chart.showLoading();
  }
});