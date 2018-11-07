function main() {

var A_mtx = new QZMath.tableCreate(document.getElementById("A_mtx"),3,3);
var U_mtx = new QZMath.tableCreate(document.getElementById("U_mtx"),3,3,true); //disable input on this one
var UtAU_mtx = new QZMath.tableCreate(document.getElementById("UtAU_mtx"),3,3,true); //disable input on this one

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
	var A_changed = A_mtx.updateData(true);
	if(A_changed){
		var out = QZMath.JacobiDiag3x3(A_mtx.e,7)
		U_mtx.insertData(out[1]);
		UtAU_mtx.insertData(out[0]);
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