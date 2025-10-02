var q2_lang = 'en';

var q2 = {
 languages:{
  da:{offset:35,clock:'KLOKKENVEROFEMTYVESKLAOJEKVARTVATTIAMINUTTERVEMOVERILMFMONALISHALVETTOTREFIREFEMSEKSRSYVOTTERNIMETIELLEVEATOLV',hr:['37f:0:1800:0','37f:0:6000:0','37f:0:38000:0','37f:0:3c0000:0','37f:0:1c00000:0','37f:0:e000000:1','37f:0:0:1c','37f:0:0:1e0','37f:0:0:c00','37f:0:0:c000','37f:0:0:3f0000','37f:0:0:7800000'],mi:['0:0:0:0','3800:78ff00:0:0','0:78ff60:0:0','e000000:780003:0:0','3c000:78ff00:0:0','3800:ff00:7a0:0','0:0:780:0','3800:78ff00:780:0','3c000:ff00:20:0','e000000:3:20:0','0:60:20:0','3800:0:20:0']},
  sv:{offset:35,clock:'KLOCKANVÄRKFEMYISTIONIKVARTQIENZOTJUGOLIVINAÖVERKONHALVETTUSCHXTVÅTREMYKYFYRAFEMSTWORSEXSJUÅTTAINIOTIOELVATOLV',hr:['37f:0:7:0','37f:0:700:0','37f:0:3800:0','37f:0:3c0000:0','37f:0:1c00000:0','37f:0:0:1c','37f:0:0:e0','37f:0:0:f00','37f:0:0:e000','37f:0:0:70000','37f:0:0:780000','37f:0:0:7800000'],mi:['0:0:0:0','3800:f0000:0:0','e0000:f0000:0:0','7c00000:f0000:0:0','0:f03e0:0:0','b800:7800000:0:0','0:7800000:0:0','3800:78f0000:0:0','0:be0:0:0','7c00000:1:0:0','2e0000:0:0:0','b800:0:0:0']},
no:{offset:40,clock:'KLOKKENVEROFEMTYVESKLAOJEKVARTVATTIAMINUTTERVEMOVERILMFMONAPÅLHALVETTOTREFIREFEMSEKSRSYVÅTTERNIMETIELLEVEATOLV',hr:['37f:0:3800:0','37f:0:6000:0','37f:0:38000:0','37f:0:3c0000:0','37f:0:1c00000:0','37f:0:e000000:1','37f:0:0:1c','37f:0:0:1e0','37f:0:0:c00','37f:0:0:c000','37f:0:0:3f0000','37f:0:0:7800000'],mi:['0:0:0:0','3800:780000:0:0','0:780060:0:0','e000000:780003:0:0','0:60:7b0:0','3800:0:7b0:0','0:0:780:0','3800:780000:780:0','0:780060:780:0','e000000:3:30:0','0:60:30:0','3800:0:30:0']},

  
  defaultLanguage:'no'
 },
 animation:{
   stepCount:0,                      // instant switch (no in-between color)
   stepDelay:50,
   // [offR,offG,offB,   onR,onG,onB]
   textColor:[255,0,255,   0,255,255],  // dim magenta -> cyan
   glowColor:[0,0,0,       0,255,255],  // no glow -> cyan glow
   glowSize:8
 },
 current:{
   language:'',
   offset:0,
   hrData:[],
   miData:[],
   minute:-1,
   animationStep:0,
   litCells:[0,0,0,0],
   lowerCells:$(),
   raiseCells:$()
 },
 clockTimer:0,
 fadeTimer:0
};

function initQlockTwo(lang)
{
    var q2lang = q2.languages[lang];
    var q2_clock = q2lang.clock;
    q2.current.offset = q2lang.offset;
    q2.current.hrData = q2lang.hr;
    q2.current.miData = q2lang.mi;

    var q2div = $('#qlocktwo');
    for (var col = 0; col < 11; col++)
    {
        var column = $('<div/>', { 'id':'q2_col_'+col, 'class':'q2col' });
        for (var row = 0; row < 10; row++)
        {
            var cellNumber = (row*11)+col+1;
            var cellId = 'q2_'+cellNumber.toString(16);
            var cellText = q2_clock.charAt(cellNumber-1);

            var newCell = $('<div/>', { 'id':cellId });
            if (cellText == 'o')
            {
                newCell.text('O');
                newCell.append($('<span/>',{'class':'q2quot'}).text('\u2019'));
            }
            else
            {
                newCell.text(cellText);
            }
            column.append(newCell);
        }
        q2div.append(column);
    }
}

function parseCells(cell_text)
{
    var parsed_cells = [0,0,0,0];
    var split_cells = cell_text.split(':');
    for (var i = 0; i < 4; i++) { parsed_cells[i] = parseInt(split_cells[i], 16); }
    return parsed_cells;
}

function mergeCells(l_cells, r_cells)
{
    var merged_cells = [0,0,0,0];
    for (var i = 0; i < 4; i++) { merged_cells[i] = l_cells[i] | r_cells[i]; }
    return merged_cells;
}

function selectCells(cells)
{
    var matchList = [];
    var offsets = [1,29,56,84];
    for (var i = 0; i < 4; i++)
    {
        var cellSet = cells[i];
        var cellRange = 28 - (i % 2);
        var cellOffset = offsets[i];

        for (var j = 0; j < cellRange; j++)
        {
            if (cellSet & 1 == 1)
            {
                var cellId = j + cellOffset;
                matchList.push('#q2_'+cellId.toString(16));
            }
            cellSet >>>= 1;
        }
    }
    return $(matchList.join(','));
}

function changeCorners(currentMinute)
{
    var x = Math.pow(2, currentMinute % 5) - 1;
    var pos = ['#q2UL','#q2UR','#q2BR','#q2BL'];
    var q2c = q2.current;
    for (var i = 0; i < 4; i++)
    {
        var corner = $(pos[i]);
        var isLit = corner.hasClass('lit');
        var lightCorner = (x & 1 == 1); x >>>= 1;

        if (!lightCorner && isLit) { q2c.lowerCells = q2c.lowerCells.add(corner); }
        if (lightCorner && !isLit) { q2c.raiseCells = q2c.raiseCells.add(corner); }
    }
}

function changeCells(newLitCells)
{
    var q2c = q2.current;
    var lower = [0,0,0,0];
    var raise = [0,0,0,0];

    for (var i = 0; i < 4; i++)
    {
        var oldCells  = q2.current.litCells[i];
        var newCells  = newLitCells[i];
        var keepCells = oldCells & newCells;
        lower[i] = oldCells ^ keepCells;
        raise[i] = newCells ^ keepCells;
    }

    q2c.litCells = newLitCells;
    q2c.lowerCells = q2c.lowerCells.add(selectCells(lower));
    q2c.raiseCells = q2c.raiseCells.add(selectCells(raise));
}

function currentTimeCells()
{
    var currentTime = new Date();
    var currentMinute = Math.floor(currentTime.getMinutes() / 5);
    var currentHour = currentTime.getHours();

    if (currentHour === 0) { currentHour = 12; }
    if (((currentMinute * 5) + q2.current.offset) >= 60) { currentHour += 1; } 
    if (currentHour > 12) { currentHour = currentHour - 12; }

    var hr_cells = parseCells(q2.current.hrData[currentHour-1]);
    var mi_cells = parseCells(q2.current.miData[currentMinute]);
    return mergeCells(hr_cells, mi_cells);
}

function onFadeTimerCompleted()
{
    clearInterval(q2.fadeTimer);
    q2.current.raiseCells.css({'color':'','text-shadow':''}).addClass('lit');
    q2.current.lowerCells.css({'color':'','text-shadow':''}).removeClass('lit');
    q2.current.raiseCells = $();
    q2.current.lowerCells = $();
}

function rgbConv(r1, g1, b1, r2, g2, b2, x, y)
{
   var rx = Math.max(0,Math.min(255,Math.floor((r1*x)+(r2*y))));
   var gx = Math.max(0,Math.min(255,Math.floor((g1*x)+(g2*y))));
   var bx = Math.max(0,Math.min(255,Math.floor((b1*x)+(b2*y))));
   return 'rgb('+rx+','+gx+','+bx+')';
}

function onFadeTimerFired()
{
    var tc = q2.animation.textColor;
    var gc = q2.animation.glowColor;
    var gs = q2.animation.glowSize;
    var x = (q2.animation.stepCount - q2.current.animationStep) / q2.animation.stepCount;
    var y = q2.current.animationStep / q2.animation.stepCount;

    var fadeI  = rgbConv(tc[3],tc[4],tc[5],tc[0],tc[1],tc[2],x,y);
    var fadeO  = rgbConv(tc[0],tc[1],tc[2],tc[3],tc[4],tc[5],x,y);
    var fadeGI = rgbConv(gc[3],gc[4],gc[5],gc[0],gc[1],gc[2],x,y);
    var fadeGO = rgbConv(gc[0],gc[1],gc[2],gc[3],gc[4],gc[5],x,y);
    var fadeSI = Math.max(1,Math.floor(gs*x));
    var fadeSO = Math.max(1,Math.floor(gs*y));

    if (q2.current.animationStep > 0)
    {
        q2.current.raiseCells.css({'color':fadeI,'text-shadow':'0 0 '+fadeSI+'px '+fadeGI});
        q2.current.lowerCells.css({'color':fadeO,'text-shadow':'0 0 '+fadeSO+'px '+fadeGO});
        q2.current.animationStep -= 1;
    }
    else
    {
        onFadeTimerCompleted();
    }
}

function abortFadeTimer()
{
    if (q2.current.animationStep > 0)
    {
        q2.current.animationStep = 0;
        onFadeTimerCompleted();
    }
}

function startFadeTimer()
{
    abortFadeTimer();
    q2.current.animationStep = q2.animation.stepCount;
    onFadeTimerFired();
    q2.fadeTimer = setInterval('onFadeTimerFired()', q2.animation.stepDelay);
}

function onClockTimerFired()
{
    var currentTime = new Date();
    var currentMinute = currentTime.getMinutes();

    if (currentMinute != q2.current.minute)
    {
        q2.current.minute = currentMinute;
        changeCorners(currentMinute);
        if (currentMinute % 5 === 0) { changeCells(currentTimeCells()); }
        startFadeTimer();
    }
}

function onChangeLanguage(lang)
{
    if (lang == q2.current.language) { return; }
    q2.current.language = lang;

    clearInterval(q2.clockTimer);
    abortFadeTimer();
    q2.current.minute = -1;

    $('#qlocktwo').empty();
    initQlockTwo(lang);
    q2.current.litCells = [0,0,0,0];
    changeCells(currentTimeCells());

    onClockTimerFired();
    q2.clockTimer = setInterval('onClockTimerFired()', 500);
}

$(document).ready(function()
{
    var lang = q2.languages.defaultLanguage;
    document.forms.debugForm.langSelect.value = lang;
    onChangeLanguage(lang);
});
