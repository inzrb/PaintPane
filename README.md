#PaintPane.js



PaintPane is A jQuery paint plugin for a simple drawing surface that you can easily pop into your pages.

* [Download the lastest version of PaintPane](https://github.com/inzrb/PaintPane)

Get Started
-----------

To get started using Pure, go to the [Pure CSS website][Pure]. The website has
extensive documentation and examples necessary to get you started using Pure.

1.First,You should include jQuery  on your page.
   
   Please make sure that the `jQuery`  version you are using is 1.7+,or it maybe doesn't work well.

    ```html
    <script src="http://code.jquery.com/jquery.min.js"></script>
    ```

2. Include the plugin `paintPane` on your page.

    ```html
    <script src="jquery.paintPane.min.js"></script>
    ```

3.  Now just use jQuery as expected and watch it work at your website.    

    ```html
    <script>$('#canvas').paintPane();</script>
    ```


## Settings

Settings are available per plugin.  Meaning only when that plugin is included will those settings be available.

### core

```js
$.fn.paintPane.defaults = {
	defaultBrushSize:	8,	// setting the initial size of the brush
	maxBrushSize:	 	50,	// the attribute will be work if the mode isset "crayon" or "ink"
	inkAmount:			5,	//ink's amount 
	splashRange:		75,		// set splash's range,just work on the mode "ink"
	splashInkSize: 		10, 		// set splash ink'size,just work on the mode "ink"
	mode:				"pencil",	//painting mode,you can pick "pencil","crayon","ink"
	strokeStyle: '#000',  // start stroke style
	bg:              	"#ffffff",          // set bg on init
	onShapeDown:     null,               // callback for draw down event
	onShapeMove:     null,               // callback for draw move event
	onShapeUp:       null                // callback for draw up event

};
```



## Contact

Weibo:[inzrb's Weibo](http://weibo.com/inzrb)



## License

MIT licensed

Copyright (C) 2010-2014 Websanova [inzrb's Website](http://www.dfabl.com) 
