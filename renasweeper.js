"use strict";
const REVEALED = 0;
const REVEALING = 1;
const CLOSED = 2;
const FLAGGED = 3;
const MINE = 4;
const MINE_FLAGGED = 5;
const leftpad = 640/2 - 480/2;
const hautime = 10;
let gridwidth;
let gridheight;
let pitch;
let gridorigin;
let mines;
let in_autoreveal;
let closed_cells;
let gameover;
let firstmove;
let flagmode;
let gfxsuf;
let cellsize;
let grid;
let click = () => {};

function easymode() {
	gridwidth = 8;
	gridheight = 8;
	mines = 10;
	cellsize = 60;
	gfxsuf = "_60px.png";
}
easymode();
function normalmode() {
	gridwidth = 16;
	gridheight = 16;
	mines = 40;
	cellsize = 30;
	gfxsuf = "_30px.png";
}
function js_load(id) {
	const el = document.getElementById(id);
	el.load();
}
function js_play(id) {
	const el = document.getElementById(id);
	el.volume = 0.5;
	el.currentTime = 0;
	el.play();
}
function js_stop(id) {
	const el = document.getElementById(id);
	el.pause();
}
function start() {
	js_play("audiobgm");
	newgame();
}
let outer;
let container;
let js_spr;
function js_image(id, p, x, y) {
	let el;
	if (js_spr[id]) {
		el = js_spr[id];
	} else {
		el = document.createElement("div");
		el.style.width = cellsize+"px";
		el.style.height = cellsize+"px";
		el.style.position = "absolute";
		el.style.left = x+"px";
		el.style.top = y+"px";
		el.style.overflow = "hidden";
		el.addEventListener("mouseenter", e => { el.style.backgroundPositionX = "right"; });
		el.addEventListener("mouseleave", e => { el.style.backgroundPositionX = ""; });
		js_spr[id] = el;
		container.appendChild(el);
	}
	el.style.backgroundImage = "url("+p+")";
}
function js_button(id) {
	js_spr[id].addEventListener("mousedown", e => { if (e.button == 0) { click(id); e.stopPropagation(); e.preventDefault(); } });
}
function newgame() {
	container.innerHTML = "";
	js_spr = {};
	js_image(999, "gfx/cellflag"+gfxsuf, 0, 0);
	js_spr[999].style.display = "none";
	reset_grid();
	click = click_ingame;
}
function drawcell(p, texture) {
	js_image(p-gridorigin+100, texture, leftpad+ptox(p)*cellsize, ptoy(p)*cellsize);
}
function drawnumcell(p, num) {
	drawcell(p, "gfx/cell"+num+gfxsuf);
}
function drawclosed(p) {
	drawcell(p, "gfx/cellnormal"+gfxsuf);
}
function drawflagged(p) {
	drawcell(p, "gfx/cellflag"+gfxsuf);
}
function ptox(p) {
	return (p-gridorigin)%pitch;
}
function ptoy(p) {
	return Math.floor((p-gridorigin)/pitch);
}
function flipflag(p) {
	switch (grid[p]) {
	case REVEALED:     quick_reveal(p); break;
	case CLOSED:       grid[p] = FLAGGED;      drawflagged(p); break;
	case FLAGGED:      grid[p] = CLOSED;       drawclosed(p); break;
	case MINE:         grid[p] = MINE_FLAGGED; drawflagged(p); break;
	case MINE_FLAGGED: grid[p] = MINE;         drawclosed(p); break;
	}
}
function flipflagmode() {
	flagmode = 1-flagmode;
	js_spr[999].style.display = flagmode == 1 ? "" : "none";
}
function reset_grid() {
	closed_cells = gridwidth*gridheight;
	pitch = gridwidth+1;
	gridorigin = pitch+1;
	gameover = 0;
	firstmove = 1;
	flagmode = 0;
	in_autoreveal = 0;
	grid = new Array((gridwidth+1)*(gridheight+2));
	let p = 0;
	for (let i = 0; i < gridwidth + 1; i++) {
		grid[p++] = REVEALED;
	}
	for (let i = 0; i < gridheight; i++) {
		grid[p++] = REVEALED;
		for (let j = 0; j < gridwidth; j++) {
			drawclosed(p);
			js_button(p-gridorigin+100);
			grid[p++] = CLOSED;
		}
	}
	for (let i = 0; i < gridwidth + 1; i++) {
		grid[p++] = REVEALED;
	}
}
function click_ingame(p) {
	if (p < 0) {
		flipflagmode();
	} else if (p != 0) {
		p += gridorigin-100;
		if (flagmode == 0) {
			reveal(p);
		} else {
			flipflag(p);
		}
	}
	if (gameover == 1) {
		click = () => {};
		js_stop("audiobgm");
		js_play("audiose1");
		js_spr = {};
		const oldcontainer = container;
		container = document.createElement("div");
		show_solved_grid();
		container.className = "container";
		js_image(999, "gfx/cellnormal"+gfxsuf, 0, 0);
		js_spr[999].style.display = flagmode == 1 ? "" : "none";
		oldcontainer.style.zIndex = 1;
		outer.appendChild(container);
		oldcontainer.animate([{opacity: 1}, {opacity: 0}], {duration: 400, fill: "forwards"}).finished.then(() => {
			oldcontainer.remove();
			click = click_dohau;
		});
	} else if (mines == closed_cells) {
		const text = textoverlay("&nbsp;&nbsp;&nbsp;Congratulations!");
		click = p => { text.remove(); normalmode(); newgame(); };
	}
}
function textoverlay(t) {
	const text = document.createElement("div");
	text.className = "textoverlay";
	const textspan = document.createElement("span");
	textspan.innerHTML = t;
	text.appendChild(textspan);
	outer.appendChild(text);
	return text;
}
function click_dohau(p) {
	click = () => {};
	js_play("audiose2");
	const hau = document.createElement("div");
	hau.style.backgroundImage = "url(gfx/bigkaii.png)";
	hau.style.backgroundSize = "cover";
	hau.style.position = "absolute";
	outer.appendChild(hau);
	const frames = [ ];
	let scale = 0;
	const pushframe = () => {
		frames.push({left: (640/2 - scale)+"px", top: (480/2 - scale)+"px", width: (2*scale)+"px", height: (2*scale)+"px"});
	};
	pushframe();
	for (let i = 0; i < 50; i++) {
		scale++;
		pushframe();
	}
	while (scale < 322) {
		scale *= 1.02;
		if (scale > 322) { scale = 322; }
		pushframe();
	}
	hau.animate(frames, {duration: frames.length * 10, fill: "forwards"}).finished.then(() => {
		// output text
		const text = textoverlay("You've been taken home");
		click = () => {
			text.remove();
			hau.remove();
			js_stop("audiose1");
			js_stop("audiose2");
			start();
		};
	});
}
function populate_grid(p) {
	for (let i = 0; i < mines; i++) {
		while (true) {
			const x = Math.floor(Math.random()*gridwidth);
			const y = Math.floor(Math.random()*gridheight);
			const q = gridorigin + pitch*y + x;
			if (q == p) {
				continue;
			}
			if (window.location.hash.includes("easystart")) {
				if (q == p-pitch-1 ||
					q == p-pitch ||
					q == p-pitch+1 ||
					q == p-1 ||
					q == p ||
					q == p+1 ||
					q == p+pitch-1 ||
					q == p+pitch ||
					q == p+pitch+1) {
					continue;
				}
			}
			if (grid[q] == CLOSED) {
				grid[q] = MINE;
				break;
			} else if (grid[q] == FLAGGED) {
				grid[q] = MINE_FLAGGED;
				break;
			}
		}
	}
}
function getminenum(p) {
	let i = 0;
	if (grid[p]         >= MINE) { return 9; }
	if (grid[p-pitch-1] >= MINE) { i++; }
	if (grid[p-pitch]   >= MINE) { i++; }
	if (grid[p-pitch+1] >= MINE) { i++; }
	if (grid[p-1]       >= MINE) { i++; }
	if (grid[p]         >= MINE) { i++; }
	if (grid[p+1]       >= MINE) { i++; }
	if (grid[p+pitch-1] >= MINE) { i++; }
	if (grid[p+pitch]   >= MINE) { i++; }
	if (grid[p+pitch+1] >= MINE) { i++; }
	return i;
}
function primeautoreveal(p) {
	if (grid[p-pitch-1] == CLOSED) { grid[p-pitch-1] = REVEALING; }
	if (grid[p-pitch]   == CLOSED) { grid[p-pitch]   = REVEALING; }
	if (grid[p-pitch+1] == CLOSED) { grid[p-pitch+1] = REVEALING; }
	if (grid[p-1]       == CLOSED) { grid[p-1]       = REVEALING; }
	if (grid[p]         == CLOSED) { grid[p]         = REVEALING; }
	if (grid[p+1]       == CLOSED) { grid[p+1]       = REVEALING; }
	if (grid[p+pitch-1] == CLOSED) { grid[p+pitch-1] = REVEALING; }
	if (grid[p+pitch]   == CLOSED) { grid[p+pitch]   = REVEALING; }
	if (grid[p+pitch+1] == CLOSED) { grid[p+pitch+1] = REVEALING; }
}
function reveal(p) {
	if (firstmove == 1) { firstmove = 0; populate_grid(p); }
	if (grid[p] == MINE) { gameover = 1; return; }
	if (grid[p] == MINE_FLAGGED) { return; }
	if (grid[p] == FLAGGED) { return; }
	if (grid[p] == REVEALED) { return; }
	const num = getminenum(p);
	drawnumcell(p, num);
	if (num == 0) {
		primeautoreveal(p);
		if (in_autoreveal == 0) { grid[p] = REVEALED; autoreveal(); }
	}
	closed_cells--;
	grid[p] = REVEALED;
}
function autoreveal() {
	in_autoreveal = 1;
	while (true) {
		let k = 1;
		let p = gridorigin;
		for (let i = 0; i < gridheight; i++) {
			for (let j = 0; j < gridwidth; j++) {
				if (grid[p] == REVEALING) { k = 0; reveal(p); }
				p++;
			}
			p += pitch-gridwidth;
		}
		if (k == 1) { break; }
	}
	in_autoreveal = 0;
}
function show_solved_grid() {
	let p = gridorigin;
	for (let i = 0; i < gridheight; i++) {
		for (let j = 0; j < gridwidth; j++) {
			drawnumcell(p, getminenum(p));
			p++;
		}
		p += pitch-gridwidth;
	}
}
function count_flags(p) {
	let i = 0;
	if (grid[p-pitch-1] == FLAGGED || grid[p-pitch-1] == MINE_FLAGGED) { i++; }
	if (grid[p-pitch]   == FLAGGED || grid[p-pitch]   == MINE_FLAGGED) { i++; }
	if (grid[p-pitch+1] == FLAGGED || grid[p-pitch+1] == MINE_FLAGGED) { i++; }
	if (grid[p-1]       == FLAGGED || grid[p-1]       == MINE_FLAGGED) { i++; }
	if (grid[p]         == FLAGGED || grid[p]         == MINE_FLAGGED) { i++; }
	if (grid[p+1]       == FLAGGED || grid[p+1]       == MINE_FLAGGED) { i++; }
	if (grid[p+pitch-1] == FLAGGED || grid[p+pitch-1] == MINE_FLAGGED) { i++; }
	if (grid[p+pitch]   == FLAGGED || grid[p+pitch]   == MINE_FLAGGED) { i++; }
	if (grid[p+pitch+1] == FLAGGED || grid[p+pitch+1] == MINE_FLAGGED) { i++; }
	return i;
}
function count_uncovered_mines(p) {
	let i = 0;
	if (grid[p-pitch-1] == MINE) { i++; }
	if (grid[p-pitch]   == MINE) { i++; }
	if (grid[p-pitch+1] == MINE) { i++; }
	if (grid[p-1]       == MINE) { i++; }
	if (grid[p]         == MINE) { i++; }
	if (grid[p+1]       == MINE) { i++; }
	if (grid[p+pitch-1] == MINE) { i++; }
	if (grid[p+pitch]   == MINE) { i++; }
	if (grid[p+pitch+1] == MINE) { i++; }
	return i;
}
function quick_reveal(p) {
	if (getminenum(p) != count_flags(p)) { return; }
	if (count_uncovered_mines(p) > 0) { gameover = 1; return; }
	primeautoreveal(p);
	autoreveal();
}
document.addEventListener("DOMContentLoaded", () => {
	js_load("audiobgm");
	js_load("audiose1");
	js_load("audiose2");
	container = document.getElementsByClassName("container")[0];
	outer = document.getElementsByClassName("outercontainer")[0];
	outer.addEventListener("mousedown", e => {
		if (e.button == 0) { click(0); }
		if (e.button == 2) { click(-1); }
		e.preventDefault(); 
	});
	outer.addEventListener("contextmenu", e => { e.preventDefault(); });
	const text = textoverlay("&nbsp;&nbsp;&nbsp;Renasweeper 1.1<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Web edition<br><br>&nbsp;- Click to start -");
	text.childNodes[0].style.top = "180px";
	click = () => {
		text.remove();
		start();
	}
});
