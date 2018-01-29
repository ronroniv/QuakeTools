var light_radius = 150;

var flickering = true;

var cha2num = [];
var current_style = null;
var pattern = [];

var length;
var interval = 100; // 0.1 seconds
var interval_modif = 1.0;
var previous_time = 0.0;
var current_index = 0;

var bg_color = "#000000";
var light_stroke = false;

var canvas;
var style_input, selection, radius_slider, colorpicker, stroke_check;
var header, label_input, desc_input, label_selec, label_setting;
var gui_margin_left = 40;
var gui_margin_top = 70;
var gui_element_margin = 20;

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


function setup() {
	canvas = createCanvas(400, 400);
	canvas.parent("canvas_container");

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

	previous_time = millis();

	bar_c1 = color(255);
	bar_c2 = color(0);
}

function setupGUI(choice) {
	header = createElement("h1", "Quake 1 Light Style Viewer");
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

	createElement("hr").parent("gui_container");

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

  	label_setting = createP("<b>Viewer Settings</b>");
  	label_setting.parent("gui_container");

  	createSpan("Light Radius: ").parent("gui_container");

	radius_slider = createSlider(50, canvas.width + 200, light_radius);
	radius_slider.parent("gui_container");
  	radius_slider.style("width", "100px");

  	createSpan(" / Background: ").parent("gui_container");

  	colorpicker = createInput(bg_color, "color");
  	colorpicker.input(bgColorChanged);
  	colorpicker.parent("gui_container");

  	createP("").parent("gui_container");

  	stroke_check = createCheckbox("Show Border", light_stroke);
  	stroke_check.changed(lightStrokeChanged);
  	stroke_check.parent("gui_container");
}

function setupStats () {
	createSpan("Length: ").parent("stats");

	stat_length = createSpan(length);
	stat_length.parent("stats");

	createSpan(" second(s)").parent("stats");
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

function lightStrokeChanged() {
	light_stroke = this.checked();
}

function initializePattern() {
	generatePattern();
	stat_length.html(length);
	current_index = 0;
}

function draw() {
	background(bg_color);
	if (flickering) {
		flick();
	}
}

function setGradient(x, y, w, h, c1, c2) {
	for (var i = y; i <= y+h; i++) {
		var inter = map(i, y, y+h, 0, 1);
		var c = lerpColor(c1, c2, inter);
		stroke(c);
		line(x, i, x+w, i);
	}
}

function generatePattern() {
	var string_array = current_style.split('');
	pattern = [];
	for (i = 0; i < string_array.length; i++) {
		var new_value = string_array[i].charCodeAt();
		pattern.push(cha2num.get(new_value) / 25);
	}
	length = (pattern.length * interval) / 1000
}

function flick() {
	if (light_stroke) {
		stroke(255);
		strokeWeight(3);
	}
	else {
		strokeWeight(0);
	}
	
	light_radius = radius_slider.value();
	fill(255 * pattern[current_index]);
	ellipse(width / 2, height / 2, light_radius, light_radius);
	if ((millis() - previous_time) >= ((interval) / interval_modif)) {
		current_index += 1;
		previous_time = millis();
	}
	if (current_index > pattern.length) {
		current_index = 0;
	}
}