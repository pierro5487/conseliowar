///class Vaiseau

class Vaisseau{
	
	constructor(config){
		this.id = null;
		this.team = 1;
		this.tailleMissile = 8;
		this.isYour = false;
		this.life = 100;
		this.position={
			x:500,
			y:200
		};
		this.boardSize={};
		this.checkEvent = null ;
		this.boardZone = 1;
		this.size = 50  ;  //75,100,125
		// this.velocy = (125-this.size+1)*2;
		this.velocy = 20;
		this.moveKey = {
			right:100,
			left:113,
			top:122,
			bottom:115,
			fire:32
		};
		
		//on set les config de jeu
		this.setConfig(config);
		//on affiche vaiseau sur plateau
		this.displayVaisseau();
		//on lui ajoute les events de déplacement
		this.initMoveEvent();
		//on le place
		this.setStartPosition();
		//on met en place la verif target
		if(this.isYour){
			this.initCheckTarget();
		}
	}
	
	getRightMoveTouch(){
		return this.moveKey.right;
	}
	getLeftMoveTouch(){
		return this.moveKey.left;
	}
	getTopMoveTouch(){
		return this.moveKey.top;
	}
	getBottomMoveTouch(){
		return this.moveKey.bottom;
	}
	
	getFireTouch(){
		return this.moveKey.fire;
	}
	
	initCheckTarget(){
		let self = this;
		this.checkEvent = setInterval(function(){
			$.each($('.target'),function(key,target){
				let tarPos = $(target).position();
				if (tarPos.left < self.position.x+self.size && tarPos.left > self.position.x){
					if (tarPos.top > self.position.y && tarPos.top < self.position.y + self.size){
						let targetId = $(target).attr('id');
						$('#'+targetId).remove();
						socket.emit('impact', {
							position : {
								x:tarPos.left,
								y:tarPos.top 
							},
								cible:self.id,
								tireur:$(target).data('tireur'),
								degat:25
					
						});

						
					}
				}
			});
		},20);
	}
	
	setConfig(config){
		this.boardSize = config.boardSize;
		this.boardZone = config.boardZone;
		this.id = config.id;
		this.isYour = config.isYour;
	}
	
	setPosition(x,y){
		$('#'+this.id).css({top:y-this.size/2,left:x-this.size/2});
	}
	
	setStartPosition(){
		let posY = this.boardSize.height-this.size;
		if(this.boardZone == 2){
			posY = this.size;
		}
		this.position.x = this.boardSize.width/2-this.size;
		this.position.y = posY;
		this.setPosition(this.boardSize.width/2-this.size,posY);
	}
	
	displayVaisseau(){
		let vaiseauHtml = this.getForm();
		$('#board').append(vaiseauHtml);
	}
	
	getForm(){
		return '<div id="'+ this.id +'" style="width: '+this.size+'px;height:'+this.size+'px;position: absolute"><img style="max-width:100%" src="vaisseau8.png"></div>';
	}
	
	initMoveEvent(){
		let self = this;
		$('body').on('keypress',function(e){
			let code = e.which;
			console.log(code);
			if(self.isYour) {
				switch (code) {
					case self.getRightMoveTouch():
						self.moveRight();
						break;
					case self.getLeftMoveTouch():
						self.moveLeft();
						break;
					case self.getTopMoveTouch():
						self.moveTop();
						break;
					case self.getBottomMoveTouch():
						self.moveBottom();
						break;
					case self.getFireTouch():
						self.sendFire();
						break;
					default:
					// code block
				}
			}
		});
		
	}
	
	sendFire(){
		socket.emit('sendFire', {
			id:this.id, //normalement inutiale avec les sockets
			startPosX:this.position.x,
			startPosY:this.position.y,
			endPosX : this.position.x,
			endPosY : 0
		});
	}
	
	fire(data){
		
		let startX = data.startPosX;
		let startY = data.startPosY;
		let endX = data.endPosX;
		let endY = data.endPosY;
		
		if(this.boardZone == '2'){
			let newCoordStart = this.getPosMirror(startX, startY);
			startX = newCoordStart.x+(this.size/2);
			startY = newCoordStart.y-this.tailleMissile/2+this.size;
			
			let newCoordEnd = this.getPosMirror(endX, endY);
			endX = newCoordEnd.x+(this.size/2);
			endY = newCoordEnd.y+this.size;
			
		} else {
			
			startX += (this.size/2);
			startY -= this.tailleMissile/2;
			endX = startX;
		}
		
		let targetId = Math.floor(Date.now() / 1000)+this.id;
		let target = $('<div class="target" id="'+targetId+'" data-tireur="'+this.id+'" style="width: 2px;height:'+this.tailleMissile+'px;z-index:9999;background-color: red;position: absolute;top:'+startY+'px;left:'+startX+'px"></div>');
		let distanceAParcourir = data.startPosY;
		let vitesse = 180 ;
		let temps_parcours = distanceAParcourir / vitesse ;
		
		target.animate({
			left : endX ,
			top : endY
		}, temps_parcours*1000,'linear',function(){
			this.remove();
		});
		$('#board').append(target)
;
	}
	
	getSpeedAnimate(){
		return 20;
	}
	
	getCentralPoint(){
		return {
			x:this.boardSize.width/2,
			y:this.boardSize.height/2
		}
	}
	
	getPosMirror(posX, posY){
		let centralPoint = this.getCentralPoint();
		let diffX = centralPoint.x - posX;
		let newPosX = centralPoint.x + diffX - this.size;
		
		let diffY = centralPoint.y - posY;
		let newPosY = centralPoint.y + diffY - this.size;
		return {x:newPosX, y:newPosY}
	}
	
	move(newPosX,newPosY){
		let posX = newPosX;
		let posY = newPosY;
		
		
		//si board2 on affiche mirroir
		if(this.boardZone == '2'){
			let newCoord = this.getPosMirror(posX, posY);
			posX = newCoord.x;
			posY = newCoord.y;
		}
		
		let self = this;
		$("#"+this.id).animate({
			left : posX ,
			top : posY
		}, this.getSpeedAnimate(),function(){
			self.position.x = posX;
			self.position.y = posY;
		});
		
	}
	
	sendMove(newPosX,newPosY){
		socket.emit('move', {
			id:this.id, //normalement initiale avec les sockets
			newPosX:newPosX,
			newPosY:newPosY
		});
	}
	
	moveRight(){
		let distance = this.velocy;
		let newPosX = this.position.x + distance;
		
		if(newPosX >= (this.boardSize.width - this.size)){
			newPosX = this.boardSize.width - this.size;
		}
		
		this.sendMove(newPosX,this.position.y);
	}
	
	moveLeft(){
		let distance = this.velocy;
		let newPosX = this.position.x - distance;
		if(newPosX <= 0){
			newPosX = 0;
		}
		
		this.sendMove(newPosX,this.position.y);
	}
	
	moveTop(){
		//on determine le plafond suivant la zone
		let boardTop = 0;
		if(this.boardZone == 1){
			boardTop = this.boardSize.height/2+this.getNoMansLandSize();
		}
		
		//on calcul nouvelle position
		let distance = this.velocy;
		let newPosY = this.position.y - distance;
		
		if(newPosY < boardTop){
			newPosY = boardTop;
		}
		
		this.sendMove(this.position.x,newPosY);
	}
	stopCheckTarget(){
		clearInterval(this.checkEvent);
	}
	
	setOffEvents(){
		if (this.isYour){
			$('body').off('keypress');	
		}
		
	}

	moveBottom(){
		//on determine le plancher suivant la zone
		let boardBottom = this.boardSize.height/2-this.getNoMansLandSize();
		if(this.boardZone == 1){
			boardBottom = this.boardSize.height;
		}
		
		//on calcule nouvelle position
		let distance = this.velocy;
		let newPosY = this.position.y + distance;
		
		if(newPosY >= (boardBottom - this.size)){
			newPosY = boardBottom - this.size;
		}
		
		this.sendMove(this.position.x,newPosY);
	}
	
	getNoMansLandSize(){
		return 40;
	}
}




$(function(){
	
	vaisseaux = {};
	
	config = {
		boardSize:{

			width:1200,
			height:800
		},
		boardZone:1
	};
	
	socket.on('welcome', function(message) {
		var nom = prompt('Veuillez vous identifiez capitaine');
		socket.emit('nouveau',nom);
	});
	
	socket.on('monVaisseau',function(id){
		alert('Votre vaisseau est pret commandant');
		console.log('votre vaisseau');
		config.id = id;
		config.isYour = true;
		config.boardZone = 1;
		vaisseaux[id] = new Vaisseau(config);
	});
	
	socket.on('newOtherVaisseau', function (id) {
		console.log('autre vaisseau');
		config.id = id;
		config.isYour = false;
		config.boardZone = 2;
		vaisseaux[id] = new Vaisseau(config);
	});
	
	socket.on('move', function (data) {
		console.log(data);
		vaisseaux[data.id].move(data.newPosX,data.newPosY);
	});
	
	socket.on('fire', function (data) {
		vaisseaux[data.id].fire(data);
	});
	
	socket.on('DisplayImpact', function (data) {
		let newPos = vaisseaux[data.cible].getPosMirror(data.position.x, data.position.y);
		let gif = $('<div class="gif" style="position: absolute;width: 80px;height: 10px;top:'+(data.position.y-40)+'px;left:'+(data.position.x-40)+'px"><img style="max-width:100%" src="explosion.png"> </div>');
		
		
		if (vaisseaux[data.cible].boardZone == 2){
			gif = $('<div class="gif" style="position: absolute;width: 80px;height: 10px;top:'+(newPos.y-40)+'px;left:'+(newPos.x)+'px"><img style="max-width:100%" src="explosion.png"> </div>');

		}
		
		
		$('#board').append(gif);
		setTimeout(function() {gif.remove()}, 1000);

	});

	socket.on('DestroyShip', function (id) {
		console.log(id);
		console.log("Le vaisseau "+id+" est mourru");
		setTimeout(function() {
			$('#'+id).remove();
			vaisseaux[id].setOffEvents();
			vaisseaux[id].stopCheckTarget();
			if(vaisseaux[id].isYour) {
				if (confirm('Perdu! voulez vous rejouer ?')) {
					location.reload();
				}
			}
			delete(vaisseaux[id]);
		}, 1000);
	});
	
	socket.on('UpdateInfos',function(vaisseaux){
		infosVaisseaux = vaisseaux;
		$('#infos').html(JSON.stringify(vaisseaux));
	});
});


