const PROG_ASCENDING = 1;
const PROG_DESCENDING = 0;
const PROG_CUSTOM = -1;

// A Threading class, representing threading quadrant of a draft
// should be created from a parent Draft
class Threading extends DraftContainer {
  constructor(parent) {
    let {height, width} = { height: parent.shafts, width: parent.warps}
    super(height, width);
    
    this.draft = parent;
    this.blocks = new BlockSystem(this.shafts, this.draft.treadles)
    
    this.seq = '';
    // this.displayData = this.threading;

    // this.setProgression(this.direction);
  }
  
  get warps() { return this.width; }
  set warps(n) { this.width = n; }

  get shafts() { return this.height; }
  set shafts(n) { 
    this.height = n; 
    // this.setProgression(this.direction);
  }
  
  get blockSeq() { return this.blocks.seq; }
  set blockSeq(newSeq) {
    this.blocks.seq = newSeq;
    this.threadSeq = this.blocks.compileBlocks();
    print(this.blocks.seq, this.threadSeq);
  }
  
  get threadSeq() { return this.seq; }
  set threadSeq(newSeq) {
    this.seq = newSeq;
    this.clearData();
    for (let char in newSeq) {
      let col = parseInt(char);
      let row = parseInt(this.seq[col])-1;
      this.setData(row, col, 1);
    }
  }
  
  updateThreading() { this.threadSeq = this.blocks.compileBlocks(); }
  
  // functionality
  addWarp() { 
    // add 1 warp
    this.warps++;
    this.addCol();    
  }
  
  delWarp() {
    this.warps--;
    // check if you're cutting into an existing block
    if (this.warps < this.threadingCount) {
      this.popBlock();
    }
    
    this.delCol();
    //updateDisplay();
  }
  
  // from overshot version
  //   pushBlock(size) {}
  //   popBlock() {}
  
  toggleProfile() {
    this.profileView = !this.profileView;
    if (this.profileView) {
      this.updateProfile();
    }
  }
  
  updateProfile() {
    // convert threading draft to a profile draft
    // reset profile
    for (var i = 0; i < this.shafts; i++) {
      for (var j = 0; j < this.warps; j++) {
        this.profile.setData(i, j, false);
      }
    }

    // for each threading block,
    var currentWarp = 0;
    for (var i = 0; i < this.warpInputs; i++) {
      // find which shaft the current block is on
      var whichShaft = -1;
      for (var s = 0; s < this.shafts; s++) {
        if (this.threading.getData(s, currentWarp)) {
          whichShaft = s;
          break;
        }
      }
      // update the profile array at the correct shaft, with the correct size block
      //console.log(currentWarp+", "+this.threadingInputs[i]+", "+whichShaft);
      for (var w = 0; w < this.threadingInputs[i]; w++) {
        this.profile.setData(whichShaft, currentWarp+w, true);
      }
      currentWarp += this.seq[i];
    }
    //console.log("done converting to profile draft");
    //console.log(printProfile());
  }
  
  print() {
    // return a string/char[] for printing
    var str = "";
    for (var s = 0; s < this.shafts; s++) {
      for (var w = 0; w < this.warps; w++) {
        str += this.threading.getData(s, w) ? '1' : '0';
      }
      str += '\n';
    }
    return str; 
  }
  
  draw() {
    if (this.render) {
      
    } else { throw Error(); }
  }
}