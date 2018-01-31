var shape_radius = 150;

var flickering = true;

var cha2num = [];
var current_style = null;
var pattern = [];

var length;
var interval = 100; // 0.1 seconds
var interval_modif = 1.0;
var previous_time = 0.0;
var current_index = 0;

var bg_color = "#222222";
var shape_stroke = false;

var is_viewmode_3d = true;
var canvas;
var style_input, selection, radius_slider, colorpicker, stroke_check, view_check, spin_check;
var header, label_input, desc_input, label_selec, label_setting;
var canvas_width = 400;
var canvas_height = 400;

var texture_def;
var spinning = false;
var spin_time;
var spin_time_def;

var stat_length;
var bar_height = 100;
var bar_width = 20;
var bar_c1, bar_c2;

var default_style_dict;
var default_style_names = ["0 = normal", "1 = flicker 1", "2 = slow strong pulse",
						   "3 = candle 1", "4 = fast strobe", "5 = gentle pulse",
						   "6 = flicker 2", "7 = candle 2", "8 = candle 3",
						   "9 = slow strobe", "10 = flourescent flicker", "11 = slow pulse, not fading to black"];
var default_styles = ["m",
					  "mmnmmommommnonmmonqnmmo", 
					  "abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba",
					  "mmmmmaaaaammmmmaaaaaabcdefgabcdefg",
					  "mamamamamama",
					  "jklmnopqrstuvwxyzyxwvutsrqponmlkj",
					  "nmonqnmomnmomomno",
					  "mmmaaaabcdefgmmmmaaaammmaamm",
					  "mmmaaammmaaammmabcdefaaaammmmabcdefmmmaaaa",
					  "aaaaaaaazzzzzzzz",
					  "mmamammmmammamamaaamammma",
					  "abcdefghijklmnopqrrqponmlkjihgfedcba"];


function preload() {
	switch(window.location.protocol) {
		case "http:":
		case "https:":
			texture_def = loadImage("images/city2_1.png");
			break;
		case "file:":
			texture_def = loadImage("https://raw.githubusercontent.com/ronroniv/QuakeTools/master/lightstyle_viewer/images/city2_1.png");
			break;
	}
}

function setup() {
	canvas = createCanvas(canvas_width, canvas_height, WEBGL);
	setAttributes("antialias", true);
	var fov = 60 / 180 * PI;
	var cameraZ = height / 2.0 / tan(fov / 2.0);
	perspective(60 / 180 * PI, width / height, cameraZ * 0.1, cameraZ * 10);

	var choice = floor(random() * (default_styles.length - 1)) + 1;
	current_style = default_styles[choice];

	cha2num = createNumberDict();
	for (i = 97; i < 123; i++) {
		cha2num.create(i, i - 97);
	}

	default_style_dict = createStringDict();
	for (i = 0; i < default_style_names.length; i ++) {
		default_style_dict.create(default_style_names[i], default_styles[i])
	}

	generatePattern();
	setupGUI(choice);
	setupStats();

	bar_c1 = color(255);
	bar_c2 = color(0);

	spin_time_def =  radians(-45) / 0.01;
	spin_time = spin_time_def;

	previous_time = millis();
}

function setupGUI(choice) {
	header = createElement("h1", "Quake 1 Lightstyle Viewer");
	header.parent("gui_container");

	label_selec = createP("<b>Default Styles</b>");
	label_selec.parent("gui_container");

  	selection = createSelect();
 	selection.parent("gui_container");
 	for (i = 0; i < default_styles.length; i++) {
 		selection.option(default_style_names[i]);
 	}
  	selection.changed(selectionChanged);
  	selection.value(default_style_names[choice]);

	label_input = createP("<b>Custom Style</b> (Enter 'a' to 'z' value without space. 'a' is total dark, 'z' is fullbright, and 'm' is normal light. Each letter represents 0.1 seconds.)");
  	label_input.parent("gui_container");

	desc_input = createP("");
	desc_input.parent("gui_container");

	style_input = createInput(current_style, text);
	style_input.size(400, 15);
	style_input.attribute("pattern", "[a-z]");
	style_input.attribute("title", "Enter only a to z.");
	style_input.input(customStyleEntered);
	style_input.parent("gui_container");

  	createElement("hr").parent("gui_container");

  	label_setting = createP("<h2>Viewer Settings</h2>");
  	label_setting.parent("gui_container");

  	view_check = createCheckbox("3D View (not necessarily an accurate emulation of Quake 1 rendering)", is_viewmode_3d);
  	view_check.changed(viewChanged);
	view_check.parent("gui_container");

	createSpan("Background color: ").parent("gui_container");

  	colorpicker = createInput(bg_color, "color");
  	colorpicker.input(bgColorChanged);
  	colorpicker.parent("gui_container");

	createP("<b>[2D]</b>").parent("gui_container");
  	createSpan("Shape Radius: ").parent("gui_container");

	radius_slider = createSlider(50, canvas.width + 200, shape_radius);
	radius_slider.parent("gui_container");
  	radius_slider.style("width", "100px");

  	stroke_check = createCheckbox("Show Border", shape_stroke);
  	stroke_check.changed(shapeStrokeChanged);
  	stroke_check.parent("gui_container");

  	createP("<b>[3D]</b>").parent("gui_container");

  	spin_check = createCheckbox("Spin box", spinning);
  	spin_check.changed(spinChanged);
  	spin_check.parent("gui_container");
}

function setupStats () {
	createSpan("Length: ").parent("stats");

	stat_length = createSpan(length);
	stat_length.parent("stats");

	createSpan(" second(s)").parent("stats");
}

function setGradient(x, y, w, h, c1, c2) {
	for (var i = y; i <= y+h; i++) {
		var inter = map(i, y, y+h, 0, 1);
		var c = lerpColor(c1, c2, inter);
		stroke(c);
		line(x, i, x+w, i);
	}
}

function customStyleEntered() {
	current_style = style_input.value();
	initializePattern();
}

function selectionChanged() {
	current_style = default_style_dict.get(selection.value());
	style_input.value(current_style);
	initializePattern();
}

function bgColorChanged() {
	bg_color = colorpicker.value();
}

function shapeStrokeChanged() {
	shape_stroke = this.checked();
}

function viewChanged() {
	is_viewmode_3d = this.checked();
}

function spinChanged() {
	spin_time = spin_time_def;
	spinning = this.checked();
}

function initializePattern() {
	generatePattern();
	stat_length.html(length);
	current_index = 0;
}

function generatePattern() {
	var string_array = current_style.split('');
	pattern = [];
	for (i = 0; i < string_array.length; i++) {
		var new_value = string_array[i].charCodeAt();
		pattern.push(cha2num.get(new_value) / 25);
	}
	length = (pattern.length * interval) / 1000;
}

function draw() {
	background(bg_color);

	if (is_viewmode_3d) {
		// orbitControl();
		rotateX(radians(-35));
		if (spinning){
			spin_time += 1
			rotateY(spin_time * 0.01);
		} else {
			rotateY(radians(-45));
		}
		
		texture(texture_def);
		box(150);
	} else {
		if (shape_stroke) {
			stroke(255);
			strokeWeight(5);
		} else {
			strokeWeight(0);
		}

		shape_radius = radius_slider.value();
	}

	if (flickering) {
		flick();
	}
}

function flick() {
	if (is_viewmode_3d) {
		var l = 255 * pattern[current_index];
		directionalLight(l, l, l, 1.0, 1.5, -5.0);
	} else {
		fill(255 * pattern[current_index]);
		ellipse(0, 0, shape_radius, shape_radius, 48, 48);
	}

	if ((millis() - previous_time) >= ((interval) / interval_modif)) {
		current_index += 1;
		previous_time = millis();
	}

	if (current_index >= pattern.length) {
		current_index = 0;
	}
}