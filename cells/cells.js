/** 
 * # cells.js
 * Cellular automata in the HTML canvas.
 * ...and a few other little experiments. :)
 * Made with <3 by Steven (mechabubba) v1.0
 * 
 * Hosted at: https://goon.haus/cells/
 * Source: https://github.com/mechabubba/goon.haus/tree/main/cells/cells.js
 * 
 * @license
 * Licensed under the Unlicense: https://unlicense.org/
 */

/**
 * @todo a few things.
 * - **the big one:** for some ungodly reason, LangtonsAnt gets **faster** on each reset(). i have no idea why. it'd be cool to have it fast all the time...
 *   - possible speed solution: step the ants a few times, draw the screen, repeat
 * - on some rows and columns pixels are malformed. see: https://b.catgirlsare.sexy/jf-krTsZWhlx.png, one horz line is narrower than the rest
 * - there are a bunch of things on this page that wont work on older browsers (`??`, `static` class methods, etc).
 *   - i dont *really* care, and i dont want to change anything drastically, but it may be good to support older browsers more.
 */

/** Gets the hexadecimal byte offset of a number. @returns {string} */
Number.prototype.byte = () => Math.abs(this % 256).toString(16).padStart(2, "0");

/** Halts operation ("sleeps") for a given amount of milliseconds `ms`. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The modulus operation, but negative numbers `v` wrap around to `l - v`. Source: https://stackoverflow.com/a/43827557/17188891 */
/**
 * Modulus operation implemented without the modulus operator. Also wraps negative number `v` around to `l - v`. Source: 
 * @param {*} v 
 * @param {*} l 
 * @returns 
 */
const mod = (v, l) => {
    //return ((v % l) + l) % l;
    return v - (l * Math.floor(v / l));
}

// Shorthand for some functions.
const abs = Math.abs;
const floor = Math.floor;
const random = Math.random;

/** A matrix that wraps around. */
class Matrix {
    constructor(height, width, fill = 0) {
        this.height = height; // X
        this.width = width;   // Y
        this.init(fill);
    }
    init = (fill = 0) => this.matrix = Array.from({ length: this.height }, (v, i) => Array.from({ length: this.width }, (v, i) => fill));
    get = (x, y) => this.matrix[mod(y, this.height)][mod(x, this.width)];
    set = (x, y, value) => this.matrix[mod(y, this.height)][mod(x, this.width)] = value;
}

/** The Color class. Mostly treated as an interface for RGBAColor and HSLAColor. */
class Color {
    _randomValue(to = 256) {
        return floor(random() * to);
    }
}

/** A class representing a 32 bit RGBA color. */
class RGBAColor extends Color {
    constructor(r, g, b, a = 255) {
        super();
        if(Array.isArray(r)) {
            this.r = abs(r[0] ?? this._randomValue()) % 256 | 0;
            this.g = abs(r[1] ?? this._randomValue()) % 256 | 0;
            this.b = abs(r[2] ?? this._randomValue()) % 256 | 0;
            this.a = abs(r[3] ?? this._randomValue()) % 256 | 0;
        } else {
            this.r = abs(r ?? this._randomValue()) % 256 | 0;
            this.g = abs(g ?? this._randomValue()) % 256 | 0;
            this.b = abs(b ?? this._randomValue()) % 256 | 0;
            this.a = abs(a ?? this._randomValue()) % 256 | 0;
        }
    }
    hex = () => this.r.byte() + this.g.byte() + this.b.byte() + this.a.byte();
    css() { return `rgba(${[this.r, this.g, this.b, (this.a / 255)]})`; }
    toHSLA = () => { // Source: https://stackoverflow.com/a/9493060/17188891
        let r = this.r / 255, g = this.g / 255, b = this.b / 255, a = this.a / 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if(max == min) {
            h = s = 0; // achromatic
        } else {
            let d = (max - min);
            s = l >= 0.5 ? d / (2 - (max + min)) : d / (max + min);
            switch(max) {
                case r: h = ((g - b) / d + 0) * 60; break;
                case g: h = ((b - r) / d + 2) * 60; break;
                case b: h = ((r - g) / d + 4) * 60; break;
            }
        }
        return new HSLAColor(h, s, l, a);
    }
}

class HSLAColor extends Color {
    constructor(h, s, l, a = 255) {
        super();
        if(Array.isArray(h)) {
            this.h = abs(h[0] ?? this._randomValue(361)) % 361 | 0;
            this.s = abs(h[1] ?? random()); // random() only goes [0, 1), may be an issue... prob not
            this.l = abs(h[2] ?? random());
            this.a = abs(h[3] ?? this._randomValue() / 255);
        } else {
            this.h = abs(h ?? this._randomValue(361)) % 361 | 0;
            this.s = abs(s ?? random());
            this.l = abs(l ?? random());
            this.a = abs(a ?? this._randomValue() / 255);
        }
    }
    css() { return `hsla(${[this.h, `${this.s * 100}%`, `${this.l * 100}%`, (this.a / 255)]})`; }
    toRGBA() { // Source: https://stackoverflow.com/a/9493060/17188891
        let r, g, b;
        if(this.s == 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return new RGBAColor(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(this.a * 255));
    }
}

// Some static colors.
Color.BLACK = new HSLAColor(0, 0, 0);
Color.WHITE = new HSLAColor(0, 0, 255);

/**
 * The default CellGrid `options` object.
 * @typedef {Object} CellGridOptions
 * @property {?Color[]} tiles - Various colors representing various different states of cells - index 0 will always the background. Represents an array of RGBA colors. Defaults to `[new Color(0, 0, 0), new Color(255, 255, 255)]`.
 * @property {?Color} bgOverride - The background override. Appears visually as its own color, but treated as `this.tiles[0]`.
 * @property {?number} zoom - The scale of the simulation; a value of `1` matches your resolution. Default: `4` (I find it most appealing on my own resolution ;D).
 * @property {?number} stepCooldown - How long it takes between mutations, in milliseconds. Default: `1`.
 * @property {?boolean} enableAlpha - Should the canvas handle alpha values? Disabling this improves preformance. Default: `true`.
 * @property {?boolean} enableContextMenu - Should we enable the context menu? Default: `false`.
 * @property {?boolean} enableDrawing - Should we enable drawing? Default: `true`.
 * @property {?number} mouseButtonDraw - The mouse button used to draw. Default: `0`.
 * @property {?number} mouseButtonErase - The mouse button used to erase. Default: `2`.
 */

/** The grid for cellular automation to play out. This is extended by LangtonsAnt, and can probably be extended elsewhere aswell! */
class CellGrid {
    /**
     * Constructs the CellGrid object.
     * @param {HTMLElement} canvas - A canvas HTML element.
     * @param {?CellGridOptions} options - Options for the cell grid.
     */
    constructor(canvas, options = {}) {
        if(!canvas || canvas.tagName.toLowerCase() != "canvas") throw new Error("Element must be canvas.");
        this.canvas = canvas;

        this.tiles = options.tiles ?? [new RGBAColor(0, 0, 0), new RGBAColor(255, 255, 255)];
        this.bgOverride = options.bgOverride;
        this.zoom = options.zoom ?? 4;
        this.stepCooldown = options.stepCooldown ?? 1;
        this.enableAlpha = options.enableAlpha ?? true;
        this.enableContextMenu = options.enableContextMenu ?? false;
        this.enableDrawing = options.enableDrawing ?? true;
        this.mouseButtonDraw = options.mouseButtonDraw ?? 0;
        this.mouseButtonErase = options.mouseButtonErase ?? 2;

        this.canvas.setAttribute("width", (Math.round((this.canvas.clientWidth / window.devicePixelRatio) / this.zoom)));
        this.canvas.setAttribute("height", (Math.round((this.canvas.clientHeight / window.devicePixelRatio) / this.zoom)));
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // CellGrid.events - used for mobile support. @todo kinda scuffed
        this.events = {
            "mousedown": (ev, isTouch = false) => {
                if(ev.button == this.mouseButtonDraw || isTouch) {
                    this._drawing = true;
                } else if(ev.button == this.mouseButtonErase) {
                    this._erasing = true;
                } else {
                    return;
                }

                if(isTouch) {
                    let touch = ev.changedTouches[0];
                    this._lastX = floor((touch.clientX / window.devicePixelRatio) / this.zoom);
                    this._lastY = floor((touch.clientY / window.devicePixelRatio) / this.zoom);
                } else {
                    this._lastX = floor((ev.offsetX / window.devicePixelRatio) / this.zoom);
                    this._lastY = floor((ev.offsetY / window.devicePixelRatio) / this.zoom);
                }
            },
            "mouseup": (ev, isTouch = false) => {
                if(ev.button == this.mouseButtonDraw || isTouch) {
                    this._drawing = false;
                } else if(ev.button == this.mouseButtonErase) {
                    this._erasing = false;
                }
            },
            "mousemove": (ev, isTouch = false) => {
                if(this._drawing || this._erasing) {
                    let x2, y2;
                    if(isTouch) {
                        let touch = ev.changedTouches[0];
                        x2 = floor((touch.clientX / window.devicePixelRatio) / this.zoom);
                        y2 = floor((touch.clientY / window.devicePixelRatio) / this.zoom);
                    } else {
                        x2 = floor((ev.offsetX / window.devicePixelRatio) / this.zoom);
                        y2 = floor((ev.offsetY / window.devicePixelRatio) / this.zoom);
                    }
                    this.drawLine(this._lastX, this._lastY, x2, y2);
                }
            }
        }

        if(this.enableDrawing) {
            this.canvas.addEventListener("mousedown",  (ev) => this.events.mousedown(ev));
            this.canvas.addEventListener("mouseup",    (ev) => this.events.mouseup(ev));
            this.canvas.addEventListener("mousemove",  (ev) => this.events.mousemove(ev));
            this.canvas.addEventListener("touchstart", (ev) => this.events.mousedown(ev, true));
            this.canvas.addEventListener("touchend",   (ev) => this.events.mouseup(ev, true))
            this.canvas.addEventListener("touchmove",  (ev) => this.events.mousemove(ev, true));
        }

        if(!this.enableContextMenu) {
            this.canvas.addEventListener("contextmenu", (ev) => ev.preventDefault()); // Disables the context menu.
        }

        this.init();
    }

    /**
     * (Re)initiates the grid and canvas.
     */
    init() {
        this.ctx = this.canvas.getContext("2d", { alpha: this.enableAlpha });
        this.matrix = new Matrix(this.height, this.width);

        this.ticks = 0;
        this.goal = Number.MAX_SAFE_INTEGER;
        this.stopped = true;

        const color = this.bgOverride instanceof Color ? this.bgOverride : this.tiles[0];
        this.ctx.fillStyle = color.css();
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Gets a color from a pixel on the canvas.
     * 
     * **Note that this is a pretty resource-intensive function and should only be used in individual circumstances.**
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @returns {Color} The color data from the grid.
     */
    getPixel(x, y) {
        return new RGBAColor(this.ctx.getImageData(floor(x), floor(y), 1, 1).data);
    }

    /**
     * Sets a color to a pixel on the canvas.
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {Color} color - The color to set.
     */
    // setPixel(x, y, color = Color.WHITE) {
    //     const img = this.ctx.createImageData(1, 1);
    //     img.data[0] = color.r; img.data[1] = color.g; img.data[2] = color.b; img.data[3] = color.a;
    //     this.ctx.putImageData(img, x % this.width, y % this.height);
    // }

    setPixel(x, y, color = Color.BLACK) {
        this.ctx.fillStyle = color.css();
        this.ctx.fillRect(x, y, 1, 1);
    }

    /** Draws a line between two points. (x1, y1) => (x2, y2). */
     drawLine(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const steps = abs(dx) > abs(dy) ? abs(dx) : abs(dy);
        const incX = dx / steps;
        const incY = dy / steps;

        for(let i = 0; i < steps; i++) {
            x1 += incX;
            y1 += incY;
            const x = floor(x1 < 0 ? 0 : x1);
            const y = floor(y1 < 0 ? 0 : y1);

            if(this._drawing) {
                this.draw(x, y);
            } else if(this._erasing) {
                this.erase(x, y);
            }
        }
    
        this._lastX = x2;
        this._lastY = y2;
    }

    /** What to do when we want to "draw" a pixel at a point (x, y). Extend this in your own class! */
    draw(x, y) {
        const tile = Math.min(this.matrix.get(x, y) + 1, this.tiles.length - 1);
        this.matrix.set(x, y, tile);
        this.setPixel(x, y, this.tiles[tile]);
    }

    /** What to do when we want to "erase" a pixel at a point (x, y). Extend this in your own class! */
    erase(x, y) {
        this.matrix.set(x, y, 0);
        this.setPixel(x, y, this.tiles[0]);
    }

    /** Starts the simulation to run indefinitely. You can set the `goal` property at any time to make it up until a point; by default, it runs to `Number.MAX_SAFE_INTEGER`. */
    start() {
        if(!this.stopped) {
            console.warn("Simulation already started; not starting again.");
            return;
        }
        this.stopped = false;
        requestAnimationFrame(this._step.bind(this))
    }

    /** Stops the simulation. */
    stop() {
        this.stopped = true;
    }

    /** Stops and resets everything. */
    reset() {
        this.stop();
        this.init();
    }

    /** Sets up recursively looping steps. **Don't call this directly;** use `start()` and `stop()`. */
    async _step() {
        this.step();
        if(typeof this.stepCooldown == "number" && this.stepCooldown >= 1) {
            await sleep(this.stepCooldown);
        }

        this.ticks++;
        if(this.ticks >= this.goal) {
            this.stop();
        }

        if(!this.stopped) {
            requestAnimationFrame(this._step.bind(this))
        }
    }

    /** Steps the simulation. Extend the CellGrid class and implement your own!*/
    async step() {
        throw new Error("You need to extend the CellGrid class and create your own `step` function!");
    }
};

/**
 * Additional properties for the `options` parameter in the LangtonsAnt class.
 * @typedef {CellGridOptions} LangtonsAntOptions
 * @property {string} rule - The rule ants follow. The length of this string should match the length of the tiles array; otherwise, random colors will be used. 
 */

/** The rules for Langton's Ant, a type of cellular automation. @extends CellGrid */
class LangtonsAnt extends CellGrid {
    /**
     * Constructs Langton's Ant.
     * @param {HTMLElement} canvas 
     * @param {LangtonsAntOptions} options 
     */
    constructor(canvas, options = {}) {
        super(canvas, options);
        this.ants = [];
        this.rule = (options.rule ?? "RL").toUpperCase().replace(/([^LR])/g, "").split("");
        if(this.rule.length > this.tiles.length) {
            // Fill in any missing tile colors with random ones.
            this.tiles = [...this.tiles, ...Array.from({ length: this.rule.length - this.tiles.length }, () => new RGBAColor())]; // https://stackoverflow.com/a/64546606
        }
        this.chaos = false; // >:)
        this.canvas.addEventListener("click", (ev) => {
            langton.spawnAnt(new Ant(floor((ev.offsetX / window.devicePixelRatio) / this.zoom), floor((ev.offsetY / window.devicePixelRatio) / this.zoom)));
        });
    }

    /**
     * Spawns a single ant.
     * @param {Ant} ant - The ant to spawn.
     */
    spawnAnt(ant) {
        if(!(ant instanceof Ant)) throw new Error("`ant` must be of the Ant class.");
        this.ants.push(ant);
    }

    /** See CellGrid.draw(). */
    draw(x, y) {
        if(this.chaos) {
            this.spawnAnt(new Ant(x, y));
        } else {
            const tile = Math.min(this.matrix.get(x, y) + 1, this.tiles.length - 1);
            this.matrix.set(x, y, tile);
            this.setPixel(x, y, this.tiles[tile]);
        }
    }

    /** Spawns a number of ants within a length x length square at (x, y). */
    spawnPack(x, y, length, numants) {
        for(let i = 0; i < numants; i++) {
            const _x = floor(random() * (x - (x - length) + 1)) + (x - length);
            const _y = floor(random() * (y - (y - length) + 1)) + (y - length);
            this.spawnAnt(new Ant(_x, _y));
        }
    }

    /** Steps the simulation; moves all ants once. */
    async step() {
        for(let i = 0; i < this.ants.length; i++) {
            const ant = this.ants[i];
            
            // First, draw the ants previous tile.
            const tile = (ant.tile + 1) % this.tiles.length;
            this.matrix.set(ant.x, ant.y, tile);
            this.setPixel(mod(ant.x, this.width), mod(ant.y, this.height), this.tiles[tile]);

            // We get the rotation from the current tiles rule.
            // @todo may want to add more rules like "F" and "B"
            let rotation = this.rule[ant.tile];
            if(rotation == "R") {
                ant.angle = (ant.angle - 90) % 360;
            } else if(rotation == "L") {
                ant.angle = (ant.angle + 90) % 360;
            }

            // Here we manipulate the values of the ant.
            // If the ant is on, we turn it counter clockwise; otherwise, we turn it clockwise.
            // We need to truncate the resulting sin/cos values; Math.sin(180 * (Math.PI / 180)) spits out some disgusting float value that definitely is not what it should be.
            ant.x += ~~Math.cos(ant.angle * (Math.PI / 180));
            ant.y += ~~Math.sin(ant.angle * (Math.PI / 180));
            ant.tile = this.matrix.get(ant.x, ant.y);

            // Now, draw the ant on its new pixel.
            this.setPixel(mod(ant.x, this.width), mod(ant.y, this.height), ant.color);
        }
        if(this.ants.length < 1) this.stop();
    }

    /** Resets the simulation by clearing the screen and reseting all ants positions to their initial. */
    reset() {
        super.reset();
        for(const ant of this.ants) {
            ant.init();
        }
        this.start();
    }
}

/** Our representation of an ant. */
class Ant {
    constructor(x, y, color = new RGBAColor()) {
        this.initialX = x;
        this.initialY = y;
        this.color = color;
        this.init();
    }

    /** (Re)initiates the ant by setting the angle its facing and resetting its X and Y position. */
    init() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.angle = 270; // Change this to change the orientation of the ants generation.
        this.tile = 0;
    }
}

/** An implementation of Conway's Game of Life. */
class GameOfLife extends CellGrid {
    /**
     * Constructs the Game of Life.
     * @param {HTMLElement} canvas 
     * @param {CellGridOptions} options 
     */
    constructor(canvas, options = {}) {
        super(canvas, options);

        // Initialize another "back" matrix, so we dont need to create a new one every frame.
        this.matrix2 = new Matrix(this.height, this.width);

        if(this.tiles.length > 2) {
            console.warn("`tiles` has a length larger than two; using only the first two tiles.")
        }
        this.canvas.addEventListener("click", (ev) => {
            const x = floor((ev.offsetX / window.devicePixelRatio) / this.zoom);
            const y = floor((ev.offsetY / window.devicePixelRatio) / this.zoom);
            if(ev.button === this.mouseButtonErase) {
                this.erase(x, y);
            } else {
                this.draw(x, y);
            }
        });
    }

    /** See CellGrid.draw() */
    draw(x, y) {
        this.matrix.set(x, y, 1);
        this.setPixel(x, y, this.tiles[1]);
    }

    spawnLifeform(x, y, lifeform) {
        if(!(lifeform instanceof Lifeform)) throw new Error("lifeform must be of type Lifeform");
        const form = lifeform.form;
        for(let i = 0; i < form.length; i++) {
            for(let j = 0; j < form[i].length; j++) {
                if(form[i][j] == 1) this.draw(x + j, y + i, form[i][j]);
            }
        }
    }

    /**
     * Returns the amount of neighbors around the given coordinates.
     * @param {number} y - Y coordinate.
     * @param {number} x - X coordinate.
     * @returns {number}
     */
    // getNeighbors(y, x) {
    //     let neighbors = 0; // The amount of alive neighbors around `this.grid[i][j]`.
    //     /* LEFT         */ neighbors += this.matrix.get(x - 1, y);
    //     /* TOP LEFT     */ neighbors += this.matrix.get(x - 1, y - 1);
    //     /* TOP          */ neighbors += this.matrix.get(x, y - 1);
    //     /* TOP RIGHT    */ neighbors += this.matrix.get(x + 1, y - 1);
    //     /* RIGHT        */ neighbors += this.matrix.get(x + 1, y);
    //     /* BOTTOM RIGHT */ neighbors += this.matrix.get(x + 1, y + 1);
    //     /* BOTTOM       */ neighbors += this.matrix.get(x, y + 1);
    //     /* BOTTOM LEFT  */ neighbors += this.matrix.get(x - 1, y + 1);
    //     return neighbors;
    // }

    // getNeighbors(y, x) {
    //     let neighbors = 0;
    //     /* LEFT         */ neighbors += this.matrix.matrix[mod(y, this.height)][mod(x - 1, this.width)];
    //     /* TOP LEFT     */ neighbors += this.matrix.matrix[mod(y - 1, this.height)][mod(x - 1, this.width)];
    //     /* TOP          */ neighbors += this.matrix.matrix[mod(y - 1, this.height)][mod(x, this.width)];
    //     /* TOP RIGHT    */ neighbors += this.matrix.matrix[mod(y - 1, this.height)][mod(x + 1, this.width)];
    //     /* RIGHT        */ neighbors += this.matrix.matrix[mod(y, this.height)][mod(x + 1, this.width)];
    //     /* BOTTOM RIGHT */ neighbors += this.matrix.matrix[mod(y + 1, this.height)][mod(x + 1, this.width)];
    //     /* BOTTOM       */ neighbors += this.matrix.matrix[mod(y + 1, this.height)][mod(x, this.width)];
    //     /* BOTTOM LEFT  */ neighbors += this.matrix.matrix[mod(y + 1, this.height)][mod(x - 1, this.width)];
    //     return neighbors;
    // }

    getNeighbors(y, x) {
        // Instead of checking individually, loop through.
        let neighbors = 0;
        for(let ypos = y - 1; ypos <= y + 1; ypos++) {
            for(let xpos = x - 1; xpos <= x + 1; xpos++) {
                if(ypos == y && xpos == x) continue; // Our cell.
                neighbors += this.matrix.get(xpos, ypos);
            }
        }
        return neighbors;
    }

    getNeighbors(y, x) {
        // Instead of checking individually, loop through.
        let neighbors = 0;
        for(let ypos = y - 1; ypos <= y + 1; ypos++) {
            for(let xpos = x - 1; xpos <= x + 1; xpos++) {
                if(ypos == y && xpos == x) continue; // Our cell.
                neighbors += this.matrix.get(xpos, ypos);
            }
        }
        return neighbors;
    }

    /**
     * Steps the game of life.
     * 
     * For the sake of speed, we directly access the matrices here
     */
    step() {
        for(let i = 0; i < this.height; i++) { // Y
            for(let j = 0; j < this.width; j++) { // X
                let neighbors = this.getNeighbors(i, j);

                if(this.matrix.get(j, i) == 0) {
                    // If the cell is dead, and has exactly three neighbors, it becomes alive.
                    if(neighbors == 3) {
                        this.matrix2.matrix[i][j] = 1;
                    } else {
                        this.matrix2.matrix[i][j] = 0;
                    }
                } else {
                    // If the cell is alive and has less than two neighbors or greater than 3 neighbors, it dies.
                    if(neighbors == 2 || neighbors == 3) {
                        this.matrix2.matrix[i][j] = 1;
                    } else {
                        this.matrix2.matrix[i][j] = 0;
                    }
                }

                if(this.matrix2.matrix[i][j] != this.matrix.matrix[i][j]) {
                    this.setPixel(j, i, this.tiles[this.matrix2.matrix[i][j]]);
                }
            }
        }
        [this.matrix, this.matrix2] = [this.matrix2, this.matrix]; // Swap the two.
    }
}

class Lifeform {
    constructor(form) {
        if(!Array.isArray(form)) throw new Error("`form` must be a matrix.");
        this.form = form;
        this.height = form.length;
        this.width = 0;
        for(let i = 0; i < this.form.length; i++) {
            if(!Array.isArray(form[i])) throw new Error("`form` must be a matrix.")
            if(form[i].length > this.width) this.width = form[i].length;
        }
    }
}
