(function($) {

   /************************************************************************
   * paintPane  HTML5 创意画板
   ************************************************************************/
  $.support.canvas = (document.createElement('canvas')).getContext;

  $.fn.paintPane = function (options, value) {
	//检测浏览器
    function check() {
      if (!$.support.canvas) {
        $(this).html('Browser does not support HTML5 canvas, please upgrade to a more modern browser.');
        return false;
      }
      return $.proxy(get, this)();
    }

	//合并参数
    function get() {
      var paintPane = $.data(this, 'paintPane');

      if (!paintPane) {
        paintPane = new Paint(this, $.extend(true, {}, options));//将参数合并到模块中

        $.data(this, 'paintPane', paintPane);
      }

      return paintPane;
    }


	//获取参数对象
    function runOpts() {
      var paintPane = $.data(this, 'paintPane');

      if (paintPane) {
        if (paintPane[options]) { paintPane[options].apply(paintPane, [value]); }
        else if (value !== undefined) {
          if (paintPane[func]) { paintPane[func].apply(paintPane, [value]); }
          if (paintPane.options[options]) { paintPane.options[options] = value; }
        }
        else {
          if (paintPane[func]) { values.push(paintPane[func].apply(paintPane, [value])); }
          else if (paintPane.options[options]) { values.push(paintPane.options[options]); }
          else { values.push(undefined); }
        }
      }
    }

	//设置单项参数
    if (typeof options === 'string') {
      var values = [],
          func = (value ? 'set' : 'get') + options.charAt(0).toUpperCase() + options.substring(1);
      this.each(runOpts);
      if (values.length) { return values.length === 1 ? values[0] : values; }
      return this;
    }

	//参数合并
    options = $.extend({}, $.fn.paintPane.defaults, options);
    options.lineWidth = parseInt(options.lineWidth, 10);//线宽取整
    options.fontSize = parseInt(options.fontSize, 10);//字体大小取整

    return this.each(check);
  };

  /************************************************************************
   * 函数拓展方法
   ************************************************************************/
  $.fn.paintPane.extend = function (funcs, protoType) {
    var key;
    function elEach(func) {
      if (protoType[func]) {
        var tmpFunc = Paint.prototype[func],
            newFunc = funcs[func];
        
        protoType[func] = function () {
          tmpFunc.apply(this, arguments);
          newFunc.apply(this, arguments);
        };
      }
      else {
        protoType[func] = funcs[func];
      }
    }

    protoType = Paint.prototype;

    for (key in funcs) { (elEach)(key); }
  };
  
  	  /************************************************************************
	   * 初始化参数
	   ************************************************************************/
	
	  $.fn.paintPane.defaults = {
		defaultBrushSize:	8,					// 画笔大小
		maxBrushSize:	 	50,					// 画笔尺寸最小值
		inkAmount:			5,					//墨水量
		splashRange:		75,					// 喷溅的墨水范围量
		splashInkSize: 		10, 				// 喷溅的墨水尺
		mode:				"pencil",			//绘制模式
		strokeStyle: '#000',  // start stroke style
		bg:              	"#ffffff",          // 背景-图片/颜色值
		onShapeDown:     null,               // 鼠标按下回调函数
		onShapeMove:     null,               // 鼠标移动回调函数
		onShapeUp:       null                // 鼠标抬起回调函数
	
	  };

  
  		
		/************************************************************************
	   * Paint class
	   ************************************************************************/
	  function Paint(el, options) { 
		this.$canvas=this.$el = $(el);
		this.canvas=el;
		this.options = options;
		this.init = false;
	
		this.previousMode = null;
		this.canvas.width=this.width = this.$el.width();
		this.canvas.height=this.height = this.$el.height();
		this.context = this.canvas.getContext('2d');
		
		if(this.options.mode!="line"){
			//初始化画笔
			this.brush=new Brush(this.canvas.width/2,this.canvas.height/2,this.options.defaultBrushSize,this.options.inkAmount,this.options.splashRange,this.options.splashInkSize,this.options.strokeStyle);
		}
		
		this.generate();
		this._init();
	  }
	  
	
	Paint.prototype = {
		 _init: function () {
		  var index = null,
			  setFuncName = null;
	
		  this.init = true;
		  // 设置所有默认参数
		  for (index in this.options) {
			setFuncName = 'set' + index.capitalize();
			if (this[setFuncName]) { this[setFuncName](this.options[index]); }
		  }
	
		},
		
		generate: function () {
			if (this.init) { return this; }
			var _this = this;
			//绑定context参数  使paint对象具有ctx属性 
			function createCanvas(name) {
				var newName = (name ? name.capitalize() : ''),
					canvasName = 'canvas' + newName,
					ctxName = 'ctx' + newName;
				_this[ctxName] = _this[canvasName].getContext('2d');
						
				return _this['$' + canvasName];
			}
			
			createCanvas();
		
		  // 绑定鼠标按下事件
		  this.$canvas.on("mousedown",mouseDown)
		  //.on("dblclick",dobuleClick)	
		  .on("mousemove",mouseMove);
		  //.bindMobileEvents();
		  		  
		  
		  $(document).on("mouseup",mouseUp);
		  //.on("keydown",keyDown);
		  
		  // 执行的功能
		  function mouseDown(e) {
			e.preventDefault();
			e.stopPropagation();
			_this.draw = true;
			e.canvasEvent = 'down';
			_this._callShapeFunc.apply(_this, [e]);
		  }
		  
		  function mouseMove(e) {
			if (_this.draw) {
			  e.canvasEvent = 'move';
			  _this._callShapeFunc.apply(_this, [e]);
			}
		  }
	
		  function mouseUp(e) {
	
			//改变绘制模式
			if (_this.draw) {
			  _this.draw = false;
			  e.canvasEvent = 'up';
			  _this._callShapeFunc.apply(_this, [e]);
			}
		  }
			
		},
		
		
		resize: function () {
	
		  this.width = this.$el.width();
		  this.height = this.$el.height();
	
		  this.canvas.width = this.width;
		  this.canvas.height = this.height;
		  
		  this.setBg(bg,true);
	
		},
		
		
		/************************************
		 * setters
		 ************************************/
		
		setMode: function (mode) {
		  this.previousMode = this.options.mode;
		  this.options.mode = mode;
		},
		
		setBg: function (bg, resize) {
		  if (!bg) { return true; }
		  
		  if(bg.inspectColor()){
			 this.context.fillStyle=bg;
		 	 this.context.fillRect(0,0,this.canvas.width,this.canvas.height);
		  }
		  
		},

		
		_callShapeFunc:function(e){

			 // 绑定所有 “_draw”开头的的功能函数
			  var canvasOffset = this.$canvas.offset(),
					  canvasEvent = e.canvasEvent.capitalize(),
					  func = '_draw' + this.options.mode.capitalize() + canvasEvent;
			  //修正鼠标位置
			  e.pageX = Math.floor(e.pageX - canvasOffset.left);
			  e.pageY = Math.floor(e.pageY - canvasOffset.top);
			  
			  
			   // 调用 “_draw”开头的的功能函数
			  if (this[func]) { this[func].apply(this, [e]); }
		
			  // 调用回调函数
			  if (this.options['draw' + canvasEvent]) { this.options['_draw' + canvasEvent].apply(this, [e]); }
			  

		},
		
		
		//墨水模式
		_drawInkDown: function(e) {
			this.brush.startStroke(e,this.options);	
			this.brush.inkPaint(this.ctx,e.pageX,e.pageY,this.options);	
				
        },
        _drawInkMove: function(e) {
			if(this.draw){
				this.brush.inkPaint(this.ctx,e.pageX,e.pageY);
			}
			

        },	
        _drawInkUp: function() {
			this.brush.endStroke();
        },
		
		//蜡笔模式
		_drawCrayonDown: function(e) {
			this.brush.crayonPaint(this.ctx,e.pageX,e.pageY,this.options);
						
			
        },
        _drawCrayonMove: function(e) {	
			if(this.draw){
				this.brush.crayonPaint(this.ctx,e.pageX,e.pageY);
			}
        },
        _drawCrayonUp: function() {
			this.brush.resetCrayon();
        },
		
		//铅笔模式
		_drawPencilDown: function(e) {
            this.ctx.lineJoin = "round";
            this.ctx.lineCap = "round";
            this.ctx.strokeStyle = this.options.strokeStyle;
            this.ctx.fillStyle = this.options.strokeStyle;
            this.ctx.lineWidth = this.options.lineWidth;
            this.ctx.beginPath();
            this.ctx.arc(e.pageX, e.pageY, this.options.lineWidth / 2, 0, 2 * Math.PI, !0);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(e.pageX, e.pageY);		
			
        },
        _drawPencilMove: function(a) {
            this.ctx.lineTo(a.pageX, a.pageY);
            this.ctx.stroke();
        },
        _drawPencilUp: function() {
            this.ctx.closePath();
        },
		
		//擦除功能
        _drawEraserDown: function(e) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = "destination-out";
            this._drawPencilDown(e);
        },
        _drawEraserMove: function(e) {
            this._drawPencilMove(e);
        },
        _drawEraserUp: function(e) {
            this._drawPencilUp(e);
            this.ctx.restore();
        }
		
		
	}

	//定义多样式画笔
	function Brush(x, y, size, inkAmount, splashRange, splashInkSize,color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.inkAmount = inkAmount;
        this.splashRange = splashRange;
        this.splashInkSize = splashInkSize;
        
		/*
        this.color = {
            h: 0,
            s: 80,
            l: 50,
            a: 1,
            toString: function() {
                return 'hsla(' + this.h + ', ' + this.s + '%, ' + this.l + '%, ' + this.a + ')';
            }
        };
		*/
		this.color =color;
        
        this.resetTip();
        
        this._drops = [];
    }

    Brush.prototype = {
        isStroke: false,
        _latest: null,//最近一点的坐标
        _strokeRenderCount: 0,//
        _dropCount: 0,	//获取流出的墨水量，控制流下的时间
        _hairs: null,
        _latestStrokeLength: 0,
		dist:null,
		dx:null,
		dy:null,
		
        
		//更新点的位置
        update: function(mouseX,mouseY) {
			//获取当前点和上一个坐标点位置
            if (!this._latest) {
                this._latest = { x: mouseX, y: mouseY };
            } else {
                this._latest.x = this.x;
                this._latest.y = this.y;
            }
			
			this.x = mouseX;
            this.y = mouseY;
			
			
			this.dx = this.x - this._latest.x;
           	this.dy = this.y - this._latest.y;
			
			//获取当前点与上一个点的距离
			this.dist = this._latestStrokeLength = Math.sqrt(this.dx * this.dx + this.dy * this.dy);

        },

        
        startStroke: function(e,myoption) {
			this.x=e.pageX;
			this.y=e.pageY;
			$.extend(true,this, {},myoption);
			if(this.mode=="ink"){
				this.size=this.inkAmount=this.defaultBrushSize;
				if(this.size>4){
					this.maxBrushSize=this.defaultBrushSize*2;
					this.minBrushSize=this.defaultBrushSize/2;
				}else{
					this.maxBrushSize=this.defaultBrushSize*1.2;
					this.minBrushSize=this.defaultBrushSize/1.1;
				}
				//this.splashInkSize=this.defaultBrushSize*2.5;
				//this.splashRange=this.defaultBrushSize*4;
				console.dir(this);
			}
			
            this.resetTip();
            this._dropCount = random(6, 3) | 0;
            this.isStroke = true;
        },
        
        endStroke: function() {
            this.isStroke = false;
            this._strokeRenderCount = 0;
            this._dropCount = 0;
			this._latest=null;
        },
        
		//初始化
        resetTip: function() {
            var hairs = this._hairs = [];
            var inkAmount = this.inkAmount;
            var hairNum = this.size * 2;

            var range = this.size / 2;
            var rx, ry, c0, x0, y0;
            var c = random(Math.PI * 2), cv, sv, x, y;
            
            for (var i = 0, r; i < hairNum; i++) {
                rx = random(range);
                ry = rx / 2;
                c0 = random(Math.PI * 2);
                x0 = rx * Math.sin(c0);
                y0 = ry * Math.cos(c0);
                cv = Math.cos(c);
                sv = Math.sin(c);
                x = this.x + x0 * cv - y0 * sv;
                y = this.y + x0 * sv + y0 * cv;
				//将坐标点和数据存入到数组以便绘制时使用
                hairs[i] = new Hair(x, y, 10, inkAmount);
            }
            
        },
        
		//墨水模式
        inkPaint: function(ctx, mouseX, mouseY,myoption) {
			//$.extend(true,this, {},myoption);
			
			this.color=this.strokeStyle;
			//this.size=this.defaultBrushSize;
			this.size=this.inkAmount=this.defaultBrushSize;
			
			this.update(mouseX,mouseY);
            this._strokeRenderCount++;
            if (this._strokeRenderCount % 120 === 0 && this._dropCount < 10) {
                this._dropCount++;
            }    
			
			
            
            var hairs = this._hairs;
            var i, len;
            
            for (i = 0, len = hairs.length; i < len; i++) {
                hairs[i].update(this.dx, this.dy, this.dist);
            }
            
            if (this.isStroke) {
                var color = this.color;
                
                for (i = 0, len = hairs.length; i < len; i++) {
                    hairs[i].draw(ctx, color);
                }

                if (this.dist > 30) {
					//绘制斑点
					if(this.size>4){
                    	this.drawSplash(ctx, this.splashRange, this.splashInkSize);
					}
                } else if (this.dist && this.dist < 10 && random() < 0.085 && this._dropCount) {
					//绘制墨水过多流下效果
                    this._drops.push(new Drop(this.x, this.y, random(this.size * 0.25, this.size * 0.1), color, this.strokeId));
                    this._dropCount--;
                }
				
            }
            
            var drops = this._drops, drop;
            for (i = 0, len = drops.length; i < len; i++) {
                drop = drops[i];
                drop.update(this);
                drop.draw(ctx);
                if (drop.life < 0) {
                    drops.splice(i, 1);
                    len--;
                    i--;
                }
            }
			
        },
		
		
		//蜡笔模式
		crayonPaint: function(ctx,mouseX,mouseY,myoption) {
			this.update(mouseX,mouseY);
			$.extend(this, {}, myoption);
			this.size=this.defaultBrushSize;
			this.color=this.strokeStyle;

           var s = Math.ceil(this.size / 2);		//算出粒子的单位长度
           var stepNum = Math.floor(this.dist / s) + 1;	//算出步长  v.length()为斜线长度
		   this.dx=this.dx/this.dist*s;
		   this.dy=this.dy/this.dist*s;
			
			
			
            var sep = 1.5; // 分割数  控制画笔的浓密程度  关键所在
			//粒子的大小 根据画笔描绘的速度（画笔的停留时间）进行调整
            var dotSize = sep * Math.min(this.inkAmount / this._latestStrokeLength * 3, 1);
            var dotNum = Math.ceil(this.size * sep);
			
            var range = this.size / 2;
            var i, j, p={}, r, c, x, y;
			
            ctx.save();
            ctx.fillStyle = this.color;//获取画笔颜色
            ctx.beginPath();
			
			for (i = 0; i < dotNum; i++) {
				for (j = 0; j < stepNum; j++) {
					p.x=this._latest.x+this.dx*j;
					p.y=this._latest.y+this.dy*j;
					//p = this._latest.add(v.scale(j));
					r = random(range);
					c = random(Math.PI * 2);
					w = random(dotSize, dotSize / 2);
					h = random(dotSize, dotSize / 2);
					x = p.x + r * Math.sin(c) - w / 2;
					y = p.y + r * Math.cos(c) - h / 2;
					ctx.rect(x, y, w, h);
					//ctx.arc(x,y,w,0,Math.PI * 2,true);
				}
			}
            ctx.fill();
            ctx.restore();
			
        },
		
		resetCrayon:function(){
			this._latest=null;
		},
        
        removeDrop: function() {
            this._drops = [];
        },
        
        drawSplash: function(ctx, range, maxSize) {
            var num = random(12, 0);
            var c, r, x, y;
            
            ctx.save();
            for (var i = 0; i < num; i++) {
                r = random(range, 1);
                c = random(Math.PI * 2);
                x = this.x + r * Math.sin(c);
                y = this.y + r * Math.cos(c);
                dot(ctx, x, y, this.color.toString(), random(maxSize, 0));
            }
            ctx.restore();
        }
    };


    /**
     * Hair  绘制笔划轨迹
     */
    function Hair(x, y, lineWidth, inkAmount) {
        this.x = x || 0;
        this.y = y || 0;
		
        this.lineWidth = lineWidth;
        this.inkAmount = inkAmount;
        
        this._currentLineWidth = this.lineWidth;
        this._latest = { x: this.x, y: this.y };
    }

    Hair.prototype = {
        update: function(strokeX, strokeY, strokeLength) {
            this._latest.x = this.x;
            this._latest.y = this.y;
            this.x += strokeX;
            this.y += strokeY;

            var per = Math.min(this.inkAmount / strokeLength, 1);
            this._currentLineWidth = this.lineWidth * per;
        },

        draw: function(ctx, color) {
            ctx.save();
            ctx.lineCap = 'round';
            line(ctx, this._latest, this, color, this._currentLineWidth);
            ctx.restore();
        }
    };
    
    
    /**
     * Drop  溢出效果
     */
    function Drop(x, y, amount, color, strokeId) {
        this.x = x || 0;
        this.y = y || 0;
        this.amount = random(amount, amount * 0.5);
        this.life = this.amount * 1.5;
        this.color = color;
        this.strokeId = strokeId;
        
        this._latest = { x: this.x, y: this.y };
    }
    
    Drop.prototype = {
        _xrate: 0,
        
        update: function(brush) {
            var dx = brush.x - this.x;
            var dy = brush.y - this.y;
            if (brush.size * 0.3 > Math.sqrt(dx * dx + dy * dy) && brush.strokeId !== this.strokeId) {
                this.life = 0;
                return;
            }
            
            this._latest.x = this.x;
            this._latest.y = this.y;
            this.y += random(this.life * 0.5);
            this.x += this.life * this._xrate;
            this.life -= random(0.05, 0.01);
            
            if (random() < 0.03) {
                this._xrate += random(0.03, - 0.03);
            } else if (random() < 0.05) {
                this._xrate *= 0.01;
            }
        },
        
        draw: function(ctx) {
            ctx.save();
            ctx.lineCap = ctx.lineJoin = 'round';
            line(ctx, this._latest, this, this.color, this.amount + this.life * 0.3);
            ctx.restore();
        }
    };
    
    
    function line(ctx, p1, p2, color, lineWidth) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    
	/**  dot  点缀杂点污点效果
	*
	*
	*/
    function dot(ctx, x, y, color, size) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2, false);
        ctx.fill();
    }
	
	
	function random(max, min) {
		if (typeof max !== 'number') {
			return Math.random();
		} else if (typeof min !== 'number') {
			min = 0;
		}
		return Math.random() * (max - min) + min;
	}

  

 
})(jQuery);

/*拓展方法  工具函数*/

(function($) {

	if (!String.prototype.capitalize) {
		String.prototype.capitalize = function () {
		  return this.slice(0, 1).toUpperCase() + this.slice(1);
		};
	 }
	 
	 if(!String.prototype.inspectColor){
		 String.prototype.inspectColor=function(){
			 var oSpan = document.createElement("span");
			 oSpan.setAttribute("style","color:"+this);
			 return !(oSpan.style.color=="");
		}
	}
})(jQuery);
