function main() {

var A_mtx = new QZMath.tableCreate(document.getElementById("A_mtx"),2,2);
var U_mtx = new QZMath.tableCreate(document.getElementById("U_mtx"),2,2,true); //disable input on this one
var UtAU_mtx = new QZMath.tableCreate(document.getElementById("UtAU_mtx"),2,2,true); //disable input on this one

//---------------------------------------------------------------------------------------intialize time/frame data
var frame=0;
var start_time_ms=performance.now();
var current_time_ms=start_time_ms;
var prev_time_ms=start_time_ms;
var current_time_ms=0;
var dt_ms=0;
var dt_s=0;
var t=0; //current time in ms with timescale effects accounted for
var dt_scale=1;
//---------------------------------------------------------------------------------------initialize stuff
//---------------------------------------------------------------------------------------define main update loop
var update = function(){
	var A_changed = A_mtx.updateData();
	if(A_changed){
		var U = QZMath.JacobiDiag2x2(A_mtx.e)
		U_mtx.insertData(U);
		var Ut = QZMath.matrixTranspose(U);
		var T = QZMath.matrixMult(Ut,A_mtx.e);
		var T2 = QZMath.matrixMult(T,U);
		UtAU_mtx.insertData(T2);
		//UtAU_mtx.insertData(Ut);
	};
};
//---------------------------------------------------------------------------------------define common animation function
var animate = function () {

	//update time data
	frame++;
	current_time_ms=performance.now();
	dt_ms=current_time_ms-prev_time_ms;
	dt_s=dt_ms/1000;
	t=t+dt_s*dt_scale;
	
	update();
	
	prev_time_ms=current_time_ms;
	
	requestAnimationFrame(animate);
};

//---------------------------------------------------------------------------------------run animation
animate();
};
main();