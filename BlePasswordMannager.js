function start(){
}

function Arr2Str(arr){
  var str = "";
  for (var i = 0; i < arr.length; i++) {
    if(arr[i]==0)
      break;
    else
      str += String.fromCharCode(arr[i]);
  }
  return str;
}

function modifier (c){
if (('A' <= c) && (c <= 'Z')) {	return 0x02;}
switch(c) {case '#':case '!':case ')':case '(': case '*': case '_':case ':':case '+':case '&':case '{':case '?':case '}':case '<':case '>':case '~':case '\'':return 0x02;}return 0;}

function mapasc(c) {
if (('a'<=c)&&(c<='z')){return c.charCodeAt()-0x5D;} 
else if (('A'<=c) && (c<='Z')){return c.charCodeAt()-0x3D;} 
else if (('1'<=c) && (c<='9')){return c.charCodeAt()-0x13;}
else {switch (c) {
case ' ':return 0x2C;
case '!':return 0x1e;
case '@':return 0x1f;
case '#':return 0x20;
case '$':return 0x21;
case '%':return 0x22;
case '^':return 0x23;
case '&':return 0x24;
case '*':return 0x25;
case '(':return 0x26;
case '0':case ')':return 0x27;
case '\n':return 0x28;
case ']':case '}': return 0x30;
case '\\':case '|': return 0x31;
case '>':case '.':return 0x37;
case '<':case ',':return 0x36;
case ';':case ':':return 0x33;
case '_':return 0x2D;
case '=':case '+': return 0x2E;
case '[':case '{':return 0x2F;
case '/':case '?':return 0x38;
case '"':case '\'':return 0x34;
case '`':case '~':return 0x35;
default: return 0x2D; // '-'
		}
	}
	return 0x2D;
}

function sendstring(str){
for (var i=0;i<str.length;i++){
  sendascii( str.charAt(i));
  }
}

var queue =[];
var busy = false;
function sendascii(ascii){
  if (busy) 
     {
      queue.push(ascii);
      return queue;
    }
    busy = true;
    try{
      digitalWrite(D17,0);//led1
      kb.tap( mapasc(ascii),modifier(ascii),
             function(){
              busy = false;
              if (queue.length){
                p = queue.shift();
                sendascii(p);}
            } );
      digitalWrite(D17,1);//led1
      }catch(e)
      {
        console.log( "e:" + e.toString());
        busy=false;
        digitalWrite(D17,0);//led1
      }
}



if(digitalRead(D14)==1)//sw1
{
  reset(true);
}
  digitalWrite(D17,0);//led1
  Serial1.setup(9600, { tx:D6, rx:D8,cts:D5,flow:"xon" });
  Serial1.setConsole(true);

var kb = require("ble_hid_keyboard.min");
NRF.setConnectionInterval(7.5);
NRF.setServices(undefined, { hid : kb.report });
NRF.on('connect', function(addr) { digitalWrite(D17,1); });//led1 off

// I2C
I2C1.setup({scl:D3,sda:D4,bitrate: 400000});
var g = require("SSD1306.min").connect(I2C1, start);
require("Font6x8.min").add(Graphics);
g.setFont6x8();

//eeprom
var eeprom=require("AT24").connect(I2C1, 64, 256,0xa0);

var mainmenu = {
  "" : {"title" : "-- Items --","fontHeight":8},
};

var cSel = 0;
var bSMenu=false;
function showSub(){
    bSMenu=true;
    var sIdx = Arr2Str(eeprom.read(cSel*0x80,0x10) );
    var sUrl = Arr2Str(eeprom.read(cSel*0x80+0x10,0x20) );
    var sACC = Arr2Str(eeprom.read(cSel*0x80+0x30,0x20) );
    var s1 = Arr2Str(eeprom.read(cSel*0x80+0x50,0x10) );
    var s2 = Arr2Str(eeprom.read(cSel*0x80+0x60,0x10) );
    var s3 = Arr2Str(eeprom.read(cSel*0x80+0x70,0x10) );
   var submenu = {
  "" : {"title" : "-- Acc info --","fontHeight":8},
    "< Back" : function() {bSMenu=false;g.clear(); m=menu.list(g, mainmenu); },
  };
   if(sIdx!="") submenu[sIdx]=undefined;
   if(sUrl!="") submenu[sUrl]= function(){sendstring(sUrl);};
   if(sACC!="") submenu[sACC]=function(){sendstring(sACC);};
   if(s1!="") submenu[s1]=function(){sendstring(s1);};
   if(s2!="") submenu[s2]=function(){sendstring(s2);};
   if(s3!="") submenu[s3]=function(){sendstring(s3);};
   g.clear();
   m=menu.list(g, submenu);
  }

var idex = 0;
while( idex*0x80<32*1024 )
{
    var strIndex = Arr2Str(eeprom.read(idex*0x80,0x10) );
    console.log( strIndex );
    if( strIndex != "")
      { idex++;
        mainmenu[strIndex]=showSub;
      }
    else
      {break;}

  }
  var menu = require("graphical_menu.min");
  g.clear();
  var m=menu.list(g, mainmenu);
console.log("total " + idex.toString() );

var tItems = idex;
//up
pinMode(D31, "input_pulldown");
setWatch(function() {
  if(bSMenu){m.move(-1);}
  else if(cSel>0)
  {
    cSel--;
    m.move(-1);
    console.log("cSel:"+cSel.toString());
  }
}, D31, { repeat:true, edge:"falling", debounce: 50 });

//down
pinMode(D30, "input_pulldown");
setWatch(function() {
  if(bSMenu){m.move(1);}
  else if(cSel< tItems-1 ){
    cSel++;
    m.move(1);
    console.log("cSel:"+cSel.toString());
  }
  
}, D30, { repeat:true, edge:"falling", debounce: 50 });

//mid
pinMode(D27, "input_pulldown");
setWatch(function() {
  g.clear();
  m.select();
  //sendstring("dwn");
}, D27, { repeat:true, edge:"falling", debounce: 50 });

function Add(sidex){
  var idex = 0;
  while( idex*0x80<32*1024 )
  {
    var strIndex = Arr2Str(eeprom.read(idex*0x80,0x10) );
    console.log( strIndex );
    if( strIndex != "")
      { idex++; }
    else
      {break;}
  }
  eeprom.write(idex*0x80,sidex);
  return idex;
}

function Lst(){
  var idex = 0;
  while( idex*0x80<32*1024 )
  {
    var strIndex = Arr2Str(eeprom.read(idex*0x80,0x10) );
    if( strIndex != "")
      {  var url=Arr2Str(eeprom.read(idex*0x80+0x10,0x20));
         console.log("id:"+idex.toString()+",idx:"+strIndex+",url:"+url);
        idex++; 
      }
    else
      {break;}
  }
  console.log("end");
}

function Mod(i,sidex,iurl,acc,p1,p2,p3){
  if( i*0x80<32*1024 )
  {
    for(var j=0;j<0x80;j++){
      eeprom.write(i*0x80+j,0);}
    eeprom.write(i*0x80,sidex);//0x10
    eeprom.write(i*0x80+0x10,iurl);//0x20
    eeprom.write(i*0x80+0x30,acc);//0x20
    eeprom.write(i*0x80+0x50,p1);//0x10
    eeprom.write(i*0x80+0x60,p2);//0x10
    eeprom.write(i*0x80+0x70,p3);//0x10
  }
}

function Help(){
  console.log("  Help()\n"+
"  Add(\"idex\")\n"+
"  Lst()\n"+
"  Get(id)\n"+
"  Del(id)\n"+
"  Mod(id,sidex,url,acc,pass1,pass2,pass3)\n");
}
