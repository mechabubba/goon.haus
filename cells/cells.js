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

// Shorthand for some functions.
const abs = Math.abs;
const floor = Math.floor;

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
            this.r = abs(r[0] ?? Color.randomValue()) % 256 | 0;
            this.g = abs(r[1] ?? Color.randomValue()) % 256 | 0;
            this.b = abs(r[2] ?? Color.randomValue()) % 256 | 0;
            this.a = abs(r[3] ?? Color.randomValue()) % 256 | 0;
        } else {
            this.r = abs(r ?? Color.randomValue()) % 256 | 0;
            this.g = abs(g ?? Color.randomValue()) % 256 | 0;
            this.b = abs(b ?? Color.randomValue()) % 256 | 0;
            this.a = abs(a ?? Color.randomValue()) % 256 | 0;
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
    static randomValue = () => floor(Math.random() * (2 ** 8));

    /**
     * Tests if a color equals another color.
     * @param {Color} col - The Color to check.
     * @returns {boolean} If they're equal or not.
     */
    equals(col) {
        if(this === col) return true;
        return this.r == col.r && this.g == col.g && this.b == col.b && this.a == col.a;
    }
}

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

        this.tiles = options.tiles ?? [new Color(0, 0, 0), new Color(255, 255, 255)];
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

        if(this.enableDrawing) {
            this.canvas.addEventListener("mousedown", (ev) => {
                if(ev.button == this.mouseButtonDraw) {
                    this._drawing = true;
                } else if(ev.button == this.mouseButtonErase) {
                    this._erasing = true;
                } else {
                    return;
                }
                this._lastX = floor((ev.offsetX / window.devicePixelRatio) / this.zoom);
                this._lastY = floor((ev.offsetY / window.devicePixelRatio) / this.zoom);
            });
    
            this.canvas.addEventListener("mouseup", (ev) => {
                if(ev.button == this.mouseButtonDraw) {
                    this._drawing = false;
                } else if(ev.button == this.mouseButtonErase) {
                    this._erasing = false;
                } else {
                    return;
                }
            });
    
            this.canvas.addEventListener("mousemove", (ev) => {
                if(this._drawing || this._erasing) {
                    let x1 = this._lastX ?? floor((ev.offsetX / window.devicePixelRatio) / this.zoom);
                    let y1 = this._lastY ?? floor((ev.offsetY / window.devicePixelRatio) / this.zoom);
                    let x2 = floor((ev.offsetX / window.devicePixelRatio) / this.zoom);
                    let y2 = floor((ev.offsetY / window.devicePixelRatio) / this.zoom);
                
                    this.drawLine(x1, y1, x2, y2);
                }
            });
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
        this.grid = Array(this.height).fill(0);
        for(let i = 0; i < this.height; i++) {
            this.grid[i] = Array(this.width).fill(0);
        }

        this.ticks = 0;
        this.goal = Number.MAX_SAFE_INTEGER;
        this.stopped = true;

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
        return new Color(this.ctx.getImageData(floor(x), floor(y), 1, 1).data);
    }

    /**
     * Sets a color to a pixel on the canvas.
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {Color} color - The color to set.
     */
    setPixel(x, y, color) {
        if(!(color instanceof Color)) throw new Error("color must be a Color object.");

        const img = this.ctx.createImageData(1, 1);
        img.data[0] = color.r; img.data[1] = color.g; img.data[2] = color.b; img.data[3] = color.a;
        this.ctx.putImageData(img, x, y)
    }

    /**
     * Draws a line between two points.
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     */
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

    /**
     * What to do when we want to "draw" a pixel. Extend this in your own class!
     * @param {number} x 
     * @param {number} y 
     */
    draw(x, y) {
        const tile = Math.min(this.grid[y][x] + 1, this.tiles.length - 1);
        this.grid[y][x] = tile;
        this.setPixel(x, y, this.tiles[tile]);
    }

    /**
     * What to do when we want to "erase" a pixel. Extend this in your own class!
     * @param {number} x 
     * @param {number} y 
     */
    erase(x, y) {
        this.grid[y][x] = 0;
        this.setPixel(x, y, this.tiles[0]);
    }

    /**
     * Starts the simulation to run indefinitely.
     * You can set the `goal` property at any time to make it up until a point; by default, it runs to `Number.MAX_SAFE_INTEGER`.
     */
    start() {
        if(!this.stopped) {
            console.warn("Simulation already started; not starting again.");
            return;
        }
        this.stopped = false;
        requestAnimationFrame(this._step.bind(this))
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
     * Sets up recursively looping steps.
     * Not meant to be used by developers; use `this.start()` and `this.stop()`, and modify `this.goal` to wherever you want your simulation to stop.
     */
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

    /**
     * Steps the simulation. Extend the CellGrid class and implement your own!
     */
     async step() {
        throw new Error("You need to extend the CellGrid class and create your own `step` function!");
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
        this.rule = (options.rule ?? "RL").toUpperCase().replace(/([^LR])/g, "").split("");
        if(this.rule.length > this.tiles.length) {
            // Fill in any missing tile colors with random ones.
            this.tiles = [...this.tiles, ...Array.from({ length: this.rule.length - this.tiles.length }, () => Color.random())]; // https://stackoverflow.com/a/64546606
        }
        this.chaos = false;

        this.canvas.addEventListener("click", (ev) => {
            langton.spawnAnt(new Ant(floor((ev.offsetX / window.devicePixelRatio) / this.zoom), floor((ev.offsetY / window.devicePixelRatio) / this.zoom)));
        });
    }

    /**
     * Spawns a single ant.
     * @param {Ant} ant - The ant to spawn.
     */
    spawnAnt(ant) {
        if(!ant instanceof Ant) throw new Error("`ant` must be of the Ant class.");
        this.ants.push(ant);
        if(langton.stopped) langton.start();
    }

    /**
     * LangtonsAnt's drawing function.
     * @param {number} x
     * @param {number} y
     */
    draw(x, y) {
        if(this.chaos) { // >:)
            this.spawnAnt(new Ant(x, y));
        } else {
            const tile = Math.min(this.grid[y][x] + 1, this.tiles.length - 1);
            this.grid[y][x] = tile;
            this.setPixel(x, y, this.tiles[tile]);
        }
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
            const _x = floor(Math.random() * (x - (x - length) + 1)) + (x - length);
            const _y = floor(Math.random() * (y - (y - length) + 1)) + (y - length);
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
        if(this.ants.length < 1) this.stop();
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

/** An implementation of Conway's Game of Life. */
class GameOfLife extends CellGrid {
    /**
     * Constructs the Game of Life.
     * @param {HTMLElement} canvas 
     * @param {CellGridOptions} options 
     */
    constructor(canvas, options = {}) {
        super(canvas, options);
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
        this.grid[y][x] = 1;
        this.setPixel(x, y, this.tiles[1]);
    }

    /**
     * Returns the amount of neighbors around the given coordinates.
     * @param {number} y - Y coordinate.
     * @param {number} x - X coordinate.
     * @returns {number}
     */
    getNeighbors(y, x) {
        let neighbors = 0; // The amount of alive neighbors around `this.grid[i][j]`.
        /* LEFT         */ if(x - 1 > -1) neighbors += this.grid[y][x - 1];
        /* TOP LEFT     */ if((x - 1 > -1) && (y - 1 > -1)) neighbors += this.grid[y - 1][x - 1];
        /* TOP          */ if(y - 1 > -1) neighbors += this.grid[y - 1][x];
        /* TOP RIGHT    */ if((y - 1 > -1) && (x + 1 < this.grid[y].length)) neighbors += this.grid[y - 1][x + 1];
        /* RIGHT        */ if(x + 1 < this.grid[y].length) neighbors += this.grid[y][x + 1];
        /* BOTTOM RIGHT */ if((x + 1 < this.grid[y].length) && (y + 1 < this.grid.length)) neighbors += this.grid[y + 1][x + 1];
        /* BOTTOM       */ if(y + 1 < this.grid.length) neighbors += this.grid[y + 1][x];
        /* BOTTOM LEFT  */ if((y + 1 < this.grid.length) && (x - 1 > -1)) neighbors += this.grid[y + 1][x - 1];
        return neighbors;
    }

    /**
     * Steps the game of life.
     */
    step() {
        const back = [];
        for(let i = 0; i < this.grid.length; i++) {
            back.push([]);
            for(let j = 0; j < this.grid[i].length; j++) {
                let neighbors = this.getNeighbors(i, j);

                if(this.grid[i][j] == 0) {
                    // If the cell is dead, and has exactly three neighbors, it becomes alive.
                    if(neighbors == 3) {
                        back[i][j] = 1;
                    } else {
                        back[i][j] = 0;
                    }
                } else {
                    // If the cell is alive and has less than two neighbors or greater than 3 neighbors, it dies.
                    if(neighbors == 2 || neighbors == 3) {
                        back[i][j] = 1;
                    } else {
                        back[i][j] = 0;
                    }
                }

                if(back[i][j] != this.grid[i][j]) {
                    this.setPixel(j, i, this.tiles[back[i][j]]);
                }
            }
        }
        this.grid = back;
    }
}
