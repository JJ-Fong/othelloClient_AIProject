var socket = require('socket.io-client')('http://192.168.1.112:3000');
const readline = require('readline');
var tournamentID = 142857;    


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function h1Function(pos) {
  var posx = pos % 8; 
  var posy = Math.floor(pos / 8); 
  var x = ((4/49)*(posx*posx) - (2/7)*posx + 1);
  var y = ((4/49)*(posy*posy) - (2/7)*posy + 1);
  return (Math.sqrt((x*x) + (y*y)));  
}


function initialHeuristic(moves){
  var bestMove = moves[0]; 
  moves.forEach( function(element) {   
      if (h1Function(bestMove)<h1Function(element)){
        bestMove = element; 
      }
  }); 
  return bestMove; 
}

function opponentColor(color){
  if (color === 1) {
    return 2;
  }  else {
    return 1; 
  }
}

function flippedCoins(board, id, position){
  var oc = opponentColor(id); 
  var positionsToFlip = [];
  var directions = [-9, -8, -7, -1, 1, 7, 8, 9];
  var lefts = [-9, -1, 7]; 
  var rights = [-7, 1, 9]; 
  var tileFound = false; 
  for (dirI in directions) {
    tileFound = false; 
    var dir = directions[dirI];
    var rowToFlip = []; 
    var cposition = position; 
    ////console.log('checking: '+ cposition);
    while ((cposition > -1) && (cposition < 64)) {
      if (cposition != position) {
        if (board[cposition] === oc) {
          // //console.log('rival tile: '+cposition);
          rowToFlip.push(cposition);
        } else {
          tileFound = (board[cposition] === id); 
          break;
        }
      }
      if  (((cposition % 8 === 0) && (lefts.indexOf(dir) > -1)) || 
        ((cposition % 8 === 7) && (rights.indexOf(dir) > -1)))
      {
        break; 
      }
      cposition += dir; 
    }
    if (tileFound) {
      for (var i = 0; i < rowToFlip.length; i++){
        //console.log('pushing:'+ rowToFlip[i]);
        positionsToFlip.push(rowToFlip[i]); 
      }
    }
  }
  return positionsToFlip; 
}

function posibleMoves(board, id){

  var movs = [];
  for (var i = 0; i < 64; i++){
    if ((board[i] === 0) && (flippedCoins(board,id, i).length > 0)) {
      movs.push(i); 
    }
  }
  return movs; 
}

function getRandom(max) {
  return Math.floor(Math.random() * (max));
}

function randomCell() {
  return Math.floor(Math.random() * 64);
}

function chooseWisely(board,id){
  var mov = minimax(board, 5, id); 
  // var moves = posibleMoves(board, id);
  // var mov = initialHeuristic(moves);  
  // //console.log(moves);
  return mov; 
}

/*
  board:  initial state
  depth:  tree depth
  iid:    initial id 
*/
function minimax(board, depth, iid){
  var cid = opponentColor(iid); 
  if (depth === 0) {
    return score(board, iid); 
  } 
  if ((depth % 2) === 1) {
    var moves = posibleMoves(board, iid);
    return maxScore(board, depth-1 ,iid, moves, beta); 
  }
  if ((depth % 2) === 0) {
    var moves = posibleMoves(board, cid);
    return minScore(board, depth-1 ,cid, moves, alfa); 
  }
}

function play(board, id, position) {
  var reaction = flippedCoins(board,id,position); 
  var nboard = board; 
  for (i in reaction){
    var cpos = reaction[i]; 
    nboard[cpos] = id;
  }
  return nboard;
}


function maxScore(board, counter, id, pmoves, beta){
  var res = -10000000;  
  var index = -1; 
  for (i in pmoves) {
    var pmov = pmoves[i];
    //console.log('max - check - '+ pmov); 
    var nstate = play(board, id, pmov); 
    var nm = minimax(nstate, counter, id); 
    if (nm > res) { index = pmov; }
    if ((beta > -10000)&&(nm>beta)) {beta = nm; return nm;} 
  }
  return index;
}

function minScore(board, counter, id, pmoves, alfa){
  var res = 10000000; 
  var index = -1; 
  for (i in pmoves){ 
      var pmov = pmoves[i];
      //console.log('min - check - '+ pmov); 
      var nstate = play(board, id, pmov); 
      var nm = minimax(nstate, counter, id); 
      if (nm < res) { index = pmov; }}
      if ((alfa < 10000)&&(nm<alfa)) {alfa = nm; return nm;} 
  return index;
}

function score(board, id){
  var val = 0;
  var t = getTurn(board); 
  if (t < 50) { 
    val = (cornerstone(board,id)/stability(board,id)); 
  } else {
    val = montecarloHeuristic(board, id); 
  }
  if (alfa === -10000) { alfa = val;}
  if (beta === 10000) { beta = val;} 
  return val; 
}

function getTurn(board){
  var turn = 0;
  for (a in board){
    if (board[a]===0) {turn++;}
  }
  return (64 - turn); 
}

function montecarloHeuristic(board,id){
  var wins = 0 ; 
  var simulations = 50;
  for(var i = 0; i < simulations; i++){
    console.log('Montecarlo ROund '+i);
    if (montecarlo(board,id) === id) { wins++;}
  }
  return (wins/simulations); 
}


function montecarlo(board, id){
  var cid = opponentColor(id); 
  var c = 0;
  var nboard = board;  
  var idVM = posibleMoves(board,id); 
  var cidVM = posibleMoves(board,cid); 
  while((idVM.length > 0)||(cidVM.length > 0)){
    if ((c % 2)== 0) {
      nboard = play(nboard,id,idVM[Math.floor(Math.random() * idVM.length)]); 
    }
    if ((c % 2)== 1) {
      nboard = play(nboard,cid,cidVM[Math.floor(Math.random() * cidVM.length)]); 
    }
    idVM = posibleMoves(nboard,id); 
    cidVM = posibleMoves(nboard,cid);
    c++;  
  }
  return winner(nboard); 
}

function winner(board){
  var b = 0;
  var w = 0; 
  for (i in board){
    if (board[i] === 1) { b++; }
    if (board[i] === 2) { w++; }
  }
  if (b < w) {
    return w; 
  } 
  if (w < b){
    return b; 
  }
  return 0; 
}

function stability(board, id){
  var cid = opponentColor(id);
  var c = 0; 
  for (i in board) {
    if (board[i] === 0) {
      c++; 
      c += flippedCoins(board, cid, i);
    }
    if (board[i] === cid){
      c++; 
    }
  }
  return ((64-c)/64); 
}

function cornerstone(board, id){
  var c = 0; 
  for (i in board){
    if (((i % 8 === 0)||(i % 8 == 1)||(i % 8 == 6)||(i % 8 == 7)) && (board[i] === id)) {
      c++; 
    }
    if (((Math.floor( i / 8) === 0)||(Math.floor( i / 8) === 1)||(Math.floor( i / 8) === 6)||(Math.floor( i / 8) === 7)) && (board[i]=== id)){
      c++;
    }

  }
  return (c/64);
}

var alfa = 10000;
var beta = -10000; 
socket.on('connect', function(){
  // Sign in signal
    console.log('Connected'); 
    socket.emit('signin', {
      user_name: 'Skynet (JFong)',
      tournament_id: tournamentID,
      user_role: 'player'
    });    

    console.log('Signed In');
});


socket.on('ready', function(data){
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var board = data.board;
  console.log('board received') ;  

  var move = chooseWisely(board, playerTurnID); 
  console.log('move: '+move); 
  //console.log('move: '+move);
  if (move == undefined) { move = randomCell(); }
  socket.emit('play', {
    tournament_id: tournamentID,
    player_turn_id: playerTurnID,
    game_id: gameID,
    movement: move
  });
});

socket.on('finish', function(data){
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var winnerTurnID = data.winner_turn_id;
  var board = data.board;
  alfa = 10000;
  beta = -10000; 
  if (playerTurnID == winnerTurnID) {
    console.log("You Won!"); 
  } else {
    console.log("You Lose!"); 
  }
  // TODO: Your cleaning board logic here
  
  socket.emit('player_ready', {
    tournament_id: tournamentID,
    player_turn_id: playerTurnID,
    game_id: gameID
  });
});

