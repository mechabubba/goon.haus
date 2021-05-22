/**
 * === Langton's Ant Simulation ===
 * Made in Javascript using the HTML canvas.
 */
class LangtonGrid {
    constructor(element, cols = ["000000FF", "FFFFFFFF"]) {
        if(!element || element.tagName.toLowerCase() != "canvas") throw new Error("Element must be canvas.");
        if(cols.length > 2) console.warn("More than two colors provided, using the first two as off and on respectively.");
        this.element = element;
        this.cols = cols;
        this.width = this.element.width;
        this.height = this.element.height;
        this.ants = [];
        this.cooldown = 1; // in ms (don't set this to zero, worst mistake of my life)

        this.init();
    }

    init() {
        this.ticks = 0;
        this.goal = 0;
        this.ctx = this.element.getContext("2d");
        this.ctx.fillStyle = `#${this.cols[0]}`;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    spawnAnt(ant) {
        if(!ant instanceof Ant) throw new Error("ant must be of the Ant class.");
        this.ants.push(ant);
    }

    spawnPack(x, y, length, numants) {
        for(let i = 0; i < numants; i++) {
            let _x = Math.floor(Math.random() * (x - (x - length) + 1)) + (x - length);
            let _y = Math.floor(Math.random() * (y - (y - length) + 1)) + (y - length);
            this.spawnAnt(new Ant(_x, _y, randomcolor()));
        }
    }

    getPixel(x, y) {
        return rgb2h(this.ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data);
    }

    setPixel(x, y, col) {
        if(typeof col != "string") throw new Error("col must be a hexadecimal color.");
        let img = this.ctx.createImageData(1, 1);
        let rgb = h2rgb(col);
        img.data[0] = rgb[0];
        img.data[1] = rgb[1];
        img.data[2] = rgb[2];
        img.data[3] = rgb[3];
        this.ctx.putImageData(img, x, y)
    }

    isOn(x, y) {
        return !(this.getPixel(x, y) == this.cols[0]);
    }
    

    start() {
        this.stopped = false;
        this.stepTo(Number.MAX_SAFE_INTEGER);
    }

    stop() {
        this.stopped = true;
    }

    reset() {
        this.stop();
        this.init();
        for(const ant of this.ants) {
            ant.init();
        }
    }

    async stepTo(to) {
        if(typeof to == "undefined") throw new Error("You must provide a tick to step to. Use start() to tick infinitely.");
        this.goal = to;
        while(!this.stopped && (this.ticks < this.goal) && this.ants.length > 0) {
            this.step();
            this.ticks++;
            await sleep(this.cooldown);
        }
    }

    step() {
        for(let i = 0; i < this.ants.length; i++) {
            let ant = this.ants[i];

            let _x = ant.x;
            let _y = ant.y;
            let _cur = ant.curTile;

            ant.updateAngle();

            ant.x += Math.cos(ant.facing * 90 * (Math.PI / 180));
            ant.y += Math.sin(ant.facing * 90 * (Math.PI / 180));
            ant.curTile = this.isOn(ant.x, ant.y);
            this.setPixel(_x, _y, _cur ? this.cols[0] : this.cols[1]);

            if(ant.x < 0 || ant.y < 0 || ant.x > this.width || ant.y > this.length) {
                this.ants.splice(i--, 1);
                continue;
            }

            this.setPixel(ant.x, ant.y, ant.col);
        }
    }
};

class Ant {
    constructor(x, y, col = randomcolor()) {
        this.init_x = x;
        this.init_y = y;
        this.col = col;

        this.init();
    }

    init() {
        this.x = this.init_x;
        this.y = this.init_y;
        this.facing = 0;
        this.curTile = false;
    }

    updateAngle() {
        let val = this.curTile ? -1 : 1;
        this.facing += val;
        if(this.facing < 0) this.facing = 3;
        else if(this.facing > 3) this.facing = 0;
    }
}

const zoom = 4; // Simulation scale.

const randomcolor = () => {
    let col = Math.floor(Math.random() * ((256 ** 3) - 1)).toString(16);
    return (new Array(7 - (col + "").length).join("0") + col + "FF").toUpperCase();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The following two functions are modified from https://stackoverflow.com/a/39077686.
 */
const h2rgb = (hex) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        typeof result[4] == "undefined" ? 255 : parseInt(result[4], 16)
    ] : null;
};

const rgb2h = (rgb) => [rgb[0], rgb[1], rgb[2], rgb[3]]
    .map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();

/**
 * This function is necessary to get correct dimensions and coordinates within the canvas, in pixels.
 */
const c = (x) => (x * window.devicePixelRatio) / zoom;

const canvas = document.getElementById("langton");

/**
 * Helps scale the canvas. This mainly fixes correct scaling when `scale = 1` (the pixels aren't aliased or otherwise malformed).
 * Source: https://medium.com/wdstack/fixing-html5-2d-canvas-blur-8ebe27db07da
 */
canvas.style.width = document.body.clientWidth + "px";
canvas.style.height = document.body.clientHeight + "px";
canvas.setAttribute("width", c(+canvas.style.width.slice(0, -2)));
canvas.setAttribute("height", c(+canvas.style.height.slice(0, -2)));

const langton = new LangtonGrid(canvas, ["000000FF", "00000000"]);
canvas.addEventListener("click", (ev) => {
    langton.spawnAnt(new Ant(c(ev.clientX), c(ev.clientY)))
});

langton.spawnPack(Math.floor(langton.width / 2), Math.floor(langton.height / 2), 10, 5);
langton.start();