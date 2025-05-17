// this file should ONLY have globals, setup(), and draw()

// yarn colors
let color_sequence;
let color_list;
let seq_input, weft_seq_input;

const defaults = {
  // loom basics
  shafts: 4,
  treadles: 6,
  warps: 90,
  picks: 90,
  tieUp: [
    [false, true, true, false, false, true],
    [true, true, false, false, true, false],
    [true, false, false, true, false, true],
    [false, false, true, true, true, false],
  ],
  // drawing parameters
  xflip: false,
  yflip: false,
  dim_cell: 5,
  // blocks
  blockData: {
    shafts: 4,
    treadles: 6,
    dir: WARP_DIRECTION,
    blocks: [
      {
        key: "1",
        name: "Block 1",
        data: "1234321",
      },
      {
        key: "2",
        name: "Block 2",
        data: "2341432",
      },
      {
        key: "3",
        name: "Block 3",
        data: "12121212",
      },
    ],
    block_seq: "121233123",
  },
};

// pattern data
// let draft;
// let stitches;
// let TX, TL;
// let tieUp, drawdown;
let thread_colors = { warp: "", weft: "" };

// block drafting
// let blocks;

// TODO: initialize more things outside of setup() because P5 is slow

const { shafts, treadles, warps, picks } = {...defaults};
const draft = new Draft(shafts, treadles, warps, picks);
const blocks = BlockSystem.fromObject(defaults.blockData);

draft.tieupFromArray(defaults.tieUp);
const { TX, TL, tieUp, drawdown } = { 
  TX: draft.threading, 
  TL: draft.treadling, 
  tieUp: draft.tieup, 
  drawdown: draft.drawdown
};
console.log(draft.tieup, tieUp);

console.log("draft initialized");

const elts = {}; // maintain collection of HTML elements created

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM fully loaded and parsed");
});
window.addEventListener("load", (event) => {
  console.log("page is fully loaded");
});

function setup() {
  console.log("running p5 setup function");
  // initialize all components of the draft
  // print(blocks.compileBlocks());

  color_sequence = new ColorSequence();
  color_list = $("#colors-list");
  addContrastingColors();
  // TODO: add color sequence controls back in?

  color_sequence.seq = "01";

  // tieUp = draft.tieup;
  // TX = draft.threading;
  // TL = draft.treadling;
  // drawdown = draft.drawdown;

  TX.blocks = blocks;
  TX.blockSeq = defaults.blockData.block_seq;
  let blockInput = createInput(TX.blockSeq);
  blockInput.parent('#block-sequence');
  blockInput.input(() => {
    if (blockInput.value().length > 0) {
      TX.blockSeq = blockInput.value();
      treadleAsWarped();
      redraw();
    }
  })
  
  treadleAsWarped();
  loadSettings();
  // just load canvas in BG and fullsize (z-index = -1)
  elts.canvas = createCanvas(windowWidth, windowHeight);
  elts.canvas.parent('#page');
  elts.canvas.style("z-index", -1);
  
  elts.blocks = select('#blocks-container');
  elts.draft = select('#draft-container')
  // console.log(elts.draft);
  
  // elts.tieup = createDiv();
  // elts.tieup.id("tie-up");
  // elts.tieup.parent(elts.draft); 
  // tieUp.setup(elts.tieup, { cell_size: defaults.dim_cell, xflip: true, yflip: false });

  // elts.tx = createDiv();
  // elts.tx.id("threading");
  // elts.tx.parent(elts.draft);
  // TX.setup(elts.tx, { cell_size: defaults.dim_cell, xflip: false, yflip: false });
  
  // print(blocks);
  // initialize grid renderers here
  for (let b of blocks.blocks) { loadBlock(b); }
  blocks.blocks.map((b) => b.render.updatePos());
  
  draft.setup(defaults.dim_cell);
  
  noLoop();
  redraw();
}

function draw() {
  background(255);
  updateDrawdown();
  updateThreadColors();
  
  const dim_cell = defaults.dim_cell;
  stroke(0);
  strokeWeight(0.5);

  let xflip = false;
  let yflip = false;
  // use the elements stored in elts to position the drawing
  let xsign = xflip ? -1 : 1;
  let ysign = yflip ? -1 : 1;

  // render the blocks
  for (let b of blocks.blocks) {
    b.draw();
  }
  
  // render the draft
  let xo = xflip ? windowWidth : elts.draft.position().x;
  let yo = yflip ? windowHeight : elts.draft.position().y;

  ddxo = xo + xsign * dim_cell * (TL.treadles + 1);
  ddyo = yo + ysign * dim_cell * (TX.shafts + 1);
  // stroke(0);

  let dispX, dispY;

  TX.draw();
  tieUp.draw();
  TL.draw();
  drawdown.draw();

  // DRAWDOWN
  noStroke();
  let match = color_sequence.match;
  for (var i = 0; i < TL.picks; i++) {
    for (var j = 0; j < TX.warps; j++) {
      let thread;
      if (match) {
        thread = drawdown.getData(i, j)
          ? thread_colors.warp[j]
          : thread_colors.warp[i];
      } else {
        thread = drawdown.getData(i, j)
          ? thread_colors.warp[j]
          : thread_colors.weft[i];
      }
      if (color_sequence.getColor(thread)) {
        fill(color_sequence.getColor(thread).color);
        dispX = ddxo + xsign * dim_cell * j;
        dispY = ddyo + ysign * dim_cell * i;
        rect(dispX, dispY, dim_cell, dim_cell);
      }
    }
  }
}
