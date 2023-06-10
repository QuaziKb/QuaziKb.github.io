'use strict';
import QZ from '../../js/QZMain.js';

const start = performance.now();
var shaders = await QZ.loadFiles({
		main_fs: 'js/main_fs.glsl',
		main_vs: 'js/main_vs.glsl'
	});
const end = performance.now();
console.log(`$setup took: ${end - start} ms`);

function main() {

	var feedback_buffer_list = [
		new QZ.FeedbackBuffer(512, 512, shaders.main_fs)
	];

	var fbc = new QZ.Canvas3D(
			"canvas_1",
			512,
			512,
			feedback_buffer_list);

	function render(time) {
		fbc.update();
		requestAnimationFrame(render);
	}

	requestAnimationFrame(render);
}
main();
