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
    let b = new Block(this.length+1, params.name, params.dir, this);
    b.data = params.data;
    b.stringToArrayData();
    this.blocks.push(b);
  }
  
  newBlock() {
    let i = this.length+1;
    let name = "Block " + i;
    let b = new Block(i, name, this, '');
    this.blocks.push(b);
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
}

class Block extends DraftContainer{
  // a small DraftContainer subtype that contains a threading or treadling sequence that can be repeated as a unit
  constructor(key, name, dir, sys) {
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
    let dim = (this.dir == WARP_DIRECTION) ? "width" : "height";
    this[dim] = this.data.length;
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
  
  draw() {
    // print(this);
    this.render.draw(this.height, this.width, this.array);
  }
  
}