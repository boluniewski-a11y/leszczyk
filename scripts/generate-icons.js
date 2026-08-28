// Generuje proste ikony PWA (PNG) bez zewnętrznych zależności.
// Uruchom: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf){
  let c, table = [];
  for(let n=0;n<256;n++){
    c=n;
    for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320 ^ (c>>>1) : c>>>1;
    table[n]=c>>>0;
  }
  let crc=0xFFFFFFFF;
  for(let i=0;i<buf.length;i++) crc = table[(crc^buf[i])&0xFF] ^ (crc>>>8);
  return (crc^0xFFFFFFFF)>>>0;
}

function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length,0);
  const typeBuf = Buffer.from(type,'ascii');
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf,data])),0);
  return Buffer.concat([len,typeBuf,data,crcBuf]);
}

function makePng(size){
  const raw = Buffer.alloc(size*size*4);
  // Tło: ciemny granat (#0e1a1e)
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const i=(y*size+x)*4;
      raw[i]=0x0e; raw[i+1]=0x1a; raw[i+2]=0x1e; raw[i+3]=0xff;
    }
  }
  // Prosta "ryba" (elipsa) w kolorze akcentu (#4fd1a5)
  const cx=size/2, cy=size/2, rx=size*0.32, ry=size*0.18;
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const dx=(x-cx)/rx, dy=(y-cy)/ry;
      if(dx*dx+dy*dy<=1){
        const i=(y*size+x)*4;
        raw[i]=0x4f; raw[i+1]=0xd1; raw[i+2]=0xa5; raw[i+3]=0xff;
      }
    }
  }
  // Oko
  const eyeX=cx+rx*0.5, eyeY=cy-ry*0.2;
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const dx=x-eyeX, dy=y-eyeY;
      if(dx*dx+dy*dy <= (size*0.04)*(size*0.04)){
        const i=(y*size+x)*4;
        raw[i]=0x0e; raw[i+1]=0x1a; raw[i+2]=0x1e; raw[i+3]=0xff;
      }
    }
  }
  // Ogon (trójkąt)
  const tailX = cx-rx;
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      if(x<tailX && x>tailX-size*0.18){
        const t=(tailX-x)/(size*0.18);
        const halfW=size*0.12*t;
        if(Math.abs(y-cy)<halfW){
          const i=(y*size+x)*4;
          raw[i]=0x4f; raw[i+1]=0xd1; raw[i+2]=0xa5; raw[i+3]=0xff;
        }
      }
    }
  }

  // Filtry: każdy wiersz zaczyna się bajtem 0 (filter type None)
  const stride = size*4;
  const filtered = Buffer.alloc((stride+1)*size);
  for(let y=0;y<size;y++){
    filtered[y*(stride+1)] = 0;
    raw.copy(filtered, y*(stride+1)+1, y*stride, (y+1)*stride);
  }
  const idat = zlib.deflateSync(filtered);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size,0);
  ihdr.writeUInt32BE(size,4);
  ihdr[8]=8; // bit depth
  ihdr[9]=6; // color type RGBA
  ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;

  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',idat), chunk('IEND',Buffer.alloc(0))]);
}

const imgDir = path.join(__dirname,'..','img');
fs.writeFileSync(path.join(imgDir,'icon-192.png'), makePng(192));
fs.writeFileSync(path.join(imgDir,'icon-512.png'), makePng(512));
console.log('Ikony wygenerowane: img/icon-192.png, img/icon-512.png');