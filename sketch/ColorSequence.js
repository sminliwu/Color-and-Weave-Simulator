class ColorSequence {
  constructor() {
    this.colors = [
      // {key: '0', color: color(255, 0, 0)},
      // {key: '1', color: color(0, 255, 0)},
      // {key: '2', color: color(0, 0, 255)},
    ];
    this.seq = "";
    this.weft_seq = "";
    this.mirror = false;
    this.weft_mirror = false;
    this.match = true;
    this.mirrorMode = true; // true = repeat end colors; false = don't repeat
    this.weft_mirrorMode = true;
  }
  
  getColor(key) {
    let res = this.colors.filter((el) => el.key == key);
    if (res.length > 0) {
      return res[0];
    } else return undefined;
  }
  
  getIndexOfColor(key) {
    return this.colors.findIndex((el) => el.key == key);
  }
  
  setColor(key, newColor) {
    let i = this.getIndexOfColor(key);
    this.colors[i].color = newColor;
  }
  
  setSymbol(key, newKey) {
    console.log("key ", key, "newKey ", newKey);
    let i = this.getIndexOfColor(key);
    this.colors[i].key = newKey;
    this.seq = this.seq.replaceAll(key, newKey);
    return newKey;
  }
  
  // get the sequence of color keys to display, generating the mirrored version if needed
  getSeq(warp=true) {
    let res = warp ? this.seq : this.weft_seq;
    let mirror = warp ? this.mirror : this.weft_mirror;
    if (!mirror) return res;
    else {
      let seq = warp ? this.seq : this.weft_seq;
      let mode = warp ? this.mirrorMode : this.weft_mirrorMode;
      if (mode) res += seq[seq.length-1];
      for (let i=seq.length-2; i>0; i--) {
        res += seq[i];
      }
      if (mode) res += seq[0];
      // console.log("mirrored color seq ", res);
      return res;
    }
  }
  
  randomSeq(n=16) {
    let res = "";
    let keys = this.colors.map((el) => el.key);
    while (res.length < n) {
      let x = random(keys);
      let size = random(3)+1;
      if (res.length+size > n) { size = n-res.length; }
      for (let i=0; i<size; i++) { res += x; }
    }
    return res;
  }
}


function addColor() {
  let newKey = color_sequence.colors.length.toString();
  let newC = color(random(0, 255), random(0, 255), random(0, 255));
  let newColor = {key: newKey, color: newC};
  color_sequence.colors.push(newColor);
  loadColor(newColor);
}

function randomRGB() {
  return {
    r: random(0, 255),
    g: random(0, 255),
    b: random(0, 255)
  };
}

function extractHSL(c) {
  return {
    h: int(hue(c)),
    s: int(saturation(c)),
    l: int(lightness(c))
  };
}

function toHSLString(obj) {
  let res = "hsl(" + obj.h + "," + obj.s + "%," + obj.l + "%)";
  print(res);
  return res;
}

function addContrastingColors() {
  let a = randomRGB();
  let b = randomRGB();
  
  let rgbA = color(a.r, a.g, a.b);
  let rgbB = color(b.r, b.g, b.b);
  
  let hslA = extractHSL(rgbA);
  let hslB = extractHSL(rgbB);
  
  let {lighter, darker} = (hslA.l > hslB.l) ? {
    lighter: hslA,
    darker: hslB
  } : {
    lighter: hslB,
    darker: hslA
  };
  
  lighter.l = 75;
  darker.l = 25; // 3:1 contrast ratio from WCAG
  
  let adjA = color(toHSLString(lighter));
  let adjB = color(toHSLString(darker));
//   print(adjA, adjB);
  
  // print(rgbA, rgbB);
  // print(hslA, hslB);
  // print(lighter, darker);
  
  let keyA = color_sequence.colors.length.toString();
  let colorA = {key: keyA, color: adjA};
  color_sequence.colors.push(colorA);
  let keyB = color_sequence.colors.length.toString();
  let colorB = {key: keyB, color: adjB};
  color_sequence.colors.push(colorB);
  
  // print(lightness(rgbA), lightness(rgbB));
  loadColor(colorA);
  loadColor(colorB);
  // loadColor({key: "x", color: rgbA});
  // loadColor({key: "y", color: rgbB});
}