// functions that affect or are called by the DOM + canvas

function setWarps(n) {
  TX.warps = n;
  // console.log(TX);
  drawdown.width = n;
  updateDraft();
  redraw();
}

function setWefts(n) {
  TL.picks = n;
  drawdown.height = n;
  updateDraft(false);
  redraw();
}


function updateThreadColors() {
  thread_colors.warp = "";
  let limit = Math.max(drawdown.width, drawdown.height);
  while (thread_colors.warp.length < limit) {
    thread_colors.warp = thread_colors.warp.concat(color_sequence.getSeq());
  }
  if (!color_sequence.match) {
    thread_colors.weft = "";
    while (thread_colors.weft.length < drawdown.height) {
      thread_colors.weft = thread_colors.weft.concat(color_sequence.getSeq(false));
    }
  }
  // console.log(thread_colors);
}

// TODO: transfer these from p5 to jQuery to speed up load time
function loadSettings() {
  let helperText = createButton('Hide help text');
  helperText.parent("settings-header");
  helperText.mousePressed(() => {
    let x = (helperText.html().includes("Hide")) ? false : true;
    x ? $(".help-text").show() : $(".help-text").hide();
    helperText.html((x? "Hide" : "Show") + " help text");
    select("body").style("grid-template-rows", (x ? "180px auto" : "150px auto"));
  });
  
  let showHide = createButton('Hide settings');
  showHide.parent("settings-header");
  showHide.attribute("disabled", true);
  
  let warps = createInput(TX.warps.toString());
  // warps.elt = $('#test');
  // console.log(warps.elt);
  warps.parent("num-warps");
  warps.class("num-input");
  warps.input(() => {
    let num = parseInt(warps.value());
    if (num > 2) setWarps(num);
  });
  
  let wefts = createInput(TL.picks.toString());
  wefts.attribute('type', 'number');
  wefts.parent("num-wefts");
  wefts.class("num-input");
  wefts.input(() => {
    let num = parseInt(wefts.value());
    if (num > 2) setWefts(num);
  });
  
  let threadMenu = createSelect();
  threadMenu.parent("thread-menu");
  threadMenu.option("Straight draw");
  threadMenu.option("Point draw");
  threadMenu.option("Advancing point");
  threadMenu.changed(() => {
    updateDraft();
    if (treadleAs.checked()) { 
      treadleMenu.value(threadMenu.value());
      updateDraft(false); }
  });
  
  let treadleAs = createCheckbox("Tromp as writ", true);
  treadleAs.parent("treadle-as");
  
  let treadleMenu = createSelect();
  treadleMenu.parent("treadle-menu");
  treadleMenu.option("Straight draw");
  treadleMenu.option("Point draw");
  treadleMenu.option("Advancing point");
  treadleMenu.changed(() => updateDraft(false));
  
  treadleAs.changed(() => {
    if (treadleAs.checked()) {
      $('#treadle-menu').hide();
    } else { $('#treadle-menu').show(); }
  });
  
  $('#treadle-menu').hide();
  $('.weft').hide();
}

function updateDraft(tr=true) {
  let sel = tr ? $("#thread-menu > select").val() :  $("#treadle-menu > select").val();
  switch (sel) {
    case "Straight draw": 
      straightThreading(tr);
      break;
    case "Point draw": 
      pointThreading(tr);
      break;
    case "Advancing point": 
      advancingPointThreading(tr);
      break;
  }
  redraw();
}

function loadColor(c) {
  let str = "<tr id='c-"+c.key+"'>";
  str += "<td id='c-"+c.key+"-symb'></td>";
  str += "<td id='c-"+c.key+"-pick'></td></tr>";
  color_list.append(str);

  let inp = createInput(c.key);
  inp.parent("c-"+c.key+"-symb");
  inp.id(c.key+"symbol");
  inp.size(14);
  inp.input(() => {
    if (inp.value().length > 0) {
      console.log(inp.value());
      let newKey = color_sequence.setSymbol(inp.id()[0], inp.value()[0]);
      // console.log(color_sequence);
      inp.id(newKey+"symbol");
      inp.value(newKey);
      seq_input.value(color_sequence.seq);
    }
  });

  let picker = createColorPicker(c.color);
  picker.parent("c-"+c.key+"-pick");
  picker.id(c.key+"picker");
  picker.input(() => {
    color_sequence.setColor(picker.id()[0], picker.color());
    redraw();
  });
}


function toggleColorMatch() {
  if (color_sequence.match) {
    $('.weft').hide();
    $('#sequence-label').text("Color Sequence");
    
  } else {
    // display two different color sequences
    if (color_sequence.weft_seq == "") {
      color_sequence.weft_seq = color_sequence.seq;
      weft_seq_input.value(color_sequence.weft_seq);
    }
    $('.weft').show();
    $('#sequence-label').text("Warp Color Sequence");
  }
}

/**
 * For the Block b: initialize its GridRenderer, udpate P5 and DOM elements, set up events
 * BEFORE CALLING: HTML elements loaded, default data loaded to a BlockSystem object
 * @param {Block} b the Block object to load to DOM/P5
 */
function loadBlock(b) {
  print(b);
  const container = elts.blocks;
  const grid = defaults.dim_cell*2;
  
  // make a new div for the GridRenderer
  let block = createDiv();
  block.id('block-'+b.key+'-grid');
  block.style('height', b.sys.shafts * grid + "px");
  block.style('width', b.data.length * grid + "px");
  block.mouseClicked(() => {
    print("user clicked", mouseX, mouseY, "relative", block.position());
  });
  
  b.render = new GridRenderer(grid, block, b);
  
  // make the rest of the card contents
  let h = createElement('p', b.name);
  let blockInput = createInput(b.data);
  blockInput.id('block-'+b.key+'-input');
  
  // make the card iteself
  let card = createDiv();
  card.id('block-'+b.key);
  card.class('flex-column card');
  
  // place elements
  card.parent(container);
  h.parent(card);
  block.parent(card);
  blockInput.parent(card);
  
  blockInput.style('width', b.data.length*0.7+"em");
  
  // let gridPos = block.position();
  // print(block.position());
  // b.render.position = block.position();
  // print(b.render);
  
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
  })
}