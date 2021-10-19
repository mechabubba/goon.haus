/** 
 * # cells.js
 * Cellular automata in the HTML canvas.
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
 * - on some rows and columns pixels are malformed. see: https://b.catgirlsare.sexy/jf-krTsZWhlx.png, one horz line is narrower than the rest
 * - line drawing might need to be rewritten
 * - `??` operator doesnt work on some browsers
 */

/**
 * Tests whether two arrays are equal.
 * Source: https://stackoverflow.com/a/16436975
 * @param {*[]} that - The array to test.
 * @returns {boolean} - Whether the arrays are equal.
 */
Array.prototype.equals = function(that) {
    if(this === that) return true;
    if(this == null || that == null) return false;
    if(this.length !== that.length) return false;
    for(let i = 0; i < this.length; ++i) {
        if(this[i] !== that[i]) return false;
    }
    return true;
};

/**
 * Gets the hexadecimal byte offset of a number.
 * @returns {string}
 */
Number.prototype.byte = function() {
    return Math.abs(this % 256).toString(16).padStart(2, "0");
}

/**
 * Halts operation for a given amount of milliseconds.
 * @param {number} ms - How long to sleep.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The default CellGrid `options` object.
 * @typedef {Object} CellGridOptions
 * @property {Color[]} tiles - Various colors representing various different states of cells - index 0 will always the background. Represents an array of RGBA colors. Defaults to `[new Color(0, 0, 0), new Color(255, 255, 255)]`.
 * @property {Color} bgOverride - The background override. Appears visually as its own color, but treated as `this.tiles[0]`.
 * @property {number} zoom - The scale of the simulation; a value of `1` matches your resolution. Default: `4` (I find it most appealing on my own resolution ;D).
 * @property {number} stepCooldown - How long it takes between mutations, in milliseconds. Default: `1`.
 * @property {boolean} enableAlpha - Should the canvas handle alpha values? Disabling this improves preformance. Default: `true`.
 * @property {boolean} enableContextMenu - Should we enable the context menu? Default: `false`.
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

        this.tiles = options.tiles ?? [new Color(0, 0, 0), new Color(255, 255, 255)];
        this.bgOverride = options.bgOverride;
        this.zoom = options.zoom ?? 4;
        this.stepCooldown = options.stepCooldown ?? 1;
        this.enableAlpha = options.enableAlpha ?? true;
        this.enableContextMenu = options.enableContextMenu ?? false;

        this.canvas.setAttribute("width", (Math.round((this.canvas.clientWidth / window.devicePixelRatio) / this.zoom)));
        this.canvas.setAttribute("height", (Math.round((this.canvas.clientHeight / window.devicePixelRatio) / this.zoom)));
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.init();
    }

    /**
     * (Re)initiates the grid and canvas.
     */
    init() {
        this.ctx = this.canvas.getContext("2d", { alpha: this.enableAlpha });
        this.grid = Array(this.height).fill(0);
        for(let i = 0; i < this.height; i++) {
            this.grid[i] = Array(this.width).fill(0);
        }

        if(!this.enableContextMenu) {
            this.canvas.addEventListener("contextmenu", (ev) => ev.preventDefault()); // Disables the context menu.
        }

        this.ticks = 0;
        this.goal = 0;

        const color = this.bgOverride instanceof Color ? this.bgOverride : this.tiles[0];
        this.ctx.fillStyle = `rgba(${color.rgba})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Gets a color from a pixel on the canvas.
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @returns {Color} The color data from the grid.
     */
    getPixel(x, y) {
        return new Color(this.ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data);
    }

    /**
     * Sets a color to a pixel on the canvas.
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {Color} color - The color to set.
     */
    setPixel(x, y, color) {
        if(!(color instanceof Color)) {
            throw new Error("color must be a Color object.");
        }

        const img = this.ctx.createImageData(1, 1);
        img.data[0] = color.r; img.data[1] = color.g; img.data[2] = color.b; img.data[3] = color.a;
        this.ctx.putImageData(img, x, y)
    }

    /**
     * Starts the simulation to run indefinitely.
     * You can set the `goal` property at any time to make it up until a point; by default, it runs to `Number.MAX_SAFE_INTEGER`.
     */
    start() {
        this.stepTo(Number.MAX_SAFE_INTEGER);
    }

    /**
     * Steps the simulation. Extend the CellGrid class and implement your own!
     */
    step() {
        throw new Error("You need to extend the CellGrid class and create your own `step` function!");
    }

    /**
     * Stops the simulation.
     */
    stop() {
        this.stopped = true;
    }

    /**
     * Stops and resets everything.
     */
    reset() {
        this.stop();
        this.init();
    }

    /**
     * Steps to a certain tick.
     * @param {number} to - The tick to step to.
     */
    stepTo(to) {
        if(this.stopped) {
            this.stopped = false;
        }
        this.goal = to;
        requestAnimationFrame(this.step.bind(this))
    }
};

/**
 * Additional properties for the `options` parameter in the LangtonsAnt class.
 * @typedef {CellGridOptions} LangtonsAntOptions
 * @property {string} pattern - The pattern ants follow. The length of this string must match the length of the tiles array. 
 */

/**
 * The rules for Langton's Ant, a type of cellular automation.
 * @extends CellGrid
 */
class LangtonsAnt extends CellGrid {
    /**
     * Constructs the Langton's Ant grid.
     * @param {HTMLElement} canvas 
     * @param {?LangtonsAntOptions} options 
     */
    constructor(canvas, options = {}) {
        super(canvas, options);

        this.ants = [];
        this.rule = (options.rule ?? "RL").split("");
        if(this.rule.length > this.tiles.length) {
            // Fill in any missing tile colors with random ones.
            this.tiles = [...this.tiles, ...Array.from({ length: this.rule.length - this.tiles.length }, () => Color.random())]; // https://stackoverflow.com/a/64546606
        }
        this.chaos = false; // >:D

        this.canvas.addEventListener("click", (ev) => {
            langton.spawnAnt(new Ant(Math.floor((ev.offsetX / window.devicePixelRatio) / this.zoom), Math.floor((ev.offsetY / window.devicePixelRatio) / this.zoom)))
        });

        /** ## Drawing Stuff */
        this.canvas.addEventListener("mousedown", (ev) => {
            if(ev.button !== 2) return;
            this._painting = true;
            this._lastX = Math.floor((ev.offsetX / window.devicePixelRatio) / this.zoom);
            this._lastY = Math.floor((ev.offsetY / window.devicePixelRatio) / this.zoom);
        });

        this.canvas.addEventListener("mouseup", (ev) => {
            if(ev.button !== 2) return;
            this._painting = false;
        });

        this.canvas.addEventListener("mousemove", (ev) => {
            if(this._painting) {
                let x1 = this._lastX ?? Math.floor((ev.offsetX / window.devicePixelRatio) / this.zoom);
                let y1 = this._lastY ?? Math.floor((ev.offsetY / window.devicePixelRatio) / this.zoom);
                let x2 = Math.floor((ev.offsetX / window.devicePixelRatio) / this.zoom);
                let y2 = Math.floor((ev.offsetY / window.devicePixelRatio) / this.zoom);
            
                let dx = x2 - x1;
                let dy = y2 - y1;
            
                let steps;
                if(Math.abs(dx) > Math.abs(dy)) {
                    steps = Math.abs(dx);
                } else {
                    steps = Math.abs(dy);
                }
            
                let incX = dx / steps;
                let incY = dy / steps;
                let x = x1;
                let y = y1;
            
                for(let i = 0; i < steps; i++) {
                    x = x + incX;
                    y = y + incY;
                    let _x = Math.floor(x < 0 ? 0 : x);
                    let _y = Math.floor(y < 0 ? 0 : y);
                
                    if(this.chaos) {
                        this.spawnAnt(new Ant(_x, _y));
                    } else {
                        const tile = Math.min(this.grid[_y][_x] + 1, this.tiles.length - 1);
                        this.grid[_y][_x] = tile;
                        this.setPixel(_x, _y, this.tiles[tile]);
                    }
                }
            
                this._lastX = x2;
                this._lastY = y2;
            }
        });
    }

    /**
     * Spawns a single ant.
     * @param {Ant} ant - he
     */
    spawnAnt(ant) {
        if(!ant instanceof Ant) throw new Error("`ant` must be of the Ant class.");
        this.ants.push(ant);
        if(langton.stopped) langton.start();
    }

    /**
     * Spawns a pack of ants within a length x length square.
     * @param {number} x - X coordinate on the grid.
     * @param {number} y - Y coordinate on the grid.
     * @param {number} length - The length of the box.
     * @param {number} numants - The number of ants to place.
     */
    spawnPack(x, y, length, numants) {
        for(let i = 0; i < numants; i++) {
            const _x = Math.floor(Math.random() * (x - (x - length) + 1)) + (x - length);
            const _y = Math.floor(Math.random() * (y - (y - length) + 1)) + (y - length);
            this.spawnAnt(new Ant(_x, _y));
        }
    }

    /**
     * Steps the simulation; moves all ants once.
     */
    async step() {
        for(let i = 0; i < this.ants.length; i++) {
            const ant = this.ants[i];
            
            // First, draw the ants previous tile.
            const tile = (ant.tile + 1) % this.tiles.length;
            this.setPixel(ant.x, ant.y, this.tiles[tile]);
            this.grid[ant.y][ant.x] = tile;

            // We get the rotation from the current tiles rule.
            const rotation = this.rule[ant.tile] == "R" ? -90 : 90; // Change this to flip the orientation of the ant.

            // Here we manipulate the values of the ant.
            // If the ant is on, we turn it counter clockwise; otherwise, we turn it clockwise.
            // We need to truncate the resulting sin/cos values; Math.sin(180 * (Math.PI / 180)) spits out some disgusting float value that definitely is not what it should be.
            ant.angle = (ant.angle + rotation) % 360;
            ant.x += ~~Math.cos(ant.angle * (Math.PI / 180));
            ant.y += ~~Math.sin(ant.angle * (Math.PI / 180));

            // If the ant is out of bounds, we remove it.
            if(ant.x < 0 || ant.y < 0 || ant.x > (this.width - 1) || ant.y > (this.height - 1)) {
                this.ants.splice(i--, 1);
                continue;
            }
            ant.tile = this.grid[ant.y][ant.x];

            // Now, draw the ant on its new pixel.
            this.setPixel(ant.x, ant.y, ant.color);
        }
        this.ticks++;

        if(this.ants.length < 1) this.stop();
        if(typeof this.stepCooldown == "number" && this.stepCooldown >= 1) await sleep(this.stepCooldown);

        if(!this.stopped || (this.ticks >= this.goal)) {
            requestAnimationFrame(this.step.bind(this));
        }
    }

    /**
     * Resets the simulation; clears the screen and resets all ants positions.
     */
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
    /**
     * Constructs an Ant.
     * @param {number} x - The ant's x coordinate.
     * @param {number} y - The ant's y coordinate.
     * @param {?Color} color - The ant's color; if not provided, a random color is chosen.
     */
    constructor(x, y, color = new Color()) {
        this.initialX = x;
        this.initialY = y;
        this.color = color;
        this.init();
    }

    /**
     * (Re)initiates the ant.
     */
    init() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.angle = 270; // Change this to change the orientation of the ants generation.
        this.tile = 0;
    }
}

/** A class representing a 32 bit RGBA color. */
class Color {
    /**
     * Constructs a color from given RGBA values.
     * - Values, if not provided, default to random values clamped between 0 to 255. 
     * - Alpha, if not provided, defaults to an opaque 255.
     * @param {number|number[]} r - The red value. Alternatively, if an array is passed in, the color values are taken from this array and g, b, and a are ignored.
     * @param {number} g - The green value.
     * @param {number} b - The blue value.
     * @param {number} a - The alpha value.
     */
    constructor(r, g, b, a = 255) {
        if(Array.isArray(r)) {
            this.r = Math.abs(r[0] ?? Color.randomValue()) % 256 | 0;
            this.g = Math.abs(r[1] ?? Color.randomValue()) % 256 | 0;
            this.b = Math.abs(r[2] ?? Color.randomValue()) % 256 | 0;
            this.a = Math.abs(r[3] ?? Color.randomValue()) % 256 | 0;
        } else {
            this.r = Math.abs(r ?? Color.randomValue()) % 256 | 0;
            this.g = Math.abs(g ?? Color.randomValue()) % 256 | 0;
            this.b = Math.abs(b ?? Color.randomValue()) % 256 | 0;
            this.a = Math.abs(a ?? Color.randomValue()) % 256 | 0;
        }
    }

    /**
     * Gets a string of the colors hexadecimal representation.
     * @returns {string} A colors hexadecimal representation.
     */
    get hex() {
        return this.r.byte() + this.g.byte() + this.b.byte() + this.a.byte();
    }

    /**
     * Gets an array of the colors RGBA representation.
     * @returns {number[]} An RGBA color in array form.
     */
    get rgba() {
        return [this.r, this.g, this.b, this.a];
    }

    /**
     * Gets a random color object.
     * @returns {Color} A Color with random values.
     */
    static random = () => new this();

    /**
     * Gets a random 8 bit value
     * @returns {number} A number from 0 - 255.
     */
    static randomValue() {
        return Math.floor(Math.random() * (2 ** 8));
    }

    /**
     * Tests if a color equals another color.
     * @param {Color} col - The Color to check.
     * @returns {boolean} If they're equal or not.
     */
    equals(col) {
        if(this === col) {
            return true;
        } else {
            return this.r === col.r && this.g === col.g && this.b === col.b && this.a === col.a;
        }
    }
}
