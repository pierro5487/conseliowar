var http = require('http');
var fs = require('fs');

// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
	// fs.readFile('./index.html', 'utf-8', function(error, content) {
	// 	res.writeHead(200, {"Content-Type": "text/html"});
	// 	res.end(content);
	// });
});

var vaisseaux = [];

// Chargement de socket.io
var io = require('socket.io').listen(server);

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
	
	socket.emit('welcome');
	
	socket.on('nouveau', function (nom) {
		let id = Math.floor(Date.now() / 1000);
		vaisseaux.forEach(function (vaisseau) {
			socket.emit('newOtherVaisseau',vaisseau.id);
		});
		
		vaisseaux.push({
			nom:nom,
			id:id,
			socketId:socket.id,
			life:100,
			point:0
		});
		socket.emit('monVaisseau',id);
		socket.broadcast.emit('newOtherVaisseau',id);
		socket.emit('UpdateInfos',vaisseaux);
		socket.broadcast.emit('UpdateInfos',vaisseaux);
	});
	
	
	socket.on('move', function (data) {
		socket.emit('move',data);
		socket.broadcast.emit('move',data);
	});
	
	socket.on('sendFire',function(data){
		socket.emit('fire',data);
		socket.broadcast.emit('fire',data);
	});
	
	socket.on('impact',function(data){
		console.log(data);
		console.log(vaisseaux);
		let indexCible = false;
		vaisseaux.forEach(function(vaisseau,key){
			if(vaisseau.id == data.cible){
				indexCible = key;
			}
		});
		vaisseaux[indexCible].life -= 25;
		let indexTireur = false;
		vaisseaux.forEach(function(vaisseau,key){
			if(vaisseau.id == data.cible){
				indexTireur = key;
			}
		});
		vaisseaux[indexTireur].point += 25;
		if (vaisseaux[indexCible].life <= 0){
			
			socket.emit('DestroyShip', data.cible);
			socket.broadcast.emit('DestroyShip', data.cible);
			
				
			// Les missiles partent toujours, il faudrait aussi effacer l'objet ou l'empêcher de tirer
			// Seule la div du vaisseau est effacée mais on peut toujours tirer avec
		}
		socket.emit('DisplayImpact',data);
		socket.broadcast.emit('DisplayImpact',data);
		socket.emit('UpdateInfos',vaisseaux);
		socket.broadcast.emit('UpdateInfos',vaisseaux);
		
	});
	
	socket.on('disconnect', function () {
		let index = false;
		vaisseaux.forEach(function(vaisseau,key){
			if(vaisseau.socketId == socket.id){
				index = key;
			}
		});
		if(index){
			socket.broadcast.emit('DestroyShip', vaisseaux[index].id);
			vaisseaux.splice(index,1);
		}
	});
});


server.listen(8080);