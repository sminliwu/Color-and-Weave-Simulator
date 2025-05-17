// this file should ONLY have globals, setup(), and draw()

// yarn colors
let color_sequence;
let color_list;
let seq_input, weft_seq_input;

// loom set-up
const defaults = {
  shafts: 4,
  treadles: 6,
  warps: 90,
  picks: 40,
  tieUp: [
    [false, true, true, false, false, true],
    [true, true, false, false, true, false],
    [true, false, false, true, false, true],
    [false, false, true, true, true, false],
  ],
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
let draft;
let stitches;
let TX, TL;
let tieUp, drawdown;
let thread_colors = { warp: "", weft: "" };

// block drafting
let blocks;

// drawing parameters
const drawParams = {
  xflip: false,
  yflip: false,
  dim_cell: 5
}

var xflip = false;
var yflip = false;

const elts = {}; // maintain collection of HTML elements created

function setup() {
  // initialize all components of the draft
  blocks = BlockSystem.fromObject(defaults.blockData);
  // print(blocks.compileBlocks());

  color_sequence = new ColorSequence();
  color_list = $("#colors-list");
  addContrastingColors();
  // TODO: add color sequence controls back in?

  color_sequence.seq = "01";

  const { shafts, treadles, warps, picks } = {...defaults};
  draft = new Draft(shafts, treadles, warps, picks);

  draft.tieupFromArray(defaults.tieUp);
  
  tieUp = draft.tieup;
  TX = draft.threading;
  TL = draft.treadling;
  drawdown = draft.drawdown;

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
  
  elts.tieup = createDiv();
  elts.tieup.id("tie-up");
  elts.tieup.parent(elts.canvas);
  
  print(blocks);
  for (let b of blocks.blocks) { loadBlock(b); }
  
  noLoop();
}

function draw() {
  background(255);
  updateDrawdown();
  updateThreadColors();
  
  const dim_cell = drawParams.dim_cell;
  stroke(0);
  strokeWeight(0.5);

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

  // background(240);

  let warp_xo = xo + xsign * dim_cell * (TL.treadles + 1);

  ddxo = xo + xsign * dim_cell * (TL.treadles + 1);
  ddyo = yo + ysign * dim_cell * (TX.shafts + 1);
  // stroke(0);

  let dispX, dispY;

  // DRAW THREADING
  for (var i = 0; i < TX.shafts; i++) {
    // Y coord (row)
    for (var j = 0; j < TX.warps; j++) {
      // X coord (col)
      if (TX.getData(i, j)) fill(0);
      else fill(255);
      dispX = ddxo + xsign * dim_cell * j;
      dispY = yo + ysign * dim_cell * (TX.shafts - 1 - i);
      rect(dispX, dispY, dim_cell, dim_cell);
    }
  }

  // DRAW TIE UP
  for (var i = 0; i < TX.shafts; i++) {
    for (var j = 0; j < TL.treadles; j++) {
      if (tieUp.getData(i, j)) fill(0);
      else fill(255);
      dispX = xo + xsign * dim_cell * (TL.treadles - 1 - j);
      dispY = yo + ysign * dim_cell * (TX.shafts - 1 - i);
      rect(dispX, dispY, dim_cell, dim_cell);
    }
  }

  // DRAW TREADLING
  for (var i = 0; i < TL.picks; i++) {
    //<>//
    for (var j = 0; j < TL.treadles; j++) {
      if (TL.getData(i, j)) fill(0);
      else fill(255);
      dispX = xo + xsign * dim_cell * (TL.treadles - 1 - j);
      dispY = ddyo + ysign * dim_cell * i;
      rect(dispX, dispY, dim_cell, dim_cell);
    }
  }

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
