/**
 * FILE: data.js --- helper classes and functions for low-level data handling
 * classes: ByteArray, DraftContainer, GridRenderer
 */
// byte handling: how many bytes are needed to hold x bits
function numBytes(x) {
  if (x % 8 == 0) {
    return x / 8 + 1;
  } else {
    return x / 8;
  }
}

class ByteArray {
  //   height;
  //   width;

  //   data; // 1D fixed-size array with size height x width

  constructor(h, w) {
    this.height = h;
    this.width = w;
    this.data = new Uint8Array(this.height * this.width);
    // TODO: change to an ArrayBuffer where 1 square = 1 bit, rather than 1 square = 1 byte
  }

  static from(array) {
    let h = array.length;
    let w = array[0].length;
    let result = new ByteArray(h, w);
    for (var row = 0; row < h; row++) {
      for (var col = 0; col < w; col++) {
        result.setData(row, col, array[row][col]);
      }
    }
    return result;
  }

  copy() {
    let result = new ByteArray(this.height, this.width);
    result.data = Uint8Array.from(this.data);
    return result;
  }

  // the DraftContainer is stored as a 1D array of length (draft height)  x (draft width)
  RCToIndex(row, col) {
    if (row >= this.height || col >= this.width) {
      return -1;
    }
    return row * this.width + col;
  }

  indexToRC(index) {
    if (index >= this.height * this.width) {
      return -1;
    }
    var row = Math.floor(index / this.width);
    var col = index % this.height;
    return { row, col };
  }

  // for now, each byte stores 1 cell's binary data (0 or 1)
  getData(row, col) {
    if (row < this.height && col < this.width) {
      var i = this.RCToIndex(row, col);
      return this.data[i] ? true : false;
    }
  }

  setData(row, col, value) {
    if (row < this.height && col < this.width) {
      var i = this.RCToIndex(row, col);
      // console.log(value);
      // console.log(row, col, '(',i,') :', this.data[i]);
      this.data[i] = value ? 1 : 0;
    }
  }

  toggleCell(row, col) {
    if (row < this.height && col < this.width) {
      var i = this.RCToIndex(row, col);
      //console.log(row, col, '(',i,') :', this.data[i]);
      this.data[i] = this.getData(row, col) ? 0 : 1;
    }
  }

  addRow() {
    this.height++;
    var newData = new Uint8Array(this.height * this.width);
    for (var r = 0; r < this.height - 1; r++) {
      for (var c = 0; c < this.width; c++) {
        var i = this.RCToIndex(r, c);
        newData[i] = this.data[i];
      }
    }
    this.data = newData;
  }

  delRow() {
    this.height--;
    var newData = new Uint8Array(this.height * this.width);
    for (var r = 0; r < this.height; r++) {
      for (var c = 0; c < this.width; c++) {
        var i = this.RCToIndex(r, c);
        newData[i] = this.data[i];
      }
    }
    this.data = newData;
  }

  addCol() {
    var newData = new Uint8Array(this.height * (this.width + 1));
    for (var r = 0; r < this.height; r++) {
      for (var c = 0; c < this.width; c++) {
        var i = this.RCToIndex(r, c);
        var newI = r * (this.width + 1) + c;
        newData[newI] = this.data[i];
      }
    }
    this.width++;
    this.data = newData;
  }

  delCol() {
    var newData = new Uint8Array(this.height * (this.width - 1));
    for (var r = 0; r < this.height; r++) {
      for (var c = 0; c < this.width; c++) {
        var i = this.RCToIndex(r, c);
        var newI = r * (this.width - 1) + c;
        newData[newI] = this.data[i];
      }
    }
    this.width--;
    this.data = newData;
  }
}

// A general draft quadrant container class that has h rows and w columns
class DraftContainer {
  // 2D arrays for boolean data
  // rawData; // stores literals; e.g. threading, treadling
  // profile; // stores a simplified profile view

  // track user inputs
  // profileView = false;

  constructor(h, w) {
    // create new 2D byte arrays of all false booleans
    // TypedArray is initializd with all 0's
    this.profileData = false;
    this.rawData = new ByteArray(h, w);
    this.profile = new ByteArray(h, w); // you can add more ByteArray properties for more "views" of the draft
    this.render = undefined; // initialize GridRenderer after DOM loads
  }

  get array() { return this.rawData; }

  get height() { return this.rawData.height; }
  set height(n) {
    if (n > this.height) {
      while (n > this.height) {
        this.addRow();
      }
      return;
    } else if (n < this.height) {
      while (n < this.height) {
        this.delRow();
      }
      return;
    }
  }

  get width() { return this.rawData.width; }
  set width(n) {
    if (n > this.width) {
      while (n > this.width) {
        this.addCol();
      }
      return;
    } else if (n < this.width) {
      while (n < this.width) {
        this.delCol();
      }
      return;
    }
  }

  static fromArray(array) {
    let data = ByteArray.from(array);
    let result = new DraftContainer(data.height, data.width);
    result.rawData = data.copy();
    result.profile = data.copy();
    // result.displayData = result.rawData;
    return result;
  }
  
  clearData() { this.rawData = new ByteArray(this.height, this.width); }
  getData(row, col) { return this.array.getData(row, col); }
  setData(row, col, value) { this.array.setData(row, col, value); }

  // resizing methods, update both rawData and profileData
  addRow() {
    this.rawData.addRow();
    this.profile.addRow();
    // this.height++;
  }

  delRow() {
    this.rawData.delRow();
    this.profile.delRow();
    // this.height--;
  }

  addCol() {
    // // add a new column to each row of the data arrays
    this.rawData.addCol();
    this.profile.addCol();
  }

  delCol() {
    this.rawData.delCol();
    this.profile.delCol();
  }

  setDimensions(h, w) {
    this.height = h;
    this.width = w;
  }

  printData() {
    // return a string/char[] for printing
    var str = "";
    for (var r = 0; r < this.height; r++) {
      for (var c = 0; c < this.width; c++) {
        str += this.rawData.getData(r, c) ? "1" : "0";
      }
      str += "\n";
    }
    return str;
  }

  setup(elt, drawParams = {cell_size: defaults.dim_cell, xflip: defaults.xflip, yflip: defaults.yflip}) {
    this.render = new GridRenderer(drawParams.cell_size, elt, this, drawParams.xflip, drawParams.yflip);
    this.render.updatePos();
    this.render.resize();
  }

  draw() { this.render.draw(); }
}

/**
 * CLASS: GridRenderer --- helper class that keeps track of HTML + p5 drawing of a grid of squares
 */
class GridRenderer {
  constructor(cell_size, elt, obj, xflip=false, yflip=true) {
    this.container = elt; // a P5 HTML element covering the area of canvas that the renderer is responsible for
    this.obj = obj; // the grid-based data object to render (DraftContainer or inheriting class)
    
    this.left = -1; // starting x pos on the canvas
    this.top = -1; // starting y pos on the canvas
    this.dim = cell_size; // size of squares in the grid (px)
    this.xflip = xflip;
    this.yflip = yflip;
    
    this.border = true;
    this.colors = {
      false: 255,
      true: 0,
    };

    this.updatePos();
  }

  get rows() { return this.obj.height; }
  get cols() { return this.obj.width; }

  get xo() {
    return this.xflip ? this.left + this.container.width - this.dim : this.left;
  }

  get yo() {
    return this.yflip ? this.top + this.container.height - this.dim : this.top;
  }
  
  get position() { return { x: this.left, y:this.top } }
  set position(pos) {
    this.left = pos.x;
    this.top = pos.y;
  }
  
  resize() {
    this.container.style('height', this.rows * this.dim + "px");
    this.container.style('width', this.cols * this.dim + "px");
  }

  // update position based on the container's position on the page
  updatePos() {
    // print(this);
    this.position = this.container.position();
  }

  // forcibly place the container on the page
  placePos(x, y) {
    this.container.position(x, y);
    this.updatePos();
  }

  // optional arg: color mapping?
  draw() {
    const array = this.obj.array;
    // this.rows = h;
    // this.cols = w;
    this.resize();

    const dim = this.dim;
    strokeWeight(0.5); 
    if (this.border) { stroke(0); }
    else { noStroke(); print('no borders'); }

    let xsign = this.xflip ? -1 : 1;
    let ysign = this.yflip ? -1 : 1;

    // the grid is h squares tall (i.e. has h rows)
    for (var i = 0; i < this.rows; i++) {
      // Y coord (row)
      for (var j = 0; j < this.cols; j++) {
        // X coord (col)
        // let h = this.colors[array.getData(i, j)];
        // print(array.getData(i, j));
        fill(this.colors[array.getData(i, j)]);
        let dispX = this.xo + xsign * dim * j;
        let dispY = this.yo + ysign * dim * i;
        rect(dispX, dispY, dim, dim);
      }
    }
  }
}
