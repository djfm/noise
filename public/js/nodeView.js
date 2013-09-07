var nodeView = function(options)
{
  var x=10;
  var y=10;
  var w=100;
  var h=50;

  this.anchorHoverColor    = 'orange';
  this.anchorDefaultColor  = 'black';
  this.anchorClickedColor  = 'blue';

  this.backgroundColor     = 'green';

  var caption = options.model.node_type;

  if(options.model.node_type == 'output')
  {
    this.backgroundColor = 'red';
  }
  else if(options.model.node_type == 'gain')
  {
    this.backgroundColor = 'yellow';
  }
  else if(options.model.node_type == 'delay')
  {
    this.backgroundColor = 'purple';
  }
  else if(options.model.node_type == 'envelope')
  {
    this.backgroundColor = 'orange';
  }
  else if(options.model.node_type == 'filter')
  {
    this.backgroundColor = 'pink';
  }

  this.inputs  = {};
  this.outputs = {};

  var rect = new Kinetic.Rect({
    x: x,
    y: y,
    width: w,
    height: h,
    fill: this.backgroundColor,
    stroke: 'black',
    strokeWidth: 3
  });

  var text = new Kinetic.Text({
    text: caption,
    fontSize: 15,
    fill: 'black'
  });

  text.setPosition(x + (w - text.getWidth())/2, y + (h - text.getHeight())/2);

  var group = new Kinetic.Group({
    draggable: true
  });

  group.add(rect);
  group.add(text);

  var my            = this;

  this.anchors = {};

  var anchor_number = 0;

  for(var i=0; i<=1; i+=0.5)
  {
    for(var j=0; j<=1; j+=0.5)
    {
      if(i!=0.5 || j!=0.5)
      {
        var circle = new Kinetic.Circle({
          x:  x+i*w,
          y:  y+j*h,
          radius: 5,
          fill: this.anchorDefaultColor
        });

        circle.anchor_id = anchor_number;
        my.anchors[anchor_number] = circle;
        anchor_number += 1;

        circle.on('mouseover', function(){

          if(this == options.global_state.focusedAnchor)return;

          this.setFill(my.anchorHoverColor);
          options.layer.draw();
          if(this.connection)
          {
            options.scope.infoText = "Click to disconnect the node!";
          }
          else
          {
            options.scope.infoText = "Click on the handle to connect the node with another!";
          }
          options.scope.$apply();
        });

        circle.on('mouseout', function(){

          if(this == options.global_state.focusedAnchor)return;

          this.setFill(my.anchorDefaultColor);
          options.layer.draw();
          options.scope.infoText = "";
          options.scope.$apply();
        });

        circle.on('click', function(){

          if(this.connection)
          {
            options.controller.disconnect({
              fromId: this.connection.from.model.id,
              toId: this.connection.to.model.id
            });
          }
          else if(options.global_state.selectedSource != null && options.global_state.selectedSource != options.model.id)
          {
            options.scope.infoText = "Connected node!";

            options.controller.connect({
              fromId:     options.global_state.selectedSource,
              toId:       options.model.id,
              fromAnchor: options.global_state.focusedAnchor,
              toAnchor:   this
            })

          }
          else
          {
            if(options.global_state.focusedAnchor)
            {
              options.global_state.focusedAnchor.setFill(this.anchorDdefaultColor);
            }

            this.setFill(my.anchorClickedColor);
            options.global_state.focusedAnchor = this;
            options.global_state.selectedSource = options.model.id;
            options.scope.infoText = "Now click on another's node anchor to connect it!";
          }

          
          options.layer.draw();
          options.scope.$apply();
        });

        group.add(circle);
      }
    }
  }

  group.on('dragstart dragmove', function(){
    var io = [my.inputs, my.outputs];
    for(var i in io)
    {
      for(var j in io[i])
      {
        io[i][j].line = options.controller.redrawConnection(
          io[i][j].line, 
          io[i][j].from.getAbsolutePosition().x, 
          io[i][j].from.getAbsolutePosition().y,
          io[i][j].to.getAbsolutePosition().x,
          io[i][j].to.getAbsolutePosition().y
        );
      }
    }
  });

  group.on('click', function(){
    options.controller.focusNode(my);
  });

  this.focus = function()
  {
    this.previousFill = rect.getFill();
    rect.setFill("white");
    options.layer.draw();
  };

  this.unFocus = function()
  {
    rect.setFill(this.previousFill);
    options.layer.draw();
  };

  this.getControls = function()
  {
    return options.model.getControls();
  };

  
  this.shape = group;

  if(options.model.viewPosition)
  {
    this.shape.setAbsolutePosition(options.model.viewPosition);
  }

  options.layer.add(this.shape);
  options.layer.draw();

}