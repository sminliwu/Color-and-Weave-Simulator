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
        data: "123432",
      },
      {
        key: "2",
        data: "12341432",
      },
      {
        key: "3",
        data: "12121212",
      },
    ],
  },
};

let thread_colors = { warp: "", weft: "" };

// TODO: initialize more things outside of setup() because P5 is slow
// initialize all components of the draft
const { shafts, treadles, warps, picks } = {...defaults};
const draft = new Draft(shafts, treadles, warps, picks);
const blocks = BlockSystem.fromObject(defaults.blockData);

// draft.tieupFromArray(defaults.tieUp);
draft.twillTieUp(4, 2);
const { TX, TL, tieUp, drawdown } = { 
  TX: draft.threading, 
  TL: draft.treadling, 
  tieUp: draft.tieup, 
  drawdown: draft.drawdown
};
// console.log(draft.tieup, tieUp);

console.log("draft initialized");

const elts = {}; // maintain collection of HTML elements created

function setup() {
  console.log("running p5 setup function");

  color_sequence = new ColorSequence();
  color_list = $("#colors-list");
  addContrastingColors();
  // TODO: add color sequence controls back in?

  color_sequence.seq = "01";

  TX.blocks = blocks;
  TX.blockSeq = blocks.randomSeq(draft.warps);
  let blockInput = createInput(TX.blockSeq);
  blockInput.parent('#block-sequence');
  blockInput.input(() => {
    if (blockInput.value().length > 0) {
      TX.blockSeq = blockInput.value();
      treadleAsWarped();
      redraw();
    }
  })
  let randomBlocks = createButton("Randomize!");
  randomBlocks.attribute('title', 'Click to generate a random sequence of blocks that fills the draft.')
  randomBlocks.parent('#block-sequence');
  randomBlocks.mousePressed(() => {
    blockInput.value(blocks.randomSeq(draft.warps));
    TX.blockSeq = blockInput.value();
    treadleAsWarped();
    redraw();
  })
  
  treadleAsWarped();
  loadSettings();
  // just load canvas in BG and fullsize (z-index = -1)
  elts.canvas = createCanvas(windowWidth, windowHeight);
  elts.canvas.parent('#page');
  elts.canvas.style("z-index", -1);
  
  elts.blocks = select('#blocks-container');
  elts.draft = select('#draft-container')

  // initialize grid renderers here
  elts.addBlock = createButton("+");
  elts.addBlock.parent(elts.blocks);
  elts.addBlock.class("add-button");
  elts.addBlock.attribute('title', "Click to add a new block.")
  blocks.setup(blockInput, elts.addBlock, defaults.dim_cell, 2);
  
  // addBlock.attribute('disabled', true); // TODO: make this work
  // TODO: add delete block buttons to cards
  // for (let b of blocks.blocks) { loadBlock(b); }
  
  blocks.blocks.map((b) => b.render.updatePos());
  
  elts.addBlock.mouseClicked(() => {
    let b = blocks.newBlock();
    blocks.setupBlock(b);
    redraw();
  });
  
  draft.setup(defaults.dim_cell);

  let maxY = elts.dd.position().y + elts.dd.height;
  resizeCanvas(windowWidth, maxY);

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

  // DRAWDOWN
  // TODO: let user choose between show thread colors and don't show (B+W draft)
  // drawdown.draw();

  // this version draws the thread colors
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
