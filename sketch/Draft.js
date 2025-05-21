/** Draft.js */
class Draft {
  constructor(shafts, treadles, warps, picks) {
    this.shafts = shafts;
    this.treadles = treadles;
    
    this.warps = warps;
    this.picks = picks;
    
    this.threading = new Threading(this);
    this.treadling = new Treadling(this);
    this.tieup = new DraftContainer(shafts, treadles);
    this.drawdown = new DraftContainer(picks, warps);

    // this.sections = [this.threading, this.tieup, this.treadling, this.drawdown];
  }

  get s() { return this.shafts; }
  set s(n) { 
    this.shafts = n;
    this.tieup.height = n;
  }

  get t() { return this.treadles; }
  set t(n) {
    this.treadles = n;
    this.tieup.width = n;
  }

  setup(dim=defaults.dim_cell) {
    // const container = elts.draft; // only run this after the P5 Element created

    elts.tieup = createDiv();
    elts.tieup.id("tie-up");
    elts.tx = createDiv();
    elts.tx.id("threading");
    elts.tl = createDiv();
    elts.tl.id("treadling");
    elts.dd = createDiv();
    elts.dd.id("drawdown");

    for (let el of [elts.tieup, elts.tx, elts.tl, elts.dd]) {
      el.parent(elts.draft); 
      // console.log(elts.draft.position());
    }

    const pos = elts.draft.position();
    const { xo, yo } = { xo: pos.x, yo: pos.y };
    const ddxo = xo + (this.treadles+1)*dim;
    const ddyo = yo + (this.shafts+1)*dim;

    console.log("positions", xo, yo, ddxo, ddyo);
    
    this.tieup.setup(elts.tieup, { cell_size: dim, xflip: true, yflip: true });
    this.threading.setup(elts.tx, { cell_size: dim, xflip: false, yflip: true});
    this.treadling.setup(elts.tl, { cell_size: dim, xflip: true, yflip: false });
    this.drawdown.setup(elts.dd, { cell_size: dim, xflip: false, yflip: false});

    this.tieup.render.placePos(xo, yo);
    this.threading.render.placePos(ddxo, yo);
    this.treadling.render.placePos(xo, ddyo);
    this.drawdown.render.placePos(ddxo, ddyo);

  }

  tieupFromArray(array) {
    this.tieup = DraftContainer.fromArray(array);
  }

  twillTieUp(shafts, shade) {
    if (shade > 0 && shade < shafts) {
      this.shafts = shafts;
      this.treadles = shafts + 2;

      let result = [];
      let twillRow = [];
      for (let s=0; s < shafts; s++) {
        if (s<shade) { twillRow.push(true); }
        else { twillRow.push(false)};
      }
      let tabby = true;

      function rotate(array, n=1, dir=true) {
        let res = Array.from(array);
        if (dir) {
          for (let i=0; i<n; i++) {
            let x = res.pop();
            res.unshift(x);
          }
        } else {
          for (let i=0; i<n; i++) {
            let x = res.shift();
            res.push(x);
          }
        }
        return res;
      }

      for (let i=0; i<shafts; i++) {    
        let row = twillRow.concat([tabby, !tabby]);
        tabby = !tabby;
        twillRow = rotate(twillRow);
        result.push(row);
      }
      
      this.tieupFromArray(result);
    }
  }
}

function updateDrawdown() {
  // each i-th row of the drawdown:
  // i-th treadling row -> which treadle was pressed?
  // on that treadle, what does that column of tie-up look like?
  // if cell in that column, then OR to make the row

  // for each row
  for (var row = 0; row < TL.picks; row++) {
    var updatedRow = [];
    var whichTreadle = -1;
    for (var t = 0; t < TL.treadles; t++) {
      if (TL.getData(row,t)) {
        whichTreadle = t;
        break;
      }
    }
    //console.log("Row", row, "uses treadle", whichTreadle);
    
    for (var col = 0; col < TX.warps; col++) {
      if (whichTreadle == -1) {
          // no treadle on this row, row should be empty
          //console.log("empty row");
          updatedRow[col] = false;
        } else {
          for (var s = 0; s < TX.shafts; s++) {
            updatedRow[col] |= tieUp.array.getData(s,whichTreadle) && TX.array.getData(s,col);
        }
      }
    }
    //console.log(updatedRow);
    // copy updated row into drawdown
    for (var col = 0; col < TX.warps; col++) {
      drawdown.array.setData(row, col, updatedRow[col]);
    }
  }
  //console.log(drawdown.printData());
  redraw();
}


function straightThreading(thread=true) {
  for (var j=0; j<TX.shafts; j++) {
    for (var i=0; i<TX.warps; i++) {
      let x = (j == i % TX.shafts) ? true : false;
      if (thread) TX.setData(j, i, x);
      else TL.setData(i, j, x);
    }
  }
}

function pointThreading(thread=true) {
  let prog = [0, 1, 2, 3, 2, 1];
  for (var i=0; i<TX.warps; i++) {
    let shaft = prog[i%6];
    for (var j=0; j<TX.shafts; j++) {
      let x = (j == shaft) ? true : false;
      if (thread) TX.setData(j, i, x);
      else TL.setData(i, j, x);
    }
  }
}

function advancingPointThreading(thread=true) {
  let prog = [0, 1, 2, 3, 2];
  for (var i=0; i<TX.warps; i++) {
    let shaft = prog[i%5];
    prog[i%5] = (prog[i%5]+1)%TX.shafts;
    for (var j=0; j<TX.shafts; j++) {
      let x = (j == shaft) ? true : false;
      if (thread) TX.setData(j, i, x);
      else TL.setData(i, j, x);
    }
  }
}

function treadleAsWarped() {
  for (var i=0; i<TL.picks; i++) {
    for (var j=0; j<TX.shafts; j++) {
      let x = TX.getData(j, i);
      TL.setData(i, j, x);
    }
  }
}