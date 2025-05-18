const WARP_DIRECTION = 1;
const WEFT_DIRECTION = -1;
const NO_DIRECTION = 0;

class BlockSystem {
  // an object representing a set of blocks used to create a larger draft. Really similar to ColorSequence except blocks need a small Draft Container to hold a binary array.
  constructor(s, t, dir) {
    // all blocks need to share the same number of treadles and shafts
    this.shafts = s;
    this.treadles = t;
    this.dir = dir; // whether these are warp (threading) blocks or weft (treadling) blocks

    this.blocks = []; // all individual Block objects
    this.seq = ''; // store a sequence of blocks as string of their key characters
  }
  
  static fromObject(preset) {
    let sys = new BlockSystem(preset.shafts, preset.treadles, preset.dir)

    // use OF not IN!
    for (let b of preset.blocks) {
      // console.log(b)
      sys.loadBlockData(b);
    }
    sys.seq = preset.block_seq;
    return sys;
  }
  
  get length() { return this.blocks.length; }
  get keys() { return this.blocks.map(b => b.key); }
  
  loadBlockData(params) {
    let b = new Block(this.length+1, params.name, this);
    b.data = params.data;
    // b.stringToArrayData();
    this.blocks.push(b);
  }
  
  newBlock() {
    let i = this.length+1;
    let name = "Block " + i;
    let b = new Block(i, name, this, '');
    this.blocks.push(b);
    return b;
  }

  delBlock(key) {
    this.blocks = this.blocks.filter((b) => b.key != key);
  }

  rekeyBlock(oldKey, newKey) {
    const b = this.getBlock(oldKey);
    if (this.keys.includes(newKey)) {
      let otherB = this.getBlock(newKey);
      otherB.key = oldKey;
    }
    b.key = newKey;
  }

  getBlock(c) {
    return this.blocks.filter((el) => el.key == c)[0];
  }
  
  compileBlocks(){
    // take the block sequence and the blocks and make a longer string to represent a threading or treadling sequence
    // print(this);
    let res = '';
    print("compiling blocks...", this.blocks, this.seq);
    for (let c of this.seq) {
      let b = this.blocks[parseInt(c)-1];
      res += b.data;
    }
    
    return res;
  }

  /**
   * Generate a random sequence of blocks that are at least n threads long.
   * @param {int} n 
   */
  randomSeq(n) {
    let seq = "";
    let len = 0;
    while (len < n) {
      let x = random(this.keys);
      let b = this.getBlock(x);
      seq += x;
      len += b.data.length;
    }
    console.log(seq);
    return seq;
  }

  setup(container, addButton, cell_size, scale=1) {
    this.elt = container;
    this.add = addButton;
    this.dim = cell_size;
    this.scale = scale; // how much larger to display block drafts vs. the rest of the draft

    this.blocks.map((b) => {
      if (!b.render) { this.setupBlock(b) }
    });
  }

  setupBlock(b) {
    b.setup(this.add, { cell_size: this.dim*this.scale, xflip: false, yflip: true });
  }
}

class Block extends DraftContainer{
  // a small DraftContainer subtype that contains a threading or treadling sequence that can be repeated as a unit
  constructor(key, name, sys) {
    super(sys.shafts, 0);
    this.key = key;  
    this.name = name;
    this.sys = sys; // reference back to the block system
    this._data = ''; // string of numbers that correspond to shafts or treadles depending on block direction
  }
  
  get dir() { return this.sys.dir; }
  get data() { return this._data; }
  set data(str) { 
    this._data = str;
    this.stringToArrayData();
  }
  
  stringToArrayData() {
    // print(this.data);
    // resize array if needed
    let { dim, otherDim, draftProp } = (this.dir == WARP_DIRECTION) ? {
      dim: "width",
      otherDim: "height",
      draftProp: "shafts",
    } : {
      dim: "height",
      otherDim: "width",
      draftProp: "treadles",
    }
    // let otherDim = (this.dir == WARP_DIRECTION) ? "height" : "width";
    this[dim] = this.data.length;
    this[otherDim] = this.sys[draftProp];
    this.clearData();
    
    for (let char in this.data) {
      let i = parseInt(char);
      let c = parseInt(this.data[i])-1;
      let row = (this.dir == WARP_DIRECTION) ? c : i;
      let col = (this.dir == WARP_DIRECTION) ? i : c;
      // print("setting", row, col);
      this.setData(row, col, 1);
    }
    // print(this.array);
  }

  /**
   * For the Block b: initialize its GridRenderer, udpate P5 and DOM elements, set up events
   * BEFORE CALLING: HTML elements loaded, default data loaded to a BlockSystem object
   * @param {Block} b the Block object to load to DOM/P5
   */
  setup(button, drawParams) {
    const b = this;
    const grid = drawParams.cell_size;

    let block = createDiv();
    block.id('block-'+b.key+'-grid');
    block.style('height', b.sys.shafts * grid + "px");
    block.style('width', b.data.length * grid + "px");
    block.mouseClicked(() => {
      print("user clicked", mouseX, mouseY, "relative", block.position());
    });

    super.setup(block, drawParams);

    // make the rest of the card contents
    let h = createElement('p', b.name);
    let blockInput = createInput(b.data);
    blockInput.id('block-'+b.key+'-input');
    
    // make the card iteself
    let card = createDiv();
    this.elt = card;
    this.render.offset = card;
    card.id('block-'+b.key);
    card.class('flex-column card');
    
    // place elements
    // card.parent(container);
    button.elt.before(card.elt);
    h.parent(card);
    block.parent(card);
    blockInput.parent(card);
    
    blockInput.style('width', (b.data.length+1)*0.7+"em");
    blockInput.input(() => {
      // update block sequences
      b.data = blockInput.value();
      // print(TX.blockSeq);
      // print(blocks);
      TX.updateThreading();
      treadleAsWarped();
      
      // block.style('width', b.data.length * grid + "px");
      blockInput.style('width', b.data.length*0.7+"em");
      blocks.blocks.map((b) => b.render.updatePos());
      redraw();
    });
  }
}