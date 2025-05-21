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
    this.counter = 0; // count the num of blocks created since initialization to generate num IDs

    this.elts = undefined; // after setup, points to all associated elements
  }
  
  static fromObject(preset) {
    let sys = new BlockSystem(preset.shafts, preset.treadles, preset.dir)

    // use OF not IN!
    for (let b of preset.blocks) {
      // console.log(b)
      sys.loadBlockData(b);
      sys.counter++;
    }
    sys.seq = preset.block_seq;
    console.log(sys.keys.map((k) => parseInt(k)));
    return sys;
  }
  
  get length() { return this.blocks.length; }
  get keys() { return this.blocks.map(b => b.key); }
  
  loadBlockData(params) {
    let b = new Block(params.key, this, params.data);
    // b.data = params.data;
    // b.stringToArrayData();
    this.blocks.push(b);
  }
  
  newBlock() {
    let i = this.counter+1;
    let b = new Block(i, this, '');
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
      this.seq = this.seq.replaceAll(newKey, '-'); // placeholder key during the swap
      this.seq = this.seq.replaceAll(oldKey, newKey);
      this.seq = this.seq.replaceAll('-', oldKey);
    } else {
      this.seq = this.seq.replaceAll(oldKey, newKey);
    }
    b.key = newKey;
    this.updateDOM();
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
      let b = this.getBlock(c);
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

  setup(seqInput, addButton, cell_size, scale=1) {
    this.elts = {
      seqInput: seqInput,
      addButton: addButton,
    }
    // this.elt = seqInput;
    // this.add = addButton;
    this.dim = cell_size;
    this.scale = scale; // how much larger to display block drafts vs. the rest of the draft

    this.blocks.map((b) => {
      if (!b.render) { this.setupBlock(b) }
    });
  }

  setupBlock(b) {
    const add = this.elts.addButton;
    b.setup(add, { cell_size: this.dim*this.scale, xflip: false, yflip: true });
  }

  updateDOM() {
    this.elts.seqInput.value(this.seq);
    this.blocks.map((b) => {
      b.updateDOM();
    })
  }
}

class Block extends DraftContainer{
  // a small DraftContainer subtype that contains a threading or treadling sequence that can be repeated as a unit
  constructor(key, sys, data='') {
    super(sys.shafts, 0);
    this.key = key.toString();  
    // this.name = name;
    this.sys = sys; // reference back to the block system
    this.data = data; // string of numbers that correspond to shafts or treadles depending on block direction

    this.elts = undefined;
    // if (data.length > 0) { this.stringArra}
  }
  
  get name() { return "Block "+this.key; }
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
    this.elts = {
      card: createDiv(),
      header: createDiv(),
      key: createInput(b.key.toString()),
      del: createButton('-'),
      body: createDiv(),
      h: createElement('h3', b.name),
      grid: createDiv(),
      blockInput: createInput(b.data),
    }
    const { card, header, key, del, body, h, grid, blockInput } = {...this.elts};

    // make the card to contain everything
    // let card = createDiv();
    card.id('block-'+b.key);
    card.class('flex-row card');

    // make the key mapping and delete button separate from the card
    // let header = createDiv();
    this.elts.header = header;
    header.id('block-'+b.key+'-header');
    header.class('flex-column');

    // let key = createInput(b.key.toString());
    // key.parent("block-"+b.key);
    key.id('block-'+b.key+'-key');
    key.class('symbol-input');
    key.attribute('title', 'You can use a single alphanumeric character (0-9, a-z, A-Z) to name each block.')
    key.input(() => {
      if (key.value().length == 1) {
        b.sys.rekeyBlock(b.key, key.value());
        // update block sequence input
        redraw();
      }
    });

    // let del = createButton('-');
    del.style('width', key.width);
    del.attribute('title', 'Click to delete this block.')
    del.mouseClicked(() => {
      header.remove();
      card.remove();
      b.sys.delBlock(b.key);
      redraw();
    })

    key.parent(header);
    del.parent(header);

    // let body = createDiv();
    body.id('block-'+b.key+'-body');
    body.class('flex-column card-body');

    // make the rest of the card contents
    // let h = createElement('h3', b.name);
    // let blockInput = createInput(b.data);
    blockInput.id('block-'+b.key+'-input');

    // let grid = createDiv();
    grid.id('block-'+b.key+'-grid');
    grid.style('height', b.sys.shafts * grid + "px");
    grid.style('width', b.data.length * grid + "px");
    grid.mouseClicked(() => {
      print("user clicked", mouseX, mouseY, "relative", grid.position());
    });

    super.setup(grid, drawParams);
    this.render.offset = body;
    
    header.parent(card);    
    body.parent(card);

    h.parent(body);
    grid.parent(body);
    blockInput.parent(body);
    
    // place elements
    // card.parent(container);
    button.elt.before(card.elt);
    
    let w = (b.data.length == 0) ? 1 : b.data.length;
    blockInput.style('width', w*0.7+"em");
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

  updateDOM() {
    const { key, blockInput, h } = {...this.elts};
    key.value(this.key);
    blockInput.value(this.data);
    h.html(this.name);
  }
}